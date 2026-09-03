// ===================================
//   WEB-Socket Server
// ===================================
// @ts-check

import { join } from "path";
import { mkdir } from "fs/promises";

// ===================================
//   Typen
// --------

/** @typedef {Array<string|number|bigint|boolean|Uint8Array<ArrayBufferLike>>} DataRow */
/** @typedef {Array<DataRow>} DataRows */
/**
 * @typedef {object} DBDriver
 * @property {(username: string) => Promise<DataRows>} getUserByUsername - Liefert einen Benutzer Datensatz zurück 
 * @property {(gsid: string, username: string, passwordHash: string) => Promise<void>} createUser - Fügt einen neuen Benutzer in die Datenbank ein
 * @property {(tableName: string) => Promise<Array<string>>} getColumns - Liefert alle Spaltennamen in einer Tabelle zurück.
 * @property {(tableName: string, selector: string) => Promise<DataRows>} getRows - Liest aus einer Tabelle Alle Datensätze oder Datensätze mit angegebenen GSID's
 * @property {(tableName: string, rows: DataRows, confilctKey?: string) => Promise<number>} saveRows - Updatet einen oder Mehrere Datensätze mit einer Liste mit der ID und den geänderten Feldern.
 */

/**
 * @typedef {Object} Token
 * @property {string} gsid
 * @property {string} userId
 * @property {string} username
 * @property {number} exp
 */

/**
 * @typedef {object} MessageData
 * @property {string} type - Message Type "LOCK_RECORD|SAVE|UNLOOK|RECORD_SAVED_AND_UNLOCKED"
 * @property {string} [tablename] - Name der Datentabelle
 * @property {string} [recordid] - Datensatz ID
 * @property {Array<Array<any>>} [rows] - Datenzeilen 1. Zeile sind Feldnamen // z.B. [ ["gsid", "name"], ["gadsfd", "Muster"] ]
 * @property {string} [idname] - Name der ID-Spalte
 * @property {Map<any, any>} [locks] - Map mit gesperrten Datensätzen
 * @property {string} [username] - Name des Benutzer
 * @property {string} [userid] - ID des Benutzers
 * @property {string} [text] - Belibiger Text, oder Fehlermeldung
 */


/**
 * data.tablename + "_" + data.recordid, { tablename, recordid username: ws.data.username, locktime: new Date().toLocaleTimeString() }
 * @typedef {object} LockData
 * @property {string} id - ID zusamengesetzt aus "{tablename}_{recordid}"
 * @property {string} tablename - Name der Tabelle
 * @property {string} recordid - ID des Datensatzes
 * @property {string} username - Name des Benutzers
 * @property {string} locktime - Datum ab wann gesperrt ist
 */
const LockData_fields = ["id", "tablename", "recordid", "username", "locktime"]

/** 
 * @typedef {Object} WebSocketData 
 * @property {string} [userId]
 * @property {string} [username]
 * @property {number} [expiresAt]
 */

/**
 * @typedef {Object} ServerConfig
 * @property {number} [port] - Server Post. Default: 3000
 * @property {number} [sessionTimeout] - Session Laufzeit im ms. Default: 900000 (15 Minuten)
 * @property {string} [rpName] - System Name. Default: "Echtzeit System"
 * @property {string} [rpId] - Default: "localhost"
 * @property {string} [origin] - Default: `http://${this.rpId}:${this.port}`
 */

// userId: payload.userId, username: payload.username, expiresAt


// ====================================
//   Parameter
// ------------

// Auslesen des Anwendungsnamens aus den Start-Parametern
// Beispiel-Aufruf: bun run server.js --name="MeinKundenSystem"
const args = Bun.argv;
const nameArg = args.find(arg => arg.startsWith("--name="));
const APP_NAME = nameArg ? nameArg.split("=")[1] : "Standard_Echtzeit_App";

console.log(`🏗️  Starte Anwendung: "${APP_NAME}"`);


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

// ===========================================
//   Konfiguration
// -----------------

/**
 * Gibt den dynamischen Pfad zur Konfiguration basierend auf dem App-Namen zurück
 * @returns {string} Pfad zur Konfiguration
 */
