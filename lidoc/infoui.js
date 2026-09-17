// =========================================================================
//   DYNAMISCHES SPALTEN-UI & KEYBOARD ROUTER (infoui.js)
// =========================================================================
// @ts-check

import { DataTable } from "./infotable.js";
import { Schema, infoSchema, InfoTableUI_fields, InfoTableUI_unique, InfoFormUI_fields, InfoFormUI_unique } from "./infoschema.js";

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
 * DatenTypen vom Server, damit diese gleich sind am Client
 * @import {MessageType, ClientServerMessage, InfoTableUI, InfoFormUI, ApplicationConfig} from "./infoschema.js"
 */

// /**
//  * Knoten für jedes Element im System
//  * @typedef {object} InfoNode
//  * @property {string} id - UUID oder eindeutiger String (z.B. "jira-PROJ-123", "md-uuid")
//  * @property {string} type - 'markdown', 'task', 'jira', 'xwiki', 'pdf', 'schema'
//  * @property {string} title - Anzeige Text
//  * @property {string} source_path - Pfad / Url zu Markdown,HTML, DB-Tabelle, Jira, XWiki, usw..
//  * @property {string} created_at - (datetime) Zeitstempel wann die Node angelegt worden ist
//  */
// const InfoNode_fields = ["id", "type", "title", "source_path", "created_at"];

// /**
//  * Knoten/Veknüpfung verknüpft alles mit allem (Richtung unabhängig)
//  * @typedef {object} InfoEdge
//  * @property {string} source_id - InfoNode.id Quelle
//  * @property {string} target_id - InfoNode.id Ziel
//  * @property {string} relation_type - 'blocks', 'documents', 'required_for', 'tagged_with'
//  */
// const InfoEdge_fields = ["source_id", "target_id", "relation_type"];

// /**
//  * Tags für die schnelle Suche
//  * @typedef {object} InfoTag
//  * @property {string} node_id - ID der InfoNode zu der dieser Tag gehört
//  * @property {string} tag - Name/Bezeichnung des Tags
//  */
// const InfoTag_fields = ["node_id", "tag"];



// // ----------  neue Typen ------------------
// /**
//  * Tabellen einstellungen
//  * @typedef {object} InfoTableUI
//  * @property {string} gsid - ID des Datensatzes
//  * @property {string} table_id - Name der Tabelle
//  * @property {string} column_name - Name der Spalte
//  * @property {string} display_name - Anzeige Text
//  * @property {number} position - Spalten Position
//  * @property {string} format - Darstellungs-Format
// */
// const InfoTableUI_fields = ["gsid", "table_id", "column_name", "display_name", "position", "format"];
// const InfoTableUI_unique = "gsid";

// // Beispiel:
// // ```json
// // [
// //   ["table_id", "column_name", "display_name", "position", "format"],
// //   ["kundenTabelle", "gsid", "Kundennummer", 1, "text"],
// //   ["kundenTabelle", "nachname", "Nachname", 2, "text"],
// //   ["kundenTabelle", "vorname", "Vorname", 3, "text"]
// // ]
// // ```

// /**
//  * Formular einstellungen
//  * @typedef {object} InfoFormUI
//  * @property {string} gsid - ID des Datensatzes
//  * @property {string} form_id - Name des Formulares
//  * @property {string} field_name - Name des Datenfeldes
//  * @property {string} label - Anzeige/Überschrift/Text(bei Buttons)
//  * @property {number} position - Position des Feldes
//  * @property {string} ui_element - Typ des Input elementes oder "button"
//  * @property {string} action_module - Modul Name welches die Funktionalität bereit stellt
//  * @property {string} action_function - Name der Funktion im Modul
//  */
// const InfoFormUI_fields = ["gsid", "form_id", "field_name", "label", "position", "ui_element", "action_module", "action_function"];
// const InfoFormUI_unique = "gsid";

// Beispiel
// ```json
// [
//   ["form_id", "field_name", "label", "position", "ui_element", "action_module", "action_function"],
//   ["kundenForm", "vorname", "Vorname des Kunden", 1, "input_text", null, null],
//   ["kundenForm", "nachname", "Nachname des Kunden", 2, "input_text", null, null],
//   ["kundenForm", "save_btn", "Speichern", 3, "button", "./modules/kunden_actions.js", "speichern"],
//   ["kundenForm", "delete_btn", "Löschen", 4, "button", "./modules/kunden_actions.js", "loeschen"]
// ]
// ```

// ==========================================
//   Schema
// ------------

const infoUISchema = new Schema("infoUISchema");

infoUISchema.setDataType({ name: "InfoTable", art: "object", id: "gsid" });
infoUISchema.addProperty("InfoTable", "gsid");
infoUISchema.addProperty("InfoTable", "table_id");
infoUISchema.addProperty("InfoTable", "column_name");
infoUISchema.addProperty("InfoTable", "position", {prop_type: "int"});
infoUISchema.addProperty("InfoTable", "format");

infoUISchema.setDataType({ name: "InfoForm", art: "object", id: "gsid" });
infoUISchema.addProperty("InfoForm", "gsid");
infoUISchema.addProperty("InfoForm", "form_id");
infoUISchema.addProperty("InfoForm", "field_name");
infoUISchema.addProperty("InfoForm", "label");
infoUISchema.addProperty("InfoForm", "position", {prop_type: "int"});
infoUISchema.addProperty("InfoForm", "ui_element");
infoUISchema.addProperty("InfoForm", "action_module");
infoUISchema.addProperty("InfoForm", "action_function");

// ============================================
//   Komponente
// --------------


// infoui.js
export class InfoUIComponent {
    /**
     * 
     * @param {string} id - ID der Komponente
     */
    constructor(id) {
        this.id = id;
        /** @type {HTMLElement|null} */
        this.domElement = null; // Wird beim Rendern besetzt
    }

    /** Wird von Komponenten überschrieben */
    render() { return ""; }
    
