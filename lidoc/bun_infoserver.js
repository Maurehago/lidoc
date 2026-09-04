// =========================================================================
//   SERVERCORE (server.js)
// =========================================================================
// @ts-check

import { join } from "path";
import { mkdir } from "fs/promises";
//import { JsonFileDriver } from "./db_drivers.js";


/**
 * Eine einzelne Datenzeile. Kann primitive Werte oder Binärdaten enthalten.
 * @typedef {Array<string | number | bigint | boolean | Uint8Array | null>} DataRow
 */

/**
 * Das universelle, zweidimensionale Tabellenformat für alle Treiber und Schichten.
 * Die ERSTE Zeile (Index 0) enthält IMMER die Spaltennamen (Header).
 * @typedef {Array<DataRow>} DataRows
 */

/**
 * Beschreibt eine registrierte Datenquelle (Datenbank oder Datei-Verzeichnis).
 * Diese Struktur wird in der lokalen config.json persistiert.
 * @typedef {Object} DriverConfig
 * @property {string} id - Eindeutige ID des Treibers innerhalb dieser App (z.B. "lokale_kunden_db")
 * @property {"SQLITE" | "FIREBIRD" | "JSON_FILES" | "HTML_FRAGMENTS"} type - Die technologische Art des Treibers
 * @property {string} name - Menschenlesbarer Anzeigename für das UI-Hauptmenü
 * @property {string} connectionString - Pfad zur Datei (SQLite/JSON) oder Server-Verbindungsdaten (Firebird)
 */

/**
 * Die globale Konfigurationsdatei der Anwendung, abgelegt im Benutzer-Appdata-Ordner.
 * @typedef {Object} ApplicationConfig
 * @property {string} appName - Der Name der App (aus Startparameter oder Default)
 * @property {boolean} isNewSystem - Flag; "true" wenn das System im Zustand "NULL" ist (keine Treiber konfiguriert)
 * @property {Array<DriverConfig>} drivers - Liste aller vom Benutzer eingerichteten Datenquellen
 * @property {string | null} defaultDriverId - Optionaler Standard-Treiber, der beim Start direkt geöffnet wird
 */

/**
 * Repräsentiert eine aktive Bearbeitungssperre eines Datensatzes (Concurrency Management).
 * Existiert rein In-Memory auf dem Server.
 * @typedef {Object} LockData
 * @property {string} lockKey - Zusammengesetzter Key aus `driverId_tableName_recordId`
 * @property {string} driverId - ID des betroffenen Treibers
 * @property {string} tableName - Name der editierten Tabelle
 * @property {string} recordId - Eindeutige ID des Datensatzes (Wert der ID-Spalte)
 * @property {string} username - Name des Benutzers, der den Datensatz aktuell sperrt
 * @property {string} lockTime - Uhrzeit des Sperr-Zeitpunkts (LocaleTimeString)
 */

/**
 * Definiert die Schnittstelle, die JEDER Datenbank- oder Dateitreiber implementieren MUSS.
 * @typedef {Object} DBDriverInterface
 * @property {string} id - Entspricht DriverConfig.id
 * @property {string} type - Entspricht DriverConfig.type
 * @property {string} name - Name des Teibers
 * @property {(tableName: string) => Promise<DataRows>} getRows - Holt alle Zeilen einer Tabelle inkl. Header
 * @property {(tableName: string, recordId: string, idColName: string) => Promise<DataRows>} getRecord - Holt genau eine Zeile + Header für die Detailansicht
 * @property {(tableName: string, deltaRows: DataRows, idColName: string) => Promise<boolean>} saveRows - Schreibt nur die geänderten Spalten (Delta-Array) in die DB
 * @property {(tableName: string, recordId: string, idColName: string) => Promise<boolean>} deleteRow - Löscht einen spezifischen Datensatz aus der Tabelle
 * @property {(newSchemaJson: string) => Promise<{success: boolean, message: string}>} [migrateSchema] - Optional: Führt Tabellen-Migrationen bei Schema-Updates aus
 */

