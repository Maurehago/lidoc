// ============================
//    InfoTable
// ============================
// @ts-check


// ----------- Daten DatenTypen ---------------------


/**
 * Eine einzelne Datenzeile. Kann primitive Werte oder Binärdaten enthalten.
 * @typedef {Array<string | number | bigint | boolean | Uint8Array | null>} DataRow
 */

/**
 * Das universelle, zweidimensionale Tabellenformat für alle Treiber und Schichten.
 * Die ERSTE Zeile (Index 0) enthält IMMER die Spaltennamen (Header).
 * @typedef {Array<DataRow>} DataRows
 */


// ----------- APP DatenTypen ---------------------

/**
 * @typedef {Object} Token
 * @property {string} gsid - Eindeutige Session ID
 * @property {string} userId - ID des Users
 * @property {string} username - Name des Benutzers
 * @property {number} exp - Gültigkeitszeitraum
 */

/**
 * Beschreibt eine registrierte Datenquelle (Datenbank oder Datei-Verzeichnis).
 * Diese Struktur wird in der lokalen config.json persistiert.
 * @typedef {Object} DriverConfig
 * @property {string} id - Eindeutige ID des Treibers innerhalb dieser App (z.B. "lokale_kunden_db")
 * @property {"SQLITE"|"FIREBIRD"|"FOLDER"} type - Die technologische Art des Treibers
 * @property {string} name - Menschenlesbarer Anzeigename für das UI-Hauptmenü
 * @property {string} connectionString - Pfad zur Datei (SQLite), Server-Verbindungsdaten (Firebird), Pfad ("FOLDER")
 */

/**
 * Die globale Konfigurationsdatei der Anwendung, abgelegt im Benutzer-Appdata-Ordner.
 * @typedef {Object} ApplicationConfig
 * @property {string} appName - Der Name der App (aus Startparameter oder Default)
 * @property {boolean} isNewSystem - Flag; "true" wenn das System im Zustand "NULL" ist (keine Treiber konfiguriert)
 * @property {Array<DriverConfig>} drivers - Liste aller vom Benutzer eingerichteten Datenquellen
 * @property {string | null} defaultDriverId - Optionaler Standard-Treiber, der beim Start direkt geöffnet wird
 * @property {DataRows} infoTables - Liste mit allen InfoTables
 * @property {DataRows} infoForms - Liste mit Formularen
 */

/**
 * Alle erlaubten MessageTypen für das System.
 * @typedef {"GET_DATA" | "REQUEST_LOCK" | "RELEASE_LOCK" | "SAVE_DATA"
 * | "DELETE_DATA" | "SAVE_CONFIG" | "INITIAL_STATE" | "LOCK_UPDATED" 
 * | "DATA" | "ERROR" | "LOCK_DENIED" | "LOCK_RELEASED_CONFIRMED"
 * | "SAVE_SUCCESS" | "DATA_MUTATED" | "DELETE_SUCCESS"} MessageType
 */

/**
 * Ziel Typen für die Verarbeitung der Messages
 * @typedef {"LIST"|"FORM"|"DETAIL"|"MENU"|"CONFIG"|"DRIVER_MAIN"} TargetType
 */


/**
 * Das einheitliche WebSocket-Nachrichtenformat für die Kommunikation zwischen Client und Server.
 * server:"INITIAL_STATE" -> client // bei erster Verbindung
 * client:"GET_DATA" -> server:"DATA"|"ERROR" -> client 
 * client:"REQUEST_LOCK" -> server:"LOCK_UPDATED" -> app_group // Alle Benutzer werden mit "LOCK_UPDATED" informiert wenn die Sperrung OK ist
 *                          server:"DATA"|"ERROR"|"LOCK_DENIED" -> client 
 * client:"RELEASE_LOCK" -> server:"LOCK_UPDATED" -> app_group // Alle Benutzer werden mit "LOCK_UPDATED" informiert das die Sperrung aufgehoben ist
 *                          server:"LOCK_RELEASED_CONFIRMED" -> client
 * client:"SAVE_DATA" ->    server:"SAVE_SUCCESS"|"ERROR" -> client
 *                          server:"DATA_MUTATED" -> app_group // Alle Benutzer werden mit "DATA_MUTATED" informiert das sich Daten geändert haben
 * client:"DELETE_DATA" ->  server:"DELETE_SUCCESS"|"ERROR" -> client
 *                          server:"DATA_MUTATED" -> app_group // Alle Benutzer werden mit "DATA_MUTATED" informiert das sich Daten geändert haben
 * @typedef {Object} ClientServerMessage
 * @property {MessageType} type - Aktionstyp
 * @property {string} [requestId] - Eindeutige ID der Nachricht wird an den Server geschickt, und dieser sendet diese wieder zurück damit der Client diese zuordnen kann????
 * @property {string} [driverId] - Ziel-Treiber für die Aktion
 * @property {string} [tableName] - Ziel-Tabelle für die Aktion
 * @property {string} [recordId] - Eindeutige ID des Datensatzes. Wird für Datensatzsperren verendet
 * @property {Array<string>} [idFields] - Felder die einen Datensatz eindeutig identifizieren
 * @property {Object<string,any>} [quest] - Optional Abfrage Bedingung. z.B.: { gsid: "jagfdgg" }
 * @property {TargetType} [targetType] - Für Navigation: Welcher UI-Typ wird erwartet ("MENU" | "TABLE" | "FORM" | "DETAIL" | "WIZARD")
 * @property {Object<string,any>} [payload] - Freitext-Feld für Payloads (z.B. komplettes Config-JSON oder Schema-JSON)
 */


// ----------- Lokale DatenTypen ---------------------


/** 
 * Callback Funktion die für alle Datensätze ausgeführt wird.  
 * Wenn die Funktion "true" zurückliefert, wird der Datensatz in die neue Liste und Index aufgenommen.
 * @template T
 * @callback CallbackFunction
 * @param {T} obj - Datensatz Zeile
 * @param {number} [rowIndex] - Position in der Liste nach Index
 * @param {ReturnType<DataTable<T>["readOnly"]>} [datatable] - Referenz auf die DatenTabelle
 * @returns {any} Wenn "true" dann kommt der Datensatz in die neue gefilterte Liste wenn "break" wird abgebrochen.
 */


/** 
 * Callback Funktion die für alle Datensätze ausgeführt wird.  
 * Wenn die Funktion "true" zurückliefert, wird der Datensatz in die neue Liste und Index aufgenommen.
 * @template T
 * @callback GroupFunction
 * @param {Array<T>} list - Liste mit Datensatz Objekten
 * @param {ReturnType<DataTable<T>["readOnly"]>} [datatable] - Referenz auf die DatenTabelle
 * @returns {any} Wenn "true" dann kommt der Datensatz in die neue gefilterte Liste wenn "break" wird abgebrochen.
 */


