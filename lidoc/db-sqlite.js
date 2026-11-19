// =========================================================================
//   SQLite DATENBANK TREIBER (sqlite_driver.js)
// =========================================================================
// @ts-check

import { Database } from "bun:sqlite";
import { DBDriver } from "./infodata.js";
import { Schema } from "./infoschema.js";

//const tableNameRegex = /^(?!sqlite_)[a-z_][a-z0-9_]*$/;

// =============================================
//   Typen
// ---------
/** @import {DataRows, QuestObject, TableObject} from "./infodata.js" */
/** @import {PropertyType} from "./infoschema.js" */

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
                    /** @type {Array<string>} */
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
     * Liest eine bestehende SQLite-Tabelle aus und überträgt sie in ein InfoSchema.
     * @param {Schema} schema - Die Ziel-Instanz deiner Schema-Klasse
     * @param {string} tableName - Name der auszulesenden Tabelle
     */
    extractTableToSchema(schema, tableName) {
        if (!this.tableNameRegex.test(tableName)) {
            throw new Error(`Ungültiger Tabellenname: ${tableName}`);
        }

        // 1. Spalteninformationen auslesen
        // Liefert: [cid, name, type, notnull, dflt_value, pk]
        const columns = this.db.query(`PRAGMA table_info(${tableName})`).all();
        if (!columns || columns.length === 0) return;

        const pkColumns = [];

        // 2. Spalten in Properties umwandeln
        for (const col of columns) {
            if (col.pk > 0) {
                pkColumns.push(col.name);
            }

            // SQL-Typ auf deine Basistypen mappen
            let propType = "string";
            const sqlType = (col.type || "").toUpperCase();
            if (sqlType.includes("INT")) {
                propType = "number"; // oder "bigint", je nach Wunsch
            } else if (sqlType.includes("REAL") || sqlType.includes("FLOA") || sqlType.includes("DOUB")) {
                propType = "number";
            } else if (sqlType.includes("BOOL")) {
                propType = "boolean";
            }

            // Default-Wert bereinigen (SQLite gibt Strings oft in Anführungszeichen zurück)
            let defaultVal = col.dflt_value;
            if (typeof defaultVal === "string" && defaultVal.startsWith("'") && defaultVal.endsWith("'")) {
                defaultVal = defaultVal.slice(1, -1);
            }

            schema.addProperty(tableName, col.name, {
                prop_type: propType,
                min: col.notnull === 1 || col.pk > 0 ? 1 : 0,
                max: 1,
                default: defaultVal !== null ? defaultVal : undefined
            });
        }

        // 3. Primary Key beim DataType hinterlegen
        schema.setDataType({
            name: tableName,
            art: "object",
            id: pkColumns.length === 1 ? pkColumns[0] : pkColumns
        });

        // 4. Fremdschlüssel (Foreign Keys) auslesen
        // Liefert: [id, seq, table, from, to, on_update, on_delete, match]
        const fks = this.db.query(`PRAGMA foreign_key_list(${tableName})`).all();
        const fkGroups = new Map();

        for (const fk of fks) {
            if (!fkGroups.has(fk.id)) {
                fkGroups.set(fk.id, {
                    name: `fk_${tableName}_${fk.table}_${fk.id}`,
                    object_name: tableName,
                    object_props: [],
                    ref_name: fk.table,
                    ref_props: [],
                    on_update: this.#mapSqlAction(fk.on_update),
                    on_delete: this.#mapSqlAction(fk.on_delete)
                });
            }
            const group = fkGroups.get(fk.id);
            group.object_props.push(fk.from);
            group.ref_props.push(fk.to);
        }

        for (const refObj of fkGroups.values()) {
            schema.setRef(refObj);
        }

        // 5. Unique-Constraints auslesen
        const indexes = this.db.query(`PRAGMA index_list(${tableName})`).all();
        for (const idx of indexes) {
            if (idx.unique === 1 && idx.origin !== "pk") {
                const idxCols = this.db.query(`PRAGMA index_info(${idx.name})`).all();
                schema.setUnique({
                    name: idx.name,
                    object_name: tableName,
                    object_props: idxCols.map(c => c.name)
                });
            }
        }
    }

    /** Hilfsfunktion für FK-Aktionen
     * @param {string} sqlAction - Art der Datenbank Verbindung
     */
    #mapSqlAction(sqlAction) {
        if (sqlAction === "CASCADE") return "DELETE"; // bzw. UPDATE
        if (sqlAction === "SET NULL") return "NULL";
        if (sqlAction === "SET DEFAULT") return "DEFAULT";
        return "NO";
    }

    /**
     * Erzeugt ein vollständiges SQLite CREATE TABLE Statement aus dem Schema.
     * @param {Schema} schema 
     * @param {string} objectName 
     * @returns {string}
     */
    generateCreateTableSQL(schema, objectName) {
        const dataType = schema.getDataType(objectName);
        if (!dataType || dataType.art !== "object") {
            throw new Error(`'${objectName}' ist kein gültiger ObjektTyp im Schema.`);
        }

        const props = schema.getObjProperties(objectName);
        const columnDefs = [];
        const tableConstraints = [];

        // Primary Key ermitteln
        const pkFields = Array.isArray(dataType.id) ? dataType.id : (dataType.id ? [dataType.id] : []);

        for (const prop of props) {
            // Listen (Arrays) in einer Spalte werden in SQLite als JSON-Text gespeichert
            if (prop.is_list || (prop.max && (prop.max > 1 || prop.max === -1))) {
                let def = `${prop.name} TEXT`;
                if ((prop.min ?? 1) >= 1) def += " NOT NULL";
                columnDefs.push(def);
                continue;
            }

            const targetType = prop.prop_type || "string";
            const targetDataType = schema.getDataType(targetType);
            const simpleType = schema.getSimpleType(targetType);

            // 1. SQL-Basistyp bestimmen
            let sqlType = "TEXT";
            if (targetType === "number" || simpleType?.art === "number") {
                sqlType = simpleType?.decimals === 0 ? "INTEGER" : "REAL";
            } else if (targetType === "bigint" || simpleType?.art === "bigint" || targetType === "boolean" || simpleType?.art === "boolean") {
                sqlType = "INTEGER";
            }

            let colSql = `${prop.name} ${sqlType}`;

            // 2. NOT NULL & DEFAULT
            if ((prop.min ?? 1) >= 1) {
                colSql += " NOT NULL";
            }
            if (prop.default !== undefined) {
                const defVal = typeof prop.default === "string" ? `'${prop.default.replace(/'/g, "''")}'` : prop.default;
                colSql += ` DEFAULT ${defVal}`;
            }

            // 3. CHECK-Constraints aus SimpleType ableiten
            const checks = [];
            if (simpleType) {
                if (simpleType.min_length !== undefined) checks.push(`length(${prop.name}) >= ${simpleType.min_length}`);
                if (simpleType.max_length !== undefined) checks.push(`length(${prop.name}) <= ${simpleType.max_length}`);
                if (simpleType.length !== undefined) checks.push(`length(${prop.name}) = ${simpleType.length}`);
                if (simpleType.min_inclusive !== undefined) checks.push(`${prop.name} >= ${simpleType.min_inclusive}`);
                if (simpleType.max_inclusive !== undefined) checks.push(`${prop.name} <= ${simpleType.max_inclusive}`);
                if (simpleType.min_exclusive !== undefined) checks.push(`${prop.name} > ${simpleType.min_exclusive}`);
                if (simpleType.max_exclusive !== undefined) checks.push(`${prop.name} < ${simpleType.max_exclusive}`);
            }

            // 4. CHECK-Constraints aus EnumType ableiten
            if (targetDataType?.art === "enum") {
                const enumObj = schema.getEnum(targetType);
                if (enumObj && Array.isArray(enumObj.values) && enumObj.values.length > 0 && !enumObj.more_enums) {
                    const allowed = enumObj.values.map(v => typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : v).join(", ");
                    checks.push(`${prop.name} IN (${allowed})`);
                }
            }

            if (checks.length > 0) {
                colSql += ` CHECK (${checks.join(" AND ")})`;
            }

            columnDefs.push(colSql);
        }

        // Primary Key Constraint
        if (pkFields.length > 0) {
            tableConstraints.push(`PRIMARY KEY (${pkFields.join(", ")})`);
        }

        // Unique Constraints aus schema.uniques
        const uniques = schema.uniques.findAll({ object_name: objectName });
        for (const u of uniques) {
            const uCols = Array.isArray(u.object_props) ? u.object_props : [u.object_props];
            tableConstraints.push(`UNIQUE (${uCols.join(", ")})`);
        }

        // Foreign Keys aus schema.refs
        const refs = schema.refs.findAll({ object_name: objectName });
        for (const r of refs) {
            const fromCols = Array.isArray(r.object_props) ? r.object_props.join(", ") : r.object_props;
            const toCols = Array.isArray(r.ref_props) ? r.ref_props.join(", ") : r.ref_props;
            let fkSql = `FOREIGN KEY (${fromCols}) REFERENCES ${r.ref_name} (${toCols})`;

            if (r.on_delete === "DELETE") fkSql += " ON DELETE CASCADE";
            else if (r.on_delete === "NULL") fkSql += " ON DELETE SET NULL";
            else if (r.on_delete === "DEFAULT") fkSql += " ON DELETE SET DEFAULT";

            if (r.on_update === "UPDATE") fkSql += " ON UPDATE CASCADE";
            else if (r.on_update === "NULL") fkSql += " ON UPDATE SET NULL";
            else if (r.on_update === "DEFAULT") fkSql += " ON UPDATE SET DEFAULT";

            tableConstraints.push(fkSql);
        }

        const allDefinitions = [...columnDefs, ...tableConstraints].join(",\n    ");
        return `CREATE TABLE IF NOT EXISTS ${objectName} (\n    ${allDefinitions}\n);`;
    }


    /**
     * Erzeugt die SQL-Definition für eine einzelne Spalte (z. B. "age INTEGER NOT NULL CHECK (age >= 18)")
     * @param {Schema} schema 
     * @param {PropertyType} prop - Das Property-Objekt aus dem Schema
     * @returns {string}
     */
    #buildColumnDefinition(schema, prop) {
        // Listen (Arrays) werden in SQLite als JSON-Text gespeichert
        if (prop.is_list || (prop.max && (prop.max > 1 || prop.max === -1))) {
            let def = `${prop.name} TEXT`;
            if ((prop.min ?? 1) >= 1) def += " NOT NULL";
            if (prop.default !== undefined) {
                const defVal = typeof prop.default === "string" ? `'${prop.default.replace(/'/g, "''")}'` : `'${JSON.stringify(prop.default)}'`;
                def += ` DEFAULT ${defVal}`;
            }
            return def;
        }

        const targetType = prop.prop_type || "string";
        const targetDataType = schema.getDataType(targetType);
        const simpleType = schema.getSimpleType(targetType);

        // 1. SQL-Basistyp bestimmen
        let sqlType = "TEXT";
        if (targetType === "number" || simpleType?.art === "number") {
            sqlType = simpleType?.decimals === 0 ? "INTEGER" : "REAL";
        } else if (targetType === "bigint" || simpleType?.art === "bigint" || targetType === "boolean" || simpleType?.art === "boolean") {
            sqlType = "INTEGER";
        }

        let colSql = `${prop.name} ${sqlType}`;

        // 2. NOT NULL & DEFAULT
        if ((prop.min ?? 1) >= 1) {
            colSql += " NOT NULL";
        }
        if (prop.default !== undefined) {
            const defVal = typeof prop.default === "string" ? `'${prop.default.replace(/'/g, "''")}'` : prop.default;
            colSql += ` DEFAULT ${defVal}`;
        }

        // 3. CHECK-Constraints aus SimpleType ableiten
        const checks = [];
        if (simpleType) {
            if (simpleType.min_length !== undefined) checks.push(`length(${prop.name}) >= ${simpleType.min_length}`);
            if (simpleType.max_length !== undefined) checks.push(`length(${prop.name}) <= ${simpleType.max_length}`);
            if (simpleType.length !== undefined) checks.push(`length(${prop.name}) = ${simpleType.length}`);
            if (simpleType.min_inclusive !== undefined) checks.push(`${prop.name} >= ${simpleType.min_inclusive}`);
            if (simpleType.max_inclusive !== undefined) checks.push(`${prop.name} <= ${simpleType.max_inclusive}`);
            if (simpleType.min_exclusive !== undefined) checks.push(`${prop.name} > ${simpleType.min_exclusive}`);
            if (simpleType.max_exclusive !== undefined) checks.push(`${prop.name} < ${simpleType.max_exclusive}`);
        }

        // 4. CHECK-Constraints aus EnumType ableiten
        if (targetDataType?.art === "enum") {
            const enumObj = schema.getEnum(targetType);
            if (enumObj && Array.isArray(enumObj.values) && enumObj.values.length > 0 && !enumObj.more_enums) {
                const allowed = enumObj.values.map(v => typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : v).join(", ");
                checks.push(`${prop.name} IN (${allowed})`);
            }
        }

        if (checks.length > 0) {
            colSql += ` CHECK (${checks.join(" AND ")})`;
        }

        return colSql;
    }


    /**
     * Führt eine intelligente Migration basierend auf dem Schema-Diff durch.
     * Gibt alle durchgeführten Änderungen im InfoData-Format zurück.
     * 
     * @param {Schema} newSchema - Das neue Ziel-Schema
     * @param {Object<string,any>} options - Optionale Einstellungen (z. B. { dropRemovedTables: false })
     * @returns {Object<string,DataRows>} InfoData-Objekt mit der Tabelle "schema_changes"
     */
    migrateSchema(newSchema, options = { dropRemovedTables: false }) {
        this.db.run("PRAGMA foreign_keys = ON;");

        // Systemtabellen für aktuellen Zustand und Änderungs-Log (InfoData) sicherstellen
        this.db.run(`
        CREATE TABLE IF NOT EXISTS _info_schema_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            schema_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
    `);
        this.db.run(`
        CREATE TABLE IF NOT EXISTS _info_schema_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            migrated_at TEXT NOT NULL,
            category TEXT NOT NULL,
            action TEXT NOT NULL,
            target_id TEXT NOT NULL,
            field TEXT NOT NULL,
            old_value TEXT,
            new_value TEXT
        );
    `);

        const stateRow = this.db.query("SELECT schema_json FROM _info_schema_state WHERE id = 1").get();

        // Wenn die DB komplett neu ist, starten wir mit einem leeren Vergleichs-Schema
        const oldSchema = stateRow
            ? new Schema("old_db_state", stateRow.schema_json)
            : new Schema("empty_db_state");

        // 1. Diff berechnen (liefert { schema_changes: [ ["category", ...], ... ] })
        const diffResult = oldSchema.diff(newSchema);
        const rows = diffResult.schema_changes; // Header-Zeile überspringen

        // Wenn es keine Änderungen gibt, sofort fertig
        if (rows.length <= 1) {
            return diffResult;
        }

        // 2. Änderungen analysieren: Welche Tabellen brauchen was?
        const tablesToCreate = new Set();
        const tablesToDrop = new Set();
        const columnsToAdd = new Map();      // tableName -> Array of propNames
        const tablesToRebuild = new Set();   // Tabellen, die Copy-and-Swap brauchen

        /**
         * Markiert alle Tabellen, die einen bestimmten SimpleType oder Enum nutzen, für Rebuild
         * @param {string} typeName - Name des Types
         */
        const markTablesUsingType = (typeName) => {
            newSchema.properties.forEach((p) => {
                if (p.prop_type === typeName) {
                    tablesToRebuild.add(p.object_name);
                }
            });
        };


        //for (const [category, action, targetId, field, oldVal, newVal] of rows) {
        for (let i = 1; i < rows.length; i ++) {
            const [category, action, targetId, field, oldVal, newVal] = rows[i];

            if (category === "datatype") {
                const dt = action === "REMOVED" ? JSON.parse(oldVal + "") : newSchema.getDataType(targetId + "");
                if (dt?.art === "object") {
                    if (action === "ADDED") tablesToCreate.add(targetId);
                    else if (action === "REMOVED" && options.dropRemovedTables) tablesToDrop.add(targetId);
                    else if (action === "MODIFIED") tablesToRebuild.add(targetId); // z. B. Primary Key geändert
                }
            }
            else if (category === "property") {
                const [tableName, propName] = (targetId + "").split(".");
                if (tablesToCreate.has(tableName)) continue; // Wird ohnehin komplett neu erstellt

                if (action === "ADDED") {
                    const prop = newSchema.getProperty({ object_name: tableName, name: propName });
                    if (!prop) {continue;}

                    // SQLite erlaubt ADD COLUMN nur, wenn die Spalte nullable ist ODER einen Default-Wert hat
                    const isNullable = (prop.min ?? 1) === 0;
                    const hasDefault = prop.default !== undefined;

                    if (isNullable || hasDefault) {
                        if (!columnsToAdd.has(tableName)) columnsToAdd.set(tableName, []);
                        columnsToAdd.get(tableName).push(prop);
                    } else {
                        // Pflichtfeld ohne Default erfordert Rebuild
                        tablesToRebuild.add(tableName);
                    }
                } else {
                    // Spalte gelöscht (REMOVED) oder verändert (MODIFIED) -> Rebuild nötig
                    tablesToRebuild.add(tableName);
                }
            }
            else if (category === "simpletype" || category === "enum") {
                // Wenn sich z. B. max_length oder Enum-Werte ändern, müssen betroffene Tabellen ihre CHECK-Constraints erneuern
                markTablesUsingType(targetId + "");
            }
            else if (category === "ref" || category === "unique") {
                // Foreign Keys oder Unique-Constraints geändert -> betroffene Tabelle neu aufbauen
                const objData = action === "REMOVED" ? JSON.parse(oldVal + "") : JSON.parse(newVal + "" || "{}");
                const tableName = objData.object_name || (targetId + "").split("->")[0];
                if (tableName) tablesToRebuild.add(tableName);
            }
        }

        // 3. Migration sicher in einer Transaktion ausführen
        const executeMigration = this.db.transaction(() => {
            // Foreign Keys während struktureller Umbauten kurz pausieren
            this.db.run("PRAGMA foreign_keys = OFF;");

            // A) Neue Tabellen erstellen
            for (const tableName of tablesToCreate) {
                const createSql = this.generateCreateTableSQL(newSchema, tableName);
                this.db.run(createSql);
            }

            // B) Schnelles ALTER TABLE ADD COLUMN (nur für Tabellen, die nicht ohnehin komplett neu gebaut werden)
            for (const [tableName, props] of columnsToAdd.entries()) {
                if (tablesToRebuild.has(tableName) || tablesToCreate.has(tableName)) continue;
                for (const prop of props) {
                    const colDef = this.#buildColumnDefinition(newSchema, prop);
                    this.db.run(`ALTER TABLE ${tableName} ADD COLUMN ${colDef};`);
                }
            }

            // C) Copy-and-Swap für komplexere Änderungen
            for (const tableName of tablesToRebuild) {
                if (tablesToCreate.has(tableName)) continue;
                // Prüfen, ob die Tabelle im neuen Schema überhaupt noch existiert
                if (!newSchema.getDataType(tableName)) continue;

                const tempTable = `_temp_${tableName}_${Date.now()}`;
                const rawCreateSql = this.generateCreateTableSQL(newSchema, tableName);
                const tempCreateSql = rawCreateSql.replace(
                    `CREATE TABLE IF NOT EXISTS ${tableName}`,
                    `CREATE TABLE ${tempTable}`
                );

                this.db.run(tempCreateSql);

                // Bestehende Daten aus gemeinsamen Spalten übernehmen
                const oldCols = oldSchema.getObjProperties(tableName).map(p => p.name);
                const newCols = newSchema.getObjProperties(tableName).map(p => p.name);
                const commonCols = newCols.filter(col => oldCols.includes(col));

                if (commonCols.length > 0) {
                    const colsStr = commonCols.join(", ");
                    this.db.run(`INSERT INTO ${tempTable} (${colsStr}) SELECT ${colsStr} FROM ${tableName};`);
                }

                this.db.run(`DROP TABLE ${tableName};`);
                this.db.run(`ALTER TABLE ${tempTable} RENAME TO ${tableName};`);
            }

            // D) Optional: Entfernte Tabellen löschen (nur wenn explizit erlaubt)
            if (options.dropRemovedTables) {
                for (const tableName of tablesToDrop) {
                    this.db.run(`DROP TABLE IF EXISTS ${tableName};`);
                }
            }

            // E) Diff-Zeilen als Historie in _info_schema_history speichern
            const now = new Date().toISOString();
            const insertHistory = this.db.prepare(`
            INSERT INTO _info_schema_history (migrated_at, category, action, target_id, field, old_value, new_value)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        `);

            for (const [category, action, targetId, field, oldVal, newVal] of rows) {
                insertHistory.run(
                    now,
                    category,
                    action,
                    targetId,
                    field,
                    oldVal !== null ? String(oldVal) : null,
                    newVal !== null ? String(newVal) : null
                );
            }

            // F) Neuen Schema-Zustand speichern
            this.db.run(
                `INSERT INTO _info_schema_state (id, schema_json, updated_at) 
             VALUES (1, ?, ?) 
             ON CONFLICT(id) DO UPDATE SET schema_json = excluded.schema_json, updated_at = excluded.updated_at;`,
                [newSchema.toString(), now]
            );

            this.db.run("PRAGMA foreign_keys = ON;");
        });

        executeMigration();

        // Das Diff-Ergebnis im InfoData-Format zurückgeben (z. B. für Logs oder UI-Anzeige)
        return diffResult;
    }

}

// Beispiel
// const changes = sqliteDriver.migrateSchema(meinAppSchema);

// if (changes.schema_changes.length > 1) {
//     console.log("Datenbank erfolgreich migriert:", changes.schema_changes);
// }

