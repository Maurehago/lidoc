// =========================================================================
//   SQLite DATENBANK TREIBER (sqlite_driver.js)
// =========================================================================
// @ts-check

import { Database } from "bun:sqlite";
import { DBDriver } from "./infodata.js";

//const tableNameRegex = /^(?!sqlite_)[a-z_][a-z0-9_]*$/;

// =============================================
//   Typen
// ---------
/** @import {DataRows, QuestObject} from "./infodata.js" */

// =============================================




/**
 * Performanter, nativer SQLite-Treiber konform zum zentralen Proxy-Protokoll.
 * @Class SQLiteDriver
 */
export class SQLiteDriver extends DBDriver {
    /**
     * @param {string} id - Eindeutige ID des Treibers im Gesamtsystem
     * @param {string} name - Menschenlesbarer Anzeigename
     * @param {string} [dbPath] - Pfad zur SQLite-Datei
     */
    constructor(id, name, dbPath = "app.db") {
        super();
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
     * @param {QuestObject} quest_object - Optional Abfrage der Daten
     * @returns {Promise<DataRows>} [Spaltennamen, ...Datenzeilen]
     */
    async getRows(quest_object) {
        if (typeof quest_object != "object") {
            throw new Error("no QuestObject!");
        }

        // SONDERFALL: Virtuelle System-Menü-Tabelle abfangen
        if (quest_object.table === "sys_tables_menu") {
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
        if (!this.tableNameRegex.test(quest_object.table)) throw new Error("Table not allowed!");

        // SQL und Parameter zusammenbauen
        
        // const qColumns = this.db.query(`SELECT * FROM ${quest_object.table} WHERE 0`);
        // const columnNames = qColumns.columnNames;
        
        const sql_object = this.buildSelectStatement(quest_object);

        if (typeof sql_object == "object") {
            //const where = this.quest_to_query(quest);
            const q = this.db.query(sql_object.sql);
            return [q.columnNames, ...q.values(...sql_object.params)];
        } else {
            const q = this.db.query(`SELECT * FROM ${quest_object.table}`);
            return [q.columnNames, ...q.values()];
        }
    }

    // /**
    //  * Holt genau einen Datensatz für die Detail-/Formularansicht des Clients.
    //  * @param {string} tableName - Name der Tabelle
    //  * @param {Object<string, any>} quest - Die ID des gesuchten Datensatzes
    //  * @returns {Promise<DataRows>} [Header, Datenzeile]
    //  */
    // async getRecord(tableName, quest) {
    //     if (!this.tableNameRegex.test(tableName)) throw new Error("Table not allowed!");

        
    //     const qColumns = this.db.query(`SELECT * FROM ${tableName} WHERE 0`);
    //     const columnNames = qColumns.columnNames;
        
    //     const where = this.quest_to_query(quest);
    //     const q = this.db.query(`SELECT * FROM ${tableName} WHERE ${where.sql}`);
    //     const resultRows = q.values(...where.params);

    //     if (!resultRows) {
    //         throw new Error(`Datensatz mit quest '${JSON.stringify(quest)}' existiert nicht in Tabelle '${tableName}'.`);
    //     }

    //     return [columnNames, ...resultRows];
    // }

    /**
     * Speichert die Daten oder legt diese neu an. Die ID-Spalten müssen den Datensatz eindeutig Identifizieren.
     * @param {string} tableName - Name der Datentabelle
     * @param {Array<Array<any>>} deltaRows - geänderte Daten. In der ersten Zeile stehen die Spaltennamen.
     * @param {Array<string>} idCols - Name der ID-Spalten
     * @returns {Promise<boolean>} true wenn erfolgreich
     */
    async saveRows(tableName, deltaRows, idCols) {
        if (!this.tableNameRegex.test(tableName)) throw new Error("Table not allowed!");
        if (!Array.isArray(deltaRows) || deltaRows.length <= 1) return false;

        const headers = deltaRows[0];
        const updateFields = headers.filter(col => idCols.indexOf(col) == -1);

        if (updateFields.length === 0) return false;

        const columnsStr = headers.join(", ");
        const placeholdersStr = headers.map(() => "?").join(", ");
        const updateStr = updateFields.map(col => `${col} = EXCLUDED.${col}`).join(", ");

        const sql = `
            INSERT INTO ${tableName} (${columnsStr}) 
            VALUES (${placeholdersStr})
            ON CONFLICT(${idCols.join(",")}) 
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

        return transaction(deltaRows);
    }

    /**
     * Löscht Datensätze von der Abfrage
     * @param {string} tableName - Name der Datentabelle
     * @param {Object<string,any>} quest - Optionale Abfrage
     * @returns {Promise<boolean>}
     */
    async deleteRows(tableName, quest) {
        if (!this.tableNameRegex.test(tableName)) throw new Error("Table not allowed!");

        const where = this.quest_to_query(quest);
        const sql = `DELETE FROM ${tableName} WHERE ${where.sql}`;
        
        // Führe das Delete-Statement aus
        const result = this.db.run(sql, where.params);
        
        // result.changes gibt die Anzahl der betroffenen Zeilen in SQLite zurück
        return result.changes > 0;
    }
}
