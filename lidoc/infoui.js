// =========================================================================
//   DYNAMISCHES SPALTEN-UI & KEYBOARD ROUTER (infoui.js)
// =========================================================================
// @ts-check

import { DataTable } from "./infotable.js";
import { Schema, InfoSchema } from "./infoschema.js";

// ===================================
//   Infos
// --------

// view:
//      - list (InfoTableUI)
//      - form (InfoFormUI)
//      - html (InfoDetailUI)
// hash: #liste1/detail1

// hash: #add_schema
// Form:
//  Title: Add Schema
//  textarea:
//  button: addSchema
// onOK: next: schema_detail
// onError: self: error

// view: schema_detail
// parameters: schemaList
// - list schema filter: {type: "object"}
// - list schema filter: {type: "string|number|boolean"}


// "row-select", {
//     bubbles: true,
//     detail: { tableId: this.id, recordId: activeRow?.getAttribute("data-record-id") }
// }

// "row-edit", {
//     bubbles: true,
//     detail: { tableId: this.id, recordId: activeRow?.getAttribute("data-record-id") }
// }


// CustomEvent:
// "form-action", {
//      bubbles: true,
//      detail: {
//          formId: this.id,
//          action: actionName,
//          values: this.getValues()
//      }
// })

// "sync-initial-state", {
//     detail: { rows: data.rows, idColName: data.idColName }
// }

// "sync-data-received", {
//     detail: {
//         tableName: data.tableName,
//         targetType: data.targetType, // "LIST", "FORM", "DETAIL"
//         recordId: data.recordId,
//         dataTable: incomingTable
//     }
// }


// --------- CSS ---------------
// /* Der umschließende Spalten-Container, wenn er den Fokus hat */
// .ui-view-container:focus,
// .ui-view-container.focused {
//     outline: none;
//     border-color: #4a90e2;
//     box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
// }

// /* Aktive Zeile in einer Tabelle oder im Menü */
// .ui-view-container .active-row,
// .ui-menu-item.active-menu-item {
//     background-color: #f0f4f9 !important;
//     color: #1a4f8a;
//     font-weight: 500;
// }

// /* Die aktuell ausgewählte Zelle bei horizontaler Navigation */
// .ui-view-container td.active-cell {
//     background-color: #e2ecf7 !important;
//     outline: 2px solid #4a90e2;
//     outline-offset: -2px;
// }


// -------------- DetailAnsicht Socket Kommunikation -----------------------
// {
//   "type": "DATA",
//   "targetType": "DETAIL",
//   "tableName": "kundenDetailAnsicht",
//   "payload": {
//     "stammdaten": [["vorname", "nachname"], ["Max", "Mustermann"]],
//     "kontakte": [["typ", "wert"], ["Telefon", "01234"], ["Email", "max@test.de"]],
//     "bestellungen": [["nr", "datum", "summe"], ["B100", "2026-03-01", "99.00"]]
//   }
// }




// ==================================
//   Typen
// -------------

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
 * Tabellen einstellungen
 * @typedef {object} InfoUITableCol
 * @property {string} column_name - Name der Spalte
 * @property {string} display_name - Anzeige Text
 * @property {number} position - Spalten Position
 * @property {string} [format] - Name der Value Formatierungs-Funktion
*/
export const InfoUITableCol_fields = ["column_name", "display_name", "position", "format"];
export const InfoUITableCol_unique = "column_name";

/**
 * Input Typen
 * @typedef {"input_text"|"input_number"|"input_range"|"input_date"|"checkbox"|"select"|"button"|"textarea"} InfoUIInputType
 */
export const InfoUIInputType_values = ["input_text", "input_number", "input_range", "input_date", "checkbox", "select", "button", "textarea"];

/**
 * Formular einstellungen
 * @typedef {object} InfoUIFormField
 * @property {string} field_name - Name des Datenfeldes
 * @property {string} label - Anzeige/Überschrift/Text(bei Buttons)
 * @property {number} position - Position des Feldes
 * @property {InfoUIInputType|undefined} ui_element - Typ des Input elementes oder "button"
 * property {string|undefined} action_module - Modul Name welches die Funktionalität bereit stellt
 * @property {string|undefined} action_function - Name der Funktion im Modul
 */
export const InfoUIFormField_fields = ["field_name", "label", "position", "ui_element", "action_function"];
export const InfoUIFormField_unique = "field_name";


/**
 * Detail Einstellungen
 * @typedef {object} InfoUIDetailField
 * @property {string} field_name - Name des Datenfeldes
 * @property {string} label - Anzeige
 * @property {number} position - Position des Feldes
 * @property {string} [format] - Name der Value Formatierungs-Funktion
 */
export const InfoUIDetailField_fields = ["field_name", "label", "position", "format"];
export const InfoUIDetailField_unique = "field_name";


// ----------- Datenbank (Treiber) Datentypen

/**
 * Definiert die Schnittstelle, die JEDER Datenbank- oder Dateitreiber implementieren MUSS.
 * @typedef {Object} DBDriverInterface
 * @property {string} id - Entspricht DriverConfig.id
 * @property {string} type - Entspricht DriverConfig.type
 * @property {string} name - Name des Teibers
 * @property {() => Promise<DataRows>} getTables - Holt alle Tabellen aus der Datenbank
 * @property {(tableName: string) => Promise<DataRows>} getRows - Holt alle Zeilen einer Tabelle inkl. Header
 * @property {(tableName: string, recordId: string, idColName: string) => Promise<DataRows>} getRecord - Holt genau eine Zeile + Header für die Detailansicht
 * @property {(tableName: string, deltaRows: DataRows, idColName: string) => Promise<boolean>} saveRows - Schreibt nur die geänderten Spalten (Delta-Array) in die DB
 * @property {(tableName: string, recordId: string, idColName: string) => Promise<boolean>} deleteRow - Löscht einen spezifischen Datensatz aus der Tabelle
 * @property {(newSchemaJson: string) => Promise<{success: boolean, message: string}>} [migrateSchema] - Optional: Führt Tabellen-Migrationen bei Schema-Updates aus
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
 * @property {InfoSchema} appSchema - Schema für die Anwendung
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
 * @property {string} [driverId] - Ziel-Treiber für die Aktion
 * @property {string} [tableName] - Ziel-Tabelle für die Aktion
 * @property {string} [recordId] - Ziel-Datensatz-ID (falls anwendbar)
 * @property {string} [idColName] - Name der Primärschlüssel-Spalte (Standard meist "gsid")
 * @property {TargetType} [targetType] - Für Navigation: Welcher UI-Typ wird erwartet ("MENU" | "TABLE" | "FORM" | "DETAIL" | "WIZARD")
 * @property {Object<string,any>} [payload] - Freitext-Feld für Payloads (z.B. komplettes Config-JSON oder Schema-JSON)
 * @property {DataRows} [rows] - Das Datenpaket (entweder gesamte Tabelle oder Delta-Array bei SAVE)
 */


// ============================================
//   Komponente
// --------------

export class InfoUIComponent {
    /**
     * 
     * @param {string} id - ID der Komponente
     */
    constructor(id) {
        this.id = id;
        /** @type {HTMLElement|null} */
        this.domElement = null; // Wird beim Rendern besetzt

        /** @type {Object<string,function>} */
        this.fu = {}; // wird von der APP überschrieben
    }

    /** Wird von Komponenten überschrieben */
    render() { return ""; }

    /**
     * Wird vom Controller aufgerufen, wenn die Komponente den Fokus hat
     * @param {KeyboardEvent} e 
     */
    handleKeyDown(e) { }

    /**
     * Wird vom Controller aufgerufen, wenn ein Klick innerhalb der Komponente erfolgt
     * @param {MouseEvent} e 
     */
    handleMouseClick(e) { } // Wird von Subklassen überschrieben

    /**
     * Wird vom Controller aufgerufen, wenn ein Klick innerhalb der Komponente erfolgt
     * @param {MouseEvent} e 
     */
    handleMouseDblClick(e) { } // Wird von Subklassen überschrieben

    /** 
     * Aktiviert das visuelle CSS-Styling für den Fokus 
     * @param {boolean} isFocused - Setzt/ entfernt den Fokus
     */
    setFocused(isFocused) {
        if (this.domElement) {
            this.domElement.classList.toggle("component-focused", isFocused);
        }
    }
}


export class InfoUITable extends InfoUIComponent {
    /**
     * Eine Tabellen-Liste Komponente
     * @param {string} id - ID der Komponente
     * @param {string} title - Titel der angezeigt wird
     * @param {DataTable<any>} [dataTable] - Optional Datentabelle
     * @param {string} [dataIndex] - Optional neuer Index
     */
    constructor(id, title, dataTable, dataIndex) {
        super(id);
        this.title = title;
        this.dataTable = dataTable;

        /** @type {string|undefined} */
        this.dataIndex = dataIndex;
        this.activeRowIdx = 0;
        this.activeColIdx = 0;
        this.cols = [];
    }

