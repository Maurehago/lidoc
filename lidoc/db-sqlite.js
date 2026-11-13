// =========================================================================
//   SQLite DATENBANK TREIBER (sqlite_driver.js)
// =========================================================================
// @ts-check

import { Database } from "bun:sqlite";
import { DBDriver } from "./infodata.js";
import { skip } from "node:test";

//const tableNameRegex = /^(?!sqlite_)[a-z_][a-z0-9_]*$/;

// =============================================
//   Typen
// ---------
/** @import {DataRows, QuestObject, TableObject} from "./infodata.js" */

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
     * Speichert die Daten mehrerer Tabellen in einer einzigen Transaktion.
     * Bei einem Fehler wird alles zurückgesetzt (Rollback).
     * @param {Object<string,TableObject>} tables - Objekt mit Datentabellen
     * @param {string} driver_id - ID des Treibers
     * @returns {Promise<boolean>} true wenn erfolgreich
     */
    async saveRows(tables, driver_id) {
        // Die gesamte Verarbeitung aller Tabellen in EINE Transaktion verpacken
        const saveAllTransaction = this.db.transaction((tablesObj) => {
            const table_names = Object.keys(tablesObj);
            let anythingSaved = false;

            for (let i = 0; i < table_names.length; i++) {
                const table_object = tablesObj[table_names[i]];

                // Nur Tabellen mit richtiger Treiber-ID berücksichtigen
                if (table_object.driver !== driver_id) {
                    continue;
                }

                // Validierungen: Werfen bei Problemen einen Fehler -> löst Rollback aus!
                if (!table_object.table || !this.tableNameRegex.test(table_object.table)) {
                    throw new Error(`Table '${table_object.table}' not allowed!`);
                }
                if (!Array.isArray(table_object.rows) || table_object.rows.length <= 1) {
                    throw new Error(`No valid rows provided for table '${table_object.table}'.`);
                }
                if (!table_object.id_name) {
                    throw new Error(`Missing id_name for table '${table_object.table}'.`);
                }

                /** @type {Array<string>} */
                const IDs = Array.isArray(table_object.id_name) ? table_object.id_name : [table_object.id_name];

                /** @type {Array<string>} Kopfzeilen */
                const headers = table_object.rows[0];

                /** @type {Array<string>} Spalten die geändert werden */
                const updateFields = [];
                for (let j = 0; j < headers.length; j++) {
                    // SpaltenNamen prüfen, Spalten-Injection-Schutz
                    if (!this.tableNameRegex.test(headers[j])) {
                        throw new Error(`Column '${headers[j]}' not allowed!`);
                    }

                    if (IDs.indexOf(headers[j]) === -1) {
                        updateFields.push(headers[j]);
                    }
                }

                // Keine Änderungen möglich (z.B. wenn Tabelle nur aus ID-Spalten besteht)
                if (updateFields.length === 0) {
                    throw new Error(`No updatable fields for table '${table_object.table}'.`);
                }

                const columnsStr = headers.join(", ");
                const placeholdersStr = headers.map(() => "?").join(", ");
                const updateStr = updateFields.map(col => `${col} = EXCLUDED.${col}`).join(", ");

                const sql = `
                INSERT INTO ${table_object.table} (${columnsStr}) 
                VALUES (${placeholdersStr})
                ON CONFLICT(${IDs.join(",")}) 
                DO UPDATE SET ${updateStr}
            `;

                const stmt = this.db.prepare(sql);

                // Erste Zeile enthält Feldnamen, deshalb bei j = 1 starten
                for (let j = 1; j < table_object.rows.length; j++) {
                    stmt.run(...table_object.rows[j]);
                }

                anythingSaved = true;
            }

            return anythingSaved;
        });

        // Transaktion ausführen
        return saveAllTransaction(tables);
    }


    /**
     * Löscht Datensätze aus einer oder mehreren Tabellen in einer einzigen Transaktion.
     * Unterstützt sowohl konkrete ID-Listen (id_name + ids) als auch Filterabfragen (quest).
     * Bei einem Fehler wird die gesamte Transaktion zurückgesetzt (Rollback).
     * 
     * @param {Object<string,TableObject|QuestObject>} tables - Objekt mit Datentabellen od Datenbank Abfragen(Quest)
     * @param {string} driver_id - ID des Treibers
     * @returns {Promise<boolean>} true wenn mindestens ein Datensatz gelöscht wurde
     */
    async deleteRows(tables, driver_id) {
        const deleteAllTransaction = this.db.transaction((tablesObj) => {
            const table_names = Object.keys(tablesObj);
            let totalChanges = 0;

            for (let i = 0; i < table_names.length; i++) {
                const table_object = tablesObj[table_names[i]];

                // 1. Nur Tabellen mit passender Treiber-ID berücksichtigen
                if (table_object.driver !== driver_id) {
                    continue;
                }

                // 2. Tabellenname validieren (SQL-Injection-Schutz)
                if (!table_object.table || !this.tableNameRegex.test(table_object.table)) {
                    throw new Error(`Table '${table_object.table}' not allowed!`);
                }

                // =================================================================
                // FALL 1: Löschen über konkrete ID-Liste (id_name + ids)
                // =================================================================
                if (table_object.id_name && Array.isArray(table_object.ids) && table_object.ids.length > 0) {
                    const idCols = Array.isArray(table_object.id_name) ? table_object.id_name : [table_object.id_name];

                    // Spaltennamen gegen SQL-Injection prüfen
                    for (const col of idCols) {
                        if (!this.tableNameRegex.test(col)) {
                            throw new Error(`Column '${col}' not allowed!`);
                        }
                    }

                    // A) Einfacher Primärschlüssel (z.B. id_name = "gsid", ids = ["1", "2", "3"])
                    // Sehr performant durch ein einzelnes "WHERE gsid IN (?, ?, ?)" Statement
                    if (idCols.length === 1) {
                        const placeholders = table_object.ids.map(() => "?").join(", ");
                        const sql = `DELETE FROM ${table_object.table} WHERE ${idCols[0]} IN (${placeholders})`;
                        const result = this.db.run(sql, table_object.ids);
                        totalChanges += result.changes;
                    }
                    // B) Zusammengesetzter Primärschlüssel (z.B. id_name = ["a", "b"], ids = [["1", "2"], ["3", "4"]])
                    else {
                        const whereClause = idCols.map(col => `${col} = ?`).join(" AND ");
                        const sql = `DELETE FROM ${table_object.table} WHERE ${whereClause}`;
                        const stmt = this.db.prepare(sql);

                        for (let j = 0; j < table_object.ids.length; j++) {
                            const idTuple = table_object.ids[j];
                            if (!Array.isArray(idTuple) || idTuple.length !== idCols.length) {
                                throw new Error(`Invalid composite ID format in table '${table_object.table}'.`);
                            }
                            const result = stmt.run(...idTuple);
                            totalChanges += result.changes;
                        }
                    }
                }

                // =================================================================
                // FALL 2: Löschen über Filter-Objekt (quest)
                // =================================================================
                if (table_object.quest && Object.keys(table_object.quest).length > 0) {
                    const where = this.quest_to_query(table_object.quest);

                    // Sicherheitsnetz: Niemals ohne WHERE-Klausel löschen
                    if (!where || !where.sql) {
                        throw new Error(`Refusing to delete from '${table_object.table}' without valid WHERE condition.`);
                    }

                    const sql = `DELETE FROM ${table_object.table} WHERE ${where.sql}`;
                    const result = this.db.run(sql, where.params);
                    totalChanges += result.changes;
                }
            }

            return totalChanges > 0;
        });

        return deleteAllTransaction(tables);
    }



    /**
     * Löscht Datensätze aus einer oder mehreren Tabellen in einer Transaktion.
     * @param {Object<string,TableObject>} deleteTasks - Löschaufträge
     * @param {string} driver_id - ID des Treibers
     * @returns {Promise<boolean>} true wenn mindestens ein Datensatz gelöscht wurde
     */
    async deleteRows3(deleteTasks, driver_id) {
        const deleteAllTransaction = this.db.transaction((tasksObj) => {
            const taskKeys = Object.keys(tasksObj);
            let totalChanges = 0;

            for (let i = 0; i < taskKeys.length; i++) {
                const task = tasksObj[taskKeys[i]];

                // Nur Aufgaben für diesen Treiber ausführen
                if (task.driver !== driver_id) {
                    continue;
                }

                if (!task.table || !this.tableNameRegex.test(task.table)) {
                    throw new Error(`Table '${task.table}' not allowed!`);
                }

                const where = this.quest_to_query(task.quest);

                // Sicherheitsnetz: Verhindert versehentliches Löschen der gesamten Tabelle ohne WHERE-Klausel
                if (!where || !where.sql) {
                    throw new Error(`Refusing to delete from '${task.table}' without WHERE condition.`);
                }

                const sql = `DELETE FROM ${task.table} WHERE ${where.sql}`;
                const result = this.db.run(sql, where.params);

                totalChanges += result.changes;
            }

            return totalChanges > 0;
        });

        return deleteAllTransaction(deleteTasks);
    }


    /**
     * Löscht Datensätze von der Abfrage
     * @param {string} tableName - Name der Datentabelle
     * @param {Object<string,any>} quest - Optionale Abfrage
     * @returns {Promise<boolean>}
     */
    async deleteRows2(tableName, quest) {
        if (!this.tableNameRegex.test(tableName)) throw new Error("Table not allowed!");

        const where = this.quest_to_query(quest);
        const sql = `DELETE FROM ${tableName} WHERE ${where.sql}`;

        // Führe das Delete-Statement aus
        const result = this.db.run(sql, where.params);

        // result.changes gibt die Anzahl der betroffenen Zeilen in SQLite zurück
        return result.changes > 0;
    }
}