/**
 * ID Objekt welche die ID und den Index eines Datensatzes oder Spalte enthält
 * @typedef {Object} RowInfo
 * @property {string} id - Die ID des Datensatzes oder der Spalte
 * @property {number} index - Die Position des Datensatzes oder der Spalte
 */


/**
 * @typedef {Object} SQLQuery
 * @property {string} sql - WHERE Bedingung ohne "WHERE" am Beginn
 * @property {Array<any>} params - Parameterwerte für die sql-Query
 */


// ===================================
//   Funktionen
// -------------

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
 * Prüft ob ein Wert eine Zahl ist
 * @param {string} string - Text zum Prüfen
 * @returns 
 */
export function isNumber(string) {
    return !isNaN(Number(string));
}

/**
 * Prüft ob ein Objekt eine Klasse ist
 * @param {object} obj - Zu prüfendes Objekt
 * @returns {boolean} "true" wenn angegebenes Objet eine Klasse ist
 */
export function isClass(obj) {
    return typeof obj === 'function' && obj.prototype && obj.prototype.constructor === obj;
}


//const ALLOWED_TABLES = ["users", "banned_users", "posts"]; // Schutz für Unter-Selects
//const ALLOWED_COLUMNS = ["id", "user_id", "name", "role", "age", "status", "reason"];
const ALLOWED_OPERATORS = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IS", "IS NOT", "IN", "NOT IN"];


// ===================================
//   Klassen
// -------------


/**
 * Basis Klasse für Daten Treiber. Muss Überschieben werden.
 * @class DBDriver
 */
export class DBDriver {
    id = ""; // Entspricht DriverConfig.id
    type = ""; // Entspricht DriverConfig.type
    name = ""; // Name des Teibers???

    /** 
     * Regular Expression für Gültige Tabellennamen
     * @example
     * tableNameRegex = /^(?!sqlite_)[a-z_][a-z0-9_]*$/; // SQLite Tabellen  
     * if (!tableNameRegex.test(tableName)) throw new Error("Table not allowed!");  
     */
    tableNameRegex = /^(?!sqlite_)[a-z_][a-z0-9_]*$/;


    /**
     * Erstellt aus einer Quest-Abfrage eine SQL-Abfrage (ohne WHERE am Beginn)  
     * OPERATORS: "=", "!=", ">", "<", ">=", "<=", "LIKE", "IS", "IS NOT", "IN", "NOT IN"  
     * Objekte {} == AND  
     * Arrays [] == OR  
     * @param {Object<string,any>} quest - Abfrage Filter
     * @returns {SQLQuery}
     * @example
     * SELECT * FROM users WHERE (status = ? AND (role = ? OR (age >= ? AND name LIKE ?)))  
     * {
     *      status: "active",
     *      _or: [
     *          { role: "admin" },
     *          { 
     *              age: { ">=": 60 }, 
     *              name: { "LIKE": "Hugo%" } 
     *          }
     *      ]
     * }
     * oder
     * 
     * SELECT * FROM users WHERE (status = ? AND role IN (?, ?) AND id NOT IN (SELECT user_id FROM banned_users WHERE reason = ?))
     * {  
     *     status: "active",  
     *     role: { "IN": ["admin", "moderator"] },  
     *     id: {  
     *         "NOT IN": {  
     *             subSelect: {  
     *                 table: "banned_users",  
     *                 column: "user_id",  
     *                 where: { reason: "spam" }  
     *             }  
     *         }  
     *     }  
     * }
     */
    quest_to_query(quest) {
        const clauses = [];
        const params = [];

        // FALL 1: Array -> OR
        if (Array.isArray(quest)) {
            //for (const subFilter of quest) {
            for (let i = 0; i < quest.length; i++) {
                const parsed = this.quest_to_query(quest[i]);
                if (parsed.sql) {
                    clauses.push(parsed.sql);
                    params.push(...parsed.params);
                }
            }
            return {
                sql: clauses.length > 1 ? `(${clauses.join(" OR ")})` : clauses.join(" OR "),
                params
            };
        }

        // FALL 2: Objekt -> AND
        if (quest && typeof quest === "object") {
            const keys = Object.keys(quest);
            //for (const key in quest) {
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];

                // ODER-Brücke (_or)
                if (key === "_or" && Array.isArray(quest[key])) {
                    const parsed = this.quest_to_query(quest[key]);
                    if (parsed.sql) {
                        clauses.push(parsed.sql);
                        params.push(...parsed.params);
                    }
                    continue;
                }

                // NICHT-Brücke (_not)
                if (key === "_not" && typeof quest[key] === "object") {
                    const parsed = this.quest_to_query(quest[key]);
                    if (parsed.sql) {
                        clauses.push(`NOT (${parsed.sql})`);
                        params.push(...parsed.params);
                    }
                    continue;
                }

                // Sicherheits-Check für Spaltennamen
                //if (!ALLOWED_COLUMNS.includes(key)) {
                //    throw new Error(`Ungültiger Spaltenname: ${key}`);
                //}

                const val = quest[key];

                // Kurzform für Gleichheit mit null
                if (val === null) {
                    clauses.push(`${key} IS NULL`);
                    continue;
                }

                // Behandlung von Operatoren-Objekten
                if (val && typeof val === "object") {
                    const operators = Object.keys(val);
                    for (const op of operators) {
                        if (!ALLOWED_OPERATORS.includes(op)) {
                            throw new Error(`Ungültiger Operator: ${op}`);
                        }

                        const innerVal = val[op];

                        // NEU: Spezialbehandlung für IN / NOT IN
                        if (op === "IN" || op === "NOT IN") {

                            // Variante A: Normales Array von Werten (z.B. ["admin", "moderator"])
                            if (Array.isArray(innerVal)) {
                                if (innerVal.length === 0) {
                                    // Ein leeres IN-Array wirft in SQL Fehler, daher fangen wir es logisch ab
                                    clauses.push(op === "IN" ? "1=0" : "1=1");
                                } else {
                                    const placeholders = innerVal.map(() => "?").join(", ");
                                    clauses.push(`${key} ${op} (${placeholders})`);
                                    params.push(...innerVal);
                                }
                            }

                            // Variante B: Unter-Select (z.B. { subSelect: { table: '...', ... } })
                            else if (innerVal && typeof innerVal === "object" && innerVal.subSelect) {
                                const sub = innerVal.subSelect;

                                // Sicherheits-Checks für das Unter-Select
                                if (!this.tableNameRegex.test(sub.table)) throw new Error(`Ungültige Tabelle im Subselect: ${sub.table}`);
                                //if (!ALLOWED_COLUMNS.includes(sub.column)) throw new Error(`Ungültige Spalte im Subselect: ${sub.column}`);

                                // Rekursiver Aufruf für die WHERE-Bedingung des Unter-Selects!
                                const subParsed = this.quest_to_query(sub.where || {});

                                clauses.push(`${key} ${op} (SELECT ${sub.column} FROM ${sub.table} WHERE ${subParsed.sql})`);
                                params.push(...subParsed.params);
                            } else {
                                throw new Error(`Ungültiger Wert für Operator ${op}. Erwartet wird ein Array oder ein subSelect-Objekt.`);
                            }
                        }
                        // Alle anderen Operatoren (=, >=, IS NULL, etc.)
                        else {
                            if (innerVal === null) {
                                if (op === "=" || op === "IS") clauses.push(`${key} IS NULL`);
                                else if (op === "!=" || op === "IS NOT") clauses.push(`${key} IS NOT NULL`);
                                else throw new Error(`Operator ${op} kann nicht mit null verwendet werden.`);
                            } else {
                                clauses.push(`${key} ${op} ?`);
                                params.push(innerVal);
                            }
                        }
                    }
                }
                // Normale Gleichheit
                else {
                    clauses.push(`${key} = ?`);
                    params.push(val);
                }
            }