    /** @type {Array<InfoUITableCol>} */
    cols = [];

    /** @type {Object<string,number>} */
    colIndex = {};

    sort() {
        this.cols = this.cols.sort((a, b) => a.position - b.position);
    }

    createIndex() {
        this.colIndex = {};
        for (let i = 0; i < this.cols.length; i++) {
            this.colIndex[this.cols[i].column_name] = this.cols[i].position;
        }
    }


    /**
     * Fügt eine neue Tabellenspalte hinzu
     * @param {string} column_name - name der Spalte
     * @param {string} [display_name] - Optional Text der Angezeigt wird
     * @param {number} [position] - Optional Position der Spalte. Verschiebt alle folgenden Spalten. -1 Wenn hinten anfügen
     * @param {string} [format] - Formatierung der Spalte. Funktion ?????
     */
    add_col(column_name, display_name, position = -1, format) {
        // neues Object
        let obj = { column_name, display_name: display_name || column_name, position, format };

        // prüfen ob vorhanden
        let colIndex = this.colIndex[column_name] || -1;
        if (colIndex >= 0) {
            // Vorhandenes ersetzen unabhängig von position
            obj.position = colIndex;
            this.cols[colIndex] = obj;
        } else {
            // nicht vorhanden
            if (position == undefined || position < 0) {
                obj.position = this.cols.push(obj) - 1;
                this.colIndex[obj.column_name] = obj.position;
            } else {
                // an neuer Position einfügen
                this.cols.splice(position, 0, obj);

                // index neu aufbauen
                this.createIndex();
            }
        }
    }


    /**
     * Generiert eine HTML-Tabelle
     * @returns {string} generiertes HTML
     */
    render() {
        // 1. Hole die relevanten UI-Spalten für diese Tabelle und sortiere sie
        const columns = this.cols;
        const colIndexes = [];

        let html = `<div class="ui-view-container" data-table-id="${this.id}">`;
        html += `<h4>${this.title}</h4>`;

        // wenn Keine Daten zugewiesen
        if (!this.dataTable) {
            return html + "<p>no DataTable</p>"
        }

        html += `<table table-stripes><thead><tr>`;

        // Header rendern
        for (let i = 0; i < columns.length; i++) {
            // Spalten Überschriften todo: Ausrichtung
            html += `<th>${columns[i].display_name}</th>`;
            colIndexes.push(this.dataTable.columnIndex[columns[i].column_name]);
        }
        html += `</tr></thead><tbody>`;

        // Zeilen aus den echten Daten rendern (Index 0 auslassen, da Header im Datentreiber)
        // Index für Sortierung und Filter
        const dataRowIndex = this.dataTable.getIndexList(this.dataIndex);

        for (let i = 0; i < dataRowIndex.length; i++) {
            if (dataRowIndex[i] === 0) continue;

            // Datenzeile lesen
            const row = this.dataTable.getRow(dataRowIndex[i]);
            if (!row) { continue; }

            // Datensatz ID todo: Optimieren: eventuell SpaltenIndex ?????
            const recordId = this.dataTable.getID(row);

            html += `<tr data-record-id="${recordId}">`;
            for (let j = 0; j < columns.length; j++) {
                const format = columns[i].format;
                let value = row[colIndexes[j]];
                
                // Formatierung
                if (format && typeof this.fu[format] == "function") {
                    value = this.fu[format](value);
                }

                // Spalte anzeigen todo: Ausrichtung/Formatierung ????
                html += `<td>${value}</td>`;
            };
            html += `</tr>`;
        };

        html += `</tbody></table></div>`;
        return html;
    }

    /**
     * DatenTabelle setzen
     * @param {DataTable<any>} newDataTable - neue Datentabelle setzen 
     * @param {string} [newDataIndex] - Optional neuer Index
     */
    set_dataTable(newDataTable, newDataIndex) {
        this.dataTable = newDataTable;
        this.dataIndex = newDataIndex || this.dataIndex;

        if (this.domElement) {
            // HTML neu erzeugen
            this.domElement.innerHTML = this.render();

            // Fokus-Index zurücksetzen ???
            this.activeRowIdx = 0;
            this.updateVisualFocus();
        }
    }


    updateVisualFocus() {
        const tbody = this.domElement?.querySelector("tbody");
        if (!tbody) return;

        // Alte Markierungen entfernen
        tbody.querySelectorAll(".active-row").forEach(el => el.classList.remove("active-row"));
        tbody.querySelectorAll(".active-cell").forEach(el => el.classList.remove("active-cell"));

        // Zeilen-Fokus
        const activeRow = tbody.rows[this.activeRowIdx];
        if (activeRow) {
            activeRow.classList.add("active-row");

            // Zellen-Fokus (Horizontale Navigation)
            const activeCell = activeRow.cells[this.activeColIdx];
            if (activeCell) {
                activeCell.classList.add("active-cell");
            }
        }
    }


    /** 
     * Vom Controller delegiertes Event für die interne Tabellensteuerung 
     * @param {KeyboardEvent} e - Tastatur Event
     */
    handleKeyDown(e) {
        const tbody = this.domElement?.querySelector("tbody");
        if (!tbody) return;
        const maxRows = tbody.rows.length;
        const maxCols = this.cols.length;

        // Vertikale Navigation
        if (e.key === "ArrowDown" && this.activeRowIdx < maxRows - 1) {
            this.activeRowIdx++; e.preventDefault();
            this.updateVisualFocus();
        }
        if (e.key === "ArrowUp" && this.activeRowIdx > 0) {
            this.activeRowIdx--; e.preventDefault();
            this.updateVisualFocus();
        }

        // Horizontale Navigation (Zellen-Fokus)
        if (e.key === "ArrowRight" && this.activeColIdx < maxCols - 1) {
            this.activeColIdx++; e.preventDefault();
            this.updateVisualFocus();
        }
        if (e.key === "ArrowLeft" && this.activeColIdx > 0) {
            this.activeColIdx--; e.preventDefault();
            this.updateVisualFocus();
        }

        // Auswahl (Leertaste)
        if (e.key === " ") { // "Space" im Web-API ist ein Leerzeichen-String
            e.preventDefault();
            const activeRow = tbody.rows[this.activeRowIdx];
            this.domElement?.dispatchEvent(new CustomEvent("row-select", {
                bubbles: true,
                detail: { tableId: this.id, recordId: activeRow?.getAttribute("data-record-id") }
            }));
        }

        // Ausführen / Editieren (Enter)
        if (e.key === "Enter") {
            e.preventDefault();
            const activeRow = tbody.rows[this.activeRowIdx];
            this.domElement?.dispatchEvent(new CustomEvent("row-edit", {
                bubbles: true,
                detail: { tableId: this.id, recordId: activeRow?.getAttribute("data-record-id") }
            }));
        }
    }

    /**
     * Checkt die Mouse Events
     * @param {MouseEvent} e - Maus Event
     * @returns 
     */
    handleMouseClick(e) {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;

        const cell = target.closest("td");
        const row = target.closest("tr");
        if (!cell || !row) return;

        // Indizes berechnen (0-basiert für den tbody)
        // row.rowIndex zieht auch den thead mit ein, daher nutzen wir besser parentNode oder eine Schleife:
        const tbody = row.closest("tbody");
        if (tbody) {
            this.activeRowIdx = Array.from(tbody.rows).indexOf(row);
            this.activeColIdx = cell.cellIndex;

            this.updateVisualFocus();

            // Row-Select Event abfeuern (wie bei Space)
            this.domElement?.dispatchEvent(new CustomEvent("row-select", {
                bubbles: true,
                detail: { tableId: this.id, recordId: row.getAttribute("data-record-id") }
            }));
        }
    }

    /**
     * Checkt die Mouse Events
     * @param {MouseEvent} e - Maus Event
     * @returns 
     */
    handleMouseDblClick(e) {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;

        const cell = target.closest("td");
        const row = target.closest("tr");
        if (!cell || !row) return;

        // Indizes berechnen (0-basiert für den tbody)
        // row.rowIndex zieht auch den thead mit ein, daher nutzen wir besser parentNode oder eine Schleife:
        const tbody = row.closest("tbody");
        if (tbody) {
            this.activeRowIdx = Array.from(tbody.rows).indexOf(row);
            this.activeColIdx = cell.cellIndex;

            this.updateVisualFocus();

            // Row-Select Event abfeuern (wie bei Space)
            this.domElement?.dispatchEvent(new CustomEvent("row-edit", {
                bubbles: true,
                detail: { tableId: this.id, recordId: row.getAttribute("data-record-id") }
            }));
        }
    }
}


export class InfoUIForm extends InfoUIComponent {
    /**
     * Eine Formular Komponente
     * @param {string} id - ID der Komponente
     * @param {string} title - Titel der angezeigt wird
     * @param {Object<string,any>} [dataObject] - Optional Datentabelle
     */
    constructor(id, title, dataObject) {
        super(id);
        this.title = title;
        this.dataObject = dataObject;

        this.activeRowIdx = 0;

        /** 
         * Speicher für dynamische Select-Optionen, die nicht aus dem Schema kommen.
         * Format: { "feld_name": [[key, value], ... ] }
         * @type {Map<string, Array<Array<any>>|Array<string>>} 
         */
        this.dynamicOptions = new Map();
    }

