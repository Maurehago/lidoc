// =============================
//   Datenbank Treiber basis
// =============================
//@ts-check

import { Schema } from "./infoschema.js";


// ===================================
//   Typen
// -------------

/** @import {DataRows, QuestObject, TableObject, SQLQuery} from "./infodata.js" */


// ===================================
//   Parameter
// -------------

//const ALLOWED_TABLES = ["users", "banned_users", "posts"]; // Schutz für Unter-Selects
//const ALLOWED_COLUMNS = ["id", "user_id", "name", "role", "age", "status", "reason"];
const ALLOWED_OPERATORS = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IS", "IS NOT", "IN", "NOT IN", "EXISTS", "NOT EXISTS"];


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
     * OPERATORS: "=", "!=", ">", "<", ">=", "<=", "LIKE", "IS", "IS NOT", "IN", "NOT IN", "EXISTS", "NOT EXISTS"
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

        if (!quest || typeof quest !== "object") return { sql: "1=1", params: [] };

        // OR-Verknüpfung (Arrays)
        if (Array.isArray(quest)) {
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

        // Hilfsfunktion zur Unterscheidung zwischen Wert (?) und Feldreferenz ($.feld)
        //@ts-ignore
        const handleValue = (val) => {
            if (typeof val === "string" && val.startsWith("$.")) {
                return { sql: val.substring(2), isRef: true }; // Entfernt das "$."
            }
            return { sql: "?", isRef: false };
        };

        // AND-Verknüpfung (Objekt-Keys)
        const keys = Object.keys(quest);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const val = quest[key];

            // 1. DER EXISTS & NOT EXISTS-HANDLER
            if ((key === "_exists" || key === "_not_exists") && typeof val === "object") {
                const subTable = val.table;
                const prefix = key === "_not_exists" ? "NOT EXISTS" : "EXISTS";

                // "on" und "quest" werden weiterhin mit derselben Logik geparst
                const onParsed = this.quest_to_query(val.on || {});
                const questParsed = this.quest_to_query(val.quest || {});

                const subWhereClauses = [];
                if (onParsed.sql && onParsed.sql !== "1=1") subWhereClauses.push(onParsed.sql);
                if (questParsed.sql && questParsed.sql !== "1=1") subWhereClauses.push(questParsed.sql);

                const subWhereSql = subWhereClauses.join(" AND ") || "1=1";

                // Hier wird dynamisch EXISTS oder NOT EXISTS eingesetzt
                clauses.push(`${prefix} (SELECT 1 FROM ${subTable} WHERE ${subWhereSql})`);
                params.push(...onParsed.params, ...questParsed.params);
                continue;
            }

            // 2. STANDARD-OPERATOREN (IN, NOT IN, etc.)
            if (val && typeof val === "object" && !Array.isArray(val)) {
                const op = Object.keys(val)[0]; // z.B. "IN" oder ">="
                const innerVal = val[op];

                // "quest": {
                // "ci.is_active": { "IS NOT NULL": true },
                // "c.deleted_at": { "IS NULL": true }
                // }                
                if (op === "IS NULL" || op === "IS NOT NULL") {
                    // Wenn true übergeben wurde, fügen wir den Operator direkt an
                    if (innerVal === true) {
                        clauses.push(`${key} ${op}`);
                    } else if (innerVal === false) {
                        // Logische Umkehrung, falls jemand {"IS NULL": false} schreibt
                        const reverseOp = op === "IS NULL" ? "IS NOT NULL" : "IS NULL";
                        clauses.push(`${key} ${reverseOp}`);
                    }
                    continue;
                }

                if (op === "IN" || op === "NOT IN") {
                    // VARIANTE 1: Ein Subselect-Objekt
                    if (innerVal && typeof innerVal === "object" && !Array.isArray(innerVal)) {
                        // Rekursiver Aufruf des Haupt-Parsers für das Subselect
                        const parsedSub = this.buildSelectStatement(innerVal);

                        // Das Subselect wird ohne Alias direkt in die Klammern gesetzt
                        clauses.push(`${key} ${op} (${parsedSub.sql})`);
                        params.push(...parsedSub.params);
                    }
                    // VARIANTE 2: Standard-Array mit Werten
                    else if (Array.isArray(innerVal)) {
                        if (innerVal.length === 0) {
                            clauses.push(op === "IN" ? "1=0" : "1=1");
                        } else {
                            const placeholders = innerVal.map(() => "?").join(", ");
                            clauses.push(`${key} ${op} (${placeholders})`);
                            params.push(...innerVal);
                        }
                    }
                    continue;
                }

                // Für andere Operatoren wie {"c.age": {">=": "$.o.min_age"}} oder {"c.age": {">=": 18}}
                const res = handleValue(innerVal);
                clauses.push(`${key} ${op} ${res.sql}`);
                if (!res.isRef) params.push(innerVal);
                continue;
            }

            // 3. NORMALE GLEICHHEIT (=) / REFERENZ-VERGLEICH
            const res = handleValue(val);
            clauses.push(`${key} = ${res.sql}`);
            if (!res.isRef) params.push(val);
        }

        return {
            sql: clauses.length > 1 ? `(${clauses.join(" AND ")})` : clauses.join(" AND ") || "1=1",
            params
        };
    }

    /**
     * But aus einer Abfrage einen SQL String + Parameter ARRAY
     * @param {QuestObject} config - Tabellen Abfrage
     * @returns {SQLQuery}
     */
    buildSelectStatement(config) {
        const allParams = [];
        const parsedCols = config.cols ? [...config.cols] : [];

        // 1. Subselects (subs) auflösen und direkt an die Spalten anhängen
        if (config.subs && typeof config.subs === "object") {
            for (const alias in config.subs) {
                // Rekursiver Aufruf: Das Subselect wird zu SQL + Params
                const parsedSub = this.buildSelectStatement(config.subs[alias]);

                // Formatieren als "(SELECT ...) AS alias" und ins Spalten-Array pushen
                parsedCols.push(`(${parsedSub.sql}) AS ${alias}`);

                // Parameter des Subselects sammeln
                allParams.push(...parsedSub.params);
            }
        }

        // Spalten final zusammenfügen
        const cols = parsedCols.length > 0 ? parsedCols.join(", ") : "*";
        let sql = `SELECT ${cols} FROM ${config.table}`;

        // Echte Joins flach anhängen
        if (config.joins && Array.isArray(config.joins)) {
            for (const join of config.joins) {
                // Standard ist immer LEFT JOIN
                const parsedOn = this.quest_to_query(join.on);

                sql += ` LEFT JOIN ${join.table} ON ${parsedOn.sql}`;
                allParams.push(...parsedOn.params);
            }
        }

        // Haupt-WHERE
        if (config.quest) {
            const parsedQuery = this.quest_to_query(config.quest);
            if (parsedQuery.sql && parsedQuery.sql !== "1=1") {
                sql += ` WHERE ${parsedQuery.sql}`;
                allParams.push(...parsedQuery.params);
            }
        }

        // GROUP BY hinzufügen
        if (config.group && Array.isArray(config.group) && config.group.length > 0) {
            sql += ` GROUP BY ${config.group.join(", ")}`;
        }

        // HAVING-Klausel (nutzt exakt dieselbe Logik wie quest)
        if (config.having && typeof config.having === "object") {
            const parsedHaving = this.quest_to_query(config.having);
            if (parsedHaving.sql && parsedHaving.sql !== "1=1") {
                sql += ` HAVING ${parsedHaving.sql}`;
                allParams.push(...parsedHaving.params);
            }
        }

        // ORDER BY (sort)
        if (config.sort && Array.isArray(config.sort) && config.sort.length > 0) {
            sql += ` ORDER BY ${config.sort.join(", ")}`;
        }

        // LIMIT und PAGE (Paginierung)
        if (config.limit && typeof config.limit === "number") {
            sql += ` LIMIT ${config.limit}`;
            if (config.page && typeof config.page === "number" && config.page > 1) {
                const offset = (config.page - 1) * config.limit;
                sql += ` OFFSET ${offset}`;
            }
        }

        return { sql, params: allParams };
    }

    // --- FUNKTIONEN sollen überschrieben werden

    /**
     * Gibt alle Datensätze oder nur die von der Abfrage zurück
     * @param {QuestObject} [quest_object] - Optionale Abfrage
     * @returns {Promise<DataRows>}
     */
    async getRows(quest_object) { return []; }

    /**
     * Gibt einen Datensatz mit angegebener ID zurück
     * @param {QuestObject} [quest_object] - Optionale Abfrage
     * @returns {Promise<DataRows>}
     */
    async getRecord(quest_object) { return []; }

    /**
     * Speichert die Daten oder legt diese neu an. Die ID-Spalten müssen den Datensatz eindeutig Identifizieren.
     * @param {Object<string,TableObject>} tables - Name der Datentabelle
     * @param {string} driver_id - ID des Teibers, damit nur Tabellen berücksichtigt werden die zu dem selben Treiber gehören.
     * @returns {Promise<boolean>} true wenn erfolgreich
     */
    async saveRows(tables, driver_id) { return true; }

    /**
     * Löscht Datensätze aus einer oder mehreren Tabellen in einer einzigen Transaktion.
     * Unterstützt sowohl konkrete ID-Listen (id_name + ids) als auch Filterabfragen (quest).
     * Bei einem Fehler wird die gesamte Transaktion zurückgesetzt (Rollback).
     * 
     * @param {Object<string,TableObject|QuestObject>} tables - Objekt mit Datentabellen od Datenbank Abfragen(Quest)
     * @param {string} driver_id - ID des Treibers
     * @returns {Promise<boolean>} true wenn mindestens ein Datensatz gelöscht wurde
     */
    async deleteRows(tables, driver_id) { return false; }

    /**
     * Liest eine bestehende Tabelle aus der Datenquelle aus und überträgt sie in ein InfoSchema.
     * @param {Schema} schema - Die Ziel-Instanz deiner Schema-Klasse
     * @param {string} tableName - Name der auszulesenden Tabelle
     * @returns {Promise<void> | void}
     */
    extractTableToSchema(schema, tableName) {
        throw new Error(`extractTableToSchema() wird vom Treiber '${this.type}' nicht unterstützt.`);
    }

    /**
     * Erzeugt das datenbankspezifische CREATE TABLE Statement aus dem Schema.
     * @param {Schema} schema - Das Quell-Schema
     * @param {string} objectName - Name des ObjektTyps (Tabellenname)
     * @returns {string}
     */
    generateCreateTableSQL(schema, objectName) {
        throw new Error(`generateCreateTableSQL() wird vom Treiber '${this.type}' nicht unterstützt.`);
    }

    /**
     * Führt eine Migration basierend auf dem Schema-Diff durch und gibt die Änderungen im InfoData-Format zurück.
     * @param {Schema} newSchema - Das neue Ziel-Schema
     * @param {Object<string, any>} [options] - Optionale Einstellungen (z. B. { dropRemovedTables: false })
     * @returns {Promise<Object<string, DataRows>> | Object<string, DataRows>} InfoData-Objekt mit der Tabelle "schema_changes"
     */
    migrateSchema(newSchema, options = { dropRemovedTables: false }) {
        throw new Error(`migrateSchema() wird vom Treiber '${this.type}' nicht unterstützt.`);
    }
}