/**
 * Das einheitliche WebSocket-Nachrichtenformat für die Kommunikation zwischen Client und Server.
 * @typedef {Object} ClientServerMessage
 * @property {"GET_DATA" | "REQUEST_LOCK" | "RELEASE_LOCK" | "SAVE_DATA" | "DELETE_DATA" | "SAVE_CONFIG"} type - Aktionstyp
 * @property {string} [driverId] - Ziel-Treiber für die Aktion
 * @property {string} [tableName] - Ziel-Tabelle für die Aktion
 * @property {string} [recordId] - Ziel-Datensatz-ID (falls anwendbar)
 * @property {string} [idColName] - Name der Primärschlüssel-Spalte (Standard meist "gsid")
 * @property {string} [targetType] - Für Navigation: Welcher UI-Typ wird erwartet ("MENU" | "TABLE" | "FORM" | "DETAIL" | "WIZARD")
 * @property {string} [payload] - Freitext-Feld für Payloads (z.B. komplettes Config-JSON oder Schema-JSON)
 * @property {DataRows} [rows] - Das Datenpaket (entweder gesamte Tabelle oder Delta-Array bei SAVE)
 */

// =========================================================================
//   SERVER BOOTSTRAPPING & INITIALISIERUNG (server.js)
// =========================================================================

// 2. ANWENDUNGSNAME ERMITTELN (Aus Startparametern oder Fallback)
// Aufruf-Beispiel: bun run server.js --name="MeinLagerSystem"
const args = Bun.argv;
const nameArg = args.find(arg => arg.startsWith("--name="));
const APP_NAME = nameArg ? nameArg.split("=")[1] : "Standard_Echtzeit_App";

console.log(`\n=== Bootstrapping gestartet: "${APP_NAME}" ===`);

/**
 * Ermittelt den plattformübergreifenden Projektordner im Benutzerverzeichnis.
 * @returns {string} Absoluter Pfad zum App-Ordner (z.B. C:\Users\Name\AppData\Roaming\.meinlagersystem)
 */
function getProjectFolder() {
    const baseDir = process.env.APPDATA || process.env.HOME || ".";
    // Erzeugt einen sicheren Ordnernamen (Kleinbuchstaben und Unterstriche)
    const safeFolderName = "." + APP_NAME.toLowerCase().replace(/[^a-z0-9]/g, "_");
    return join(baseDir, safeFolderName);
}

/**
 * Holt den Pfad zur zentralen, lokalen Konfigurationsdatei.
 * @returns {string} Pfad zur config.json
 */
function getConfigFilePath() {
    return join(getProjectFolder(), "config.json");
}

/**
 * Speichert die gesamte Anwendungskonfiguration direkt als Datei ab.
 * (Wird nicht durch einen DBDriver geschleust, da rein lokale Benutzer-Einstellung)
 * @param {ApplicationConfig} configData 
 */
async function saveApplicationConfig(configData) {
    const filePath = getConfigFilePath();
    const file = Bun.file(filePath);

    // Verzeichnisstruktur sicherstellen
    const dirPath = filePath.substring(0, filePath.lastIndexOf(process.platform === "win32" ? "\\" : "/"));
    await mkdir(dirPath, { recursive: true });

    await Bun.write(file, JSON.stringify(configData, null, 2));
    console.log(`Konfiguration erfolgreich in APPDATA/User-Ordner gespeichert.`);
}

/**
 * Lädt die Konfiguration aus dem Benutzerverzeichnis. 
 * Wenn noch keine existiert, wird der Zustand "NULL" initialisiert.
 * @returns {Promise<ApplicationConfig>}
 */
async function loadOrInitializeConfig() {
    const filePath = getConfigFilePath();
    const file = Bun.file(filePath);

    if (await file.exists()) {
        console.log(`Bestehende Konfiguration geladen aus: ${filePath}`);
        return await file.json();
    }

    console.log(`Keine Konfiguration gefunden. Initialisiere Zustand "NULL" für Projekt: ${APP_NAME}`);

    /** @type {ApplicationConfig} */
    const freshConfig = {
        appName: APP_NAME,
        isNewSystem: true,
        drivers: [],
        defaultDriverId: null
    };

    await saveApplicationConfig(freshConfig);
    return freshConfig;
}

// 3. SERVER CLASS IMPLEMENTIERUNG
export class RealtimeServer {
    /**
     * @param {number} port - Der Port, auf dem Bun lauschen soll
     */
    constructor(port = 3000) {
        this.port = port;

        /** 
         * Instanziierte und aktive Treiber im Speicher des Servers.
         * Key ist die driverId aus der Konfiguration.
         * @type {Map<string,DBDriverInterface>} 
         */
        this.activeDrivers = new Map();

        /** 
         * Aktive Editier-Sperren im Speicher (In-Memory).
         * Key ist zusammengesetzt aus driverId_tableName_recordId.
         * @type {Map<string,LockData>} 
         */
        this.activeLocks = new Map();

        /**
         * Optional: Instanzierte Schema-Klassen pro Projekt, falls hochgeladen
         * @type {Map<string, any>}
         */
        this.loadedProjectSchemas = new Map();
    }