    /** @type {HTMLFormElement|null|undefined} */
    formElement = null;

    /** @type {Array<HTMLElement>} */
    inputElements = []

    /** @type {Array<InfoUIFormField>} */
    fields = [];

    /** @type {Object<string,number>} */
    fieldIndex = {};

    #sort() {
        this.fields = this.fields.sort((a, b) => a.position - b.position);
    }

    createIndex() {
        this.fieldIndex = {};
        for (let i = 0; i < this.fields.length; i++) {
            this.fieldIndex[this.fields[i].field_name] = this.fields[i].position;
        }
    }

    /**
     * Fügt eine neue Tabellenspalte hinzu
     * @param {string} field_name - name der Spalte
     * @param {string} [label] - Text der Angezeigt wird
     * @param {InfoUIInputType} [ui_element] - Formatierung der Spalte. Funktion ?????
     * @param {number} [position] - Optional Position der Spalte. Verschiebt alle folgenden Spalten. -1 Wenn hinten anfügen
     * param {string} [action_module] - Formatierung der Spalte. Funktion ?????
     * @param {string} [action_function] - Formatierung der Spalte. Funktion ?????
     */
    add_field(field_name, label, ui_element, position = -1, action_function) {
        // neues Object
        let obj = { field_name, label: label || field_name, ui_element, position, action_function };

        // prüfen ob vorhanden
        let fieldIndex = this.fieldIndex[field_name] || -1;
        if (fieldIndex >= 0) {
            // Vorhandenes ersetzen unabhängig von position
            obj.position = fieldIndex;
            this.fields[fieldIndex] = obj;
        } else {
            // nicht vorhanden
            if (position == undefined || position < 0) {
                obj.position = this.fields.push(obj) - 1;
                this.fieldIndex[obj.field_name] = obj.position;
            } else {
                // an neuer Position einfügen
                this.fields.splice(position, 0, obj);

                // index neu aufbauen
                this.createIndex();
            }
        }
    }

    /**
     * Generiert plattformunabhängige, tastaturbedienbare Formularfelder
     * @param {InfoUIFormField} field - Feld-Einstellungs-Objekt
     * @param {any} value - Aktueller Wert aus dem Daten-Objekt
     * @param {Schema} [schema] - Optionales Schema zur Typerkennung
     */
    get_input_html(field, value, schema) {
        // Falls ein Schema übergeben wurde, versuchen wir den prop_type zu ermitteln, falls ui_element generisch ist
        let uiType = field.ui_element;

        // Fallback-Wert-Splitting für Ranges (erwartet "wert1|wert2" oder ein Array)
        const rangeValues = typeof value === "string" ? value.split("|") : (Array.isArray(value) ? value : ["", ""]);
        const cleanVal = value !== undefined && value !== null ? value : "";

        switch (uiType) {
            case "input_text":
                return `
                <div class="form-group" data-focusable="true">
                    <label>${field.label}</label>
                    <input type="text" name="${field.field_name}" value="${cleanVal}">
                </div>`;

            case "input_number":
                return `
                <div class="form-group" data-focusable="true">
                    <label>${field.label}</label>
                    <input type="number" name="${field.field_name}" value="${cleanVal}">
                </div>`;

            case "input_range": // Numerische Range (Von - Bis)
                // todo: Min und Max Value lesen (schema?????)
                return `
                <div class="form-group range-group" data-focusable="true">
                    <label>${field.label}</label>
                    <input type="range" name="${field.field_name}" value="${cleanVal}" min="0" max="99">
                </div>`;

            case "input_date":
                return `
                <div class="form-group" data-focusable="true">
                    <label>${field.label}</label>
                    <input type="date" name="${field.field_name}" value="${cleanVal}">
                </div>`;

            case "textarea":
                return `
                <div class="form-group" data-focusable="true">
                    <label>${field.label}</label>
                    <textarea 
                        name="${field.field_name}" 
                        data-field="${field.field_name}"
                        class="ui-input ui-textarea"
                        rows="4">${cleanVal}</textarea>
                </div>`;
            // todo: Datumsbereich mit Range???
            // case "input_date_range": // Datums-Range (Von - Bis)
            //     return `
            //     <div class="form-group range-group" data-focusable="true">
            //         <label>${field.label}</label>
            //         <div style="display:flex; gap:5px;">
            //             <input type="date" name="${field.field_name}_start" value="${rangeValues[0] ?? ''}">
            //             <input type="date" name="${field.field_name}_end" value="${rangeValues[1] ?? ''}">
            //         </div>
            //     </div>`;

            case "checkbox":
                const isChecked = value === true || value === "true" || value === 1 || value === "1";
                return `
                <div class="form-group checkbox-group" data-focusable="true">
                    <label style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" name="${field.field_name}" ${isChecked ? 'checked' : ''}>
                        ${field.label}
                    </label>
                </div>`;

            case "select": // Dropdown-Auswahl
                let optionsHtml = "<option value=''>-- Bitte wählen --</option>";
                const currentVal = cleanVal;

                // 1. Priorität: Dynamisch übergebene Listen von der App
                if (this.dynamicOptions.has(field.field_name)) {
                    const optionsList = this.dynamicOptions.get(field.field_name) || [];
                    for (let i = 0; i < optionsList?.length; i++) {
                        const opt_key = Array.isArray(optionsList[i]) ? optionsList[i][0] : optionsList[i];
                        const opt_value = Array.isArray(optionsList[i]) ? optionsList[i][1] : optionsList[i];
                        optionsHtml += `<option value="${opt_value}" ${currentVal == opt_value ? 'selected' : ''}>${opt_key}</option>`;
                    };
                }
                // 2. Priorität: Fallback auf dein infoSchema Enum
                else if (schema && field.field_name) {
                    const enumObj = schema.getEnum(field.field_name) || schema.getEnum("InfoUIInputType"); // Dynamisch passend
                    if (enumObj && enumObj.values) {
                        // Da 'values' nun ein Array ist (voriger Schritt!), können wir direkt forEach nutzen!
                        enumObj.values.forEach(val => {
                            optionsHtml += `<option value="${val}" ${currentVal == val ? 'selected' : ''}>${val}</option>`;
                        });
                    }
                }

                return `
                <div class="form-group" data-focusable="true">
                    <label>${field.label}</label>
                    <select name="${field.field_name}" data-field="${field.field_name}">${optionsHtml}</select>
                </div>`;

            case "button":
                // Wir nutzen 'action_function' als sprechenden Event-Namen (z.B. "addSchema")
                const actionName = field.action_function || field.field_name;
                return `
                <div class="form-group button-group">
                    <button type="button" class="ui-btn" data-focusable="true" 
                            data-action="${actionName}">
                        ${field.label}
                    </button>
                </div>`;

            default:
                return `
                <div class="form-group" data-focusable="true">
                    <label>${field.label}</label>
                    <input type="text" name="${field.field_name}" value="${cleanVal}">
                </div>`;
        }
    }

    /**
     * Generiert ein HTML-Formular
     * @returns {string}
     */
    render() {
        const fields = this.fields;

        let html = `<form class="ui-view-container" data-form-id="${this.id}">`;

        //fields.forEach(field => {
        for (let i = 0; i < fields.length; i++) {
            // todo: input Formate Festlegen
            // todo: eingabe Schema prüfen ????
            const val = this.dataObject ? this.dataObject[fields[i].field_name] : "";

            // Input HTML zusammenbauen
            html += this.get_input_html(fields[i], val);
        };

        html += `</form>`;

        // Nach dem Einfügen ins DOM müssen wir Event-Listener für Live-Validierung binden
        //setTimeout(() => this.#bindLiveValidation(schemaInstance), 0);

        // Form und inputs zurücksetzen
        this.formElement = null;
        this.inputElements = [];

        return html;
    }

    /**
     * DatenObjekt setzen
     * @param {Object<string,any>} newDataObject - neue Datentabelle setzen 
     */
    set_dataObject(newDataObject) {
        this.dataObject = newDataObject;
        if (this.domElement) {
            // HTML neu erzeugen
            this.domElement.innerHTML = this.render();

            // todo: Fokus-Index zurücksetzen ???
            //this.activeRowIdx = 0;
            //this.updateVisualFocus();
        }
    }

    /**
     * Erlaubt es der App, Dropdown-Daten zur Laufzeit zu setzen
     * @param {string} fieldName 
     * @param {Array<Array<any>>|Array<string>} options 
     */
    setSelectOptions(fieldName, options) {
        this.dynamicOptions.set(fieldName, options);

        // Falls das Formular bereits im DOM ist, rendern wir es neu
        if (this.domElement) {
            this.domElement.innerHTML = this.render();
        }
    }

    /**
     * Liest die aktuellen Formulardaten als flaches Objekt aus
     * @returns {Object<string,any>|null}
     */
    getValues() {
        this.formElement = this.formElement || this.domElement?.querySelector("form");
        if (!this.formElement) return null;

        // Erzeugt automatisch ein Key-Value-Objekt aller Felder
        const formData = new FormData(this.formElement);
        /** @type {Object<string,any>} */
        const daten = Object.fromEntries(formData);

        // Typ-Konvertierung basierend auf deinen Formularfeldern
        this.fields.forEach(field => {
            if (field.ui_element === "input_number" && daten[field.field_name] !== "") {
                daten[field.field_name] = Number(daten[field.field_name]);
            }
            if (field.ui_element === "checkbox") {
                // FormData überträgt gecheckte Checkboxen als "on", ungecheckte gar nicht
                daten[field.field_name] = formData.has(field.field_name);
            }
        });

        return daten;
    }

    /**
     * Validiert das gesamte Formular gegen ein Schema
     * @param {Schema} [schema] 
     * @returns {boolean}
     */
    validate(schema) {
        if (!schema || !this.domElement) return false; //

        this.formElement = this.formElement || this.domElement.querySelector("form");
        if (!this.formElement) return false; //

        // Daten in Objekt lesen
        const aktuelleDaten = this.getValues();
        if (!aktuelleDaten) return false;

        // todo: Schema Objekt Name ????
        // Nutzt die von dir geschriebene validateObject-Methode
        const validationResult = schema.validateObject(this.id, aktuelleDaten); //

        // 3. Bestehende Fehlermeldungen im DOM aufräumen
        this.formElement.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error")); //
        this.formElement.querySelectorAll(".error-message").forEach(el => el.remove()); //

        // 4. Fehler im UI anzeigen, falls vorhanden
        if (!validationResult.valid && validationResult.propValids) { //
            validationResult.propValids.forEach(propError => { //
                if (!propError.valid) { //
                    const input = this.formElement?.querySelector(`[name="${propError.property}"]`);
                    if (input) {
                        input.classList.add("input-error"); //
                        const errorSpan = document.createElement("span"); //
                        errorSpan.className = "error-message"; //
                        errorSpan.style.cssText = "color: #d0021b; font-size: 11px; display: block; margin-top: 2px;"; //
                        errorSpan.textContent = propError.error || "Ungültiger Wert"; //
                        input.parentNode?.appendChild(errorSpan); //
                    }
                }
            });
        }

        return validationResult.valid; //
    }


    /** 
    * Vom Controller delegiertes Event für die interne Formularsteuerung 
    * @param {KeyboardEvent} e - Tastatur Event
    */
    handleKeyDown(e) {
        const target = e.target;
        if (!(target instanceof HTMLElement)) { return; }

        // Prüfen, ob das Event überhaupt aus einem Eingabefeld kommt
        if (!target.matches('input, textarea, select, button')) return;

        /**
         * Formular-Hilfsfunktion für die Navigation
         * @param {"next"|"prev"} direction - Richtung in die gegangen wird
        */
        const navigateTo = (direction) => {
            this.formElement = this.formElement || target.closest('form');
            if (!this.formElement) return;
            this.inputElements = this.inputElements || Array.from(this.formElement.querySelectorAll('input:not([type="hidden"]):not([disabled]), textarea, select, button'));
            const index = this.inputElements.indexOf(target);

            if (direction === 'next' && index < this.inputElements.length - 1) {
                this.inputElements[index + 1].focus();
            } else if (direction === 'prev' && index > 0) {
                this.inputElements[index - 1].focus();
            }
        };

        // Sonderfall - Wenn TextArea
        if (target instanceof HTMLTextAreaElement) {
            // Tabulator
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault(); // Verhindert das Verlassen der Textarea

                const start = target.selectionStart;
                const end = target.selectionEnd;
                const val = target.value;

                // Fügt an der Cursorposition ein Tab-Zeichen (oder 4 Leerzeichen) ein
                target.value = val.substring(0, start) + "\t" + val.substring(end);

                // Setzt den Cursor direkt hinter das eingefügte Tab-Zeichen
                target.selectionStart = target.selectionEnd = start + 1;
                return;
            }

            // Enter
            if (e.key === 'Enter') {
                // Wenn NUR Enter gedrückt wird, erlauben wir den Zeilenumbruch.
                // Wir verhindern, dass ein übergeordnetes Formular-Submit ausgelöst wird.
                e.stopPropagation();

                // Optional: Wenn Strg+Enter oder Meta+Enter das Formular trotz Textarea abspeichert:
                // if (e.ctrlKey || e.metaKey) {
                //     e.preventDefault();
                //     this.submitForm(); // Ruft deine Speicher-Logik auf
                // }
                return; // Breche hier ab, damit der Zeilenumbruch normal durchgeführt wird
            }


            // Feature A: Umschalt + Pfeiltaste Unten/Oben springt SOFORT zum nächsten Feld
            if (e.shiftKey && e.key === 'ArrowDown') {
                e.preventDefault();
                navigateTo('next');
                return;
            }
            if (e.shiftKey && e.key === 'ArrowUp') {
                e.preventDefault();
                navigateTo('prev');
                return;
            }

            // Feature B: Normale Pfeiltasten prüfen, ob Cursor ganz oben/unten steht
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                const start = target.selectionStart;
                const val = target.value;

                if (e.key === 'ArrowUp') {
                    // Steht der Cursor in der allerersten Zeile? 
                    // Wenn vor dem Cursor kein Zeilenumbruch (\n) mehr kommt, sind wir ganz oben.
                    const befindetSichGanzOben = !val.substring(0, start).includes('\n');
                    if (befindetSichGanzOben) {
                        e.preventDefault();
                        navigateTo('prev');
                        return;
                    }
                }

                if (e.key === 'ArrowDown') {
                    // Steht der Cursor in der allerletzten Zeile?
                    // Wenn nach dem Cursor kein Zeilenumbruch (\n) mehr kommt, sind wir ganz unten.
                    const befindetSichGanzUnten = !val.substring(start).includes('\n');
                    if (befindetSichGanzUnten) {
                        e.preventDefault();
                        navigateTo('next');
                        return;
                    }
                }
            }
            return;
        }

        // Wenn Enter auf einem Button gedrückt wird -> Aktion auslösen
        if (e.key === "Enter" && target.tagName.toLowerCase() === "button") {
            e.preventDefault();

            const actionName = target.getAttribute("data-action");
            if (actionName) {
                this.domElement?.dispatchEvent(new CustomEvent("form-action", {
                    bubbles: true,
                    detail: {
                        formId: this.id,
                        action: actionName,
                        values: this.getValues() // Schickt direkt alle aktuellen Formulardaten mit!
                    }
                }));
            }
            return;
        }


        // // 2. STANDARD-INPUTS: Enter-Taste (Formular absenden oder Aktion ausführen)
        // if (e.key === 'Enter') {
        //     e.preventDefault(); // Verhindert das unkontrollierte Neuladen der Seite
        //     this.submitForm();
        //     return;
        // }

        // Normale Inputs
        if (target instanceof HTMLInputElement && target.type !== 'range') {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                navigateTo('next');
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                navigateTo('prev');
            }
        }
    }

    /**
     * Verarbeitet ein Mous Event
     * @param {MouseEvent} e - Maus Event
     */
    handleMouseClick(e) {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;

        // Prüfen, ob ein Button mit einer registrierten Aktion geklickt wurde
        if (target.tagName.toLowerCase() === "button" && target.hasAttribute("data-action")) {
            e.preventDefault();
            const actionName = target.getAttribute("data-action");

            if (actionName) {
                this.domElement?.dispatchEvent(new CustomEvent("form-action", {
                    bubbles: true,
                    detail: {
                        formId: this.id,
                        action: actionName,
                        values: this.getValues()
                    }
                }));
            }
        }
    }
}