function getConfigPath() {
	const baseDir = process.env.APPDATA || process.env.HOME || ".";
	// Erstellt einen sauberen Ordnernamen aus dem App-Namen
	const safeFolder = "." + APP_NAME.toLowerCase().replace(/[^a-z0-9]/g, "_");
	return join(baseDir, safeFolder, "config.json");
}

/**
 * Konfiguration speichern
 * @param {object} data - Einstellungen
 */
async function saveConfig(data) {
	const filePath = getConfigPath();
	const file = Bun.file(filePath);
	const dirPath = filePath.substring(0, filePath.lastIndexOf(
		process.platform === "win32" ? "\\" : "/"
	));
	await mkdir(dirPath, { recursive: true });
	await Bun.write(file, JSON.stringify(data, null, 2));
}

/**
 * Konfiguration laden. Wenn keine existiert, wird eine leere Start-Struktur angelegt.
 * @returns {Promise<object>}
 */
async function loadOrInitConfig() {
	const file = Bun.file(getConfigPath());
	if (await file.exists()) {
		return await file.json();
	}
	
	// Minimale Struktur für eine nagelneue App (Zustand: NULL)
	const initialConfig = {
		appName: APP_NAME,
		isNewSystem: true,      // Flag für das Frontend
		drivers: [],            // Liste der konfigurierten DB/JSON-Treiber
		activeDriverId: null,   // Welcher Treiber ist gerade aktiv
		schemaTables: {         // Deine Schema-Metadaten Tabellen-Speicherorte
			DataType: [],
			PropertyType: [],
			SimpleType: [],
			RefType: [],
			UniqueType: [],
			InfoText: []
		}
	};
	await saveConfig(initialConfig);
	return initialConfig;
}

// =============================================


export class RealtimeServer {
	/**
	 * @param {DBDriver} dbDriver - Standard/Fallback Treiber
	 * @param {ServerConfig} [config] 
	 */
	constructor(dbDriver, config = {}) {
		this.db = dbDriver; 
		this.port = config.port || 3000;
		this.sessionTimeout = config.sessionTimeout || 15 * 60 * 1000;
		this.activeLocks = new Map();
		this.connections = new Map();
		this.tokens = new Map();
	}

