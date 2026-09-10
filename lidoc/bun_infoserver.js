// =========================================================================
//   SERVERCORE (server.js)
// =========================================================================
// @ts-check

import { join } from "path";
import { mkdir } from "fs/promises";
import { InfoSchema, InfoTableUI_fields, InfoFormUI_fields } from "./infoschema.js";

//import { JsonFileDriver } from "./db_drivers.js";

// =========================================
//   Typen
// ---------

/**
 * DatenTypen vom Schema
 * @import {ApplicationConfig, ClientServerMessage, Token, DBDriverInterface, DriverConfig} from "./infoschema.js"
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
 * Gibt eine neue GlobalShortId zurück
 * @param {boolean} [large] - "true" Wenn in langer Form
 * @returns {string}
 */
export function getGSID(large) {
    if (large) {
        return new Date().getTime().toString(36) +
            crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    } else {
        return new Date().getTime().toString(36) +
            crypto.getRandomValues(new Uint16Array(1))[0].toString(36);
    }
}

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
        appName: APP_NAME
        , isNewSystem: true
        , drivers: []
        , defaultDriverId: null
        , infoTables: [[...InfoTableUI_fields]]
        , infoForms: [[...InfoFormUI_fields]]
        , appSchema: new InfoSchema()
    };

    await saveApplicationConfig(freshConfig);
    return freshConfig;
}