export class InfoUIVerticalForm extends InfoUIForm {
    /**
     * Eine Formular Komponente
     * @param {string} id - ID der Komponente
     * @param {string} title - Titel der angezeigt wird
     * @param {DataTable<any>} [dataTable] - Optional Datentabelle
     * @param {string} [keyField] - Optional Name der Key Spalte
     * @param {string} [valueField] - Optional Name der Value Spalte
     */
    constructor(id, title, dataTable, keyField, valueField) {
        super(id, title);

        this.dataTable = dataTable;
        this.keyField = keyField;
        this.valueField = valueField;

        /** @type {string|undefined} */
        this.dataIndex = undefined;
    }

    /**
     * @returns {string}
     */
    render() {
        if (!this.dataTable || !this.keyField || !this.valueField) {
            return "<p>No DataTable or KeyField or ValueField</p>"
        }

        let html = `<form class="ui-view-container" data-form-id="${this.id}">`;

        const keyIndex = this.dataTable.columnIndex[this.keyField];
        const valueIndex = this.dataTable.columnIndex[this.valueField];

        // Label aus der UI-Config holen, falls vorhanden, sonst den Key nutzen
        const uiKeyField = this.fields[this.fieldIndex[this.keyField]];
        const uiValueField = this.fields[this.fieldIndex[this.valueField]];

        const input_type = uiValueField.ui_element;

        // Zeilen aus den echten Daten rendern (Index 0 auslassen, da Header im Datentreiber)
        // Index für Sortierung und Filter
        const dataRowIndex = this.dataTable.getIndexList(this.dataIndex);

        for (let i = 0; i < dataRowIndex.length; i++) {
            if (dataRowIndex[i] === 0) continue;

            // Datenzeile lesen
            const row = this.dataTable.getRow(dataRowIndex[i]);
            if (!row) { continue; }

            // Datensatz ID todo: Optimieren: eventuell SpaltenIndex ?????
            const recordId = this.dataTable.getID(row);

            // Angenommen, die Tabelle hat die Spalten "key" (oder parameter) und "value"
            const key = row[keyIndex];
            const val = row[valueIndex];

            //const labelText = uiField ? uiField.label : key;
            const labelText = key;

            // todo: datensatzID damit das richtig gespeichert wird
            // todo: input-typ lesen
            html += this.get_input_html(uiValueField, val);
        }

        html += `</form>`;

        // Form und inputs zurücksetzen
        this.formElement = null;
        this.inputElements = [];

        return html;
    }