	start() {
        /** @type {Bun.Server<WebSocketData>} */
		const server = Bun.serve({
			port: this.port,
            // @ts-ignore
			fetch: async (req, server) => {
				const url = new URL(req.url);
				
                // 1. ROUTING: STATISCHE RECHTE / UI (Falls benötigt)
				if (url.pathname === "/" || url.pathname === "/index.html") {
					return new Response(Bun.file("./index.html"), { headers: { "Content-Type": "text/html" } });
				}

				// 2. ROUTING: AUTHENTIFIZIERUNG (Nutzt das generische db-Objekt)
				if (url.pathname === "/api/auth/register" && req.method === "POST") {
					const { username, password } = await req.json();
					if (await this.db.getUserByUsername(username)) return new Response("Existiert", { status: 400 });
					const hash = await Bun.password.hash(password);
					await this.db.createUser(getGSID(), username, hash);
					return new Response(JSON.stringify({ success: true }));
				}

				if (url.pathname === "/api/auth/login" && req.method === "POST") {
					const { username, password } = await req.json();
					const user = await this.db.getUserByUsername(username);
					const password_hash = "" + (user[1][user[0].indexOf("password_hash")] || "");
					if (!user || !password_hash || !(await Bun.password.verify(password, password_hash))) {
						return new Response("Falsche Daten", { status: 401 });
					}
					const user_gsid = user[1][user[0].indexOf("gsid")] + "";
					return new Response(JSON.stringify({ success: true, token: this._genToken(user_gsid, username), userId: user_gsid }));
				}


				// 3. ROUTING: WEBSOCKET HANDSHAKE
				// if (url.pathname === "/socket") {
				// 	const token = url.searchParams.get("token") || "";
				// 	try {
				// 		/** @type {Token} */
				// 		const payload = JSON.parse(atob(token));
				// 		if (!payload || payload.exp < Date.now()) return new Response("Expired", { status: 401 });

				// 		// Token Prüfen ob registriert
				// 		const serverToken = this.tokens.get(payload.gsid);
				// 		if (!serverToken || serverToken != payload.userId) return new Response("Wrong Token", { status: 401 });

				// 		return server.upgrade(req, { data: { userId: payload.userId, username: payload.username, expiresAt: Date.now() + this.sessionTimeout } });
				// 	} catch (e) { return new Response("Unauthorized", { status: 401 }); }
				// }

                if (url.pathname === "/socket") {
                    return server.upgrade(req, { data: { userId: "local_user", username: "local", expiresAt: Date.now() + this.sessionTimeout } });
                }
    			return new Response("Not Found", { status: 404 });
			},
		    websocket: {
				open: async (ws) => {
					this.connections.set(ws.data.userId, ws);
					
					// Konfiguration laden oder initial anlegen
					const appConfig = await loadOrInitConfig();

					// Erzeuge das initiale Menü dynamisch basierend auf dem System-Zustand
					const startMenu = [["ID", "Label", "TargetType", "TargetTable"]];
					
					if (appConfig.isNewSystem || appConfig.drivers.length === 0) {
						// Zustand: Komplett Neu
						startMenu.push(
							["setup_wizard", "🚨 System einrichten (Neu)", "MENU_SETUP", ""],
							["import_schema", "Schema importieren (.json)", "FORM", "schema_import"]
						);
					} else {
						// Zustand: Betriebsbereit
						startMenu.push(
							["db_view", "Datenbanken & Tabellen", "MENU_DRIVERS", ""],
							["schema_manager", "Schema-Editor (Metadaten)", "MENU_SCHEMA", ""],
							["config_view", "System-Einstellungen", "FORM", "system_config"]
						);
					}

					ws.send(JSON.stringify({
						type: "INITIAL_STATE",
						appName: APP_NAME,
						locks: Object.fromEntries(this.activeLocks),
						initialColumn: {
							id: "root_menu",
							type: "MENU",
							title: `${APP_NAME} - Hauptmenü`,
							rows: startMenu
						}
					}));
				},

				message: async (ws, message) => {
					/** @type {MessageData & { targetType?: string }} */
					const data = JSON.parse(message + "");
					const appConfig = await loadOrInitConfig();

					switch (data.type) {
						case "GET_NEXT_COLUMN": {
							const { tablename, recordid, targetType } = data;

							// =========================================================
							// WIZARD: WENN ALLES NEU IST
							// =========================================================
							if (targetType === "MENU_SETUP") {
								const setupMenu = [
									["ID", "Typ", "Beschreibung"],
									["add_json_driver", "JSON-Datei-Verbindung", "Daten in lokaler JSON-Datei speichern"],
									["add_sqlite_driver", "SQLite Datenbank", "Lokale performante SQL-Datenbank"],
									["add_html_driver", "HTML-Fragment-Ordner", "Ordner für Detailansichten einbinden"]
								];
								ws.send(JSON.stringify({
									type: "COLUMN_DATA",
									columnId: "setup_options",
									columnType: "MENU",
									title: "Treiber-Verbindung hinzufügen",
									rows: setupMenu
								}));
								break;
							}

							// Formular zum Anlegen eines Treibers (Beispiel JSON-Datei)
							if (tablename === "add_json_driver" || recordid === "add_json_driver") {
								const driverForm = [
									["DriverID", "Verzeichnispfad", "Beschreibung"],
									["json_db_1", "./daten/", "Meine lokalen JSON Tabellen"]
								];
								ws.send(JSON.stringify({
									type: "COLUMN_DATA",
									columnId: "form_json_driver",
									columnType: "FORM",
									title: "JSON Treiber konfigurieren",
									tablename: "save_new_driver",
									rows: driverForm
								}));
								break;
							}

							// =========================================================
							// MULTI-TREIBER LOGIK (JSON, SQLITE, HTML)
							// =========================================================
							
							// Wenn HTML-Fragmente für eine Detailansicht abgefragt werden
							if (targetType === "HTML_FRAGMENT" || tablename?.endsWith(".html")) {
								// Bun liest Textdateien/HTML extrem schnell direkt ein
								const htmlPath = join(appConfig.htmlFolderPath || "./fragments", tablename);
								const file = Bun.file(htmlPath);
								let content = "<h1>Fragment nicht gefunden</h1>";
								if (await file.exists()) {
									content = await file.text();
								}
								ws.send(JSON.stringify({
									type: "COLUMN_DATA",
									columnId: `html_${tablename}`,
									columnType: "DETAIL", // Weist das Frontend an, HTML zu rendern
									title: `Vorschau: ${tablename}`,
									htmlContent: content 
								}));
								break;
							}

							// Standard-Tabellenabfrage (Leitet an den konfigurierten Treiber weiter)
							if (tablename && !recordid) {
								let rows = [];
								
								// Hier wird entschieden, welcher Treiber die Daten liefert!
								if (appConfig.activeDriverType === "JSON") {
									rows = await this._readFromJsonFile(tablename);
								} else {
									rows = await this.db.getRows(tablename, "ALL");
								}

								ws.send(JSON.stringify({
									type: "COLUMN_DATA",
									columnId: `table_${tablename}`,
									columnType: "TABLE",
									title: `Tabelle: ${tablename}`,
									tablename: tablename,
									rows: rows
								}));
								break;
							}

							break;
						}

						// case "SAVE": {
						// 	// Speichert einen neu angelegten DB/JSON Treiber
						// 	if (data.tablename === "save_new_driver" && data.rows) {
						// 		const headers = data.rows[0];
						// 		const values = data.rows[1];
						// 		const newDriver = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
								
						// 		appConfig.drivers.push(newDriver);
						// 		appConfig.activeDriverId = newDriver.DriverID;
						// 		appConfig.activeDriverType = "JSON"; // zur Veranschaulichung
						// 		appConfig.isNewSystem = false; // System ist nicht mehr jungfräulich!
								
						// 		await saveConfig(appConfig);
								
						// 		ws.send(JSON.stringify({ type: "SYSTEM_RELOAD", text: "Treiber erfolgreich eingerichtet! Bitte App neu laden." }));
						// 		break;
						// 	}
						// 	break;
						// }
						// =================================================================
						// SCHEMA-MANAGEMENT (IMPORT, ANALYSE & INITIALISIERUNG)
						// =================================================================
						
						case "GET_NEXT_COLUMN": {
							const { tablename, recordid, targetType } = data;

							// 1. ANZEIGE DES SCHEMA-MANAGERS (Metadaten-Tabellen)
							if (targetType === "MENU_SCHEMA") {
								const schemaMenu = [
									["ID", "Tabelle (Metadaten)", "Beschreibung"],
									["meta_datatypes", "DataTypes", "Definierte Objekttypen und Entitäten"],
									["meta_properties", "Properties", "Felder und Spaltenzuordnungen"],
									["meta_simpletypes", "SimpleTypes", "Spezifische Datenvalidierungen"],
									["meta_enums", "EnumTypes", "Erlaubte Wertelisten"],
									["meta_refs", "RefTypes", "Datenbank-Fremdschlüssel/Referenzen"]
								];
								ws.send(JSON.stringify({
									type: "COLUMN_DATA",
									columnId: "schema_tables_overview",
									columnType: "MENU",
									title: "Schema-Struktur bearbeiten",
									rows: schemaMenu
								}));
								break;
							}

							// Wenn eine Metadaten-Tabelle ausgewählt wird, laden wir sie aus unserer Konfiguration
							if (tablename?.startsWith("meta_")) {
								const schemaKey = tablename.replace("meta_", ""); // z.B. "datatypes"
								// Hole die Zeilen aus appConfig.schemaTables[schemaKey]
								// Falls leer, liefere zumindest das leere Spaltengerüst (Header)
								const rows = appConfig.schemaTables[schemaKey] && appConfig.schemaTables[schemaKey].length > 0
									? appConfig.schemaTables[schemaKey]
									: [this._getSchemaHeaders(schemaKey)];

								ws.send(JSON.stringify({
									type: "COLUMN_DATA",
									columnId: `table_${tablename}`,
									columnType: "TABLE",
									title: `Metadaten: ${schemaKey.toUpperCase()}`,
									tablename: tablename,
									rows: rows
								}));
								break;
							}

							// 2. FORMULAR FÜR SCHEMA-IMPORT
							if (tablename === "schema_import") {
								const importForm = [
									["SchemaJSON", "Beschreibung"],
									["", "Füge hier den Inhalt deiner vollständigen InfoSchema.json ein"]
								];
								ws.send(JSON.stringify({
									type: "COLUMN_DATA",
									columnId: "form_schema_import",
									columnType: "FORM",
									title: "Neues InfoSchema importieren",
									tablename: "execute_schema_import",
									rows: importForm
								}));
								break;
							}
							break;
						}

						case "SAVE": {
							// 3. SCHEMA-IMPORT VERARBEITEN & SPEICHERN
							if (data.tablename === "execute_schema_import" && data.rows) {
								try {
									const rawJsonString = data.rows[1][0]; // Erster Wert der zweiten Zeile (Inhalt des Textareas)
									/** @type {InfoSchema} */
									const importedSchema = JSON.parse(rawJsonString);

									if (importedSchema.infotype !== "infoSchema") {
										throw new Error("Ungültiger infotype. Erwartet wird 'infoSchema'.");
									}

									// Befülle die Metadaten-Tabellen der App-Konfiguration direkt mit den Arrays
									appConfig.schemaTables = {
										datatypes: importedSchema.datatypes || [["name","art","base_name","simple_types","id","more_attributes","more_properties"]],
										simpletypes: importedSchema.simpletypes || [["name","art","length","min_length","max_length","pattern","whitespace","casing","decimals","min_inclusive","min_exclusive","max_exclusive","max_inclusive"]],
										properties: importedSchema.properties || [["gsid","object_name","name","pos","prop_type","min","max","default","fix"]],
										uniques: importedSchema.uniques || [["gsid", "name", "object_name", "object_props"]],
										enums: importedSchema.enums || [["name","values","more_enums"]],
										refs: importedSchema.refs || [["gsid","name","object_name","object_props","ref_name","ref_props","on_update","on_delete"]],
										infos: importedSchema.infos || [["gsid","type_name","prop_gsid","lang","date","text"]]
									};

									appConfig.isNewSystem = false; // System hat nun valide Strukturen
									await saveConfig(appConfig);

									ws.send(JSON.stringify({ 
										type: "SYSTEM_RELOAD", 
										text: `Schema '${importedSchema.name}' (v${importedSchema.version}) erfolgreich importiert! Bitte App neu laden.` 
									}));
								} catch (err) {
									ws.send(JSON.stringify({ type: "ERROR", text: "Import fehlgeschlagen: " + err.message }));
								}
								break;
							}
							break;
						}
                    
					} // switch
				}
			}
		});
		console.log(`🚀 Modularer Server läuft auf http://localhost:${this.port}`);
	}