            return {
                sql: clauses.length > 1 ? `(${clauses.join(" AND ")})` : clauses.join(" AND "),
                params
            };
        }

        return { sql: "1=1", params: [] };
    }

    // // --- Testlauf ---

    // const meinUltimativerFilter = {
    //     status: "active",
    //     role: { "IN": ["admin", "moderator"] },
    //     id: {
    //         "NOT IN": {
    //             subSelect: {
    //                 table: "banned_users",
    //                 column: "user_id",
    //                 where: { reason: "spam" }
    //             }
    //         }
    //     }
    // };

    // const { sql, params } = quest_to_query(meinUltimativerFilter);
    // console.log("Generiertes SQL:\n", `SELECT * FROM users WHERE ${sql}`);
    // console.log("\nParameter dazu:\n", params);


    // --- FUNKTIONEN sollen überschrieben werden

    /**
     * Gibt alle Datensätze oder nur die von der Abfrage zurück
     * @param {string} tableName - Name der Datentabelle
     * @param {Object<string,any>} [quest] - Optionale Abfrage
     * @returns {Promise<DataRows>}
     */
    async getRows(tableName, quest) { return []; }

    /**
     * Gibt einen Datensatz mit angegebener ID zurück
     * @param {string} tableName - Name der Datentabelle
     * @param {Object<string,any>} quest - Abfrage für eindeutigen Datensatz.
     * @returns {Promise<DataRows>}
     */
    async getRecord(tableName, quest) { return []; }

    /**
     * Speichert die Daten oder legt diese neu an. Die ID-Spalten müssen den Datensatz eindeutig Identifizieren.
     * @param {string} tableName - Name der Datentabelle
     * @param {Array<Array<any>>} deltaRows - geänderte Daten. In der ersten Zeile stehen die Spaltennamen.
     * @param {Array<string>} idCols - Name der ID-Spalten
     * @returns {Promise<boolean>} true wenn erfolgreich
     */
    async saveRows(tableName, deltaRows, idCols) { return true; }

    /**
     * Löscht Datensätze von der Abfrage
     * @param {string} tableName - Name der Datentabelle
     * @param {Object<string,any>} quest - Optionale Abfrage
     * @returns {Promise<boolean>}
     */
    async deleteRows(tableName, quest) { return false; }
}




/**
 * Eine InMemmory Datentabelle
 * @template T
 */
export class DataTable {
    /**
     * Eine InMemmory Datentabelle
     * @param {string} tableName - Name der Tabelle
     * @param {Array<Array<any>>} dataArray - DatenZeilen. Erste Zeile enthält Spaltennamen
     * @param {string} [idColumnName] - Name der ID-DatenSpalte. Default: "gsid"
     */
    constructor(tableName, dataArray, idColumnName = "gsid") {
        /** @type {string} */
        this.tableName = tableName;
        /** @type {Array<string>} */
        this.columns = dataArray[0] || [];
        /** @type {Array<Array<any>>} WICHTIG!! rows nicht direkt bearbeiten! */
        this.rows = dataArray;
        /** @type {string} */
        this.idColumnName = idColumnName;

        /** @type {Object<string,number>} */
        this.columnIndex = {}; // Object.fromEntries(this.columns.map((col, idx) => [col, idx]));
        for (let i = 0; i < this.columns.length; i++) {
            this.columnIndex[this.columns[i]] = i;
        }

        /** @type {Map<string,number>} */
        this.rowMap = new Map();

        const idIdx = this.columnIndex[idColumnName];
        for (let i = 1; i < this.rows.length; i++) {
            this.rowMap.set(this.rows[i][idIdx] + "", i);
        }

        this._instanzCache = new Map();
        /** @type {Map<string,Array<number>>} */
        this._indexList = new Map();

        /** @type {Map<string,number>} */
        this._changed = new Map();

        /** @type {Map<string,number>} */
        this._deleted = new Map();
    }


    /**
     * Gib die Anzahl der Listeneinträge zurück
     * @param {string|Array<number>} [indexName] - Optional Index von dem die Länge zurückgegeben wird
     */
    getLength(indexName) {
        return this.getIndexList(indexName).length;
    }


    /**
     * Gibt alle Spalten der Tabelle zurück
     * @returns {Array<string>} Alle Spalten der Tabelle in richtiger Reihenfolge
     */
    getCols() {
        return this.columns;
    }

    /**
     * Liefert die ID eines Objektes zurück
     * @param {Object<string,any>|Array<any>} obj - Datenobjekt mit dem idFeld
     * @returns {any} ID
     */
    getID(obj) {
        if (!obj) { return; }
        if (Array.isArray(obj)) {
            const idIdx = this.columnIndex[this.idColumnName];
            return obj[idIdx];
        } else {
            return obj[this.idColumnName] || undefined;
        }
    }


    /**
     * Liefter die SpaltenIndexes der Angegeben Spalten in einer Liste zurück.
     * @param {Array<string>|string} colNames - Liste mit Spaltennamen
     * @returns {Array<number>} Liste min Spalten Indexes
     */
    getColIndex(colNames) {
        /** @type {Array<number>} */
        const colIndexList = [];
        if (Array.isArray(colNames)) {
            for (let i = 0; i < colNames.length; i++) {
                colIndexList.push(this.columnIndex[colNames[i]] || -1);
            }
            return colIndexList;
        } else {
            return [this.columnIndex[colNames] || -1];
        }
    }