    /**
     * DatenTabelle setzen
     * @param {DataTable<any>} newDataTable - neue Datentabelle setzen 
     * @param {string} [newDataIndex] - Optional neuer Index
     */
    set_dataTable(newDataTable, newDataIndex) {
        this.dataTable = newDataTable;
        this.dataIndex = newDataIndex || this.dataIndex;
        if (this.domElement) {
            // HTML neu erzeugen
            this.domElement.innerHTML = this.render();
        }
    }


    // /** 
    //  * Vom Controller delegiertes Event für die interne Tabellensteuerung 
    //  * @param {KeyboardEvent} e - Tastatur Event
    //  */
    // handleKeyDown(e) {
    // }
}


export class InfoUIDatail extends InfoUIComponent {
    /**
     * Eine Detail Komponente
     * @param {string} id - ID der Komponente
     * @param {string} title - Titel der angezeigt wird
     * @param {Object<string,any>} [dataObject] - Optional Datentabelle
     */
    constructor(id, title, dataObject) {
        super(id);
        this.title = title;
        this.dataObject = dataObject;

        this.activeRowIdx = 0;
    }

    /** @type {Array<InfoUIDetailField>} */
    fields = [];

    /** @type {Object<string,number>} */
    fieldIndex = {};

    sort() {
        this.fields = this.fields.sort((a, b) => a.position - b.position);
    }

    createIndex() {
        this.fieldIndex = {};
        for (let i = 0; i < this.fields.length; i++) {
            this.fieldIndex[this.fields[i].field_name] = this.fields[i].position;
        }
    }

    /**
     * Fügt eine neue Tabellenspalte hinzu
     * @param {string} field_name - name der Spalte
     * @param {string} label - Text der Angezeigt wird
     * @param {string} [format] - Formatierung der Spalte. Funktion ?????
     * @param {number} [position] - Optional Position der Spalte. Verschiebt alle folgenden Spalten. -1 Wenn hinten anfügen
     */
    add_field(field_name, label, format, position = -1) {
        // neues Object
        let obj = { field_name, label, format, position };

        // prüfen ob vorhanden
        let fieldIndex = this.fieldIndex[field_name] || -1;
        if (fieldIndex >= 0) {
            // Vorhandenes ersetzen unabhängig von position
            obj.position = fieldIndex;
            this.fields[fieldIndex] = obj;
        } else {
            // nicht vorhanden
            if (position == undefined || position < 0) {
                obj.position = this.fields.push(obj) - 1;
                this.fieldIndex[obj.field_name] = obj.position;
            } else {
                // an neuer Position einfügen
                this.fields.splice(position, 0, obj);

                // index neu aufbauen
                this.createIndex();
            }
        }
    }


    /**
     * Generiert ein HTML-Formular
     * @returns {string}
     */
    render() {
        if (!this.dataObject) { return "<p>No DataObject!</p>" }
        const fields = this.fields;

        let html = `<div class="ui-view-container" data-detail-id="${this.id}">`;

        // Tabelle
        html += `<table><tbody>`;

        //fields.forEach(field => {
        for (let i = 0; i < fields.length; i++) {
            // todo: formate Festlegen (fields[i].format)
            const val = this.dataObject[fields[i].field_name];

            // Input HTML zusammenbauen
            html += `<tr><th>${fields[i].label}</th><td>${val}</td></tr>`;
        };

        html += `</tbody></table></div>`;

        return html;
    }


    /**
     * DatenObjekt setzen
     * @param {Object<string,any>} newDataObject - neue Datentabelle setzen 
     */
    set_dataObject(newDataObject) {
        this.dataObject = newDataObject;
        if (this.domElement) {
            // HTML neu erzeugen
            this.domElement.innerHTML = this.render();

            // todo: Fokus-Index zurücksetzen ???
            //this.activeRowIdx = 0;
            //this.updateVisualFocus();
        }
    }


    /** 
     * Vom Controller delegiertes Event für die interne Tabellensteuerung 
     * @param {KeyboardEvent} e - Tastatur Event
     */
    handleKeyDown(e) {
        const container = this.domElement?.querySelector(".ui-view-container");
        if (!container) return;

        // Da es keine Inputs gibt, scrollen wir die Komponente sanft per Tastatur
        if (e.key === "ArrowDown") {
            container.scrollTop += 30;
            e.preventDefault();
        }
        if (e.key === "ArrowUp") {
            container.scrollTop -= 30;
            e.preventDefault();
        }
    }
}


// ==========================================
//   Spalten UI
// --------------


// infoui.js (Fortsetzung)
export class UiColumn {
    /**
     * UI Spalte in der Benutzeroberfläche
     * @param {string} title - Titel in der Zeile
     * @param {number} colIndex - Spalten Index
     */
    constructor(title, colIndex) {
        this.title = title;
        this.colIndex = colIndex;
        /** @type {Array<InfoUIComponent>} Vertical gestapelte Komponenten */
        this.components = [];
        this.activeComponentIdx = 0;
        this.domElement = null;
    }

    /**
     * Fügt eine Komponente zur Spalte hinzu
     * @param {InfoUIComponent} component - Tabelle,Form/Detail, .. Komponente
     */
    addComponent(component) {
        this.components.push(component);
    }

    /**
     * Gibt die aktive Komponente zurück
     * @returns {InfoUIComponent|null}
     */
    get activeComponent() {
        return this.components[this.activeComponentIdx] || null;
    }

    /** Baut das HTML für die gesamte Spalte inklusive aller Sub-Komponenten */
    render() {
        const colDiv = document.createElement("div");
        colDiv.className = "app-column";
        colDiv.setAttribute("data-col-index", this.colIndex.toString());
        colDiv.style.cssText = "display: flex; flex-direction: column; width: 350px; min-width: 350px; background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e1e4e8; height: 100%;";

        colDiv.innerHTML = `
            <div class="app-column-header" style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e1e4e8; background: #fafbfc; border-radius: 6px 6px 0 0;">
                ${this.title}
            </div>
            <div class="app-column-body" style="flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 15px;">
                <!-- Komponenten werden hier eingehängt -->
            </div>
        `;

        const body = colDiv.querySelector(".app-column-body");
        if (body) {
            this.components.forEach(comp => {
                const compWrapper = document.createElement("div");
                compWrapper.className = "ui-component-wrapper";
                compWrapper.innerHTML = comp.render();
                comp.domElement = compWrapper; // Verbindung zum DOM halten
                body.appendChild(compWrapper);
            });
        }
        this.domElement = colDiv;
        return colDiv;
    }
}

// ==========================================
//   UI Controller
// ----------------------


// infoui.js (Fortsetzung)
export class UiController {
    /**
     * 
     * @param {HTMLElement} appContainer 
     */
    constructor(appContainer) {
        this.appContainer = appContainer;
        /** @type {Array<UiColumn>} */
        this.columns = [];
        this.activeColIdx = 0;

        this.#initGlobalListeners();
    }

    /** Gibt die aktuell aktive Spalte zurück */
    get activeColumn() {
        return this.columns[this.activeColIdx] || null;
    }


    /**
     * Fügt eine fertig konfigurierte Spalte hinzu
     * @param {UiColumn} uiColumn - UI Spalte zur Anzeige
     */
    addColumn(uiColumn) {
        // Kaskadierendes Abschneiden rechts von der aktuellen Spalte
        if (this.activeColumn) {
            this.columns = this.columns.slice(0, this.activeColIdx + 1);
            const clearCols = this.appContainer.querySelectorAll(".app-column");
            clearCols.forEach(col => {
                if (parseInt(col.getAttribute("data-col-index") || "", 10) > this.activeColIdx) col.remove();
            });
        }

        uiColumn.colIndex = this.columns.length;
        this.columns.push(uiColumn);

        const colHtml = uiColumn.render();
        this.appContainer.appendChild(colHtml);
        this.appContainer.scrollTo({ left: this.appContainer.scrollWidth, behavior: "smooth" });

        // Fokus auf die neue Spalte legen
        this.switchFocus(this.columns.length - 1, 0);
    }