    /**
     * Durchläuft alle konfigurierten Treiber der config.json und instanziiert diese.
     * Wenn Treiber (wie SQLite) lokale Dateien benötigen, wird das hier veranlasst.
     * @returns {Promise<void>}
     */
    async initializeConfiguredDrivers() {
        const config = await loadOrInitializeConfig();
        this.activeDrivers.clear();

        if (config.isNewSystem || config.drivers.length === 0) {
            console.log("Keine aktiven Treiber zu initialisieren (Zustand: NULL). Waiting for UI setup...");
            return;
        }

        for (const driverCfg of config.drivers) {
            try {
                console.log(`Initialisiere Treiber [${driverCfg.id}] vom Typ [${driverCfg.type}]...`);

                // HIER: Dynamische Zuweisung je nach Technologie-Typ
                if (driverCfg.type === "SQLITE") {
                    // Beispiel: SQLite-Datei wird im Projektordner angelegt, falls Pfad relativ angegeben war
                    const fullDbPath = driverCfg.connectionString.startsWith(".")
                        ? join(getProjectFolder(), driverCfg.connectionString)
                        : driverCfg.connectionString;

                    console.log(`🗄️ SQLite-Verbindung wird vorbereitet auf Datei: ${fullDbPath}`);

                    // Hier würde deine Klasse aus den Treibern geladen werden:
                    // const driverInstance = new SQLiteDriver(driverCfg.id, driverCfg.name, fullDbPath);
                    // await driverInstance.connect();
                    // this.activeDrivers.set(driverCfg.id, driverInstance);
                }
                else if (driverCfg.type === "FIREBIRD") {
                    console.log(`Teste Netzwerk-Verbindung zu Firebird über ConnectionString...`);
                    // Keine lokale Dateierstellung, da Server bereits im Netzwerk laufen muss!
                    // const driverInstance = new FirebirdDriver(driverCfg.id, driverCfg.name, driverCfg.connectionString);
                    // this.activeDrivers.set(driverCfg.id, driverInstance);
                }
                else if (driverCfg.type === "JSON_FILES") {
                    console.log(`JSON-Dateien-Verzeichnis wird überwacht/initialisiert: ${driverCfg.connectionString}`);
                }

            } catch (err) {
                //@ts-ignore
                console.error(`Fehler beim Starten des Treibers ${driverCfg.id}:`, err.message);
            }
        }
        console.log(`${this.activeDrivers.size} Treiber erfolgreich im Server-Proxy registriert.`);
    }