    /**
     * Prüft ob ein Datensatz mit abgefragter ID bereits in der List ist
     * @param {string} id - ID die gesucht wird
     * @returns {boolean} 
     */
    has(id) {
        return this.rowMap.has(id);
    }


    /**
     * Lieftert die Datensatz Information (ID und Position(index) in der Liste) zurück. index: -1 wenn nicht gefunden oder gelöscht.
     * @param {string|number} id - ID oder Datensatzindex
     * @returns {RowInfo} DatensatzInformation Objekt mit ID und Position(index). index: -1 wenn nicht gefunden
     */
    getRowInfo(id) {
        /** @type {RowInfo} */
        const rowInfo = { id: "", index: -1 };

        // Wenn ID des Datensatzen
        if (typeof id == "string") {
            rowInfo.id = id;
            rowInfo.index = this.rowMap.get(id) || -1;
        } else if (id > 0 && id < this.rows.length) {
            rowInfo.index = id;
            rowInfo.id = this.getID(this.rows[id]);
        } else {
            return rowInfo;
        }

        // wenn gelöscht -> abbrechen
        if (this._deleted.has(rowInfo.id)) {
            rowInfo.index = -1;
        }

        return rowInfo;
    }


    /**
     * Liefert eine Liste aller Index-Positionen vom angegeben Index oder allen Datensätzen zurück.  
     * Existiert der Index nicht, wird eine die ganze Liste zurück gegeben.
     * @param {string|Array<number>} [indexName] - Indexname oder Liste mit PositionsNummern
     * @returns {Array<number>} ID-Liste der Datzensätze
     */
    getIndexList(indexName) {
        if (!indexName) {
            return [...this.rowMap.values()];
        } else {
            if (Array.isArray(indexName)) { return indexName; }
            return this._indexList.get(indexName) || [...this.rowMap.values()];
        }
    }

    /**
     * Prüft ob ein bestimmter index in der Liste vorhanden ist
     * @param {string} indexName - Index Name
     * @returns {boolean} "true" wenn Index mit dem Namen vorhanden
     */
    hasIndexList(indexName) {
        return this._indexList.has(indexName);
    }


    /**
     * Liefert eine Datenzeile zurück die nicht die Kopfzeile ist, und auch noch nicht gelöscht worden ist.
     * @param {string|number} id - ID oder Datenzeilen Position
     * @returns {Array<any>|undefined}
     */
    getRow(id) {
        const rowInfo = this.getRowInfo(id);

        // wenn gelöscht -> abbrechen
        if (rowInfo.index <= 0) { return; }

        return this.rows[rowInfo.index];
    }


    /**
     * Fügt neue Datenzeilen hinzu oder ersetzt bestehende wenn die selbe ID. Die 1. Datenzeile muss Feldnamen enthalten.
     * @param {Array<Array<any>>} newRows - Neue Datenzeilen, in 1. Zeile müssen die Spaltennamen stehen
     */
    mergeRows(newRows) {
        if (!Array.isArray(newRows)) { return; }

        // 1. Zeile mit Feldnamen
        const colIndexes = this.getColIndex(newRows[0]);

        // Alle Zeilen durchgehen
        for (let i = 1; i < newRows.length; i++) {
            const newRow = newRows[i];
            const id = this.getID(newRow);

            // versuchen bestehenesn Datensatz zu lesen
            let row = this.getRow(id);
            if (!row) {
                row = new Array(this.columns.length);
                const newIndex = this.rows.push(row) - 1;
                this.rowMap.set(id, newIndex);
            }

            // Alle spalten durchgehen
            for (let j = 0; j < colIndexes.length; j++) {
                // Wenn Spalte vorhanden
                if (colIndexes[j] >= 0) {
                    // wert zuweisen
                    row[colIndexes[j]] = newRow[j];
                }
            }
        }
    }


    /**
     * Erzeugt eine neue Datenzeile die noch nicht in der Liste angelegt wird. 
     * @param {string} [id] - Optional neue ID. Wenn nicht angegeben wird eine GSID generiert
     * @returns {Partial<T>}
     */
    newObject(id) {
        /** @type {Partial<T>} */
        const obj = {};
        //@ts-ignore
        obj[this.idColumnName] = id || getGSID();
        return obj;
    }


    /**
     * Liefert einen Datensatz als Objekt zurück
     * @param {string|number} id - ID oder DatenSatz Position 
     * @returns {T|undefined} Datensatz als Objekt
     */
    getObject(id) {
        const rawRow = this.getRow(id);
        if (!rawRow) { return; }

        /** @type {T} */
        //@ts-ignore
        const obj = {};
        for (let i = 0; i < this.columns.length; i++) {
            //@ts-ignore
            obj[this.columns[i]] = rawRow[i];
        }

        return obj;
    }


    /**
     * Liefert eine Liste mit Datensatzobjekten zurück
     * @param {string|Array<string|number>|undefined} index - Index-Name oder Liste mit ID oder Datensatz position
     * @returns {Array<T>} Liste mit Datensatz-Objekten
     */
    getObjectList(index) {
        /** @type {Array<T>} */
        let objList = [];

        if (!index || typeof index == "string") {
            index = this.getIndexList(index);
        }

        // Wenn Array
        if (Array.isArray(index)) {
            for (let i = 0; i < index.length; i++) {
                const obj = this.getObject(index[i]);
                if (obj) {
                    objList.push(obj);
                }
            }
        }

        return objList;
    }


    /**
     * Liefert eine Liste mit allen gelöschen Datensatzobjekten zurück
     * @returns {Array<T>} Liste mit Datensatz-Objekten
     */
    getDeletedList() {
        /** @type {Array<T>} */
        let objList = [];

        const index = [...this._deleted.values()];

        // Wenn Array
        if (Array.isArray(index)) {
            for (let i = 0; i < index.length; i++) {
                const obj = this.getObject(index[i]);
                if (obj) {
                    objList.push(obj);
                }
            }
        }

        return objList;
    }


    /**
     * Liefert den Wert einer Spalte von der angegebenen Zeilenposition zurück
     * @param {string|number} row - Zeilennummer oder ID
     * @param {string|number} col - Spaltenname oder Spalten Position
     * @returns {any}
     */
    getCellValue(row, col) {
        // Datenzeile lesen
        const rawRow = this.getRow(row);
        if (!rawRow) { return; }

        if (typeof col == "string") {
            return rawRow[this.columnIndex[col]];
        } else {
            return rawRow[col];
        }
    }