    /** 
     * Schaltet den Fokus sauber um (inkl. CSS-Visualisierung) 
     * @param {number} colIdx - SpaltenIndex
     * @param {number} compIdx - KomponentenIndex
     */
    switchFocus(colIdx, compIdx) {
        // Alten Fokus aufheben
        if (this.activeColumn?.activeComponent) {
            this.activeColumn.activeComponent.setFocused(false);
        }

        this.activeColIdx = colIdx;
        const col = this.activeColumn;
        if (col) {
            col.activeComponentIdx = compIdx;
            if (col.activeComponent) {
                col.activeComponent.setFocused(true);
                // Optional: Scrolle das Element in den sichtbaren Bereich der Spalte
                col.activeComponent.domElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
    }

    #initGlobalListeners() {
        // 1. GLOBALES KEYBOARD ROUTING (Zentraler Einstiegspunkt für Performance)
        window.addEventListener("keydown", (e) => {
            const col = this.activeColumn;
            if (!col) return;

            // --- A: STRUKTURELLE NAVIGATION ZWISCHEN SPALTEN (Alt + ArrowLeft/Right) ---
            if (e.altKey && e.key === "ArrowRight") {
                if (this.activeColIdx < this.columns.length - 1) {
                    this.switchFocus(this.activeColIdx + 1, this.columns[this.activeColIdx + 1].activeComponentIdx);
                    e.preventDefault();
                }
                return;
            }
            if (e.altKey && e.key === "ArrowLeft") {
                if (this.activeColIdx > 0) {
                    this.switchFocus(this.activeColIdx - 1, this.columns[this.activeColIdx - 1].activeComponentIdx);
                    e.preventDefault();
                }
                return;
            }

            // --- B: STRUKTURELLE NAVIGATION ZWISCHEN VERTIKALEN KOMPONENTEN (Alt + ArrowUp/Down) ---
            if (e.altKey && e.key === "ArrowDown") {
                if (col.activeComponentIdx < col.components.length - 1) {
                    this.switchFocus(this.activeColIdx, col.activeComponentIdx + 1);
                    e.preventDefault();
                }
                return;
            }
            if (e.altKey && e.key === "ArrowUp") {
                if (col.activeComponentIdx > 0) {
                    this.switchFocus(this.activeColIdx, col.activeComponentIdx - 1);
                    e.preventDefault();
                }
                return;
            }

            // --- C: DELEGATION AN DIE AKTIVE KOMPONENTE ---
            // Wenn es kein globaler Steuerungsbefehl war, reichen wir das Event an die Komponente weiter
            if (col.activeComponent) {
                col.activeComponent.handleKeyDown(e);
            }
        });


        // Innerhalb von #initGlobalListeners() im UiController:
        this.appContainer.addEventListener("click", (e) => {
            const target = e.target;
            if (!(target instanceof HTMLElement)) return;

            const clickedColDom = target.closest(".app-column");
            const clickedCompDom = target.closest(".ui-component-wrapper");

            if (clickedColDom && clickedCompDom) {
                const colIdx = parseInt(clickedColDom.getAttribute("data-col-index") || "", 10);
                const colInstance = this.columns[colIdx];

                if (colInstance) {
                    const compIdx = colInstance.components.findIndex(c => c.domElement === clickedCompDom);
                    if (compIdx !== -1) {
                        // 1. Fokus visuell umschalten (wie gehabt)
                        this.switchFocus(colIdx, compIdx);

                        // 2. MAGISCHE DELEGATION: Event an die Komponente weiterreichen
                        const comp = colInstance.components[compIdx];
                        if (comp) {
                            comp.handleMouseClick(e);
                        }
                    }
                }
            }
        });

        // Innerhalb von #initGlobalListeners() im UiController:
        this.appContainer.addEventListener("dblclick", (e) => {
            const target = e.target;
            if (!(target instanceof HTMLElement)) return;

            const clickedColDom = target.closest(".app-column");
            const clickedCompDom = target.closest(".ui-component-wrapper");

            if (clickedColDom && clickedCompDom) {
                const colIdx = parseInt(clickedColDom.getAttribute("data-col-index") || "", 10);
                const colInstance = this.columns[colIdx];

                if (colInstance) {
                    const compIdx = colInstance.components.findIndex(c => c.domElement === clickedCompDom);
                    if (compIdx !== -1) {
                        // 1. Fokus visuell umschalten (wie gehabt)
                        this.switchFocus(colIdx, compIdx);

                        // 2. MAGISCHE DELEGATION: Event an die Komponente weiterreichen
                        const comp = colInstance.components[compIdx];
                        if (comp) {
                            comp.handleMouseDblClick(e);
                        }
                    }
                }
            }
        });

    }
}



// HTML-Template: Ein einziger flexibler Container für unendlich anbaubare Spalten nach rechts
const base_html = `
<div id="app-container" style="display: flex; flex-direction: row; overflow-x: auto; width: 100vw; height: 100vh; gap: 10px; padding: 10px; box-sizing: border-box;">
  <!-- Spalten werden hier dynamisch per JS eingehängt -->
</div>
`;

const app_html = `
<f-row class="width: 100vw, height: 100vh">
  <f-item id="left_menu" class="width:280px;"></f-item>
  <f-item w-fit style="overflow-x: auto;">
    <f-row gap-s class="app-container">
      <!-- Dynamische Spalten(Views) -->
    </f-row>
  </f-item>
</f-row>
`;

//   <f-item data-col-index="0" class="app-column">
//     <div class="app-column-header" style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e1e4e8; background: #fafbfc; border-radius: 6px 6px 0 0;">
//       ${title}
//     </div>
//     <div class="app-column-body" style="flex: 1; overflow-y: auto; padding: 10px;">
//       <!-- Tabelle -->
//       <div class="ui-view-container" data-target-type="LIST" data-table-id="${tableId}" tabindex="0">
//         <table class="pure-table">
//           <thead><tr></tr></thead>
//           <tbody><tr></tr></tbody>
//         </table>
//       </div>

//       <!-- Formular -->
//       <div class="ui-view-container" data-target-type="FORM" data-form-id="${formId}" tabindex="0">
//         <!-- Input -->
//         <div class="form-group" data-focusable="true">
//           <label>${field.label}</label>
//           <input type="text" data-field="${field.field_name}" value="${value}">
//         </div>
//         <!-- Button -->
//         <button class="ui-btn" data-focusable="true" data-module="${field.action_module || ''}" data-function="${field.action_function || ''}">
//           ${field.label}
//         </button>
//       </div>
//     </div>        
//   </f-item>




// RealtimeSync.js - Wiederverwendbares Client-Modul
export class RealtimeSync {
    /**
     * @param {string} serverUrl - ServerPfad 
     * @param {UiController} uiController - Kontroller für die Grafische UI
     */
    constructor(serverUrl, uiController) {
        this.serverUrl = serverUrl;
        this.uiController = uiController;
        this.ws = null;

        /** @type {DataTable<any>|null} - Layout Definitionen vom Server */
        this.uiLayoutTable = null;
    }

    /** Gesperrte Datensätze */
    lockedData = new Map();