    /**
     * Startet den nativen Bun-HTTP- und WebSocket-Server
     */
    start() {
        /** @type {Bun.Server<{userId: string, username: string}>} */
        const server = Bun.serve({
            port: this.port,
            //@ts-ignore
            fetch: async (req, server) => {
                const url = new URL(req.url);

                // WebSocket Upgrade Handshake
                if (url.pathname === "/socket") {
                    return server.upgrade(req, {
                        data: {
                            userId: "user_" + Math.random().toString(36).substring(2, 7),
                            username: "Local_Operator"
                        }
                    });
                }

                // 2. Standard-Pfad auf index.html umleiten
                let filePath = url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname;
                
                // Pfad für Bun.file vorbereiten (Punkt voranstellen für relativen Pfad)
                const file = Bun.file("." + filePath);

                // 3. Prüfen, ob die Datei existiert, und ausliefern
                if (await file.exists()) {
                    return new Response(file);
                }

                // 4. Fallback, falls die Datei nicht existiert
                return new Response("Not Found", { status: 404 });                
            },

            websocket: {
                open: async (ws) => {
                    console.log(`Client verbunden (ID: ${ws.data.userId})`);

                    // Jedes Mal beim Verbindungsaufbau prüfen wir frisch den Zustand der config.json
                    const currentConfig = await loadOrInitializeConfig();

                    // Initialisierung der ersten Menüspalte für den Browser
                    const startMenuRows = [["ID", "Label", "TargetType", "Payload"]];

                    if (currentConfig.isNewSystem || this.activeDrivers.size === 0) {
                        // Der Server meldet den Zustand "NULL" an das Frontend
                        startMenuRows.push([
                            "wizard_setup",
                            "System einrichten (Keine Verbindungen vorhanden)",
                            "WIZARD",
                            ""
                        ]);
                    } else {
                        // Der Server ist betriebsbereit und listet alle konfigurierten Datenbank-Ziele auf
                        for (const driverCfg of currentConfig.drivers) {
                            startMenuRows.push([
                                driverCfg.id,
                                `Datenquelle: ${driverCfg.name} (${driverCfg.type})`,
                                "DRIVER_MAIN",
                                driverCfg.id
                            ]);
                        }
                    }

                    // Schicke dem Client das initiale State-Paket über den Socket
                    ws.send(JSON.stringify({
                        type: "INITIAL_STATE",
                        appName: currentConfig.appName,
                        isNewSystem: currentConfig.isNewSystem,
                        locks: Object.fromEntries(this.activeLocks), // Aktuelle Sperren als Objekt
                        initialColumn: {
                            id: "root_column",
                            type: "MENU",
                            title: `${currentConfig.appName} - Hauptmenü`,
                            rows: startMenuRows
                        }

                    }));
                },
                message: async (ws, message) => {
                    try {
                        /** @type {ClientServerMessage} */
                        const msg = JSON.parse(message.toString());
                        console.log(`Aktion [${msg.type}] angefordert von [${ws.data.username}]`);

                        // Frisch geladene Konfiguration für eventuelle Abgleiche holen
                        const currentConfig = await loadOrInitializeConfig();

                        // Eindeutigen Sperrschlüssel generieren, falls Treiber, Tabelle und ID vorliegen
                        const lockKey = (msg.driverId && msg.tableName && msg.recordId)
                            ? `${msg.driverId}_${msg.tableName}_${msg.recordId}`
                            : "";

                        switch (msg.type) {

                            // =================================================================
                            // 1. NAVIGATION & DATENABFRAGE (Pass-Through)
                            // =================================================================
                            case "GET_DATA": {
                                const { targetType, payload, driverId, tableName, recordId, idColName } = msg;

                                // Fall A: Der Client möchte das Ersteinrichtungs-Formular aufrufen
                                if (targetType === "WIZARD") {
                                    // Wir liefern die Tabellenstruktur, um Treiber-Daten einzugeben
                                    /** @type {DataRows} */
                                    const wizardForm = [
                                        ["id", "name", "type", "connectionString"],
                                        ["sqlite_main", "Haupt-Datenbank", "SQLITE", "./app_data.db"]
                                    ];
                                    ws.send(JSON.stringify({
                                        type: "COLUMN_DATA", columnType: "FORM", title: "Treiber einrichten", targetType: "SAVE_CONFIG", rows: wizardForm
                                    }));
                                    break;
                                }

                                // Fall B: Ein Treiber wurde gewählt -> Frage dessen Tabellenliste oder Menütabelle ab
                                if (targetType === "DRIVER_MAIN" && payload) {
                                    const driver = this.activeDrivers.get(payload);
                                    if (!driver) {
                                        ws.send(JSON.stringify({ type: "ERROR", text: `Treiber mit ID '${payload}' ist nicht initialisiert.` }));
                                        break;
                                    }

                                    // Der Treiber liefert uns die Tabellenübersicht
                                    // (Entweder per Datei-Scan oder aus einer systeminternen Menütabelle)
                                    // Format: [ ["TableName", "Beschreibung"], ["kunden", "Kundenkartei"] ]
                                    const tablesList = await driver.getRows("sys_tables_menu");

                                    ws.send(JSON.stringify({
                                        type: "COLUMN_DATA", columnType: "MENU", title: driver.name, driverId: payload, rows: tablesList
                                    }));
                                    break;
                                }

                                // Fall C: Eine Tabelle wurde gewählt -> Hole alle Datensätze für die InfoTable des Browsers
                                if (driverId && tableName && !recordId) {
                                    const driver = this.activeDrivers.get(driverId);
                                    if (!driver) {
                                        ws.send(JSON.stringify({ type: "ERROR", text: `Treiber '${driverId}' nicht aktiv.` }));
                                        break;
                                    }

                                    // Hole das komplette Daten-Array über den Treiber
                                    const tableRows = await driver.getRows(tableName);

                                    // Der Server gibt das Array unverändert an den Client weiter.
                                    // Der Client speichert es in seiner lokalen InfoTable zum Filtern und Sortieren.
                                    ws.send(JSON.stringify({
                                        type: "COLUMN_DATA", columnType: "TABLE", title: `Tabelle: ${tableName}`, driverId, tableName, rows: tableRows
                                    }));
                                    break;
                                }
                                break;
                            }

                            // =================================================================
                            // 2. CONCURRENCY LOGIC (Sperren & Freigeben)
                            // =================================================================
                            case "REQUEST_LOCK": {
                                const { driverId, tableName, recordId, idColName } = msg;
                                if (!lockKey || !driverId || !tableName || !recordId) {
                                    ws.send(JSON.stringify({ type: "ERROR", text: "Unvollständige Lock-Parameter." }));
                                    break;
                                }

                                // Prüfen, ob ein anderer Operator diesen Datensatz blockiert
                                if (this.activeLocks.has(lockKey)) {
                                    const currentLock = this.activeLocks.get(lockKey);
                                    if (currentLock && currentLock.username !== ws.data.username) {
                                        // Zugriff verweigert! Client erhält Fehlermeldung und darf nicht editieren
                                        ws.send(JSON.stringify({
                                            type: "LOCK_DENIED",
                                            text: `Datensatz wird bereits von '${currentLock.username}' bearbeitet (seit ${currentLock.lockTime}).`
                                        }));
                                        break;
                                    }
                                }

                                // Sperre im Server-Arbeitsspeicher (In-Memory) registrieren
                                /** @type {LockData} */
                                const newLock = {
                                    lockKey, driverId, tableName, recordId,
                                    username: ws.data.username,
                                    lockTime: new Date().toLocaleTimeString()
                                };
                                this.activeLocks.set(lockKey, newLock);

                                // Informiere ALLE Clients über den neuen globalen Sperr-Zustand
                                server.publish("app-room", JSON.stringify({ type: "LOCK_UPDATED", locks: Object.fromEntries(this.activeLocks) }));

                                // Jetzt holen wir den aktuellen Zustand GENAU DIESES einen Datensatzes frisch vom Treiber
                                const driver = this.activeDrivers.get(driverId);
                                if (driver) {
                                    const singleRecordRows = await driver.getRecord(tableName, recordId, idColName || "gsid");

                                    // Dem anfragenden Client grünes Licht geben und das Daten-Array für sein Formular senden
                                    ws.send(JSON.stringify({
                                        type: "COLUMN_DATA",
                                        columnType: "FORM",
                                        title: `Bearbeiten: ${recordId}`,
                                        driverId, tableName, recordId,
                                        rows: singleRecordRows // [ [Header], [Der eine Datensatz] ]
                                    }));
                                }
                                break;
                            }

                            case "RELEASE_LOCK": {
                                if (lockKey && this.activeLocks.has(lockKey)) {
                                    const currentLock = this.activeLocks.get(lockKey);
                                    // Nur der Besitzer des Locks darf es regulär wieder freigeben
                                    if (currentLock?.username === ws.data.username) {
                                        this.activeLocks.delete(lockKey);
                                        server.publish("app-room", JSON.stringify({ type: "LOCK_UPDATED", locks: Object.fromEntries(this.activeLocks) }));
                                        ws.send(JSON.stringify({ type: "LOCK_RELEASED_CONFIRMED" }));
                                    }
                                }
                                break;
                            }
                            // =================================================================
                            // 3. DATEN MODIFIKATION & SPEICHERUNG (Delta-Handling)
                            // =================================================================
                            case "SAVE_DATA": {
                                const { driverId, tableName, recordId, idColName, rows } = msg;

                                // Sonderfall: Speichern der globalen Optionen (Zustand: NULL überwinden)
                                if (msg.tableName === "save_driver_wizard" && rows) {
                                    const headers = rows[0];
                                    const values = rows[1];
                                    /** @type {DriverConfig} */
                                    // @ts-ignore
                                    const newDriverCfg = Object.fromEntries(headers.map((h, i) => [h, values[i]]));

                                    currentConfig.drivers.push(newDriverCfg);
                                    currentConfig.isNewSystem = false; // Zustand NULL ist beendet

                                    // Persistieren in der lokalen Benutzerdatei
                                    await saveApplicationConfig(currentConfig);
                                    // Treiber zur Laufzeit frisch hochfahren
                                    await this.initializeConfiguredDrivers();

                                    ws.send(JSON.stringify({ type: "SYSTEM_RELOAD_REQUIRED", text: "Treiber eingerichtet! Benutzeroberfläche wird neu aufgebaut." }));
                                    break;
                                }

                                // Regulärer Fall: Datenzeilen-Änderung in einer echten Datenbank
                                if (!driverId || !tableName || !rows) break;

                                // Concurrency Check: Hat der User die Sperre noch?
                                const currentLock = this.activeLocks.get(lockKey);
                                if (currentLock && currentLock.username !== ws.data.username) {
                                    ws.send(JSON.stringify({ type: "ERROR", text: "Speichern fehlgeschlagen: Du hast die Bearbeitungsrechte zwischenzeitlich verloren." }));
                                    break;
                                }

                                const driver = this.activeDrivers.get(driverId);
                                if (driver) {
                                    // Der Server reicht das Delta-Array [ [Header], [Nur ID & Geänderte Zellen] ] an den Treiber weiter.
                                    // Der Treiber validiert intern und führt das physische UPDATE/INSERT aus.
                                    const success = await driver.saveRows(tableName, rows, idColName || "gsid");

                                    if (success) {
                                        // Nach dem erfolgreichen Schreiben heben wir das Lock sofort auf
                                        this.activeLocks.delete(lockKey);

                                        // Broadcast an ALLE, dass sich Daten geändert haben.
                                        // Das triggert im Client das von dir beschriebene automatische Neu-Abrufen (Routing)
                                        server.publish("app-room", JSON.stringify({
                                            type: "DATA_MUTATED",
                                            driverId,
                                            tableName,
                                            locks: Object.fromEntries(this.activeLocks)
                                        }));

                                        // Dem ausführenden Client den Erfolg bestätigen
                                        ws.send(JSON.stringify({ type: "SAVE_SUCCESS", text: "Daten erfolgreich geschrieben." }));
                                    } else {
                                        ws.send(JSON.stringify({ type: "ERROR", text: "Der Datenbanktreiber hat das Speichern abgelehnt (Validierungsfehler)." }));
                                    }
                                }
                                break;
                            }

                            // =================================================================
                            // 4. LÖSCH-OPERATION (Data Purge)
                            // =================================================================
                            case "DELETE_DATA": {
                                const { driverId, tableName, recordId, idColName } = msg;
                                if (!lockKey || !driverId || !tableName || !recordId) break;

                                // Datensatz darf nicht von jemand anderem gesperrt sein
                                if (this.activeLocks.has(lockKey)) {
                                    const currentLock = this.activeLocks.get(lockKey);
                                    if (currentLock && currentLock.username !== ws.data.username) {
                                        ws.send(JSON.stringify({ type: "ERROR", text: "Löschen verweigert: Der Datensatz wird gerade von einem anderen Benutzer editiert." }));
                                        break;
                                    }
                                }

                                const driver = this.activeDrivers.get(driverId);
                                if (driver) {
                                    // Löschbefehl an den Treiber übergeben
                                    const success = await driver.deleteRow(tableName, recordId, idColName || "gsid");

                                    if (success) {
                                        // Eine eventuelle eigene Sperre sofort löschen
                                        this.activeLocks.delete(lockKey);

                                        // Allen Clients mitteilen, dass Daten gelöscht wurden -> Veranlasst UI-Refresh
                                        server.publish("app-room", JSON.stringify({
                                            type: "DATA_MUTATED",
                                            driverId,
                                            tableName,
                                            locks: Object.fromEntries(this.activeLocks)
                                        }));

                                        ws.send(JSON.stringify({ type: "DELETE_SUCCESS", text: "Datensatz permanent entfernt." }));
                                    } else {
                                        ws.send(JSON.stringify({ type: "ERROR", text: "Der Treiber konnte den Datensatz nicht löschen." }));
                                    }
                                }
                                break;
                            }
                            default:
                                ws.send(JSON.stringify({ type: "ERROR", text: `Aktionstyp '${msg.type}' wird vom Server nicht unterstützt.` }));
                                break;
                        }
                    } catch (err) {
                        console.error("Fehler im WebSocket-Handler:", err);
                        ws.send(JSON.stringify({ type: "ERROR", text: "Interner Serverfehler bei der Verarbeitung der Nachricht." }));

                    }
                    //console.log(`Nachricht empfangen von ${ws.data.userId}:`, message.toString());
                },
                close: (ws) => {
                    console.log(`Client getrennt(ID: ${ws.data.userId})`);
                    // Bereinige In-Memory Locks dieses Users
                    for (const [key, lock] of this.activeLocks.entries()) {
                        if (lock.username === ws.data.username) { this.activeLocks.delete(key); }
                    }
                }
            }
        });
        console.log(`Server läuft auf http://localhost:${this.port}`);
    }
}

// 4. AUSFÜHRUNG STARTEN
const app = new RealtimeServer(3000);
await app.initializeConfiguredDrivers();
app.start();