    /**
     * Wird vom Controller aufgerufen, wenn die Komponente den Fokus hat
     * @param {KeyboardEvent} e 
     */
    handleKeyDown(e) { }
    
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


/**
 * Tabellen einstellungen
 * @typedef {object} InfoUITableCol
 * @property {string} column_name - Name der Spalte
 * @property {string} display_name - Anzeige Text
 * @property {number} position - Spalten Position
 * @property {string} [format] - Name der Value Formatierungs-Funktion
*/

export class InfoUITable extends InfoUIComponent{
    /**
     * Eine Tabellen-Liste Komponente
     * @param {string} id - ID der Komponente
     * @param {string} title - Titel der angezeigt wird
     * @param {DataTable<any>} [dataTable] - Optional Datentabelle
     */
    constructor(id, title, dataTable) {
        super(id);
        this.title = title;
        this.dataTable = dataTable;

        /** @type {string|undefined} */
        this.dataIndex = undefined;
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
     * @param {string} display_name - Text der Angezeigt wird
     * @param {number} [position] - Optional Position der Spalte. Verschiebt alle folgenden Spalten. -1 Wenn hinten anfügen
     * @param {string} [format] - Formatierung der Spalte. Funktion ?????
     */
    add_col(column_name, display_name, position = -1, format) {
        // neues Object
        let obj = {column_name, display_name, position, format};
        
        // prüfen ob vorhanden
        let colIndex = this.colIndex[column_name] || -1;
        if (colIndex >= 0) {
            // Vorhandenes ersetzen unabhängig von position
            obj.position = colIndex;
            this.cols[colIndex] = obj;
        } else {
            // nicht vorhanden
            if (position == undefined || position < 0) {
                obj.position = this.cols.push(obj) -1;
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
            if (!row) {continue;}

            // Datensatz ID todo: Optimieren: eventuell SpaltenIndex ?????
            const recordId = this.dataTable.getID(row);

            html += `<tr data-record-id="${recordId}">`;
            for (let j = 0; j < columns.length; j++) {
                const value = row[colIndexes[j]];

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
     */
    updateData(newDataTable) {
        this.dataTable = newDataTable;
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
}


/**
 * Formular einstellungen
 * @typedef {object} InfoUIFormField
 * @property {string} field_name - Name des Datenfeldes
 * @property {string} label - Anzeige/Überschrift/Text(bei Buttons)
 * @property {number} position - Position des Feldes
 * @property {string|undefined} ui_element - Typ des Input elementes oder "button"
 * @property {string|undefined} action_module - Modul Name welches die Funktionalität bereit stellt
 * @property {string|undefined} action_function - Name der Funktion im Modul
 */

export class InfoUIForm extends InfoUIComponent{
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
    }


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
     * @param {string} label - Text der Angezeigt wird
     * @param {string} [ui_element] - Formatierung der Spalte. Funktion ?????
     * @param {number} [position] - Optional Position der Spalte. Verschiebt alle folgenden Spalten. -1 Wenn hinten anfügen
     * @param {string} [action_module] - Formatierung der Spalte. Funktion ?????
     * @param {string} [action_function] - Formatierung der Spalte. Funktion ?????
     */
    add_field(field_name, label, ui_element, position = -1, action_module, action_function) {
        // neues Object
        let obj = {field_name, label, ui_element, position, action_module, action_function};
        
        // prüfen ob vorhanden
        let fieldIndex = this.fieldIndex[field_name] || -1;
        if (fieldIndex >= 0) {
            // Vorhandenes ersetzen unabhängig von position
            obj.position = fieldIndex;
            this.fields[fieldIndex] = obj;
        } else {
            // nicht vorhanden
            if (position == undefined || position < 0) {
                obj.position = this.fields.push(obj) -1;
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

        switch (uiType) {
            case "input_text":
                return `
                <div class="form-group" data-focusable="true">
                    <label>${field.label}</label>
                    <input type="text" data-field="${field.field_name}" value="${value ?? ''}">
                </div>`;

            case "input_number":
                return `
                <div class="form-group" data-focusable="true">
                    <label>${field.label}</label>
                    <input type="number" data-field="${field.field_name}" value="${value ?? ''}">
                </div>`;

            case "input_range": // Numerische Range (Von - Bis)
                return `
                <div class="form-group range-group" data-focusable="true">
                    <label>${field.label}</label>
                    <div style="display:flex; gap:5px;">
                        <input type="number" data-field="${field.field_name}_min" value="${rangeValues[0] ?? ''}" placeholder="Min">
                        <input type="number" data-field="${field.field_name}_max" value="${rangeValues[1] ?? ''}" placeholder="Max">
                    </div>
                </div>`;

            case "input_date":
                return `
                <div class="form-group" data-focusable="true">
                    <label>${field.label}</label>
                    <input type="date" data-field="${field.field_name}" value="${value ?? ''}">
                </div>`;

            case "input_date_range": // Datums-Range (Von - Bis)
                return `
                <div class="form-group range-group" data-focusable="true">
                    <label>${field.label}</label>
                    <div style="display:flex; gap:5px;">
                        <input type="date" data-field="${field.field_name}_start" value="${rangeValues[0] ?? ''}">
                        <input type="date" data-field="${field.field_name}_end" value="${rangeValues[1] ?? ''}">
                    </div>
                </div>`;

            case "checkbox":
                const isChecked = value === true || value === "true" || value === 1 || value === "1";
                return `
                <div class="form-group checkbox-group" data-focusable="true">
                    <label style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" data-field="${field.field_name}" ${isChecked ? 'checked' : ''}>
                        ${field.label}
                    </label>
                </div>`;

            case "select": // Dropdown-Auswahl
                // Optionen können aus der Action-Funktion oder einem Enum des Typs geladen werden
                let optionsHtml = "<option value=''>-- Bitte wählen --</option>";
                if (schema && field.field_name) {
                    // Versuche ein eingetragenes Enum zu finden
                    const enumObj = schema.getEnum(field.field_name) || schema.getEnum("enu_" + field.field_name);
                    if (enumObj && enumObj.values) {
                        Array.from(enumObj.values).forEach(val => {
                            optionsHtml += `<option value="${val}" ${value == val ? 'selected' : ''}>${val}</option>`;
                        });
                    }
                }
                return `
                <div class="form-group" data-focusable="true">
                    <label>${field.label}</label>
                    <select data-field="${field.field_name}">${optionsHtml}</select>
                </div>`;

            case "button":
                return `
                <div class="form-group button-group">
                    <button class="ui-btn" data-focusable="true" data-action="true"
                            data-module="${field.action_module || ''}" 
                            data-function="${field.action_function || ''}">
                        ${field.label}
                    </button>
                </div>`;

            default:
                return `
                <div class="form-group" data-focusable="true">
                    <label>${field.label}</label>
                    <input type="text" data-field="${field.field_name}" value="${value ?? ''}">
                </div>`;
        }
    }

    /**
     * Generiert ein HTML-Formular
     * @returns {string}
     */
    render() {
        const fields = this.fields;

        let html = `<div class="ui-view-container" data-form-id="${this.id}">`;

        //fields.forEach(field => {
        for (let i = 0; i < fields.length; i++) {
            // todo: input Formate Festlegen
            // todo: eingabe Schema prüfen ????
            const val = this.dataObject ? this.dataObject[fields[i].field_name] : "";
            
            // Input HTML zusammenbauen
            html += this.get_input_html(fields[i], val);
        };

        html += `</div>`;

        // Nach dem Einfügen ins DOM müssen wir Event-Listener für Live-Validierung binden
        //setTimeout(() => this.#bindLiveValidation(schemaInstance), 0);

        return html;
    }


    /**
     * Validiert die Input-Änderungen
     * @param {Schema} [schema] 
     */
    validate(schema) {
        if (!schema || !this.domElement) return;

        const formContainer = this.domElement.querySelector(".ui-view-container");
        if (!formContainer) return;

        // Suche alle interaktiven Eingabefelder
        const inputs = [...formContainer.querySelectorAll("input[data-field], select[data-field]")];

        for (let i = 0; i < inputs.length; i++) {
            //input.addEventListener("input", (e) => {
            const input = inputs[i];
            const fieldName = input.getAttribute("data-field");
            let value = undefined;
            if (input instanceof HTMLInputElement) {
                value = input.getAttribute("type") === "checkbox" ? input.checked : input.value;
            } else if (input instanceof HTMLElement && input.hasAttribute("value")) {
                value = input.value;
            }
                
                // Konvertiere Zahlentypen automatisch für den Validator
                if (inputs[i].type === "number" && value !== "") value = Number(value);

                // Nutze dein hochgeladenes Schema-Prüfungs-Objekt!
                // Angenommen, der Objekt-Typ im Schema heißt wie die Form-ID oder wir nutzen eine generische Zuordnung
                const validationResult = schema.validateSimple(fieldName, value);

                // Visualisierung aufräumen
                inputs[i].classList.remove("input-error");
                const existingMsg = input.parentNode.querySelector(".error-message");
                if (existingMsg) existingMsg.remove();

                if (!validationResult.valid) {
                    inputs[i].classList.add("input-error");
                    const errorSpan = document.createElement("span");
                    errorSpan.className = "error-message";
                    errorSpan.style.cssText = "color: #d0021b; font-size: 11px; display: block; margin-top: 2px;";
                    errorSpan.textContent = validationResult.error || "Ungültiger Wert";
                    inputs[i].parentNode.appendChild(errorSpan);
                }
            }
            //});
        };
    }


    /** 
     * Vom Controller delegiertes Event für die interne Tabellensteuerung 
     * @param {KeyboardEvent} e - Tastatur Event
     */
    handleKeyDown(e) {
        if (!this.domElement) return;
        
        // Finde alle fokussierbaren Elemente innerhalb dieser spezifischen Komponente
        const focusables = Array.from(this.domElement.querySelectorAll("input, select, button"));
        if (focusables.length === 0) return;

        let currentIdx = focusables.indexOf(document.activeElement);

        if (e.key === "ArrowDown") {
            e.preventDefault();
            currentIdx = (currentIdx + 1) % focusables.length;
            focusables[currentIdx].focus();
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            currentIdx = (currentIdx - 1 + focusables.length) % focusables.length;
            focusables[currentIdx].focus();
        }
        
        // Wenn Enter auf einem Button gedrückt wird -> Klick auslösen
        if (e.key === "Enter" && document.activeElement?.tagName === "BUTTON") {
            e.preventDefault();
            document.activeElement.click();
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

        let html = `<div class="ui-view-container" data-form-id="${this.id}">`;

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
            if (!row) {continue;}

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

        html += `</div>`;
        return html;
    }

    /** 
     * Vom Controller delegiertes Event für die interne Tabellensteuerung 
     * @param {KeyboardEvent} e - Tastatur Event
     */
    handleKeyDown(e) {
    }
}


/**
 * Detail Einstellungen
 * @typedef {object} InfoUIDetailField
 * @property {string} field_name - Name des Datenfeldes
 * @property {string} label - Anzeige
 * @property {number} position - Position des Feldes
 * @property {string} [format] - Name der Value Formatierungs-Funktion
 */

export class InfoUIDatail extends InfoUIComponent{
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
        let obj = {field_name, label, format, position};
        
        // prüfen ob vorhanden
        let fieldIndex = this.fieldIndex[field_name] || -1;
        if (fieldIndex >= 0) {
            // Vorhandenes ersetzen unabhängig von position
            obj.position = fieldIndex;
            this.fields[fieldIndex] = obj;
        } else {
            // nicht vorhanden
            if (position == undefined || position < 0) {
                obj.position = this.fields.push(obj) -1;
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
        if (!this.dataObject) {return "<p>No DataObject!</p>"}
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

        // 2. GLOBALES MAUS CLICK ROUTING (Event Delegation)
        this.appContainer.addEventListener("click", (e) => {
            const target = e.target;
            if (target instanceof HTMLElement) {
                const clickedColDom = target.closest(".app-column");
                const clickedCompDom = target.closest(".ui-component-wrapper");
                
                if (clickedColDom && clickedCompDom) {
                    const colIdx = parseInt(clickedColDom.getAttribute("data-col-index") || "", 10);
                    
                    // Finde heraus, welche Komponente geklickt wurde
                    const colInstance = this.columns[colIdx];
                    if (colInstance) {
                        const compIdx = colInstance.components.findIndex(c => c.domElement === clickedCompDom);
                        if (compIdx !== -1) {
                            this.switchFocus(colIdx, compIdx);
                        }
                    }
                }
            }
        });
    }
}



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


// HTML-Template: Ein einziger flexibler Container für unendlich anbaubare Spalten nach rechts
const base_html = `
<div id="app-container" style="display: flex; flex-direction: row; overflow-x: auto; width: 100vw; height: 100vh; gap: 10px; padding: 10px; box-sizing: border-box;">
  <!-- Spalten werden hier dynamisch per JS eingehängt -->
</div>
`;


// export class UiGenerator_old {
//     /**
//      * Generiert eine HTML-Tabelle
//      * @param {string} tableId - ID der UI-Konfiguration
//      * @param {DataTable<InfoTableUI>} uiConfigTable - Die Tabelle mit den UI-Spalten-Definitionen
//      * @param {DataTable<any>} dataTable - Die echten Geschäftsdaten (z.B. Kunden)
//      * @param {string} [dataIndex] - Optional Index der DatenTabelle
//      */
//     static generateTable(tableId, uiConfigTable, dataTable, dataIndex) {
//         // 1. Hole die relevanten UI-Spalten für diese Tabelle und sortiere sie
//         const columns = uiConfigTable.findAll({ table_id: tableId }).sort((a, b) => a.position - b.position);

//         let html = `<div class="ui-view-container" data-target-type="LIST" data-table-id="${tableId}" tabindex="0">`;
//         html += `<table class="pure-table"><thead><tr>`;

//         // Header rendern
//         for (let i = 0; i < columns.length; i++) {
//             // Spalten Überschriften todo: Ausrichtung
//             html += `<th>${columns[i].display_name}</th>`;
//         }
//         html += `</tr></thead><tbody>`;

//         // Zeilen aus den echten Daten rendern (Index 0 auslassen, da Header im Datentreiber)
//         // Index für Sortierung und Filter
//         const dataRowIndex = dataTable.getIndexList(dataIndex);

//         for (let i = 0; i < dataRowIndex.length; i++) {
//             if (dataRowIndex[i] === 0) return;

//             // Datensatz ID todo: Optimieren: eventuell SpaltenIndex ?????
//             const recordId = dataTable.getCellValue(dataRowIndex[i], dataTable.idColumnName);

//             html += `<tr data-record-id="${recordId}">`;
//             for (let j = 0; j < columns.length; j++) {
//                 const value = dataTable.getCellValue(dataRowIndex[i], columns[j].column_name) ?? "";

//                 // Spalte anzeigen todo: Ausrichtung/Formatierung ????
//                 html += `<td>${value}</td>`;
//             };
//             html += `</tr>`;
//         };

//         html += `</tbody></table></div>`;
//         return html;
//     }

//     /**
//      * Generiert ein HTML-Formular
//      * @param {string} formId - Name des Formulares
//      * @param {DataTable<InfoFormUI>} uiConfigTable - Einstellungen für das Formular
//      * @param {Object<string,any>} currentDataObj - Datenzeilen Objekt
//      */
//     static generateForm(formId, uiConfigTable, currentDataObj) {
//         const fields = uiConfigTable.findAll({ form_id: formId }).sort((a, b) => a.position - b.position);

//         let html = `<div class="ui-view-container" data-target-type="FORM" data-form-id="${formId}" tabindex="0">`;

//         //fields.forEach(field => {
//         for (let i = 0; i < fields.length; i++) {
//             // todo: input Formate Festlegen
//             // todo: eingabe Schema prüfen ????
//             if (fields[i].ui_element === "input_text") {
//                 const val = currentDataObj ? currentDataObj[fields[i].field_name] : "";
//                 html += `
//                     <div class="form-group" data-focusable="true">
//                         <label>${fields[i].label}</label>
//                         <input type="text" data-field="${fields[i].field_name}" value="${val}">
//                     </div>`;
//             } else if (fields[i].ui_element === "button") {
//                 html += `
//                     <button class="ui-btn" data-focusable="true" 
//                             data-module="${fields[i].action_module || ''}" 
//                             data-function="${fields[i].action_function || ''}">
//                         ${fields[i].label}
//                     </button>`;
//             }
//         };

//         html += `</div>`;
//         return html;
//     }

//     /**
//      * Generiert ein Navigationsmenü aus einer DataTable
//      * @param {string} menuId 
//      * @param {DataTable<InfoTableUI>} uiConfigTable 
//      * @param {DataTable<any>} menuData 
//      * @param {string} [dataIndex] - Optional Index der DatenTabelle
//      */
//     static generateMenu(menuId, uiConfigTable, menuData, dataIndex) {
//         let html = `<div class="ui-view-container" data-target-type="MENU" data-table-id="${menuId}" tabindex="0">`;
//         html += `<ul class="ui-menu-list">`;

//         const rowIndices = menuData.getIndexList(dataIndex);
//         // todo: Optimieren
//         for (let i = 0; i < rowIndices.length; i++) {
//             if (rowIndices[i] === 0) continue; // Header überspringen

//             // Wir erwarten Spalten wie 'id' (oder gsid) und 'title'
//             const id = menuData.getCellValue(rowIndices[i], "id") || menuData.getCellValue(rowIndices[i], "gsid");
//             const title = menuData.getCellValue(rowIndices[i], "title") ?? "";

//             html += `<li data-record-id="${id}" class="ui-menu-item">${title}</li>`;
//         }

//         html += `</ul></div>`;
//         return html;
//     }


//     /**
//      * Generiert ein Formular aus einer Key-Value-Tabelle (Vertikale Daten)
//      * todo: Spalten müssen noch angepasst werden. Was ist die Key-Spalte, was ist die Value-Spalte?
//      * @param {string} formId 
//      * @param {DataTable<InfoFormUI>} uiConfigTable 
//      * @param {DataTable<any>} dataTable - Die vertikalen Tabellendaten
//      * @param {string} [dataIndex] - Optional Index der DatenTabelle
//      */
//     static generateVerticalForm(formId, uiConfigTable, dataTable, dataIndex) {
//         let html = `<div class="ui-view-container" data-target-type="FORM" data-form-id="${formId}" tabindex="0">`;

//         const rowIndices = dataTable.getIndexList(dataIndex);

//         for (let i = 0; i < rowIndices.length; i++) {
//             if (rowIndices[i] === 0) continue; // Header überspringen

//             // Angenommen, die Tabelle hat die Spalten "key" (oder parameter) und "value"
//             const key = dataTable.getCellValue(rowIndices[i], "parameter_name");
//             const val = dataTable.getCellValue(rowIndices[i], "wert") ?? "";

//             // Label aus der UI-Config holen, falls vorhanden, sonst den Key nutzen
//             const uiField = uiConfigTable.find({ form_id: formId, field_name: key });
//             const labelText = uiField ? uiField.label : key;

//             html += `
//             <div class="form-group" data-focusable="true" style="margin-bottom: 10px;">
//                 <label style="display: block; font-weight: 500;">${labelText}</label>
//                 <input type="text" data-field="${key}" value="${val}" style="width: 100%;">
//             </div>`;
//         }

//         html += `</div>`;
//         return html;
//     }

//     /**
//      * Generiert eine zusammengesetzte Detailansicht aus mehreren Sub-Tabellen
//      * todo: Muss angepasst werden da im payload unterschiedliche Daten kommen können (Formulare, Tabellen, Details(HTML), usw)
//      */
//     static generateDetail(viewId, uiConfigTable, compositeDataPayload) {
//         // compositeDataPayload ist das geparste JSON-Objekt aus dem Server-Payload
//         let html = `<div class="ui-view-container" data-target-type="DETAIL" data-view-id="${viewId}" tabindex="0" style="display:flex; flex-direction:column; gap:20px;">`;

//         // 1. Stammdaten-Segment (Formularartig, schreibgeschützt)
//         if (compositeDataPayload.stammdaten) {
//             const stammdatenTable = new DataTable(compositeDataPayload.stammdaten);
//             const obj = stammdatenTable.getObject(1);
//             html += `<div class="detail-segment card"><h3>Kundenstammdaten</h3>`;
//             for (const [key, value] of Object.entries(obj)) {
//                 html += `<p><strong>${key}:</strong> ${value}</p>`;
//             }
//             html += `</div>`;
//         }

//         // 2. Kontakt-Sektion als kompakte Liste
//         if (compositeDataPayload.kontakte) {
//             html += `<div class="detail-segment"><h3>Kontaktinformationen</h3><ul class="ui-menu-list">`;
//             const kontakteTable = new DataTable(compositeDataPayload.kontakte);
//             kontakteTable.getIndexList().forEach(idx => {
//                 if (idx === 0) return;
//                 const typ = kontakteTable.getCellValue(idx, "typ");
//                 const wert = kontakteTable.getCellValue(idx, "wert");
//                 html += `<li class="ui-static-item"><strong>${typ}:</strong> ${wert}</li>`;
//             });
//             html += `</ul></div>`;
//         }

//         // 3. Letzte Bestellungen als Sub-Tabelle
//         if (compositeDataPayload.bestellungen) {
//             html += `<div class="detail-segment"><h3>Letzte Bestellungen</h3>`;
//             const bestellungenTable = new DataTable(compositeDataPayload.bestellungen);
//             // Nutzen Sie die bestehende generateTable Methode intern!
//             html += UiGenerator.generateTable("subBestellungen", uiConfigTable, bestellungenTable);
//             html += `</div>`;
//         }

//         html += `</div>`;
//         return html;
//     }
// }


// export class UiController_old {
//     /**
//      * 
//      * @param {HTMLElement} appContainer - Der übergeordnete DOM-Container für die Spalten
//      */
//     constructor(appContainer) {
//         /** @type {HTMLElement} */
//         this.appContainer = appContainer;

//         /** @type {Map<string,DataTable<any>>} */
//         this.loadedTables = new Map();

//         /** @type {Map<string,string>} */
//         this.currentDataIndex = new Map();

//         /** @type {DataTable<InfoTableUI>} */
//         this.infoTableUI = new DataTable("InfoTableUI", [InfoTableUI_fields], InfoTableUI_unique);
        
//         /** @type {DataTable<InfoFormUI>} */
//         this.infoFormUI = new DataTable("InfoFormUI", [InfoFormUI_fields], InfoFormUI_unique);

//         /** @type {any} - Wird nachgelagert vom Sync-Client besetzt */
//         //this.sync = null;
//         this.activeContainer = null;
//         this.activeRowIdx = 0;
//         this.activeColIdx = 0;

//         //this.initGlobalEvents();
//     }


//     /**
//      * Entscheidet, ob eine Spalte neu geöffnet oder nur aktualisiert (refreshed) wird
//      * @param {string} tableName - Name der Tabelle
//      * @param {string} targetType - Zile Typ ? "LIST", "FORM", ...
//      * @param {DataTable<any>} dataTable - DatenTabelle
//      * @param {string} html - HTML String ????? 
//      */
//     renderOrUpdateColumn(tableName, targetType, dataTable, html) {
//         // Prüfen, ob dieses UI-Element bereits im DOM existiert
//         const existingView = document.querySelector(`[data-table-id="${tableName}"][data-target-type="${targetType}"]`);

//         // Instanz für spätere Sortierung/Filterung im Cache merken
//         this.loadedTables.set(tableName, dataTable);

//         if (existingView) {
//             // REFRESH: Bestehendes HTML einfach austauschen!
//             const bodyContainer = existingView.closest(".app-column-body");
//             if (bodyContainer) {
//                 bodyContainer.innerHTML = html;

//                 // Dem Controller sagen, er soll das geänderte HTML neu scannen
//                 /** @type {HTMLElement|null} */
//                 const newView = bodyContainer.querySelector(".ui-view-container");
//                 this.parseContainer(newView);
//                 this.focusContainer(newView);
//                 return;
//             }
//         }

//         // NEU ANHÄNGEN: Wenn die Spalte noch nicht offen war
//         const targetElement = this.appendColumnHTML(tableName, html);
//         this.parseContainer(targetElement);
//         this.focusContainer(targetElement);
//     }

//     /**
//      * Erstellt eine neue visuelle Spalte im macOS-Finder-Stil, entfernt alle rechts davon stehenden Spalten
//      * und bettet das generierte HTML ein.
//      * @param {string} title - Titel der Spalte (wird im Header angezeigt)
//      * @param {string} innerHtml - Das vom UiGenerator erzeugte HTML
//      * @returns {HTMLElement|null} - Das innere Container-Element für den UiController (.ui-view-container)
//      */
//     appendColumnHTML(title, innerHtml) {
//         // 1. Ermittle, von wo aus die Aktion getriggert wurde (aktive Spalte)
//         // Falls kein Element aktiv ist, fangen wir bei Spalte 0 an.
//         let currentColIdx = -1;
//         if (this.activeContainer) {
//             const parentCol = this.activeContainer.closest(".app-column");
//             if (parentCol) {
//                 currentColIdx = parseInt(parentCol.getAttribute("data-col-index") || "0", 10);
//             }
//         }

//         // 2. Kaskadierendes Löschen: Alle Spalten RECHTS von der aktuellen Spalte abschneiden
//         const targetColIdx = currentColIdx + 1;
//         const existingCols = this.appContainer.querySelectorAll(".app-column");
//         existingCols.forEach(col => {
//             const idx = parseInt(col.getAttribute("data-col-index") || "0", 10);
//             if (idx >= targetColIdx) {
//                 col.remove();
//             }
//         });

//         // 3. Neue Spalten-Hülle bauen
//         const colDiv = document.createElement("div");
//         colDiv.className = "app-column";
//         colDiv.setAttribute("data-col-index", targetColIdx.toString());
//         colDiv.style.cssText = "display: flex; flex-direction: column; width: 350px; min-width: 350px; background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e1e4e8; height: 100%;";

//         // Spalten-Kopf (Header)
//         colDiv.innerHTML = `
//             <div class="app-column-header" style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e1e4e8; background: #fafbfc; border-radius: 6px 6px 0 0;">
//                 ${title}
//             </div>
//             <div class="app-column-body" style="flex: 1; overflow-y: auto; padding: 10px;">
//                 ${innerHtml}
//             </div>
//         `;

//         this.appContainer.appendChild(colDiv);

//         // Nach rechts scrollen
//         this.appContainer.scrollTo({ left: this.appContainer.scrollWidth, behavior: "smooth" });

//         // Das interaktive Element für den Controller zurückgeben
//         return colDiv.querySelector(".ui-view-container");
//     }


//     /**
//      * Parst einen neu hinzugefügten DOM-Bereich und bindet dynamische JS-Module an Buttons
//      * @param {HTMLElement|null} container 
//      */
//     parseContainer(container) {
//         if (!container) {return;}
//         // 1. Suche nach interaktiven Elementen (z.B. Buttons mit Modul-Zuweisung)
//         const buttons = container.querySelectorAll("button[data-module]");
//         buttons.forEach(async (btn) => {
//             const modulePath = btn.getAttribute("data-module");
//             const functionName = btn.getAttribute("data-function");

//             if (modulePath && functionName) {
//                 // Dynamischer JavaScript-Import zur Laufzeit!
//                 try {
//                     const module = await import(modulePath);
//                     btn.addEventListener("click", (e) => {
//                         // Rufe die Funktion auf und übergebe den aktuellen Sync-Server & Kontext
//                         // todo: Daten als Datensatz Übergeben ????
//                         module[functionName]({ event: e, sync: this.sync, btn: btn });
//                     });
//                 } catch (err) {
//                     console.error(`Fehler beim Laden des Moduls ${modulePath}:`, err);
//                 }
//             }
//         });

//         // 2. Klick-Navigation zur Maus-Unterstützung
//         container.addEventListener("click", (e) => {
//             const target = e.target;
//             if (!(target instanceof HTMLElement)) { return; }
//             const viewContainer = target.closest(".ui-view-container");
//             if (viewContainer instanceof HTMLElement) {
//                 this.focusContainer(viewContainer);

//                 // Falls auf eine Tabellenzeile geklickt wurde:
//                 const tr = target.closest("tr");
//                 const tr_parent = tr?.parentNode;
//                 if (tr && tr_parent instanceof HTMLElement && tr_parent.tagName === "TBODY") {
//                     this.activeRowIdx = tr.rowIndex - 1; // Ohne Header
//                     this.updateVisualFocus();
//                 }
//             }
//         });
//     }

//     /**
//      * Setzt den Fokus auf das angegebene Element
//      * @param {HTMLElement|null} el - Element welches den Fokus erhält
//      */
//     focusContainer(el) {
//         if (!el) {return;}
//         if (this.activeContainer) this.activeContainer.classList.remove("focused");
//         this.activeContainer = el;
//         this.activeContainer.classList.add("focused");
//         this.activeContainer.focus();
//         this.activeRowIdx = 0;
//         this.activeColIdx = 0;
//         this.updateVisualFocus();
//     }

//     initGlobalEvents() {
//         window.addEventListener("keydown", (e) => {
//             if (!this.activeContainer) return;

//             const targetType = this.activeContainer.getAttribute("data-target-type");

//             // todo: Überlegen ob Navigationshandling an InfoUI... Klassen auslagern

//             if (targetType === "LIST") {
//                 this.handleTableNavigation(e);

//             } else if (targetType === "FORM") {
//                 this.handleFormNavigation(e);
//             } else if (targetType === "DEAIL") {
//                 // todo: Detail Navigation
//             }

//             // Alt + Pfeiltasten für Spaltenwechsel
//             // todo: "ArrowUp", "ArrowDown" noch berücksichtigen wenn "ui-view-container" untereinander
//             if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
//                 const currentCol = this.activeContainer.closest(".app-column");
//                 if (!currentCol) return;
//                 const currentIdx = parseInt(currentCol.getAttribute("data-col-index") || "0", 10);
//                 let targetIdx = e.key === "ArrowLeft" ? currentIdx - 1 : currentIdx + 1;
//                 const targetCol = this.appContainer.querySelector(`.app - column[data - col - index="${targetIdx}"]`);
//                 if (targetCol) {
//                     const viewContainer = targetCol.querySelector(".ui-view-container");
//                     if (viewContainer instanceof HTMLElement) {
//                         this.focusContainer(viewContainer);
//                         e.preventDefault();
//                     }
//                 }
//             }
//         });
//     }



//     /**
//      * Verarbeitet die TastaturEvents auf einer Tabelle
//      * todo: Überlegen ob an InfoUI... Klassen auslagern
//      * @param {KeyboardEvent} e - Event für die Tastur Eingaben
//      * @returns {ClientServerMessage|undefined}
//      */
//     handleTableNavigation(e) {
//         const tbody = this.activeContainer?.querySelector("tbody");
//         const thead = this.activeContainer?.querySelector("thead");
//         if (!tbody || !thead) return;

//         const maxRows = tbody.rows.length;
//         const tableId = this.activeContainer?.getAttribute("data-table-id") || "";

//         // Hole den technischen Spaltennamen basierend auf der aktuellen Zelle
//         const th = thead.rows[0].cells[this.activeColIdx];
//         const columnName = th?.getAttribute("data-col-name") || "";

//         // Standard-Pfeiltasten-Navigation (Zelle / Zeile wechseln)
//         if (e.key === "ArrowRight") {
//             const currentRowsCells = tbody.rows[this.activeRowIdx]?.cells.length || 0;
//             if (this.activeColIdx < currentRowsCells - 1) { this.activeColIdx++; e.preventDefault(); }
//         }
//         if (e.key === "ArrowLeft") {
//             if (this.activeColIdx > 0) { this.activeColIdx--; e.preventDefault(); }
//         }
//         if (e.key === "ArrowDown" && this.activeRowIdx < maxRows - 1) {
//             this.activeRowIdx++; e.preventDefault();
//         }
//         if (e.key === "ArrowUp" && this.activeRowIdx > 0) {
//             this.activeRowIdx--; e.preventDefault();
//         }

//         // --- NEU: TASTENBEFEHLE FÜR AKTIONEN ---

//         // 1. SORTIEREN (Taste "s" oder "S")
//         // todo: Ausbessern auf "CTRL+ArrowUp" und "CTRL+ArrowDown" für Aufsteigend und Absteigend sortieren
//         if (e.key.toLowerCase() === "s" && columnName) {
//             e.preventDefault();
//             const mode = "CLIENT"; // Oder "SERVER" per Konfigurations-Flag der App

//             if (mode === "CLIENT") {
//                 console.log(`Lokal sortieren nach: ${columnName}`);
//                 const currentTable = this.loadedTables.get(tableId);

//                 if (currentTable) {
//                     currentTable.sort([columnName]); // Ihre eingebaute Sortierfunktion

//                     // 1. HTML mit den frisch sortierten Daten neu generieren
//                     const updatedHtml = UiGenerator.generateTable(tableId, this.infoTableUI, currentTable);

//                     // 2. KORREKTUR: Die soeben geschriebene Methode nutzen, um das HTML auszutauschen
//                     this.renderOrUpdateColumn(tableId, "LIST", currentTable, updatedHtml || "");
//                 }
//             } else {
//                 // Server-seitig
//                 return {type: "GET_DATA", tableName: tableId, targetType: "LIST", payload: { action: "SORT", column: columnName } };
//             }
//         }

//         // 2. FILTERN (Taste "f" oder "F")
//         // todo: Ausbessern auf "CTRL+SPACE" oder "CTRL+ENTER" je nach dem was intuitiver ist
//         if (e.key.toLowerCase() === "f" && columnName) {
//             e.preventDefault();
//             const activeCell = tbody.rows[this.activeRowIdx]?.cells[this.activeColIdx];
//             const cellValue = activeCell?.textContent;
//             const mode = "CLIENT";

//             if (mode === "CLIENT") {
//                 console.log(`Lokal filtern: ${columnName} = ${cellValue}`);
//                 const currentTable = this.loadedTables.get(tableId);
//                 if (currentTable) {
//                     // Erstellt eine gefilterte Kopie oder mutiert die Tabelle temporär
//                     const filteredTable = currentTable.filter(columnName, cellValue);
//                     AppCore.refreshColumnHTML(tableId, filteredTable);
//                 }
//             } else {
//                 // Server-seitig
//                 return {type: "GET_DATA", tableName: tableId, targetType: "LIST", payload: { action: "FILTER", column: columnName, value: cellValue }};
//             }
//         }

//         // 3. REFRESH VOM SERVER ERZWINGEN (Taste "r" oder "R")
//         if (e.key.toLowerCase() === "r") {
//             e.preventDefault();
//             return{ type:"GET_DATA", tableName: tableId, targetType: "LIST", payload: { action: "REFRESH" } };
//         }

//         // 4. ENTER (Datensatz öffnen / in die nächste Spalte wandern)
//         if (e.key === "Enter") {
//             e.preventDefault();
//             const activeRow = tbody.rows[this.activeRowIdx];
//             const recordId = activeRow?.getAttribute("data-record-id");

//             return {type: "GET_DATA", tableName: tableId, recordId: recordId, targetType: "FORM" };
//         }

//         this.updateVisualFocus();
//     }


//     // /**
//     //  * Verarbeitet die TastaturEvents auf einer Tabelle
//     //  * @param {KeyboardEvent} e - Event für die Tastur Eingaben
//     //  * @returns {void}
//     //  */
//     // handleTableNavigation_old2(e) {
//     //     const targetType = this.activeContainer?.getAttribute("data-target-type");

//     //     // Abstraktion: Entweder Zeilen im tbody (Tabelle) oder li-Elemente (Menü)
//     //     const items = targetType === "MENU"
//     //         ? Array.from(this.activeContainer?.querySelectorAll(".ui-menu-item") || [])
//     //         : Array.from(this.activeContainer?.querySelectorAll("tbody tr") || []);

//     //     if (items.length === 0) return;

//     //     if (e.key === "ArrowDown" && this.activeRowIdx < items.length - 1) {
//     //         this.activeRowIdx++; e.preventDefault();
//     //     }
//     //     if (e.key === "ArrowUp" && this.activeRowIdx > 0) {
//     //         this.activeRowIdx--; e.preventDefault();
//     //     }

//     //     if (e.key === "Enter") {
//     //         e.preventDefault();
//     //         const activeItem = items[this.activeRowIdx];
//     //         const recordId = activeItem.getAttribute("data-record-id");
//     //         const tableId = this.activeContainer?.getAttribute("data-table-id");

//     //         // Über die Kanten-Spezifikation (InfoEdge) weiß der Server, was als nächstes kommt!
//     //         this.sync.ws?.send(JSON.stringify({
//     //             type: "GET_DATA",
//     //             tableName: tableId,
//     //             recordId: recordId,
//     //             targetType: targetType === "MENU" ? "LIST" : "FORM"
//     //         }));
//     //     }

//     //     this.updateVisualFocus();
//     // }


//     // /**
//     //  * Verarbeitet die TastaturEvents auf einer Tabelle
//     //  * @param {KeyboardEvent} e - Event für die Tastur Eingaben
//     //  * @returns {void}
//     //  */
//     // handleTableNavigation_old(e) {
//     //     const tbody = this.activeContainer?.querySelector("tbody");
//     //     if (!tbody) return;
//     //     const maxRows = tbody.rows.length;

//     //     if (e.key === "ArrowDown" && this.activeRowIdx < maxRows - 1) {
//     //         this.activeRowIdx++; e.preventDefault();
//     //     }
//     //     if (e.key === "ArrowUp" && this.activeRowIdx > 0) {
//     //         this.activeRowIdx--; e.preventDefault();
//     //     }

//     //     if (e.key === "Enter") {
//     //         e.preventDefault();
//     //         const activeRow = tbody.rows[this.activeRowIdx];
//     //         const recordId = activeRow.getAttribute("data-record-id");
//     //         const tableId = this.activeContainer?.getAttribute("data-table-id");

//     //         // Trigger an Server (Nächste Spalte anfordern)
//     //         this.sync.ws?.send(JSON.stringify({
//     //             type: "GET_DATA",
//     //             tableName: tableId,
//     //             recordId: recordId,
//     //             targetType: "FORM" // Server weiß, er soll Formular-Daten schicken
//     //         }));
//     //     }

//     //     this.updateVisualFocus();
//     // }

//     /**
//      * Verarbeitet die TastaturEvents auf einem Formular
//      * @param {KeyboardEvent} e - Event für die Tastur Eingaben
//      * @returns {ClientServerMessage|undefined}
//      */
//     handleFormNavigation(e) {
//         // Im Formular navigieren wir durch die Elemente mit "data-focusable"
//         const focusables = Array.from(this.activeContainer?.querySelectorAll("[data-focusable='true']") || []);
//         let currentIdx = document.activeElement ? focusables.indexOf(document.activeElement) : 0;

//         if (e.key === "ArrowDown" || e.key === "Tab") {
//             e.preventDefault();
//             currentIdx = (currentIdx + 1) % focusables.length;
//             //@ts-ignore
//             focusables[currentIdx].focus();
//         }
//         if (e.key === "ArrowUp") {
//             e.preventDefault();
//             currentIdx = (currentIdx - 1 + focusables.length) % focusables.length;
//             //@ts-ignore
//             focusables[currentIdx].focus();
//         }
//         return;
//     }

//     updateVisualFocus() {
//         if (!this.activeContainer) return;

//         // Alle alten Fokuseffekte aufheben
//         //@ts-ignore todo: Verbessern
//         this.activeContainer.querySelectorAll(".active-row, .active-menu-item").forEach(el => {
//             el.classList.remove("active-row", "active-menu-item");
//         });

//         const targetType = this.activeContainer.getAttribute("data-target-type");

//         if (targetType === "MENU") {
//             const items = this.activeContainer.querySelectorAll(".ui-menu-item");
//             if (items[this.activeRowIdx]) items[this.activeRowIdx].classList.add("active-menu-item");
//         } else if (targetType === "LIST") {
//             const tbody = this.activeContainer.querySelector("tbody");
//             if (tbody && tbody.rows[this.activeRowIdx]) tbody.rows[this.activeRowIdx].classList.add("active-row");
//         }
//     }

//     // updateVisualFocus_old() {
//     //     if (!this.activeContainer) return;

//     //     // Entferne alte CSS-Klassen
//     //     this.activeContainer.querySelectorAll(".active-row").forEach(el => el.classList.remove("active-row"));

//     //     const type = this.activeContainer.getAttribute("data-ui-type");
//     //     if (type === "table") {
//     //         const tbody = this.activeContainer.querySelector("tbody");
//     //         if (tbody && tbody.rows[this.activeRowIdx]) {
//     //             tbody.rows[this.activeRowIdx].classList.add("active-row");
//     //         }
//     //     }
//     // }

//     /**
//      * Prüft alle Felder eines Formulars gegen die geladenen Schemas
//      * @param {HTMLElement} formContainer 
//      */
//     validateFormFields(formContainer) {
//         const formId = formContainer.getAttribute("data-form-id");
//         const inputs = formContainer.querySelectorAll("input[data-field]");
//         let hasAnyError = false;

//         inputs.forEach(input => {
//             const fieldName = input.getAttribute("data-field");
//             const value = input.value;

//             // Hier rufen Sie Ihre bestehende Schema-Validierungs-Logik auf!
//             // Angenommen, diese liefert { isValid: false, message: "Pflichtfeld" }
//             const validationResult = YourCustomSchemaClass.validate(formId, fieldName, value);

//             // Vorherige Fehler-Stylings aufräumen
//             input.classList.remove("input-error");
//             const existingMsg = input.parentNode.querySelector(".error-message");
//             if (existingMsg) existingMsg.remove();

//             if (!validationResult.isValid) {
//                 hasAnyError = true;
//                 input.classList.add("input-error"); // Macht den Rahmen z.B. rot via CSS

//                 // Fehlermeldung als Text unter dem Input einfügen
//                 const errorSpan = document.createElement("span");
//                 errorSpan.className = "error-message";
//                 errorSpan.style.cssText = "color: red; font-size: 12px; display: block; margin-top: 4px;";
//                 errorSpan.textContent = validationResult.message;
//                 input.parentNode.appendChild(errorSpan);
//             }
//         });

//         return !hasAnyError; // Gibt true zurück, wenn alles fehlerfrei ist
//     }
// }





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

// ============ Beispiel Verwendung =================



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
        if (!hashString) {return;}

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




// =========================================================================
//   ZENTRALER APPMANAGER & DOM ORCHESTRATOR
// =========================================================================

export class AppCore_old {
    // static getLoadedTable(tableId) {
    //     throw new Error("Method not implemented.");
    // }
    // static renderOrUpdateColumn(tableId, arg1, currentTable, arg3) {
    //     throw new Error("Method not implemented.");
    // }
    // static refreshColumnHTML(tableId, filteredTable) {
    //     throw new Error("Method not implemented.");
    // }
    // /** @type {RealtimeSync|null} */
    // static sync = null;
    // /** @type {UiController|null} */
    // static controller = null;

    // /** @type {HTMLElement|null} */
    // static appContainer = null;

    /**
     * Initialisiert die App und hängt den Basis-Container ein
     * @param {string} serverUrl - Die URL vom Server
     */
    static init(serverUrl) {
        document.body.innerHTML = `
            <div id="app-container" style="display: flex; flex-direction: row; overflow-x: auto; width: 100vw; height: 100vh; gap: 15px; padding: 15px; box-sizing: border-box; background: #f4f5f7;">
              <!-- Spalten werden hier dynamisch per JS eingehängt -->
            </div>
        `;

        // APP-Container Lesen
        const appContainer = document.getElementById("app-container");
        if (!appContainer) throw new Error("App-Container nicht gefunden");

        // 1. Controller und Sync instanziieren und kreuzverweisen
        const controller = new UiController(appContainer); // Wird gleich im Sync gesetzt
        const sync = new RealtimeSync(serverUrl, controller);
        //controller.sync = sync;

        // 2. Verbindung starten
        sync.connect();

        // Events registrieren
        window.addEventListener("keydown", (e) => {
            if (!controller.activeContainer) return;
            
            /** @type {ClientServerMessage|undefined} */
            let sendCommand;

            const targetType = controller.activeContainer.getAttribute("data-target-type");
    
            if (targetType === "LIST" || targetType === "MENU") {
                sendCommand = controller.handleTableNavigation(e);
            } else if (targetType === "FORM") {
                sendCommand = controller.handleFormNavigation(e);
            }
            
            // Alt + Pfeiltasten für Spaltenwechsel
            if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
                const currentCol = controller.activeContainer.closest(".app-column");
                if (!currentCol) return;
                const currentIdx = parseInt(currentCol.getAttribute("data-col-index") || "0", 10);
                let targetIdx = e.key === "ArrowLeft" ? currentIdx - 1 : currentIdx + 1;
                const targetCol = controller.appContainer.querySelector(`.app - column[data - col - index="${targetIdx}"]`);
                if (targetCol) {
                    const viewContainer = targetCol.querySelector(".ui-view-container");
                    if (viewContainer instanceof HTMLElement) {
                        controller.focusContainer(viewContainer);
                        e.preventDefault();
                    }
                }
            }

            if (sendCommand) {
                sync.send(sendCommand);
            }
        });
    }
}


    // // Hier merken wir uns die aktuell im UI geladenen DataTable-Instanzen
    // static loadedTables = new Map();

    // /**
    //  * Gibt eine bestehende DatenTabelle zurück
    //  * @param {string} tableId - ID der Tabelle
    //  * @returns {DataTable<any>}
    //  */
    // static getLoadedTable(tableId) {
    //     return AppCore.loadedTables.get(tableId);
    // }

    // /**
    //  * Entscheidet, ob eine Spalte neu geöffnet oder nur aktualisiert (refreshed) wird
    //  * @param {string} tableName - Name der Tabelle
    //  * @param {string} targetType - Zile Typ ? "LIST", "FORM", ...
    //  * @param {DataTable<any>} dataTable - DatenTabelle
    //  * @param {string} html - HTML String ????? 
    //  */
    // static renderOrUpdateColumn(tableName, targetType, dataTable, html) {
    //     // Prüfen, ob dieses UI-Element bereits im DOM existiert
    //     const existingView = document.querySelector(`[data-table-id="${tableName}"][data-target-type="${targetType}"]`);

    //     // Instanz für spätere Sortierung/Filterung im Cache merken
    //     AppCore.loadedTables.set(tableName, dataTable);

    //     if (existingView) {
    //         // REFRESH: Bestehendes HTML einfach austauschen!
    //         const bodyContainer = existingView.closest(".app-column-body");
    //         if (bodyContainer) {
    //             bodyContainer.innerHTML = html;

    //             // Dem Controller sagen, er soll das geänderte HTML neu scannen
    //             /** @type {HTMLElement|null} */
    //             const newView = bodyContainer.querySelector(".ui-view-container");
    //             AppCore.controller?.parseContainer(newView);
    //             AppCore.controller?.focusContainer(newView);
    //             return;
    //         }
    //     }

    //     // NEU ANHÄNGEN: Wenn die Spalte noch nicht offen war
    //     const targetElement = AppCore.appendColumnHTML(tableName, html);
    //     AppCore.controller?.parseContainer(targetElement);
    //     AppCore.controller?.focusContainer(targetElement);
    // }

    // /**
    //  * Erstellt eine neue visuelle Spalte im macOS-Finder-Stil, entfernt alle rechts davon stehenden Spalten
    //  * und bettet das generierte HTML ein.
    //  * @param {string} title - Titel der Spalte (wird im Header angezeigt)
    //  * @param {string} innerHtml - Das vom UiGenerator erzeugte HTML
    //  * @returns {HTMLElement|null} - Das innere Container-Element für den UiController (.ui-view-container)
    //  */
    // static appendColumnHTML(title, innerHtml) {
    //     const container = document.getElementById("app-container");
    //     if (!this.appContainer) throw new Error("App-Container nicht gefunden");

    //     // 1. Ermittle, von wo aus die Aktion getriggert wurde (aktive Spalte)
    //     // Falls kein Element aktiv ist, fangen wir bei Spalte 0 an.
    //     let currentColIdx = -1;
    //     if (AppCore.controller && AppCore.controller.activeContainer) {
    //         const parentCol = AppCore.controller.activeContainer.closest(".app-column");
    //         if (parentCol) {
    //             currentColIdx = parseInt(parentCol.getAttribute("data-col-index") || "0", 10);
    //         }
    //     }

    //     // 2. Kaskadierendes Löschen: Alle Spalten RECHTS von der aktuellen Spalte abschneiden
    //     const targetColIdx = currentColIdx + 1;
    //     const existingCols = this.appContainer.querySelectorAll(".app-column");
    //     existingCols.forEach(col => {
    //         const idx = parseInt(col.getAttribute("data-col-index") || "0", 10);
    //         if (idx >= targetColIdx) {
    //             col.remove();
    //         }
    //     });

    //     // 3. Neue Spalten-Hülle bauen
    //     const colDiv = document.createElement("div");
    //     colDiv.className = "app-column";
    //     colDiv.setAttribute("data-col-index", targetColIdx.toString());
    //     colDiv.style.cssText = "display: flex; flex-direction: column; width: 350px; min-width: 350px; background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e1e4e8; height: 100%;";

    //     // Spalten-Kopf (Header)
    //     colDiv.innerHTML = `
    //         <div class="app-column-header" style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e1e4e8; background: #fafbfc; border-radius: 6px 6px 0 0;">
    //             ${title}
    //         </div>
    //         <div class="app-column-body" style="flex: 1; overflow-y: auto; padding: 10px;">
    //             ${innerHtml}
    //         </div>
    //     `;

    //     this.appContainer.appendChild(colDiv);

    //     // Nach rechts scrollen
    //     this.appContainer.scrollTo({ left: this.appContainer.scrollWidth, behavior: "smooth" });

    //     // Das interaktive Element für den Controller zurückgeben
    //     return colDiv.querySelector(".ui-view-container");
    // }

    // static registerGlobalEvents() {
    //     window.addEventListener("keydown", (e) => {
    //         // Horizontaler Spaltenwechsel mit Alt + ArrowLeft / ArrowRight
    //         if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
    //             if (!this.appContainer || !AppCore.controller || !AppCore.controller.activeContainer) return;

    //             const currentCol = AppCore.controller.activeContainer.closest(".app-column");
    //             if (!currentCol) return;

    //             const currentIdx = parseInt(currentCol.getAttribute("data-col-index") || "0", 10);
    //             let targetIdx = e.key === "ArrowLeft" ? currentIdx - 1 : currentIdx + 1;

    //             const targetCol = this.appContainer.querySelector(`.app-column[data-col-index="${targetIdx}"]`);
    //             if (targetCol) {
    //                 const viewContainer = targetCol.querySelector(".ui-view-container");
    //                 if (viewContainer instanceof HTMLElement) {
    //                     AppCore.controller.focusContainer(viewContainer);
    //                     e.preventDefault();
    //                 }
    //             }
    //         }
    //     });
    // }
//}