    /**
     * Speichert einen wert in einer Datensatz-Spalte, legt keinen neuen Daten an wenn nicht gefunden
     * @param {string|number} row - Zeilennummer oder ID
     * @param {string|number} col - Spaltenname oder Spalten Position
     * @param {any} value - Wert der gespeichert wird
     * @returns {string|number|undefined} die ID wenn Änderung erfolgreich
     */
    setCellValue(row, col, value) {
        // DatensatzIndex lesen
        const rowInfo = this.getRowInfo(row);
        const rowIndex = rowInfo.index;
        if (rowIndex <= 0) { return; }

        let colIndex = -1;
        if (typeof col == "string") {
            colIndex = this.columnIndex[col];
        } else {
            colIndex = col;
        }

        // Nur wenn Spalte vorhanden
        if (colIndex != undefined && colIndex >= 0 && colIndex < this.columns.length) {
            // Wert übernehmen
            this.rows[rowIndex][colIndex] = value;

            // als Geändert markieren
            this._changed.set(rowInfo.id, rowIndex);
        }

        return row;
    }


    /**
     * Fügt einen wert in einer Datensatz-Spalte hinzu. Die Spalte muss ein Array sein oder wird in ein Array umgewandelt. 
     * @param {string|number} row - Zeilennummer oder ID
     * @param {string|number} col - Spaltenname oder Spalten Position
     * @param {any} value - Wert der gespeichert wird
     * @param {boolean} unique - Optional ob der Wert in der Liste eindeutig sein soll. DEFAULT: true
     * @returns {string|number|undefined} Die ID wenn Änderung erfolgreich
     */
    addCellArrayValue(row, col, value, unique = true) {
        // DatensatzIndex lesen
        const rowInfo = this.getRowInfo(row);
        const rowIndex = rowInfo.index;
        if (rowIndex <= 0) { return; }

        if (typeof col == "string") {
            col = this.columnIndex[col]
        }

        // Wenn Spalte nicht in der Datenzeile
        if (col == undefined || col < 0 || col >= this.columns.length) {
            return row;
        }

        const oldValue = this.rows[rowIndex][col];

        // Wenn bereits ein Array
        if (Array.isArray(oldValue)) {
            // Wenn einfügender Wert ein Array ist
            if (Array.isArray(value)) {
                // Alle Werte durchgehen
                for (let i = 0; i < value.length; i++) {
                    if (!unique || oldValue.indexOf(value[i]) < 0) {
                        oldValue.push(value[i]);
                    }
                }
            } else {
                if (!unique || oldValue.indexOf(value) < 0) {
                    oldValue.push(value);
                }
            }
        } else if (oldValue != undefined) {
            if (Array.isArray(value)) {
                this.rows[rowIndex][col] = [oldValue, ...value];
            } else {
                this.rows[rowIndex][col] = [oldValue, value];
            }
        } else {
            if (Array.isArray(value)) {
                this.rows[rowIndex][col] = value;
            } else {
                this.rows[rowIndex][col] = [value];
            }
        }

        // als Geändert markieren
        this._changed.set(rowInfo.id, rowIndex);
        return row;
    }