	/**
	 * Erzeugt einen Benutzer Token für die Websocket Verbindung
	 * @param {string} userId - ID des Benutzers
	 * @param {string} username - Name des Benutzers
	 * @returns {string}
	 */
	_genToken(userId, username) {
		const gsid = getGSID();
		this.tokens.set(gsid, userId);
		return btoa(JSON.stringify({ gsid, userId, username, exp: Date.now() + this.sessionTimeout }));
	}

	/**
	 * 
	 * @param {Bun.Server<WebSocketData>} server 
	 */
	_broadcastDashboard(server) {
		server.publish("app-room", JSON.stringify({ type: "DASHBOARD_UPDATE", locks: Object.fromEntries(this.activeLocks) }));
	}


	// Hilfsmethode für das dynamische Lesen aus JSON-Dateien statt echter DB
	async _readFromJsonFile(tablename) {
		const filePath = `./daten/${tablename}.json`;
		const file = Bun.file(filePath);
		if (await file.exists()) {
			return await file.json();
		}
		// Wenn Datei nicht existiert, leere Tabelle mit ID-Header zurückgeben
		return [["gsid"], ["generiert_id"]];
	}

	/**
	 * Hilfsmethode zur Bereitstellung der Default-Spaltennamen laut deinem Schema-Gerüst
	 * @param {string} type 
	 * @returns {Array<string>}
	 */
	_getSchemaHeaders(type) {
		switch(type) {
			case "datatypes": return ["name","art","base_name","simple_types","id","more_attributes","more_properties"];
			case "simpletypes": return ["name","art","length","min_length","max_length","pattern","whitespace","casing","decimals","min_inclusive","min_exclusive","max_exclusive","max_inclusive"];
			case "properties": return ["gsid","object_name","name","pos","prop_type","min","max","default","fix"];
			case "uniques": return ["gsid", "name", "object_name", "object_props"];
			case "enums": return ["name","values","more_enums"];
			case "refs": return ["gsid","name","object_name","object_props","ref_name","ref_props","on_update","on_delete"];
			case "infos": return ["gsid","type_name","prop_gsid","lang","date","text"];
			default: return ["gsid"];
		}
	}
}