    /**
     * Stellt eine Verbindung mit dem Server her
     */
    connect() {
        //this.currentUserId = currentUserId;
        this.ws = new WebSocket(`${this.serverUrl}`);

        this.ws.onmessage = (event) => {
            /** @type {ClientServerMessage} */
            const data = JSON.parse(event.data);
            console.log("vom Server: ", data);

            switch (data.type) {
                case "ERROR":
                    // TODO: Fehler anzeigen
                    console.error(data.payload);
                    break;

                case "INITIAL_STATE":
                    if (data.payload) {
                        // this.uiController.infoTableUI = new DataTable("TableUI", data.payload.infoTables, InfoTableUI_unique);
                        // this.uiController.infoFormUI = new DataTable("FormUI", data.payload.infoForms, InfoFormUI_unique);
                    }

                    // Melde der App, dass der Initialzustand (z.B. Hauptmenü-Daten) da ist
                    window.dispatchEvent(new CustomEvent("sync-initial-state", {
                        detail: { rows: data.rows, idColName: data.idColName }
                    }));

                    // if (data.rows) {
                    //     // Das Hauptmenü kommt vom Server. Da es im DataTable-Format vorliegt,
                    //     // behandeln wir es wie eine Tabelle, die gerendert wird.
                    //     const menuTable = new DataTable("System_Menu", data.rows, data.idColName);

                    //     // Wir nutzen den Generator (für Menüs oder Listen)
                    //     // HINWEIS: Hier greifen wir auf das global geladene UI-Schema zu
                    //     const html = UiGenerator.generateMenu("System_Menue", this.uiController.infoTableUI, menuTable);
                    //     this.uiController.renderOrUpdateColumn("System_Menue", "MENU", menuTable, html);

                    //     // // Spalte im UI anhängen (Hier nutzen wir Ihr AppCore-Prinzip)
                    //     // const targetElement = AppCore.appendColumnHTML("Hauptmenü", html);

                    //     // // Controller scannt das Menü für Pfeiltasten & Buttons
                    //     // if (this.uiController) {
                    //     //     this.uiController.parseContainer(targetElement);
                    //     //     this.uiController.focusContainer(targetElement);
                    //     // }
                    // }
                    break;

                case "LOCK_UPDATED":
                    // Optional: Sperr-Status im UI visualisieren (z.B. Zeile rot färben)
                    break;

                case "DATA":
                    if (!data.rows) return;

                    // Verwandle die Array-of-Arrays Zeilen in ein echtes DataTable-Objekt
                    const incomingTable = new DataTable(data.tableName || "", data.rows, data.idColName);

                    // CUSTOM EVENT
                    window.dispatchEvent(new CustomEvent("sync-data-received", {
                        detail: {
                            tableName: data.tableName,
                            targetType: data.targetType, // "LIST", "FORM", "DETAIL"
                            recordId: data.recordId,
                            dataTable: incomingTable
                        }
                    }));


                    // // Je nach data.targetType die Antwort-Daten verarbeiten
                    // switch (data.targetType) {
                    //     case "LIST":
                    //         // Generiert die HTML-Tabelle anhand der UI-Konfigurations-Tabelle
                    //         generatedHtml = UiGenerator.generateTable(data.tableName || "", this.uiLayoutTable, incomingTable) || "";
                    //         break;

                    //     case "FORM":
                    //         // Konvertiert die erste Zeile der Daten in ein flaches Objekt für das Formular
                    //         const currentRecordObj = incomingTable.getObject(1); // Holt die Zeile 1 als Key-Value-Paar
                    //         generatedHtml = UiGenerator.generateForm(data.tableName || "", this.uiLayoutTable, currentRecordObj);
                    //         break;

                    //     case "DETAIL":
                    //         // Analog für Detailansichten
                    //         generatedHtml = UiGenerator.generateDetail(data.tableName || "", this.uiLayoutTable, incomingTable);
                    //         break;
                    // }

                    // // Das generierte HTML in eine neue Spalte rendern und dem Controller übergeben
                    // if (generatedHtml && this.uiController) {
                    //     // Delegiert an den Controller
                    //     this.uiController.renderOrUpdateColumn(data.tableName, data.targetType, incomingTable, generatedHtml);                        
                    //     // const targetElement = AppCore.appendColumnHTML(data.tableName, generatedHtml);
                    //     // AppCore.renderOrUpdateColumn(data.tableName, data.targetType, incomingTable, generatedHtml);

                    //     // // Der magische Schritt: Der Controller übernimmt Tastatur & Button-Module
                    //     // this.uiController.parseContainer(targetElement);
                    //     // this.uiController.focusContainer(targetElement);
                    // }
                    break;

                case "LOCK_DENIED":
                    alert("Datensatz wird gerade von einem anderen Benutzer bearbeitet!");
                    break;

                case "LOCK_RELEASED_CONFIRMED":
                    break;

                case "SAVE_SUCCESS":
                    console.log("Erfolgreich gespeichert!");
                    // Optional: Dem Controller sagen, er soll den Fokus zurück auf die Tabelle legen
                    break;

                case "DATA_MUTATED":
                    // Ein anderer Nutzer hat Daten geändert. 
                    // Hier können Sie prüfen, ob die geänderte Tabelle gerade offen ist, 
                    // und sie im Hintergrund neu anfordern oder updaten.
                    break;

                case "DELETE_SUCCESS":
                    break;

                default:
                    break;
            }
        };

        // =================================================================
        // HIER REAGIEREN WIR AUF DEN LOGOUT / VERBINDUNGSABBRUCH
        // =================================================================
        this.ws.onclose = (event) => {
            console.log(`Verbindung geschlossen. Code: ${event.code}, Grund: ${event.reason}`);

            // Code 4001 = Gezielter Kick durch den Server wegen Session-Timeout
            if (event.code === 4001) {
                console.warn("Session abgelaufen! Zeige Login-Maske.");

                // Wenn ein Hash existiert (z.B. "#api.schema=xxx"), sichern wir ihn im Speicher
                // todo: Aktuelles merken
                if (window.location.hash) {
                    // für Redirekt nach dem Login (dort weitermachen bevor die Session abgelaufen ist)
                    sessionStorage.setItem("spa_redirect_hash", window.location.hash);
                }

                // Seite neu laden. Da das Cookie ein Session-Cookie ist 
                // und der Server das Token gelöscht hat, landet der User automatisch auf der Login-Seite.
                window.location.reload();
                return;
            }

            // Code 1000 = Normales geordnetes Schließen (z. B. User klickt auf "Ausloggen")
            if (event.code === 1000) {
                console.log("Erfolgreich abgemeldet.");
                window.location.reload();
                return;
            }

            // Ungeplanter Verbindungsabbruch (z.B. Server-Neustart oder WLAN weg)
            // Hier versuchen wir nach 5 Sekunden automatisch einen Wiederverbindungsaufbau (Reconnection)
            console.log("Verbindung verloren. Versuche Wiederaufbau in 5 Sekunden...");
            setTimeout(() => {
                this.connect();
            }, 5000);
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket-Fehler aufgetreten:", error);
        };
    }

    /**
     * Vereinfacht das Senden von strukturierten Nachrichten an den Bun-Server
     * @param {Partial<ClientServerMessage>} data - Daten zum Senden
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.error("WebSocket ist nicht offen. Nachricht verworfen:", data.type);
        }
    }
}



// ===================================================

export class InfoRouter {
    /**
     * Erzeugt aus einem String ein Objekt  
     * Wandelt "id:456,name:hallo" in ein Objekt {id: "456", name: "hallo"} um.
     * @param {string} valueString - Wert der geparst wird
     * @returns {Object<string,any>}
     */
    get_obj_from_string(valueString) {
        /** @type {Object<string,any>} */
        const obj = {};

        // Aufteilen am Komma
        const pairs = valueString.split(",");

        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i].split(":");
            if (pair[0] && pair[1]) {
                const key = pair[0].trim();
                let value = pair[1].trim();

                // Optional: Automatisch Zahlen konvertieren
                //if (!isNaN(value)) {
                //    value = Number(value);
                //}

                obj[key] = value;
            }
        }
        return obj;
    }


    /**
     * Prüft den Hash in der URL
     * @returns {Object<string,Array<any>>|undefined}
     */
    get_hashData() {
        // darf nicht in den Daten stehen "#","/","&", "=", "," -> sind Trennzeichen
        // key beginnt mit: "api." = Fetch API, "ws." = Websocket typ "GET_DATA", "LOCK_DATA", "SAVE_DATA", "DEL_DATA"  ("ws.get.adresse","ws.lock.adresse", "ws.save.adresse", "ws.del.adresse")
        // domain.de/#?api.menu=/menu/menu1&api.content=/forms/form1&ws.addresse=id:456,name:hallo&ws.bestellungen=gsid:25
        const hash = window.location.hash;
        const hashString = hash.includes("?") ? hash.split("?")[1] : "";
        if (!hashString) { return; }

        // In parts "key=value" aufsplitten
        const parts = hashString.split("&");
        const api_list = []; // [["menu", "/menu/menu1"], ["content","/forms/form1"]]
        const ws_list = []; // [ ["addresse", {id: "456", name: "hallo"}], ["bestellungen": {gsid: "25"}] ]

        // alle Parts durchgehen
        for (let i = 0; i < parts.length; i++) {
            const key_value = parts[i].split("=");

            // wenn UI - startet mit "api."
            if (key_value[0].startsWith("api.")) {
                api_list.push([key_value[0].substring(4), key_value[1]]);
            }

            // wenn Websocket-Daten - startet mit "ws."
            if (key_value[0].startsWith("ws.")) {
                ws_list.push([key_value[0].substring(3), this.get_obj_from_string(key_value[1])]);
            }
        }

        // Zurückgeben
        return { api: api_list, ws: ws_list };
    }


}

// ==========================================
//   UI Schema
// -------------

export const infoUISchema = new Schema("infoUISchema");

// Enums
infoUISchema.setEnum({ name: "InfoUIInputType", values: InfoUIInputType_values });

// InfoUITableCol
infoUISchema.setDataType({ name: "InfoUITableCol", art: "object", id: "column_name" });
infoUISchema.addProperty("InfoUITableCol", "column_name");
infoUISchema.addProperty("InfoUITableCol", "display_name");
infoUISchema.addProperty("InfoUITableCol", "position", { prop_type: "int" });
infoUISchema.addProperty("InfoUITableCol", "format", { min: 0 });