    /**
     * Fügt einen wert in einer Datensatz-Spalte hinzu. Die Spalte muss ein Set sein oder wird in ein Set umgewandelt. 
     * @deprecated
     * @param {string|number} row - Zeilennummer oder ID
     * @param {string|number} col - Spaltenname oder Spalten Position
     * @param {any} value - Wert der gespeichert wird
     * @returns {string|number|undefined} Die ID wenn Änderung erfolgreich
     */
    addCellSetValue(row, col, value) {
        // SpaltenIndex bestimmen
        if (typeof col == "string") {
            col = this.columnIndex[col]
        }

        // Wenn Spalte nicht in der Datenzeile
        if (col == undefined || col < 0 || col >= this.columns.length) {
            return;
        }

        // DatensatzIndex lesen
        const rowInfo = this.getRowInfo(row);
        const rowIndex = rowInfo.index;
        if (rowIndex <= 0) { return; }

        // wenn eine Liste von Werten
        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                this.addCellSetValue(row, col, value[i]);
            }
            return row;
        }


        const oldValue = this.rows[rowIndex][col];
        if (oldValue instanceof Set) {
            oldValue.add(value);
        } else if (oldValue != undefined) {
            this.rows[rowIndex][col] = new Set([oldValue, value]);
        } else {
            this.rows[rowIndex][col] = new Set([value]);
        }

        // als Geändert markieren
        this._changed.set(rowInfo.id, rowIndex);
        return row;
    }


    /**
     * Setzt ein Objekt in die Liste. Die ID wird aus den Einstellungen und dem Objekt-Eigenschaften gelesen.
     * @param {Partial<T>} obj - Objekt mit Daten das in die Liste aufgenommen wird.
     * @param {boolean} [createNew] - Optional ob ein neues Objekt angelegt wird wenn nicht vorhanden. Default: true
     * @returns {string|undefined} Die ID wenn Neu oder Bearbeitet
     */
    setObject(obj, createNew = true) {
        let id = this.getID(obj);
        let isChanged = false;

        // Wenn keine ID dann kann nicht eingefügt werden
        if (id == undefined) {
            if (createNew == false) { return; }

            // neue ID selbst vergeben
            id = getGSID();
            //@ts-ignore
            obj[this.idColumnName] = id;

            isChanged = true;
        }

        // gelöschte Datensätze mit selber ID nicht mehr anlegen
        if (this._deleted.has(id)) { return; }

        /** @type {Array<string>} neue Spalten */
        const newColNames = [...Object.keys(obj)];
        const colIds = this.getColIndex(newColNames);

        /** @type {Array<any>} */
        let rawRow = [];

        //let rowIndex = this.rowMap.get(id);
        const rowInfo = this.getRowInfo(id);
        let rowIndex = rowInfo.index;

        // Wenn kein rowindex (oder datensatz gelöscht?)
        if (rowIndex < 0) {
            if (createNew == false) { return; }

            // neu anlegen
            rawRow = new Array(this.columns.length);
            rowIndex = this.rows.push(rawRow) - 1;
            this.rowMap.set(id, rowIndex);
            isChanged = true;
        } else if (rowIndex > 0) {
            rawRow = this.rows[rowIndex];
        } else {
            return;
        }

        // Werte zuweisen
        for (let i = 0; i < newColNames.length; i++) {
            if (colIds[i] >= 0 && colIds[i] < this.columns.length) {
                //@ts-ignore
                rawRow[colIds[i]] = obj[newColNames[i]];
                isChanged = true;
            }
        }

        // nur wenn Bearbeitet die ID zurückgeben
        if (isChanged) {
            this._changed.set(id, rowIndex);
            return id;
        }

        return;
    }


    /**
     * Setzt Eigenschaften einer Datenzeile 
     * @param {string} id - ID der Datenzeile
     * @param {Partial<T>} obj - Eigenschaften die gesetzt werden
     * @param {boolean} [createNew] - Optional ob ein neues Objekt angelegt wird wenn nicht vorhanden. Default: true
     * @returns {string|number|undefined} die ID wenn Bearbeitet oder angelegt
     */
    setValues(id, obj, createNew = true) {
        if (id == undefined) return;

        //@ts-ignore
        obj[this.idColumnName] = id;
        return this.setObject(obj, createNew);
    }


    /**
     * Markiert einen oder mehrere Datensätze aus der Liste als gelöscht
     * @param {string|number|Array<string|number>} id - ID oder ZeilenIndex oder Liste mit Ids oder ZeilenIndexes
     */
    delete(id) {
        // Wenn liste mit ID's
        if (Array.isArray(id)) {
            for (let i = 0; i < id.length; i++) {
                this.delete(id);
            }
            return;
        }

        // Zeilenindex lesen
        const rowInfo = this.getRowInfo(id);
        const rowIndex = rowInfo.index;
        if (rowIndex) {
            // zeile als gelöscht markieren
            this._deleted.set(rowInfo.id, rowIndex);

            // Zeile aus IndexMap entfernen
            this.rowMap.delete(rowInfo.id);
            this._changed.delete(rowInfo.id);
        }
    }

    /**
     * Markiert einen oder mehrere Datensätze aus der Liste als nicht gelöscht
     * @param {string|number|Array<string|number>} id - ID oder ZeilenIndex oder Liste mit Ids oder ZeilenIndexes
     */
    unDelete(id) {
        // Wenn liste mit ID's
        if (Array.isArray(id)) {
            for (let i = 0; i < id.length; i++) {
                this.unDelete(id);
            }
            return;
        }

        // ZeilenInfo lesen
        const rowInfo = this.getRowInfo(id);

        // Wenn gelöscht
        if (this._deleted.has(rowInfo.id)) {
            // zeile aus gelöscht entfernen
            this._deleted.delete(rowInfo.id);

            // Zeile in IndexMap hinzufügen
            this.rowMap.set(rowInfo.id, rowInfo.index);

            // Bearbeitet setzen
            this._changed.set(rowInfo.id, rowInfo.index);
        }
    }


    /**
     * Sortiert die Daten nach angegebenen Spalten. Groß-Kleinschreibung bei Texten wird ignoriert.  
     * Aufsteigend: A > B = 1  
     * Wenn kein "index" angegeben, werden alle Daten sortiert.
     * Wenn "index" angegeben, werden nur die Daten unter diesem Index sortiert.
     * Wenn "newIndex" angegeben, wird die Sortierung unter "newIndex" abgelegt.
     * @param {Array<string>} sortCols - Liste mit Spalten nach denen Sortiert wird oder eine Sortierungsfunktion (|CallbackSortFunction<T>)
     * @param {string|Array<number>} [index] - Index Name oder Liste mit IndexPositionan der zum sortieren verwendet wird.
     * @param {string} [newIndexName] - Index Name der nach dem Sortieren gesetzt wird.
     * @returns {Array<number>} sortierte Liste mit sortiertem Datenzeilen-Positionen
     * @example
     * const sortList = dataList.sortRows(["name", "hausnummer DESC"], "sortListe");
     */
    sort(sortCols, index, newIndexName) {
        // Alle Datenzeile in einer liste
        const rowList = this.getIndexList(index); // todo: ??? prüfen ob Kopie oder Referenz ??? Es ist eine Referenz!!!!

        // Wenn Sortierungs Funktion
        if (typeof sortCols == "function") {
            // @ts-ignore
            rowList.sort(sortCols);
        } else {
            // wenn keine SortierungsSpalten angegeben
            if (!Array.isArray(sortCols)) {
                // nur Index merken
                if (typeof index == "string") { this._indexList.set(index, rowList); }
                // unsortierte Liste mit ID's
                return rowList;
            }

            // Feld Indexes lesen und Sortier Reihenfolge
            const colLength = sortCols.length;
            const orderIndex = new Array(colLength);
            const isString = new Array(colLength);
            /** @type {Array<number>} */
            const sCols = new Array(colLength); // Spalten Index
            const sDirection = new Array(colLength);

            // 1. Daten-Datensatz(1) lesen / erste Zeile(0) enthält Feldnamen
            let row = this.rows[1];
            if (!row) { return rowList; }

            // Alle sortierspalten durchgehen
            for (let i = 0; i < colLength; i++) {
                let col = sortCols[i];
                let direction = 1; // 1 = Aufsteigend sortieren / -1 = Absteigend sortieren

                // prüfen auf Sortier Richtung
                const fieldData = col.split(" ");
                sCols[i] = this.columnIndex[fieldData[0]] || -1; // Spalten-ID für spätere Verwendung merken
                sDirection[i] = "ASC";
                if (fieldData[1]?.trim().toUpperCase() == "DESC") {
                    direction = -1;
                    sDirection[i] = "DESC"; // Sortierrichtung für spätere Verwendung merken
                }

                orderIndex[i] = direction;
                isString[i] = typeof row[sCols[i]] == "string" ? true : false; // dataType?.type == "string" ? true : false;
            }


            // Sortieren
            rowList.sort((a, b) => {

                // Kopfzeile immer als erstes
                if (a === 0) return -1; // 'a' ist die Kopfzeile, bleibt oben
                if (b === 0) return 1;  // 'b' ist die Kopfzeile, bleibt oben

                const aRow = this.rows[a] || [];
                const bRow = this.rows[b] || [];

                // Prüfen
                for (let i = 0; i < colLength; i++) {
                    if (sCols[i] < 0) continue;

                    const aValue = aRow[sCols[i]];
                    const bValue = bRow[sCols[i]];
                    if (aValue == undefined && bValue == undefined) {
                        continue;
                    } else if (aValue != undefined && bValue == undefined) {
                        if (orderIndex[i] < 0) {
                            // Absteigend
                            return -1;
                        } else {
                            // Aufsteigend
                            return 1;
                        }
                    } else if (aValue == undefined && bValue != undefined) {
                        if (orderIndex[i] < 0) {
                            // Absteigend
                            return 1;
                        } else {
                            // Aufsteigend
                            return -1;
                        }
                    }

                    // absteigend
                    if (orderIndex[i] < 0) {
                        //if (typeof aRow[colIndex[i]] == "string" && typeof bRow[colIndex[i]] == "string") {
                        if (isString[i]) {
                            // @ts-ignore
                            if (aValue.toLowerCase() > bValue.toLowerCase()) { return -1; }
                            // @ts-ignore
                            if (aValue.toLowerCase() < bValue.toLowerCase()) { return 1; }
                        } else {
                            // @ts-ignore
                            if (aValue > bValue) { return -1; }
                            // @ts-ignore
                            if (aValue < bValue) { return 1; }
                        }
                    } else {
                        // Aufsteigend
                        if (isString[i]) {
                            // @ts-ignore
                            if (aValue.toLowerCase() > bValue.toLowerCase()) { return 1; }
                            // @ts-ignore
                            if (aValue.toLowerCase() < bValue.toLowerCase()) { return -1; }
                        } else {
                            // @ts-ignore
                            if (aValue > bValue) { return 1; }
                            // @ts-ignore
                            if (aValue < bValue) { return -1; }
                        }
                    }
                } // alle Felder vergleichen

                // alle gleich
                return 0;
            });
        }

        // neuen Index speichern
        if (typeof newIndexName == "string") {
            this._indexList.set(newIndexName, rowList);
        } else if (typeof index == "string") {
            this._indexList.set(index, rowList);
        }
        return rowList;
    } // sort


    /**
     * Führt die angegebene Funktion für jeden Datensatz, oder jeden Datensatz im angegebenen index, aus.  
     * @param {CallbackFunction<T>} fu - Funktion die pro Datensatz ausgeführt wird.
     * @param {string|Array<number>} [index] - optionaler Index Name oder Liste von Indexes der als Datenquelle verwendet wird
     * @param {any} [breakValue] - Optionaler Wert, wenn dieser von der Funktion zurückgegeben wird, wird Abgebrochen und dieser Wert zurückgegeben
     * @returns {void}
     */
    forEach(fu, index, breakValue) {
        if (typeof fu != "function") { return; }

        // Daten zum Filtern
        const rowIndexList = this.getIndexList(index);
        const readOnlyTable = this.readOnly();

        // alle durchgehen
        for (let i = 0; i < rowIndexList.length; i++) {
            const rowIndex = rowIndexList[i];
            const obj = this.getObject(rowIndex);
            if (!obj) { continue; }

            // Funktion ausführen
            const backValue = fu(obj, rowIndex, readOnlyTable);
            if (backValue != undefined && backValue == breakValue) {
                return backValue;
            };
        }
    }


    /**
     * Führt die Angegebene Funktion, pro Gruppierung nach den Angegebenen Spalten, aus.
     * @param {GroupFunction<T>} fu - Funktion die für jede Gruppierung aufgerufen wird.
     * @param {string|Array<string>} colList - Liste der Spalten nach denen Gruppiert wird.
     * @param {string|Array<number>} [index] - Optionaler Index der für die Gruppierung verwendet wird.
     * @param {any} [breakValue] - Optionaler Wert der die Ausführung abbricht.
     * @returns {void}
     */
    forGroup(fu, colList, index, breakValue) {
        if (typeof fu != "function") { return; }

        // Daten zum Filtern
        const rowIndexList = this.getIndexList(index);
        //const colIndexList = this.getColIndex(colList);

        /** @type {Map<string,Array<T>>} */
        const groupIndex = new Map(); // merkt sich den Index der Gruppe

        /**
         * Liefert den Gruppenwert der Datenzeile
         * @param {T} obj - Datenzeile
         * @returns {string} GruppenWert
         */
        let getGroupValue = function (obj) {
            let value = "";
            for (let i = 0; i < colList.length; i++) {
                //@ts-ignore
                value += obj[colList[i]] + "_";
            }
            return value;
        }

        // alle Datenzeilen durchgehen
        for (let i = 0; i < rowIndexList.length; i++) {
            const rowIndex = rowIndexList[i];
            const obj = this.getObject(rowIndex);

            // erste Datenzeile(Feldnamen) und gelöschte Datenzeilen überspringen
            if (!obj) { continue; }

            const groupValue = getGroupValue(obj);

            // Wenn es Gruppenwert schon gibt
            if (groupIndex.has(groupValue)) {
                // Index hinzufügen
                groupIndex.get(groupValue)?.push(obj);
            } else {
                // neuen Index anlegen
                groupIndex.set(groupValue, [obj]);
            }
        } // for jeder Datensatz

        // Alle Gruppen Arrays
        const groupList = [...groupIndex.keys()];
        const readOnlyTable = this.readOnly();


        // alle Gruppierten Listen durchgehen
        for (let i = 0; i < groupList.length; i++) {
            // funktion ausführen
            const backValue = fu(groupIndex.get(groupList[i]) || [], readOnlyTable);
            if (breakValue != undefined && breakValue == backValue) { return; }
        }
    }


    /**
     * Sucht in der Liste nach angegebener Quest und liefert das gefundene Objekt zurück
     * @param {Object<string,any>|CallbackFunction<T>} quest - Abfrage Objekt oder FilterFunktion
     * @param {string|Array<number>} [index] - Optional Index der für die Suche verwendet wird 
     * @returns {T|undefined} DatenObjekt oder undefined wenn nicht gefunden.
     */
    find(quest, index) {
        const indexList = this.getIndexList(index);

        /** @type {CallbackFunction<T>} */
        let fu;

        // Wenn Quest eine Funktion
        if (typeof quest == "function") {
            //@ts-ignore
            fu = quest;
        } else if (typeof quest == "object") {
            const keys = Object.keys(quest);

            /**
             * Sucht nach allen Spalten
             * @param {T} obj - Datenzeile
             * @returns {boolean}
             */
            fu = function find(obj) {
                for (let i = 0; i < keys.length; i++) {
                    //@ts-ignore
                    const rowValue = obj[keys[i]];
                    const questValue = quest[keys[i]];

                    if (typeof questValue == "function") {
                        // Wert gegen Funktion prüfen (Wert, Spaltenindex, Dateizeile)
                        if (!questValue(rowValue, keys[i], obj)) { return false; }
                    } else if (rowValue != questValue) {
                        return false;
                    }
                }
                return true;
            }
        } else {
            return;
        }

        const readOnlyTable = this.readOnly();

        for (let i = 0; i < indexList.length; i++) {
            const rowIndex = indexList[i];
            const obj = this.getObject(rowIndex);

            // erste datenZeile(FeldNamen) und gelöschte auslassen
            if (!obj) { continue; }
            if (fu(obj, rowIndex, readOnlyTable)) {
                return obj;
            }
        }

        // nicht gefunden
        return;
    }


    /**
     * Sucht alle Objekte aus der Liste das mit dem übergebenen Objekt übereinstimmt und gibt eine Liste der gefundenen Objekte zurück.
     * @param {Object<string,any>|CallbackFunction<T>} quest - Abfrage Objekt oder FilterFunktion
     * @param {string|Array<number>} [index] - Optional Index der für die Suche verwendet wird 
     * @param {string} [newIndex] - Optional Name unter der der Filterindex abgelegt wird. 
     * @returns {Array<T>} Liste mit Datensatz Zeilen oder Leere Liste wenn nicht gefunden.
     */
    findAll(quest, index, newIndex) {
        const indexList = this.getIndexList(index);

        /** @type {Array<number>} */
        const newIndexList = [];
        /** @type {Array<T>} */
        const newObjList = [];

        /** @type {CallbackFunction<T>} */
        let fu;

        // Wenn Quest eine Funktion
        if (typeof quest == "function") {
            //@ts-ignore
            fu = quest;
        } else if (typeof quest == "object") {
            const keys = Object.keys(quest);

            /**
             * Sucht nach allen Spalten
             * @param {T} obj - Datenzeile
             * @returns {boolean}
             */
            fu = function find(obj) {
                for (let i = 0; i < keys.length; i++) {
                    //@ts-ignore
                    const rowValue = obj[keys[i]];
                    const questValue = quest[keys[i]];

                    if (typeof questValue == "function") {
                        // Wert gegen Funktion prüfen (Wert, Spaltenindex, Dateizeile)
                        if (!questValue(rowValue, keys[i], obj)) { return false; }
                    } else if (rowValue != questValue) {
                        return false;
                    }
                }
                return true;
            }
        } else {
            return newObjList;
        }

        const readOnlyTable = this.readOnly();

        // Alle Zeilen durchgehen
        for (let i = 0; i < indexList.length; i++) {
            const rowIndex = indexList[i];
            const obj = this.getObject(rowIndex);

            // erste datenZeile(FeldNamen) und gelöschte auslassen
            if (!obj) { continue; }
            if (fu(obj, rowIndex, readOnlyTable)) {
                newIndexList.push(rowIndex);
                newObjList.push(obj);
            }
        }

        if (newIndex) {
            // Index merken
            this._indexList.set(newIndex, newIndexList);
        }

        // gefundene Indexes
        return newObjList;
    }

    /**
     * Liefert eine Schreibgeschützte Version der Liste zurück
     * @returns {{
     * getID: DataTable<T>["getID"]
     * , getLength: DataTable<T>["getLength"]
     * , getCols: DataTable<T>["getCols"]
     * , getColIndex: DataTable<T>["getColIndex"]
     * , has: DataTable<T>["has"]
     * , getRowInfo: DataTable<T>["getRowInfo"]
     * , getIndexList: DataTable<T>["getIndexList"]
     * , hasIndexList: DataTable<T>["hasIndexList"]
     * , getCellValue: DataTable<T>["getCellValue"]
     * , sort: DataTable<T>["sort"]
     * , newObject: DataTable<T>["newObject"]
     * , getObject: DataTable<T>["getObject"]
     * , getObjectList: DataTable<T>["getObjectList"]
     * , forEach: DataTable<T>["forEach"]
     * , forGroup: DataTable<T>["forGroup"]
     * , find: DataTable<T>["find"]
     * , findAll: DataTable<T>["findAll"]
     * }} 
     */
    readOnly() {
        return {
            getID: this.getID.bind(this)
            , getLength: this.getLength.bind(this)
            , getCols: this.getCols.bind(this)
            , getColIndex: this.getColIndex.bind(this)
            , has: this.has.bind(this)
            , getRowInfo: this.getRowInfo.bind(this)
            , getIndexList: this.getIndexList.bind(this)
            , hasIndexList: this.hasIndexList.bind(this)
            , getCellValue: this.getCellValue.bind(this)
            , sort: this.sort.bind(this)
            , newObject: this.newObject.bind(this)
            , getObject: this.getObject.bind(this)
            , getObjectList: this.getObjectList.bind(this)
            , forEach: this.forEach.bind(this)
            , forGroup: this.forGroup.bind(this)
            , find: this.find.bind(this)
            , findAll: this.findAll.bind(this)
        };
    }
}