// 3. SERVER CLASS IMPLEMENTIERUNG
export class RealtimeServer {
    /**
     * @param {number} port - Der Port, auf dem Bun lauschen soll
     * @param {number} sessionTimeout - Zeit wie lange eine Session gültig ist
     */
    constructor(port = 3000, sessionTimeout = 15 * 60 * 1000) {
        this.port = port;

        /**
         * Aktive Token
         * @type {Map<string,Token>}
         */
        this.tokens = new Map();

        this.sessionTimeout = sessionTimeout;

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

        /** @type {Set<any>}  Alle offenen Sockets */
        this.openSockets = new Set();
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

                    console.log(`SQLite-Verbindung wird vorbereitet auf Datei: ${fullDbPath}`);

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


    // Hilfsfunktion um ein bestimmtes Cookie aus dem Header-String zu lesen
    /**
     * 
     * @param {string} cookieString - Cookie Header
     * @param {string} name - Name der Header Eigenschaft
     * @returns 
     */
    getCookie(cookieString, name) {
        if (!cookieString) return null;
        const pairs = cookieString.split(";");
        for (let pair of pairs) {
            const [key, value] = pair.trim().split("=");
            if (key === name) return decodeURIComponent(value);
        }
        return null;
    }

    /**
     * Gibt eine Message zum zurücksenden eines Fehlers zurück.
     * @param {string} message - Fehlermeldung
     * @returns {ClientServerMessage}
     */
    getErrorMessage(message) {
        /** @type {ClientServerMessage} */
        return {
            type: "ERROR"
            , payload: { message }
        };
    }

    /**
     * Gibt eine Massage zum Publizieren aller Sperreinträge zurück
     * @returns {ClientServerMessage}
     */
    getPublishLocksMessage() {
        // Informiere ALLE Clients über den neuen globalen Sperr-Zustand
        /** @type {ClientServerMessage} */
        return {
            type: "LOCK_UPDATED"
            , payload: this.activeLocks.values()
        };
    }


    /**
     * Startet den nativen Bun-HTTP- und WebSocket-Server
     */
    start() {
        /** @type {Bun.Server<{userId: string, username: string, exp: number}>} */
        const server = Bun.serve({
            port: this.port,
            //@ts-ignore
            fetch: async (req, server) => {
                const url = new URL(req.url);
                const cookieHeader = req.headers.get("cookie") || "";
                const tokenGsid = this.getCookie(cookieHeader, "auth_token") || "";
                const currentToken = this.tokens.get(tokenGsid);

                // 1. Erlaube den Zugriff auf die Login-Seite und statische Assets immer ohne Prüfung
                if (url.pathname === "/login" && req.method === "GET") {
                    // Hier lieferst du deine normalen Login-Dateien aus...
                    // Pfad für Bun.file vorbereiten (Punkt voranstellen für relativen Pfad)
                    const file = Bun.file("./_login.html");

                    // 3. Prüfen, ob die Datei existiert, und ausliefern
                    if (await file.exists()) {
                        return new Response(file);
                    }

                    // 4. Fallback, falls die Datei nicht existiert
                    return new Response("Login Not Found", { status: 404 });
                }

                // Prüfen auf aktiven user
                if (!currentToken || Date.now() < currentToken.exp) {
                    console.log(`Anonyme Anfrage auf ${url.pathname} - Leite um zu /login.html`);

                    // REDIRECT: Status 302 und Location-Header
                    return new Response(null, { status: 302, headers: { "Location": "/login" } });
                }

                // HTTP-Endpunkt zum EINLOGGEN und Cookie setzen
                if (url.pathname === "/login" && req.method === "POST") {
                    // todo: hier kommt irgendwann die Benutzer Prüfung rein
                    const body = await req.json();

                    /** @type {Token} */
                    const token = {
                        gsid: getGSID()
                        , userId: getGSID() // todo: wird Später vom Benutzer gelesen
                        , username: body.username || "lokaler_benutzer"
                        , exp: Date.now() + this.sessionTimeout
                    }

                    // Token Merken
                    this.tokens.set(token.gsid, token);

                    return new Response(JSON.stringify({ success: true }), {
                        status: 200,
                        headers: {
                            "Content-Type": "application/json",
                            // Hier setzen wir das sichere Cookie!
                            // HIER: Max-Age weglassen -> Es wird ein Session-Cookie!
                            "Set-Cookie": `auth_token=${token.gsid}; Path=/; HttpOnly; Secure; SameSite=Strict`
                        }
                    });

                    //return new Response("Nicht gefunden", { status: 404 });
                }

                // WebSocket Upgrade Handshake
                if (url.pathname === "/socket") {
                    // todo: Benutzer Daten -> Anmeldung
                    const cookieHeader = req.headers.get("cookie") || "";
                    const token = this.getCookie(cookieHeader, "auth_token") || "";

                    // TOKEN-PRÜFUNG
                    if (this.tokens.has(token)) {
                        const t = this.tokens.get(token);
                        if (t) {
                            return server.upgrade(req, { data: t });
                        } else {
                            // Wenn das Cookie fehlt oder ungültig ist, brechen wir den Handshake ab
                            return new Response("Nicht autorisiert", { status: 401 });
                        }
                    }

                    // Wenn das Cookie fehlt oder ungültig ist, brechen wir den Handshake ab
                    return new Response("Nicht autorisiert", { status: 401 });
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
                    // Socket im Set registrieren
                    this.openSockets.add(ws);

                    if (!ws.data || !ws.data.exp || Date.now() > ws.data.exp) {
                        console.log(`Verbindungsaufbau abgelehnt: Session abgelaufen.`);
                        ws.close(4001, "Session Timeout");
                        return;
                    }

                    console.log(`Client verbunden (ID: ${ws.data.userId})`);

                    // Jedes Mal beim Verbindungsaufbau prüfen wir frisch den Zustand der config.json
                    const currentConfig = await loadOrInitializeConfig();

                    // Initialisierung der ersten Menüspalte für den Browser
                    const startMenuRows = [["ID", "Label", "TargetType", "Payload"]];

                    // Diese Verwaltungs-Punkte stehen IMMER zur Verfügung, um das System live anzupassen
                    startMenuRows.push(["sys_schema_edit", "Schema Bearbeitung", "CONFIG_SCHEMA", ""]);
                    startMenuRows.push(["sys_ui_edit", "UI Darstellung Bearbeiten", "CONFIG_UI", ""]);
                    startMenuRows.push(["sys_drivers_edit", "Daten-Verbindungen Verwalten", "CONFIG_DRIVERS", ""]);

                    // Erst wenn das System eingerichtet ist, listen wir die echten Datenquellen auf
                    if (!currentConfig.isNewSystem && this.activeDrivers.size > 0) { //
                        for (const driverCfg of currentConfig.drivers) { //
                            startMenuRows.push([ //
                                driverCfg.id, //
                                `Datenquelle: ${driverCfg.name}`, //
                                "DRIVER_MAIN", //
                                driverCfg.id //
                            ]); //
                        } //
                    }

                    // Schicke dem Client das initiale State-Paket über den Socket
                    /** @type {ClientServerMessage} */
                    const init_data = {
                        type: "INITIAL_STATE"
                        //locks: Object.fromEntries(this.activeLocks), // Aktuelle Sperren als Objekt
                        //id: "root_column",
                        ,targetType: "MENU"
                        //title: `${currentConfig.appName} - Hauptmenü`,
                        ,rows: startMenuRows
                        , payload: currentConfig
                    }

                    ws.send(JSON.stringify(init_data));
                },
                message: async (ws, message) => {
                    try {
                        // Prüfen, ob die Datenstruktur des Nutzers überhaupt existiert
                        if (!ws.data || !ws.data.userId) {
                            /** @type {ClientServerMessage} */
                            const msg = this.getErrorMessage("No Login.");

                            ws.send(JSON.stringify(msg));
                            ws.close(4001, "Nicht authentifiziert");
                            return;
                        }

                        // Prüfen, ob die Session-Zeit (exp) abgelaufen ist
                        if (Date.now() > ws.data.exp) {
                            /** @type {ClientServerMessage} */
                            const msg = this.getErrorMessage("Session Timeout.");

                            ws.send(JSON.stringify(msg));
                            ws.close(4001, "Session abgelaufen");
                            return;
                        }

                        // Berechne den neuen Ablaufzeitpunkt (Jetzt + Timeout-Dauer)
                        const newExpiration = Date.now() + this.sessionTimeout;

                        // Aktualisiert sowohl ws.data als auch den Eintrag in this.tokens (Referenz)
                        ws.data.exp = newExpiration;

                        /** @type {ClientServerMessage} */
                        const msg = JSON.parse(message.toString());
                        console.log(`Aktion [${msg.type}] angefordert von [${ws.data.username}]`);

                        // Frisch geladene Konfiguration für eventuelle Abgleiche holen
                        const currentConfig = await loadOrInitializeConfig();

                        // Eindeutigen Sperrschlüssel generieren, falls Treiber, Tabelle und ID vorliegen
                        const lockKey = (msg.driverId && msg.tableName && msg.recordId)
                            ? `${msg.driverId}_${msg.tableName}_${msg.recordId}`
                            : "";

                        const { type, driverId, tableName, recordId, idColName, targetType, payload, rows } = msg;

                        /** @type {ClientServerMessage} */
                        const answer = { type: "ERROR", driverId, tableName, recordId, idColName };

                        switch (msg.type) {

                            // =================================================================
                            //   DATENABFRAGE (Pass-Through)
                            // =================================================================
                            case "GET_DATA": {
                                // Fall A: Der Client möchte das Ersteinrichtungs-Formular aufrufen
                                if (targetType === "CONFIG") {
                                    // Wir liefern die Tabellenstruktur, um Treiber-Daten einzugeben
                                    answer.type = "DATA";
                                    answer.targetType = "CONFIG";
                                    answer.payload = currentConfig;
                                    //const answer = { type: "DATA", targetType: "FORM", rows: wizardForm };

                                    ws.send(JSON.stringify(answer));
                                    break;
                                }

                                // Fall B: Ein Treiber wurde gewählt -> Frage dessen Tabellenliste oder Menütabelle ab
                                if (targetType === "DRIVER_MAIN") {
                                    const driver = this.activeDrivers.get(driverId || "");
                                    if (!driver) {
                                        ws.send(JSON.stringify(this.getErrorMessage(`No Driver with ID '${driverId}' found.`)));
                                        break;
                                    }

                                    // Der Treiber liefert uns die Tabellenübersicht
                                    // (Entweder per Datei-Scan oder aus einer systeminternen Menütabelle)
                                    // Format: [ ["TableName", "Beschreibung"], ["kunden", "Kundenkartei"] ]
                                    const tablesList = await driver.getTables();

                                    answer.type = "DATA";
                                    answer.targetType = "LIST";
                                    answer.rows = tablesList;

                                    ws.send(JSON.stringify(answer));
                                    break;
                                }

                                // Fall C: Eine Tabelle wurde gewählt -> Hole Datensätze oder Datensatz
                                if (driverId && tableName) {
                                    const driver = this.activeDrivers.get(driverId);

                                    if (!driver) {
                                        ws.send(JSON.stringify(this.getErrorMessage(`No Driver with ID '${driverId}' found.`)));
                                        break;
                                    }

                                    let tableRows;

                                    // Wenn datensatz ID  && !recordId
                                    if (recordId != undefined) {
                                        tableRows = await driver.getRecord(tableName, recordId, idColName || "gsid");
                                    } else {
                                        // Hole das komplette Daten-Array über den Treiber
                                        tableRows = await driver.getRows(tableName);
                                    }

                                    ///** @type {ClientServerMessage} */
                                    //const answer = { type: "DATA", targetType: "LIST", rows: tableRows };
                                    answer.type = "DATA";
                                    answer.targetType = "LIST";
                                    answer.rows = tableRows;

                                    // Der Server gibt das Array unverändert an den Client weiter.
                                    // Der Client speichert es in seiner lokalen InfoTable zum Filtern und Sortieren.
                                    ws.send(JSON.stringify(answer));
                                    break;
                                }
                                break;
                            }

                            // =================================================================
                            //   CONCURRENCY LOGIC (Sperren & Freigeben)
                            // =================================================================
                            case "REQUEST_LOCK": {
                                if (!lockKey || !driverId || !tableName || !recordId) {
                                    ws.send(JSON.stringify(this.getErrorMessage("Wrong Lock-Params.")));
                                    break;
                                }

                                // Prüfen, ob ein anderer Operator diesen Datensatz blockiert
                                if (this.activeLocks.has(lockKey)) {
                                    const currentLock = this.activeLocks.get(lockKey);
                                    if (currentLock && currentLock.username !== ws.data.username) {
                                        // Zugriff verweigert! Client erhält Fehlermeldung und darf nicht editieren
                                        answer.type = "LOCK_DENIED";
                                        answer.payload = { message: `Datensatz wird bereits von '${currentLock.username}' bearbeitet (seit ${currentLock.lockTime}).` };

                                        ws.send(JSON.stringify(answer));
                                        break;
                                    }
                                }

                                // Jetzt holen wir den aktuellen Zustand GENAU DIESES einen Datensatzes frisch vom Treiber
                                const driver = this.activeDrivers.get(driverId);
                                if (driver) {
                                    // Sperre im Server-Arbeitsspeicher (In-Memory) registrieren
                                    /** @type {LockData} */
                                    const newLock = {
                                        lockKey, driverId, tableName, recordId,
                                        username: ws.data.username,
                                        lockTime: new Date().toLocaleTimeString()
                                    };
                                    this.activeLocks.set(lockKey, newLock);

                                    // Informiere ALLE Clients über den neuen globalen Sperr-Zustand
                                    server.publish("app_group", JSON.stringify(this.getPublishLocksMessage()));

                                    // Daten lesen
                                    const singleRecordRows = await driver.getRecord(tableName, recordId, idColName || "gsid");

                                    // Antwort zusammenstellen
                                    answer.type = "DATA";
                                    answer.targetType = "FORM";
                                    answer.rows = singleRecordRows;

                                    // Dem anfragenden Client grünes Licht geben und das Daten-Array für sein Formular senden
                                    ws.send(JSON.stringify(answer));
                                }

                                break;
                            }

                            case "RELEASE_LOCK": {
                                if (lockKey && this.activeLocks.has(lockKey)) {
                                    const currentLock = this.activeLocks.get(lockKey);
                                    // Nur der Besitzer des Locks darf es regulär wieder freigeben
                                    if (currentLock?.username === ws.data.username) {
                                        this.activeLocks.delete(lockKey);

                                        // Informiere ALLE Clients über den neuen globalen Sperr-Zustand
                                        server.publish("app_group", JSON.stringify(this.getPublishLocksMessage()));

                                        // Benutzer Informieren das die Sperre aufgehoben ist
                                        ws.send(JSON.stringify({ type: "LOCK_RELEASED_CONFIRMED" }));
                                    }
                                }
                                break;
                            }

                            // =================================================================
                            //   DATEN MODIFIKATION & SPEICHERUNG (Delta-Handling)
                            // =================================================================
                            case "SAVE_DATA": {
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
                                    ws.send(JSON.stringify(this.getErrorMessage("Speichern fehlgeschlagen: Du hast die Bearbeitungsrechte zwischenzeitlich verloren.")));
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
                                        server.publish("app_group", JSON.stringify(this.getPublishLocksMessage()));

                                        // Dem ausführenden Client den Erfolg bestätigen
                                        answer.type = "SAVE_SUCCESS";
                                        answer.payload = { message: "Daten erfolgreich geschrieben." };
                                        ws.send(JSON.stringify(answer));
                                    } else {
                                        ws.send(JSON.stringify(this.getErrorMessage("Der Datenbanktreiber hat das Speichern abgelehnt (Validierungsfehler).")));
                                    }
                                }
                                break;
                            }

                            // =================================================================
                            // 4. LÖSCH-OPERATION (Data Purge)
                            // =================================================================
                            case "DELETE_DATA": {
                                if (!lockKey || !driverId || !tableName || !recordId) break;

                                // Datensatz darf nicht von jemand anderem gesperrt sein
                                if (this.activeLocks.has(lockKey)) {
                                    const currentLock = this.activeLocks.get(lockKey);
                                    if (currentLock && currentLock.username !== ws.data.username) {
                                        ws.send(JSON.stringify(this.getErrorMessage("Löschen verweigert: Der Datensatz wird gerade von einem anderen Benutzer editiert.")));
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
                                        server.publish("app_group", JSON.stringify(this.getPublishLocksMessage()));

                                        answer.type = "DELETE_SUCCESS";
                                        answer.payload = { message: "Datensatz permanent entfernt." };
                                        ws.send(JSON.stringify(answer));
                                    } else {
                                        ws.send(JSON.stringify(this.getErrorMessage("Der Treiber konnte den Datensatz nicht löschen.")));
                                    }
                                }
                                break;
                            }
                            default:
                                ws.send(JSON.stringify(this.getErrorMessage(`Aktionstyp '${msg.type}' wird vom Server nicht unterstützt.`)));
                                break;
                        }
                    } catch (err) {
                        console.error("Fehler im WebSocket-Handler:", err);
                        ws.send(JSON.stringify(this.getErrorMessage("Interner Serverfehler bei der Verarbeitung der Nachricht.")));

                    }
                    //console.log(`Nachricht empfangen von ${ws.data.userId}:`, message.toString());
                },
                close: (ws) => {
                    console.log(`Client getrennt(ID: ${ws.data.userId})`);

                    // Socket aus dem Set entfernen
                    this.openSockets.delete(ws);

                    // Bereinige In-Memory Locks dieses Users
                    for (const [key, lock] of this.activeLocks.entries()) {
                        if (lock.username === ws.data.username) { this.activeLocks.delete(key); }
                    }
                }
            }
        });


