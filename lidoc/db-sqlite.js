// =========================================================================
//   SQLite DATENBANK TREIBER (sqlite_driver.js)
// =========================================================================
// @ts-check

import { Database } from "bun:sqlite";


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
 * Definiert die Schnittstelle, die JEDER Datenbank- oder Dateitreiber implementieren MUSS.
 * @typedef {Object} DBDriverInterface
 * @property {string} id - Entspricht DriverConfig.id
 * @property {string} type - Entspricht DriverConfig.type
 * @property {string} name - Name des Teibers???
 * @property {(tableName: string) => Promise<DataRows>} getRows - Holt alle Zeilen einer Tabelle inkl. Header
 * @property {(tableName: string, recordId: string, idColName: string) => Promise<DataRows>} getRecord - Holt genau eine Zeile + Header für die Detailansicht
 * @property {(tableName: string, deltaRows: DataRows, idColName: string) => Promise<boolean>} saveRows - Schreibt nur die geänderten Spalten (Delta-Array) in die DB
 * @property {(tableName: string, recordId: string, idColName: string) => Promise<boolean>} deleteRow - Löscht einen spezifischen Datensatz aus der Tabelle
 * @property {(newSchemaJson: string) => Promise<{success: boolean, message: string}>} [migrateSchema] - Optional: Führt Tabellen-Migrationen bei Schema-Updates aus
 */


const tableNameRegex = /^(?!sqlite_)[a-z_][a-z0-9_]*$/;

/**
 * Performanter, nativer SQLite-Treiber konform zum zentralen Proxy-Protokoll.
 * @implements {DBDriverInterface}
 */
export class SQLiteDriver {
    /**
     * @param {string} id - Eindeutige ID des Treibers im Gesamtsystem
     * @param {string} name - Menschenlesbarer Anzeigename
     * @param {string} [dbPath] - Pfad zur SQLite-Datei
     */
    constructor(id, name, dbPath = "app.db") {
        this.id = id;
        this.type = "SQLITE";
        this.name = name;
        this.db = new Database(dbPath);
        //this._initTables();
    }

    _initTables() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (gsid TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT);
            CREATE TABLE IF NOT EXISTS passkeys (gsid TEXT PRIMARY KEY, user_id TEXT NOT NULL, public_key TEXT NOT NULL, counter INTEGER DEFAULT 0);
            CREATE TABLE IF NOT EXISTS records (gsid TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT);
            CREATE TABLE IF NOT EXISTS audit_log (gsid TEXT PRIMARY KEY, table_name TEXT, row_id TEXT, action TEXT, changed_fields TEXT, changed_by TEXT, changed_at TEXT);
        `);
    }

    /**
     * Liest aus einer Tabelle Datensätze mit flexiblen Filtern und Sortierung.
     * Unterstützt die virtuelle Tabelle 'sys_tables_menu' zur Systemabfrage.
     * 
     * @param {string} tableName - Name der Tabelle
     * @returns {Promise<DataRows>} [Spaltennamen, ...Datenzeilen]
     */
    async getRows(tableName) {
        // SONDERFALL: Virtuelle System-Menü-Tabelle abfangen
        if (tableName === "sys_tables_menu") {
            // Holt alle vom Benutzer angelegten Tabellen aus dem SQLite-Katalog (ohne interne Tabellen)
            const q = this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            const dbTables = q.values(); // Liefert ein Array von Arrays, z.B. [ ["users"], ["records"] ]
            
            // Formatieren als zweidimensionales Client-Menü-Array
            /** @type {DataRows} */
            const menuRows = [
                ["ID", "Tabelle", "Beschreibung"],
                ...dbTables.map(row => [row[0], `📊 ${row[0]}`, `Echte Daten-Entität aus ${this.name}`])
            ];
            return menuRows;
        }

        // Regulärer Tabellen-Abruf (Schutz gegen SQL-Injection)
        if (!tableNameRegex.test(tableName)) throw new Error("Table not allowed!");

        const qColumns = this.db.query(`SELECT * FROM ${tableName} WHERE 0`);
        const columnNames = qColumns.columnNames;

        const q = this.db.query(`SELECT * FROM ${tableName}`);
        return [columnNames, ...q.values()];
    }

    /**
     * Holt genau einen Datensatz für die Detail-/Formularansicht des Clients.
     * @param {string} tableName - Name der Tabelle
     * @param {string} recordId - Die ID des gesuchten Datensatzes
     * @param {string} [idColName] - Name der Primärschlüsselspalte
     * @returns {Promise<DataRows>} [Header, Datenzeile]
     */
    async getRecord(tableName, recordId, idColName = "gsid") {
        if (!tableNameRegex.test(tableName)) throw new Error("Table not allowed!");

        const qColumns = this.db.query(`SELECT * FROM ${tableName} WHERE 0`);
        const columnNames = qColumns.columnNames;

        const q = this.db.query(`SELECT * FROM ${tableName} WHERE ${idColName} = ?`);
        const resultRow = q.values(recordId)[0];

        if (!resultRow) {
            throw new Error(`Datensatz mit ID '${recordId}' existiert nicht in Tabelle '${tableName}'.`);
        }

        return [columnNames, resultRow];
    }

    /**
     * Updatet oder fügt einen oder mehrere Datensätze über ein Delta-Array ein.
     * Nutzt SQLite UPSERT für extrem schnelle Transaktionsverarbeitung.
     * 
     * @param {string} tableName - Name der Tabelle
     * @param {DataRows} rows - Datenzeilen. Zeile 0 = Header.
     * @param {string} [idColName] - Name der Identifikationsspalte
     * @returns {Promise<boolean>} "true" wenn erfolgreich geschrieben
     */
    async saveRows(tableName, rows, idColName = "gsid") {
        if (!tableNameRegex.test(tableName)) throw new Error("Table not allowed!");
        if (!Array.isArray(rows) || rows.length <= 1) return false;

        const headers = rows[0];
        const updateFields = headers.filter(col => col !== idColName);

        if (updateFields.length === 0) return false;

        const columnsStr = headers.join(", ");
        const placeholdersStr = headers.map(() => "?").join(", ");
        const updateStr = updateFields.map(col => `${col} = EXCLUDED.${col}`).join(", ");

        const sql = `
            INSERT INTO ${tableName} (${columnsStr}) 
            VALUES (${placeholdersStr})
            ON CONFLICT(${idColName}) 
            DO UPDATE SET ${updateStr}
        `;

        const stmt = this.db.prepare(sql);
        
        // Transaktions-Sicherheit über Buns native API
        const transaction = this.db.transaction((allRows) => {
            for (let i = 1; i < allRows.length; i++) {
                stmt.run(...allRows[i]);
            }
            return true;
        });

        return transaction(rows);
    }

    /**
     * Löscht einen spezifischen Datensatz dauerhaft aus der Datenbank.
     * @param {string} tableName - Name der Tabelle
     * @param {string} recordId - Die ID des zu löschenden Objekts
     * @param {string} [idColName] - Name der Primärschlüsselspalte
     * @returns {Promise<boolean>} "true" wenn erfolgreich gelöscht
     */
    async deleteRow(tableName, recordId, idColName = "gsid") {
        if (!tableNameRegex.test(tableName)) throw new Error("Table not allowed!");

        const sql = `DELETE FROM ${tableName} WHERE ${idColName} = ?`;
        
        // Führe das Delete-Statement aus
        const result = this.db.run(sql, [recordId]);
        
        // result.changes gibt die Anzahl der betroffenen Zeilen in SQLite zurück
        return result.changes > 0;
    }
}