// InfoUIFormField
infoUISchema.setDataType({ name: "InfoUIFormField", art: "object", id: "field_name" });
infoUISchema.addProperty("InfoUIFormField", "field_name");
infoUISchema.addProperty("InfoUIFormField", "label");
infoUISchema.addProperty("InfoUIFormField", "position", { prop_type: "int" });
infoUISchema.addProperty("InfoUIFormField", "ui_element", { prop_type: "InfoUIInputType", min: 0 });
infoUISchema.addProperty("InfoUIFormField", "action_module", { min: 0 });
infoUISchema.addProperty("InfoUIFormField", "action_function", { min: 0 });

// InfoUIFormField
infoUISchema.setDataType({ name: "InfoUIDetailField", art: "object", id: "field_name" });
infoUISchema.addProperty("InfoUIDetailField", "field_name");
infoUISchema.addProperty("InfoUIDetailField", "label");
infoUISchema.addProperty("InfoUIDetailField", "position", { prop_type: "int" });
infoUISchema.addProperty("InfoUIDetailField", "format", { min: 0 });


// ==========================================
//   UI- Komponenten
// ------------------

// Tabellen ansicht
export const infoUITable_list = new InfoUITable("table_cols", "Table Columns");
infoUITable_list.add_col("column_name");
infoUITable_list.add_col("display_name");
infoUITable_list.add_col("position");
infoUITable_list.add_col("format");

export const infoUITable_form = new InfoUIForm("table_form", "Table Formular");
infoUITable_form.add_field("column_name");
infoUITable_form.add_field("display_name");
infoUITable_form.add_field("position", "position", "input_number");
infoUITable_form.add_field("format");

// Formular Ansicht
export const infoUIForm_list = new InfoUITable("form_fields", "Formular Fields");
infoUIForm_list.add_col("field_name");
infoUIForm_list.add_col("label");
infoUIForm_list.add_col("position");
infoUIForm_list.add_col("ui_element");
infoUIForm_list.add_col("action_module");
infoUIForm_list.add_col("action_function");

export const infoUIForm_form = new InfoUIForm("form_form", "Form Formular");
infoUIForm_form.add_field("field_name");
infoUIForm_form.add_field("label");
infoUIForm_form.add_field("position");
infoUIForm_form.add_field("ui_element", "ui_element", "select");
infoUIForm_form.add_field("action_module");
infoUIForm_form.add_field("action_function");
infoUIForm_form.setSelectOptions("ui_element", InfoUIInputType_values);


//-------  Schema Komponenten ---------

// ObjektTypen
export const infoUISchema_typelist = new InfoUITable("schema_typelist", "Schema Type List");
infoUISchema_typelist.add_col("name");
infoUISchema_typelist.add_col("art");
infoUISchema_typelist.add_col("base_name");
infoUISchema_typelist.add_col("simple_types");


// Propertys von Objekt Typen
export const infoUISchema_proplist = new InfoUITable("schema_proplist", "Schema Property List");
infoUISchema_proplist.add_col("name");
infoUISchema_proplist.add_col("pos");
infoUISchema_proplist.add_col("prop_type");
infoUISchema_proplist.add_col("min");
infoUISchema_proplist.add_col("max");
infoUISchema_proplist.add_col("default");
infoUISchema_proplist.add_col("fix");


// Simple Typen
export const infoUISchema_simpletypelist = new InfoUITable("schema_simpletypelist", "Schema SimpleType List");
infoUISchema_simpletypelist.add_col("name");
infoUISchema_simpletypelist.add_col("art");
infoUISchema_simpletypelist.add_col("length");
infoUISchema_simpletypelist.add_col("min_length");
infoUISchema_simpletypelist.add_col("max_length");
infoUISchema_simpletypelist.add_col("pattern");
infoUISchema_simpletypelist.add_col("whitespace");
infoUISchema_simpletypelist.add_col("casing");
infoUISchema_simpletypelist.add_col("decimals");
infoUISchema_simpletypelist.add_col("min_inclusive");
infoUISchema_simpletypelist.add_col("min_exclusive");
infoUISchema_simpletypelist.add_col("max_exclusive");
infoUISchema_simpletypelist.add_col("max_inclusive");



// ==========================================
//   Beispiel APP
// ---------------

// // app.js (Spezifischer Business-Anwendungsfall)
// import { UiController, UiColumn, InfoUITable } from "./infoui.js";
// import { DataTable } from "./infotable.js";

// const container = document.getElementById("app-container");
// const controller = new UiController(container);

// // Beispiel-Daten
// const kundenDaten = new DataTable("kunden", [
//     ["gsid", "name", "ort"],
//     ["1", "Müller GmbH", "Wien"],
//     ["2", "Gruber AG", "Salzburg"]
// ]);

// const ansprechpartnerDaten = new DataTable("partner", [
//     ["gsid", "name", "funktion"],
//     ["p1", "Max Mustermann", "Einkauf"],
//     ["p2", "Anna Rossi", "Geschäftsführung"]
// ]);

// // SPALTE 1 bauen (Mit ZWEI vertikalen Tabellen untereinander)
// const col1 = new UiColumn("Kundenstamm", 0);

// const t1 = new InfoUITable("kunden_master", "Firmen", kundenDaten);
// t1.add_col("gsid", "ID");
// t1.add_col("name", "Name");
// col1.addComponent(t1);

// const t2 = new InfoUITable("kunden_kontakte", "Ansprechpartner", ansprechpartnerDaten);
// t2.add_col("name", "Name");
// t2.add_col("funktion", "Rolle");
// col1.addComponent(t2);

// // Spalte an den Controller übergeben -> Rendert automatisch alles inklusive globaler Event-Links
// controller.addColumn(col1);

// // Logische Custom Events abfangen
// container.addEventListener("row-select", (e) => {
//     const { tableId, recordId } = e.detail;
//     console.log(`app.js hat die Auswahl mitbekommen: ${tableId} -> ${recordId}`);
//     // Hier folgt dein sync.send(...) für den WebSocket
// });

// -------  2. Beispiel --------------------

// // kunden_app.js (Beispiel für einen konkreten Anwendungsfall)
// import { UiController, UiColumn, InfoUITable, InfoUIForm, RealtimeSync } from "./infoui.js";

// const container = document.getElementById("app-container");
// const controller = new UiController(container);
// const sync = new RealtimeSync("ws://localhost:3000/socket", controller);
// sync.connect();

// // 1. Definition der UI-Komponenten für diese App
// const kundenTabelle = new InfoUITable("kunden_master", "Kundenliste");
// kundenTabelle.add_col("gsid", "ID", 0);
// kundenTabelle.add_col("name", "Firmenname", 1);
// kundenTabelle.add_col("ort", "Stadt", 2);

// const kundenForm = new InfoUIForm("kunden_form", "Kundendetails");
// kundenForm.add_field("name", "Firmenname", "input_text", 0);
// kundenForm.add_field("ort", "Stadt", "input_text", 1);

// // Spalten definieren
// const spalte1 = new UiColumn("Stammdaten", 0);
// spalte1.addComponent(kundenTabelle);
// controller.addColumn(spalte1); // Zeigt die erste leere/wartende Spalte an

// // 2. REAKTION AUF DATEN VOM SERVER (Über RealtimeSync geleitet)
// window.addEventListener("sync-data-received", (e) => {
//     const { tableName, targetType, dataTable } = e.detail;

//     // Wenn es die Kundenliste ist -> Tabelle befüllen und rendern
//     if (tableName === "kunden" && targetType === "LIST") {
//         kundenTabelle.updateData(dataTable);
//     }

//     // Wenn ein einzelner Kunde geladen wurde -> Formular dynamisch in Spalte 2 öffnen
//     if (tableName === "kunden" && targetType === "FORM") {
//         const clientObj = dataTable.getObject(1); // Hole Zeile 1 als Objekt
//         kundenForm.dataObject = clientObj; // Dem Formular die Daten geben

//         // Prüfen, ob Spalte 2 schon offen ist, ansonsten neu hinzufügen
//         let spalte2 = controller.columns[1];
//         if (!spalte2) {
//             spalte2 = new UiColumn("Bearbeiten", 1);
//             spalte2.addComponent(kundenForm);
//             controller.addColumn(spalte2);
//         } else {
//             // Wenn Spalte schon offen, nur Inhalt aktualisieren
//             kundenForm.domElement.innerHTML = kundenForm.render();
//         }
//     }
// });

// // 3. REAKTION AUF AKTIONEN AUS DER UI (Tastatur / Maus)
// container.addEventListener("row-edit", (e) => {
//     const { tableId, recordId } = e.detail;

//     if (tableId === "kunden_master") {
//         // Sende Datenanforderung für das Formular an den Server
//         sync.send({
//             type: "GET_DATA",
//             tableName: "kunden",
//             recordId: recordId,
//             targetType: "FORM"
//         });
//     }
// });


// ==========================================