export class RealtimeServer2 {
	/**
	 * Erstellt einen WebSocket Server
	 * @param {DBDriver} dbDriver - Datenbank Treiber
	 * @param {ServerConfig} [config] - Optional Konfiguration für den Server 
	 */
	constructor(dbDriver, config = {}) {
		/** @type {DBDriver} */
		this.db = dbDriver; // Das generische Interface
		this.port = config.port || 3000;
		this.sessionTimeout = config.sessionTimeout || 15 * 60 * 1000;
		this.rpName = config.rpName || 'Echtzeit System';
		this.rpId = config.rpId || 'localhost';
		this.origin = config.origin || `http://${this.rpId}:${this.port}`;

		this.activeLocks = new Map();
		this.currentChallenges = new Map();
	}

	/** @type {Map<string,Bun.ServerWebSocket<WebSocketData>>} */
	connections = new Map();

	/** @type {Map<string,string>} */
	tokens = new Map();

	start() {
		/** @type {Bun.Server<WebSocketData>} */
		const server = Bun.serve({
			port: this.port,
			// @ts-ignore
			fetch: async (req, server) => {
				const url = new URL(req.url);

				// 1. ROUTING: STATISCHE RECHTE / UI (Falls benötigt)
				if (url.pathname === "/" || url.pathname === "/index.html") {
					return new Response(Bun.file("./index.html"), { headers: { "Content-Type": "text/html" } });
				}

				// 2. ROUTING: AUTHENTIFIZIERUNG (Nutzt das generische db-Objekt)
				if (url.pathname === "/api/auth/register" && req.method === "POST") {
					const { username, password } = await req.json();
					if (await this.db.getUserByUsername(username)) return new Response("Existiert", { status: 400 });
					const hash = await Bun.password.hash(password);
					await this.db.createUser(getGSID(), username, hash);
					return new Response(JSON.stringify({ success: true }));
				}

				if (url.pathname === "/api/auth/login" && req.method === "POST") {
					const { username, password } = await req.json();
					const user = await this.db.getUserByUsername(username);
					const password_hash = "" + (user[1][user[0].indexOf("password_hash")] || "");
					if (!user || !password_hash || !(await Bun.password.verify(password, password_hash))) {
						return new Response("Falsche Daten", { status: 401 });
					}
					const user_gsid = user[1][user[0].indexOf("gsid")] + "";
					return new Response(JSON.stringify({ success: true, token: this._genToken(user_gsid, username), userId: user_gsid }));
				}


				// 3. ROUTING: WEBSOCKET HANDSHAKE
				if (url.pathname === "/socket") {
					const token = url.searchParams.get("token") || "";
					try {
						/** @type {Token} */
						const payload = JSON.parse(atob(token));
						if (!payload || payload.exp < Date.now()) return new Response("Expired", { status: 401 });

						// Token Prüfen ob registriert
						const serverToken = this.tokens.get(payload.gsid);
						if (!serverToken || serverToken != payload.userId) return new Response("Wrong Token", { status: 401 });

						return server.upgrade(req, { data: { userId: payload.userId, username: payload.username, expiresAt: Date.now() + this.sessionTimeout } });
					} catch (e) { return new Response("Unauthorized", { status: 401 }); }
				}

				return new Response("Not Found", { status: 404 });
			},

			/** @type {Bun.WebSocketHandler<WebSocketData>} */
			websocket: {
				open: async (ws) => {
					if (!ws.data.userId) { return; }
					this.connections.set(ws.data.userId, ws);
					ws.subscribe("app-room");

					// Lädt beim Start die im Benutzerordner hinterlegte Konfiguration
					const userConfig = await loadConfig() || { defaultTable: "records" };

					// Wir senden den Initial-State inkl. der ersten Menü-Spalte (Hauptmenü)
					const startMenu = [
						["ID", "Label", "TargetType", "TargetTable"],
						["db_view", "Datenbank Tabellen", "MENU_TABLES", ""],
						["config_view", "Einstellungen (Lokal)", "FORM", "system_config"],
						["help_view", "Dokumentation", "DETAIL", "readme"]
					];

					ws.send(JSON.stringify({
						type: "INITIAL_STATE",
						locks: Object.fromEntries(this.activeLocks),
						userConfig: userConfig,
						// Wir schicken direkt die erste Spalte mit, damit die UI sofort rendern kann
						initialColumn: {
							id: "root_menu",
							type: "MENU",
							title: "Hauptmenü",
							rows: startMenu
						}
					}));
					this._broadcastDashboard(server);
				},
				message: async (ws, message) => {
					ws.data.expiresAt = Date.now() + this.sessionTimeout;

					/** @type {MessageData & { columnId?: string, targetType?: string }} */
					const data = JSON.parse(message + "");
					
					// Einheitliche Generierung des Lock-Keys
					const lockKey = data.tablename && data.recordid ? `${data.tablename}_${data.recordid}` : "";

					switch (data.type) {
						// =================================================================
						// NEU: SPALTEN-NAVIGATION (KERN DEINER UI LOGIK)
						// =================================================================
						case "GET_NEXT_COLUMN": {
							const { tablename, recordid, targetType } = data;

							// Untermenü: Tabellen auflisten
							if (targetType === "MENU_TABLES") {
								const tableList = [
									["TableName", "Beschreibung"],
									["records", "Standard Datensätze"],
									["kunden", "Kundenstammdaten"],
									["artikel", "Artikelkatalog"]
								];
								ws.send(JSON.stringify({
									type: "COLUMN_DATA",
									columnId: "menu_tables",
									columnType: "MENU",
									title: "Tabellenübersicht",
									rows: tableList
								}));
								break;
							}

							// Formular für Einstellungen (Lokal)
							if (tablename === "system_config") {
								const currentConfig = await loadConfig() || {};
								// Schema-Format: Zeile 1 = Header, Zeile 2 = Aktuelle Werte
								const configForm = [
									["defaultTable", "theme", "autoSave"],
									[currentConfig.defaultTable || "records", currentConfig.theme || "dark", currentConfig.autoSave || false]
								];
								ws.send(JSON.stringify({
									type: "COLUMN_DATA",
									columnId: "config_form",
									columnType: "FORM",
									title: "Einstellungen",
									tablename: "system_config",
									rows: configForm
								}));
								break;
							}

							// Wenn eine Datentabelle geklickt wurde (noch keine recordid vorhanden)
							if (tablename && !recordid) {
								const allRows = await this.db.getRows(tablename, "ALL");
								ws.send(JSON.stringify({
									type: "COLUMN_DATA",
									columnId: `table_${tablename}`,
									columnType: "TABLE",
									title: `Tabelle: ${tablename}`,
									tablename: tablename,
									rows: allRows
								}));
								break;
							}

							// Wenn ein konkreter Datensatz gewählt wurde -> Detail-/Formularansicht
							if (tablename && recordid) {
								const singleRecord = await this.db.getRows(tablename, recordid);
								ws.send(JSON.stringify({
									type: "COLUMN_DATA",
									columnId: `detail_${lockKey}`,
									columnType: "FORM", // oder DETAIL
									title: `Datensatz ${recordid}`,
									tablename: tablename,
									recordid: recordid,
									rows: singleRecord
								}));
								break;
							}
							break;
						}

						case "LOCK": {
							/** @type {LockData} */
							const lockdata = {
								id: lockKey,
								username: ws.data.username || "local",
								tablename: data.tablename || "",
								recordid: data.recordid || "",
								locktime: new Date().toLocaleTimeString()
							};
							this.activeLocks.set(lockKey, lockdata);

							server.publish("app-room", JSON.stringify({
								type: "RECORD_LOCKED",
								tablename: data.tablename,
								recordid: data.recordid,
								username: ws.data.username,
								locks: Object.fromEntries(this.activeLocks)
							}));
							this._broadcastDashboard(server);
							break;
						}

						case "SAVE": {
							// Speichern der lokalen Systemkonfiguration in APPDATA
							if (data.tablename === "system_config" && data.rows) {
								const headers = data.rows[0];
								const values = data.rows[1];
								const configObj = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
								await saveConfig(configObj);
								
								ws.send(JSON.stringify({ type: "CONFIG_SAVED", success: true }));
								break;
							}

							// Normaler DB-Speichervorgang
							const currentLock = this.activeLocks.get(lockKey);
							// Lokal erlauben wir das Speichern immer, im Netzwerk nur dem Lock-Besitzer
							if (!currentLock || currentLock.username === ws.data.username || ws.data.username === "local") {

								// TODO: Hier deine Schema-Validierung der Rows vorschalten!

								await this.db.saveRows(
									data.tablename || "",
									data.rows || [[]],
									data.idname || "gsid"
								);

								this.activeLocks.delete(lockKey);

								server.publish("app-room", JSON.stringify({
									type: "RECORD_SAVED_AND_UNLOCKED",
									tablename: data.tablename,
									recordid: data.recordid,
									locks: Object.fromEntries(this.activeLocks)
								}));
								this._broadcastDashboard(server);
							}
							break; // WICHTIG: Verhindert Fall-Through in UNLOCK!
						}

						case "UNLOCK":
							this.activeLocks.delete(lockKey);
							server.publish("app-room", JSON.stringify({
								type: "RECORD_UNLOCKED",
								tablename: data.tablename,
								recordid: data.recordid,
								locks: Object.fromEntries(this.activeLocks)
							}));
							this._broadcastDashboard(server);
							break;

						default:
							break;
					}
				},
				close: (ws) => {
					setTimeout(() => {
						if (ws.readyState == 3) {
							// Bereinigung über den korrekten Key-Vergleich
							for (const [key, lock] of this.activeLocks.entries()) {
								if (lock.username === ws.data.username) {
									this.activeLocks.delete(key);
									server.publish("app-room", JSON.stringify({ type: "RECORD_UNLOCKED", id: key, locks: Object.fromEntries(this.activeLocks) }));
								}
							}
							this.connections.delete(ws.data.userId + "");
							ws.unsubscribe("app-room");
							this._broadcastDashboard(server);

							const keys = [...this.tokens.keys()];
							for (let i = 0; i < keys.length; i++) {
								const t = this.tokens.get(keys[i]);
								if (t && t == ws.data.userId) {
									this.tokens.delete(keys[i]);
								}
							}
						}
					}, 3000);
				}
			}
		});

		// Timeout-Wächter-Interval
		setInterval(() => {
			const jetzt = Date.now();
			const keys = [...this.connections.keys()];
			for (let i = 0; i < keys.length; i++) {
				const ws = this.connections.get(keys[i]);
				if (ws?.data && ws.data.expiresAt && ws.data.expiresAt < jetzt) {
					// Schicken das Session endet
					ws.send(JSON.stringify({ type: "SESSION_EXPIRED" }));

					// Socket verbindung schliessen
					ws.close();

					// aus Verbindungen löschen
					this.connections.delete(keys[i]);
				}
			}
		}, 60000);

		console.log(`🚀 Modularer Server läuft auf http://localhost:${this.port}`);
	}

	/**
	 * Erzeugt einen Benutzer Token für die Websocket Verbindung
	 * @param {string} userId - ID des Benutzers
	 * @param {string} username - Name des Benutzers
	 * @returns {string}
	 */
	_genToken(userId, username) {
		const gsid = getGSID();
		this.tokens.set(gsid, userId);
		return btoa(JSON.stringify({ gsid, userId, username, exp: Date.now() + this.sessionTimeout }));
	}

	/**
	 * 
	 * @param {Bun.Server<WebSocketData>} server 
	 */
	_broadcastDashboard(server) {
		server.publish("app-room", JSON.stringify({ type: "DASHBOARD_UPDATE", locks: Object.fromEntries(this.activeLocks) }));
	}
}