        // =================================================================
        // NEU: HINTERGRUND-AUFRÄUMPROZESS FÜR ABGELAUFENE SESSIONS
        // =================================================================
        setInterval(() => {
            const now = Date.now();
            let deletedTokensCount = 0;
            let closedSocketsCount = 0;

            // 1. Abgelaufene Tokens aus der Server-Map löschen
            for (const [gsid, token] of this.tokens.entries()) {
                if (now > token.exp) {
                    this.tokens.delete(gsid);
                    deletedTokensCount++;
                }
            }

            // 2. Alle offenen WebSockets prüfen und abgelaufene Verbindungen kicken
            for (const ws of this.openSockets) {
                if (ws.data && ws.data.exp && now > ws.data.exp) {
                    console.log(`Verbindung von User [${ws.data.username}] wird wegen Inaktivität geschlossen.`);

                    // Dem Client ein JSON senden, damit das Frontend weiß, warum es fliegt
                    try {
                        ws.send(JSON.stringify({ type: "ERROR", text: "Deine Session ist wegen Inaktivität abgelaufen." }));
                    } catch (e) {
                        // Falls der Socket bereits im Abbau ist
                    }

                    // Verbindung hart serverseitig schließen (Code 4001 signalisiert dem Client das Timeout)
                    ws.close(4001, "Session abgelaufen");
                    closedSocketsCount++;
                }
            }

            if (deletedTokensCount > 0 || closedSocketsCount > 0) {
                console.log(`[Aufräumer] ${deletedTokensCount} abgelaufene Tokens entfernt, ${closedSocketsCount} Verbindungen getrennt.`);
            }
        }, 30000); // Läuft alle 30 Sekunden (für lokale Entwicklung optimal)

        console.log(`Server läuft auf http://localhost:${this.port}`);
    }
}


// 4. AUSFÜHRUNG STARTEN
const app = new RealtimeServer(3000);
await app.initializeConfiguredDrivers();
app.start();