// // Umsetzung
// // Alles in Tabellen Strucktur
// // 1. Zeile enthält Feldnamen - Wichtig IDFeld muss immer angegeben werden
// // Neue Datensätze (ID) In Map (_newRows)
// // generische Klasse constructor (Array in daten)
// // funktion toArray -> Feldnamen in Richtige Spalten vom Array



// /// Example
// // @ts-check
// // import { DataTable } from "./data-table.js";
// // import { Customer } from "./customer.js";

// const rohDaten = [
//     ["gsid", "name", "city"],
//     ["C-1", "Max", "Wien"]
// ];

// // class Customer extends DataRow {
// //     /** Eindeutige ID */
// //     gsid = "";
// //     name = "";
// //     city = "";
// //     /** Test @type {Map<string,string>} */
// //     test = new Map();
// //     constructor() { super(); } // Zwingend erforderlich wenn man von einer anderen Klasse erbt
// // }

// /**
//  * @typedef {Object} Customer
//  * @property {string} gsid
//  * @property {string} name
//  * @property {string} city
//  */
// let CustomerCols = ["gsid", "name", "city"];

// /** @type {DataTable<Customer>} */
// const kundenTabelle = new DataTable("customers", rohDaten, "gsid");

// // --- NEUEN DATENSATZ ANLEGEN ---
// // VS Code vervollständigt dir hier alles und prüft die Typen!
// const neuerKunde = kundenTabelle.newObject();
// neuerKunde.city = "Salzburg";

// // Werte zuweisen (schreibt LIVE ins 'rohDaten'-Array!)
// neuerKunde.name = "Sabine";

// console.log(neuerKunde.gsid);  // Autogenerierte GSID (z.B. "f81d4fae-...")

// kundenTabelle.setObject(neuerKunde);

// // Überprüfung der globalen Rohdaten:
// console.log(rohDaten);
// /*
// Output zeigt, dass die Zeile vollautomatisch am Ende des Arrays angefügt wurde:
// [
//   ["gsid", "name", "city"],
//   ["C-1", "Max", "Wien"],
//   ["f81d4fae-...", "Sabine", "Salzburg"]
// ]
// */
