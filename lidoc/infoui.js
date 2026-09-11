// =========================================================================
//   DYNAMISCHES SPALTEN-UI & KEYBOARD ROUTER (infoui.js)
// =========================================================================
// @ts-check

import { DataTable } from "./infotable.js";
import { Schema, infoSchema, InfoTableUI_fields, InfoTableUI_unique, InfoFormUI_fields, InfoFormUI_unique } from "./infoschema.js";

// ===================================
//   Infos
// --------

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

// ==========================================


// HTML-Template: Ein einziger flexibler Container für unendlich anbaubare Spalten nach rechts
const base_html = `
<div id="app-container" style="display: flex; flex-direction: row; overflow-x: auto; width: 100vw; height: 100vh; gap: 10px; padding: 10px; box-sizing: border-box;">
  <!-- Spalten werden hier dynamisch per JS eingehängt -->
</div>
`;


// ===================================================
//   neue Klassen
// ---------------

export class UiGenerator {
    /**
     * Generiert eine HTML-Tabelle
     * @param {string} tableId - ID der UI-Konfiguration
     * @param {DataTable<InfoTableUI>} uiConfigTable - Die Tabelle mit den UI-Spalten-Definitionen
     * @param {DataTable<any>} dataTable - Die echten Geschäftsdaten (z.B. Kunden)
     * @param {string} [dataIndex] - Optional Index der DatenTabelle
     */
    static generateTable(tableId, uiConfigTable, dataTable, dataIndex) {
        // 1. Hole die relevanten UI-Spalten für diese Tabelle und sortiere sie
        const columns = uiConfigTable.findAll({ table_id: tableId }).sort((a, b) => a.position - b.position);

        let html = `<div class="ui-view-container" data-target-type="LIST" data-table-id="${tableId}" tabindex="0">`;
        html += `<table class="pure-table"><thead><tr>`;

        // Header rendern
        for (let i = 0; i < columns.length; i++) {
            // Spalten Überschriften todo: Ausrichtung
            html += `<th>${columns[i].display_name}</th>`;
        }
        html += `</tr></thead><tbody>`;

        // Zeilen aus den echten Daten rendern (Index 0 auslassen, da Header im Datentreiber)
        // Index für Sortierung und Filter
        const dataRowIndex = dataTable.getIndexList(dataIndex);

        for (let i = 0; i < dataRowIndex.length; i++) {
            if (dataRowIndex[i] === 0) return;

            // Datensatz ID todo: Optimieren: eventuell SpaltenIndex ?????
            const recordId = dataTable.getCellValue(dataRowIndex[i], dataTable.idColumnName);

            html += `<tr data-record-id="${recordId}">`;
            for (let j = 0; j < columns.length; j++) {
                const value = dataTable.getCellValue(dataRowIndex[i], columns[j].column_name) ?? "";

                // Spalte anzeigen todo: Ausrichtung/Formatierung ????
                html += `<td>${value}</td>`;
            };
            html += `</tr>`;
        };

        html += `</tbody></table></div>`;
        return html;
    }

    /**
     * Generiert ein HTML-Formular
     * @param {string} formId - Name des Formulares
     * @param {DataTable<InfoFormUI>} uiConfigTable - Einstellungen für das Formular
     * @param {Object<string,any>} currentDataObj - Datenzeilen Objekt
     */
    static generateForm(formId, uiConfigTable, currentDataObj) {
        const fields = uiConfigTable.findAll({ form_id: formId }).sort((a, b) => a.position - b.position);

        let html = `<div class="ui-view-container" data-target-type="FORM" data-form-id="${formId}" tabindex="0">`;

        //fields.forEach(field => {
        for (let i = 0; i < fields.length; i++) {
            // todo: input Formate Festlegen
            // todo: eingabe Schema prüfen ????
            if (fields[i].ui_element === "input_text") {
                const val = currentDataObj ? currentDataObj[fields[i].field_name] : "";
                html += `
                    <div class="form-group" data-focusable="true">
                        <label>${fields[i].label}</label>
                        <input type="text" data-field="${fields[i].field_name}" value="${val}">
                    </div>`;
            } else if (fields[i].ui_element === "button") {
                html += `
                    <button class="ui-btn" data-focusable="true" 
                            data-module="${fields[i].action_module || ''}" 
                            data-function="${fields[i].action_function || ''}">
                        ${fields[i].label}
                    </button>`;
            }
        };

        html += `</div>`;
        return html;
    }

    /**
     * Generiert ein Navigationsmenü aus einer DataTable
     * @param {string} menuId 
     * @param {DataTable<InfoTableUI>} uiConfigTable 
     * @param {DataTable<any>} menuData 
     * @param {string} [dataIndex] - Optional Index der DatenTabelle
     */
    static generateMenu(menuId, uiConfigTable, menuData, dataIndex) {
        let html = `<div class="ui-view-container" data-target-type="MENU" data-table-id="${menuId}" tabindex="0">`;
        html += `<ul class="ui-menu-list">`;

        const rowIndices = menuData.getIndexList(dataIndex);
        // todo: Optimieren
        for (let i = 0; i < rowIndices.length; i++) {
            if (rowIndices[i] === 0) continue; // Header überspringen

            // Wir erwarten Spalten wie 'id' (oder gsid) und 'title'
            const id = menuData.getCellValue(rowIndices[i], "id") || menuData.getCellValue(rowIndices[i], "gsid");
            const title = menuData.getCellValue(rowIndices[i], "title") ?? "";

            html += `<li data-record-id="${id}" class="ui-menu-item">${title}</li>`;
        }

        html += `</ul></div>`;
        return html;
    }


    /**
     * Generiert ein Formular aus einer Key-Value-Tabelle (Vertikale Daten)
     * todo: Spalten müssen noch angepasst werden. Was ist die Key-Spalte, was ist die Value-Spalte?
     * @param {string} formId 
     * @param {DataTable<InfoFormUI>} uiConfigTable 
     * @param {DataTable<any>} dataTable - Die vertikalen Tabellendaten
     * @param {string} [dataIndex] - Optional Index der DatenTabelle
     */
    static generateVerticalForm(formId, uiConfigTable, dataTable, dataIndex) {
        let html = `<div class="ui-view-container" data-target-type="FORM" data-form-id="${formId}" tabindex="0">`;

        const rowIndices = dataTable.getIndexList(dataIndex);

        for (let i = 0; i < rowIndices.length; i++) {
            if (rowIndices[i] === 0) continue; // Header überspringen

            // Angenommen, die Tabelle hat die Spalten "key" (oder parameter) und "value"
            const key = dataTable.getCellValue(rowIndices[i], "parameter_name");
            const val = dataTable.getCellValue(rowIndices[i], "wert") ?? "";

            // Label aus der UI-Config holen, falls vorhanden, sonst den Key nutzen
            const uiField = uiConfigTable.find({ form_id: formId, field_name: key });
            const labelText = uiField ? uiField.label : key;

            html += `
            <div class="form-group" data-focusable="true" style="margin-bottom: 10px;">
                <label style="display: block; font-weight: 500;">${labelText}</label>
                <input type="text" data-field="${key}" value="${val}" style="width: 100%;">
            </div>`;
        }

        html += `</div>`;
        return html;
    }

    /**
     * Generiert eine zusammengesetzte Detailansicht aus mehreren Sub-Tabellen
     * todo: Muss angepasst werden da im payload unterschiedliche Daten kommen können (Formulare, Tabellen, Details(HTML), usw)
     */
    static generateDetail(viewId, uiConfigTable, compositeDataPayload) {
        // compositeDataPayload ist das geparste JSON-Objekt aus dem Server-Payload
        let html = `<div class="ui-view-container" data-target-type="DETAIL" data-view-id="${viewId}" tabindex="0" style="display:flex; flex-direction:column; gap:20px;">`;

        // 1. Stammdaten-Segment (Formularartig, schreibgeschützt)
        if (compositeDataPayload.stammdaten) {
            const stammdatenTable = new DataTable(compositeDataPayload.stammdaten);
            const obj = stammdatenTable.getObject(1);
            html += `<div class="detail-segment card"><h3>Kundenstammdaten</h3>`;
            for (const [key, value] of Object.entries(obj)) {
                html += `<p><strong>${key}:</strong> ${value}</p>`;
            }
            html += `</div>`;
        }

        // 2. Kontakt-Sektion als kompakte Liste
        if (compositeDataPayload.kontakte) {
            html += `<div class="detail-segment"><h3>Kontaktinformationen</h3><ul class="ui-menu-list">`;
            const kontakteTable = new DataTable(compositeDataPayload.kontakte);
            kontakteTable.getIndexList().forEach(idx => {
                if (idx === 0) return;
                const typ = kontakteTable.getCellValue(idx, "typ");
                const wert = kontakteTable.getCellValue(idx, "wert");
                html += `<li class="ui-static-item"><strong>${typ}:</strong> ${wert}</li>`;
            });
            html += `</ul></div>`;
        }

        // 3. Letzte Bestellungen als Sub-Tabelle
        if (compositeDataPayload.bestellungen) {
            html += `<div class="detail-segment"><h3>Letzte Bestellungen</h3>`;
            const bestellungenTable = new DataTable(compositeDataPayload.bestellungen);
            // Nutzen Sie die bestehende generateTable Methode intern!
            html += UiGenerator.generateTable("subBestellungen", uiConfigTable, bestellungenTable);
            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }
}


export class UiController {
    /**
     * 
     * @param {HTMLElement} appContainer - Der übergeordnete DOM-Container für die Spalten
     */
    constructor(appContainer) {
        /** @type {HTMLElement} */
        this.appContainer = appContainer;

        /** @type {Map<string,DataTable<any>>} */
        this.loadedTables = new Map();

        /** @type {Map<string,string>} */
        this.currentDataIndex = new Map();

        /** @type {DataTable<InfoTableUI>} */
        this.infoTableUI = new DataTable("InfoTableUI", [InfoTableUI_fields], InfoTableUI_unique);
        
        /** @type {DataTable<InfoFormUI>} */
        this.infoFormUI = new DataTable("InfoFormUI", [InfoFormUI_fields], InfoFormUI_unique);

        /** @type {any} - Wird nachgelagert vom Sync-Client besetzt */
        //this.sync = null;
        this.activeContainer = null;
        this.activeRowIdx = 0;
        this.activeColIdx = 0;

        //this.initGlobalEvents();
    }


    /**
     * Entscheidet, ob eine Spalte neu geöffnet oder nur aktualisiert (refreshed) wird
     * @param {string} tableName - Name der Tabelle
     * @param {string} targetType - Zile Typ ? "LIST", "FORM", ...
     * @param {DataTable<any>} dataTable - DatenTabelle
     * @param {string} html - HTML String ????? 
     */
    renderOrUpdateColumn(tableName, targetType, dataTable, html) {
        // Prüfen, ob dieses UI-Element bereits im DOM existiert
        const existingView = document.querySelector(`[data-table-id="${tableName}"][data-target-type="${targetType}"]`);

        // Instanz für spätere Sortierung/Filterung im Cache merken
        this.loadedTables.set(tableName, dataTable);

        if (existingView) {
            // REFRESH: Bestehendes HTML einfach austauschen!
            const bodyContainer = existingView.closest(".app-column-body");
            if (bodyContainer) {
                bodyContainer.innerHTML = html;

                // Dem Controller sagen, er soll das geänderte HTML neu scannen
                /** @type {HTMLElement|null} */
                const newView = bodyContainer.querySelector(".ui-view-container");
                this.parseContainer(newView);
                this.focusContainer(newView);
                return;
            }
        }

        // NEU ANHÄNGEN: Wenn die Spalte noch nicht offen war
        const targetElement = this.appendColumnHTML(tableName, html);
        this.parseContainer(targetElement);
        this.focusContainer(targetElement);
    }

    /**
     * Erstellt eine neue visuelle Spalte im macOS-Finder-Stil, entfernt alle rechts davon stehenden Spalten
     * und bettet das generierte HTML ein.
     * @param {string} title - Titel der Spalte (wird im Header angezeigt)
     * @param {string} innerHtml - Das vom UiGenerator erzeugte HTML
     * @returns {HTMLElement|null} - Das innere Container-Element für den UiController (.ui-view-container)
     */
    appendColumnHTML(title, innerHtml) {
        // 1. Ermittle, von wo aus die Aktion getriggert wurde (aktive Spalte)
        // Falls kein Element aktiv ist, fangen wir bei Spalte 0 an.
        let currentColIdx = -1;
        if (this.activeContainer) {
            const parentCol = this.activeContainer.closest(".app-column");
            if (parentCol) {
                currentColIdx = parseInt(parentCol.getAttribute("data-col-index") || "0", 10);
            }
        }

        // 2. Kaskadierendes Löschen: Alle Spalten RECHTS von der aktuellen Spalte abschneiden
        const targetColIdx = currentColIdx + 1;
        const existingCols = this.appContainer.querySelectorAll(".app-column");
        existingCols.forEach(col => {
            const idx = parseInt(col.getAttribute("data-col-index") || "0", 10);
            if (idx >= targetColIdx) {
                col.remove();
            }
        });

        // 3. Neue Spalten-Hülle bauen
        const colDiv = document.createElement("div");
        colDiv.className = "app-column";
        colDiv.setAttribute("data-col-index", targetColIdx.toString());
        colDiv.style.cssText = "display: flex; flex-direction: column; width: 350px; min-width: 350px; background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e1e4e8; height: 100%;";

        // Spalten-Kopf (Header)
        colDiv.innerHTML = `
            <div class="app-column-header" style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e1e4e8; background: #fafbfc; border-radius: 6px 6px 0 0;">
                ${title}
            </div>
            <div class="app-column-body" style="flex: 1; overflow-y: auto; padding: 10px;">
                ${innerHtml}
            </div>
        `;

        this.appContainer.appendChild(colDiv);

        // Nach rechts scrollen
        this.appContainer.scrollTo({ left: this.appContainer.scrollWidth, behavior: "smooth" });

        // Das interaktive Element für den Controller zurückgeben
        return colDiv.querySelector(".ui-view-container");
    }


    /**
     * Parst einen neu hinzugefügten DOM-Bereich und bindet dynamische JS-Module an Buttons
     * @param {HTMLElement|null} container 
     */
    parseContainer(container) {
        if (!container) {return;}
        // 1. Suche nach interaktiven Elementen (z.B. Buttons mit Modul-Zuweisung)
        const buttons = container.querySelectorAll("button[data-module]");
        buttons.forEach(async (btn) => {
            const modulePath = btn.getAttribute("data-module");
            const functionName = btn.getAttribute("data-function");

            if (modulePath && functionName) {
                // Dynamischer JavaScript-Import zur Laufzeit!
                try {
                    const module = await import(modulePath);
                    btn.addEventListener("click", (e) => {
                        // Rufe die Funktion auf und übergebe den aktuellen Sync-Server & Kontext
                        // todo: Daten als Datensatz Übergeben ????
                        module[functionName]({ event: e, sync: this.sync, btn: btn });
                    });
                } catch (err) {
                    console.error(`Fehler beim Laden des Moduls ${modulePath}:`, err);
                }
            }
        });

        // 2. Klick-Navigation zur Maus-Unterstützung
        container.addEventListener("click", (e) => {
            const target = e.target;
            if (!(target instanceof HTMLElement)) { return; }
            const viewContainer = target.closest(".ui-view-container");
            if (viewContainer instanceof HTMLElement) {
                this.focusContainer(viewContainer);

                // Falls auf eine Tabellenzeile geklickt wurde:
                const tr = target.closest("tr");
                const tr_parent = tr?.parentNode;
                if (tr && tr_parent instanceof HTMLElement && tr_parent.tagName === "TBODY") {
                    this.activeRowIdx = tr.rowIndex - 1; // Ohne Header
                    this.updateVisualFocus();
                }
            }
        });
    }

    /**
     * Setzt den Fokus auf das angegebene Element
     * @param {HTMLElement|null} el - Element welches den Fokus erhält
     */
    focusContainer(el) {
        if (!el) {return;}
        if (this.activeContainer) this.activeContainer.classList.remove("focused");
        this.activeContainer = el;
        this.activeContainer.classList.add("focused");
        this.activeContainer.focus();
        this.activeRowIdx = 0;
        this.activeColIdx = 0;
        this.updateVisualFocus();
    }

    initGlobalEvents() {
        window.addEventListener("keydown", (e) => {
            if (!this.activeContainer) return;

            const targetType = this.activeContainer.getAttribute("data-target-type");

            if (targetType === "LIST" || targetType === "MENU") {
                this.handleTableNavigation(e);

            } else if (targetType === "FORM") {
                this.handleFormNavigation(e);
            }
            // Alt + Pfeiltasten für Spaltenwechsel
            if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
                const currentCol = this.activeContainer.closest(".app-column");
                if (!currentCol) return;
                const currentIdx = parseInt(currentCol.getAttribute("data-col-index") || "0", 10);
                let targetIdx = e.key === "ArrowLeft" ? currentIdx - 1 : currentIdx + 1;
                const targetCol = this.appContainer.querySelector(`.app - column[data - col - index="${targetIdx}"]`);
                if (targetCol) {
                    const viewContainer = targetCol.querySelector(".ui-view-container");
                    if (viewContainer instanceof HTMLElement) {
                        this.focusContainer(viewContainer);
                        e.preventDefault();
                    }
                }
            }
        });
    }

    // initGlobalEvents_old() {
    //     window.addEventListener("keydown", (e) => {
    //         if (!this.activeContainer) return;

    //         const targetType = this.activeContainer.getAttribute("data-target-type");

    //         if (targetType === "LIST" || targetType === "MENU") {
    //             this.handleTableNavigation(e); // Nutzt dieselbe Zeilen-Navigation
    //         } else if (targetType === "FORM") {
    //             this.handleFormNavigation(e);
    //         }
    //     });
    // }



    /**
     * Verarbeitet die TastaturEvents auf einer Tabelle
     * @param {KeyboardEvent} e - Event für die Tastur Eingaben
     * @returns {ClientServerMessage|undefined}
     */
    handleTableNavigation(e) {
        const tbody = this.activeContainer?.querySelector("tbody");
        const thead = this.activeContainer?.querySelector("thead");
        if (!tbody || !thead) return;

        const maxRows = tbody.rows.length;
        const tableId = this.activeContainer?.getAttribute("data-table-id") || "";

        // Hole den technischen Spaltennamen basierend auf der aktuellen Zelle
        const th = thead.rows[0].cells[this.activeColIdx];
        const columnName = th?.getAttribute("data-col-name") || "";

        // Standard-Pfeiltasten-Navigation (Zelle / Zeile wechseln)
        if (e.key === "ArrowRight") {
            const currentRowsCells = tbody.rows[this.activeRowIdx]?.cells.length || 0;
            if (this.activeColIdx < currentRowsCells - 1) { this.activeColIdx++; e.preventDefault(); }
        }
        if (e.key === "ArrowLeft") {
            if (this.activeColIdx > 0) { this.activeColIdx--; e.preventDefault(); }
        }
        if (e.key === "ArrowDown" && this.activeRowIdx < maxRows - 1) {
            this.activeRowIdx++; e.preventDefault();
        }
        if (e.key === "ArrowUp" && this.activeRowIdx > 0) {
            this.activeRowIdx--; e.preventDefault();
        }

        // --- NEU: TASTENBEFEHLE FÜR AKTIONEN ---

        // 1. SORTIEREN (Taste "s" oder "S")
        if (e.key.toLowerCase() === "s" && columnName) {
            e.preventDefault();
            const mode = "CLIENT"; // Oder "SERVER" per Konfigurations-Flag der App

            if (mode === "CLIENT") {
                console.log(`Lokal sortieren nach: ${columnName}`);
                const currentTable = this.loadedTables.get(tableId);

                if (currentTable) {
                    currentTable.sort([columnName]); // Ihre eingebaute Sortierfunktion

                    // 1. HTML mit den frisch sortierten Daten neu generieren
                    const updatedHtml = UiGenerator.generateTable(tableId, this.infoTableUI, currentTable);

                    // 2. KORREKTUR: Die soeben geschriebene Methode nutzen, um das HTML auszutauschen
                    this.renderOrUpdateColumn(tableId, "LIST", currentTable, updatedHtml || "");
                }
            } else {
                // Server-seitig
                return {type: "GET_DATA", tableName: tableId, targetType: "LIST", payload: { action: "SORT", column: columnName } };
            }
        }

        // 2. FILTERN (Taste "f" oder "F")
        if (e.key.toLowerCase() === "f" && columnName) {
            e.preventDefault();
            const activeCell = tbody.rows[this.activeRowIdx]?.cells[this.activeColIdx];
            const cellValue = activeCell?.textContent;
            const mode = "CLIENT";

            if (mode === "CLIENT") {
                console.log(`Lokal filtern: ${columnName} = ${cellValue}`);
                const currentTable = this.loadedTables.get(tableId);
                if (currentTable) {
                    // Erstellt eine gefilterte Kopie oder mutiert die Tabelle temporär
                    const filteredTable = currentTable.filter(columnName, cellValue);
                    AppCore.refreshColumnHTML(tableId, filteredTable);
                }
            } else {
                // Server-seitig
                return {type: "GET_DATA", tableName: tableId, targetType: "LIST", payload: { action: "FILTER", column: columnName, value: cellValue }};
            }
        }

        // 3. REFRESH VOM SERVER ERZWINGEN (Taste "r" oder "R")
        if (e.key.toLowerCase() === "r") {
            e.preventDefault();
            return{ type:"GET_DATA", tableName: tableId, targetType: "LIST", payload: { action: "REFRESH" } };
        }

        // 4. ENTER (Datensatz öffnen / in die nächste Spalte wandern)
        if (e.key === "Enter") {
            e.preventDefault();
            const activeRow = tbody.rows[this.activeRowIdx];
            const recordId = activeRow?.getAttribute("data-record-id");

            return {type: "GET_DATA", tableName: tableId, recordId: recordId, targetType: "FORM" };
        }

        this.updateVisualFocus();
    }


    // /**
    //  * Verarbeitet die TastaturEvents auf einer Tabelle
    //  * @param {KeyboardEvent} e - Event für die Tastur Eingaben
    //  * @returns {void}
    //  */
    // handleTableNavigation_old2(e) {
    //     const targetType = this.activeContainer?.getAttribute("data-target-type");

    //     // Abstraktion: Entweder Zeilen im tbody (Tabelle) oder li-Elemente (Menü)
    //     const items = targetType === "MENU"
    //         ? Array.from(this.activeContainer?.querySelectorAll(".ui-menu-item") || [])
    //         : Array.from(this.activeContainer?.querySelectorAll("tbody tr") || []);

    //     if (items.length === 0) return;

    //     if (e.key === "ArrowDown" && this.activeRowIdx < items.length - 1) {
    //         this.activeRowIdx++; e.preventDefault();
    //     }
    //     if (e.key === "ArrowUp" && this.activeRowIdx > 0) {
    //         this.activeRowIdx--; e.preventDefault();
    //     }

    //     if (e.key === "Enter") {
    //         e.preventDefault();
    //         const activeItem = items[this.activeRowIdx];
    //         const recordId = activeItem.getAttribute("data-record-id");
    //         const tableId = this.activeContainer?.getAttribute("data-table-id");

    //         // Über die Kanten-Spezifikation (InfoEdge) weiß der Server, was als nächstes kommt!
    //         this.sync.ws?.send(JSON.stringify({
    //             type: "GET_DATA",
    //             tableName: tableId,
    //             recordId: recordId,
    //             targetType: targetType === "MENU" ? "LIST" : "FORM"
    //         }));
    //     }

    //     this.updateVisualFocus();
    // }


    // /**
    //  * Verarbeitet die TastaturEvents auf einer Tabelle
    //  * @param {KeyboardEvent} e - Event für die Tastur Eingaben
    //  * @returns {void}
    //  */
    // handleTableNavigation_old(e) {
    //     const tbody = this.activeContainer?.querySelector("tbody");
    //     if (!tbody) return;
    //     const maxRows = tbody.rows.length;

    //     if (e.key === "ArrowDown" && this.activeRowIdx < maxRows - 1) {
    //         this.activeRowIdx++; e.preventDefault();
    //     }
    //     if (e.key === "ArrowUp" && this.activeRowIdx > 0) {
    //         this.activeRowIdx--; e.preventDefault();
    //     }

    //     if (e.key === "Enter") {
    //         e.preventDefault();
    //         const activeRow = tbody.rows[this.activeRowIdx];
    //         const recordId = activeRow.getAttribute("data-record-id");
    //         const tableId = this.activeContainer?.getAttribute("data-table-id");

    //         // Trigger an Server (Nächste Spalte anfordern)
    //         this.sync.ws?.send(JSON.stringify({
    //             type: "GET_DATA",
    //             tableName: tableId,
    //             recordId: recordId,
    //             targetType: "FORM" // Server weiß, er soll Formular-Daten schicken
    //         }));
    //     }

    //     this.updateVisualFocus();
    // }

    /**
     * Verarbeitet die TastaturEvents auf einem Formular
     * @param {KeyboardEvent} e - Event für die Tastur Eingaben
     * @returns {ClientServerMessage|undefined}
     */
    handleFormNavigation(e) {
        // Im Formular navigieren wir durch die Elemente mit "data-focusable"
        const focusables = Array.from(this.activeContainer?.querySelectorAll("[data-focusable='true']") || []);
        let currentIdx = document.activeElement ? focusables.indexOf(document.activeElement) : 0;

        if (e.key === "ArrowDown" || e.key === "Tab") {
            e.preventDefault();
            currentIdx = (currentIdx + 1) % focusables.length;
            //@ts-ignore
            focusables[currentIdx].focus();
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            currentIdx = (currentIdx - 1 + focusables.length) % focusables.length;
            //@ts-ignore
            focusables[currentIdx].focus();
        }
        return;
    }

    updateVisualFocus() {
        if (!this.activeContainer) return;

        // Alle alten Fokuseffekte aufheben
        //@ts-ignore todo: Verbessern
        this.activeContainer.querySelectorAll(".active-row, .active-menu-item").forEach(el => {
            el.classList.remove("active-row", "active-menu-item");
        });

        const targetType = this.activeContainer.getAttribute("data-target-type");

        if (targetType === "MENU") {
            const items = this.activeContainer.querySelectorAll(".ui-menu-item");
            if (items[this.activeRowIdx]) items[this.activeRowIdx].classList.add("active-menu-item");
        } else if (targetType === "LIST") {
            const tbody = this.activeContainer.querySelector("tbody");
            if (tbody && tbody.rows[this.activeRowIdx]) tbody.rows[this.activeRowIdx].classList.add("active-row");
        }
    }

    // updateVisualFocus_old() {
    //     if (!this.activeContainer) return;

    //     // Entferne alte CSS-Klassen
    //     this.activeContainer.querySelectorAll(".active-row").forEach(el => el.classList.remove("active-row"));

    //     const type = this.activeContainer.getAttribute("data-ui-type");
    //     if (type === "table") {
    //         const tbody = this.activeContainer.querySelector("tbody");
    //         if (tbody && tbody.rows[this.activeRowIdx]) {
    //             tbody.rows[this.activeRowIdx].classList.add("active-row");
    //         }
    //     }
    // }

    /**
     * Prüft alle Felder eines Formulars gegen die geladenen Schemas
     * @param {HTMLElement} formContainer 
     */
    validateFormFields(formContainer) {
        const formId = formContainer.getAttribute("data-form-id");
        const inputs = formContainer.querySelectorAll("input[data-field]");
        let hasAnyError = false;

        inputs.forEach(input => {
            const fieldName = input.getAttribute("data-field");
            const value = input.value;

            // Hier rufen Sie Ihre bestehende Schema-Validierungs-Logik auf!
            // Angenommen, diese liefert { isValid: false, message: "Pflichtfeld" }
            const validationResult = YourCustomSchemaClass.validate(formId, fieldName, value);

            // Vorherige Fehler-Stylings aufräumen
            input.classList.remove("input-error");
            const existingMsg = input.parentNode.querySelector(".error-message");
            if (existingMsg) existingMsg.remove();

            if (!validationResult.isValid) {
                hasAnyError = true;
                input.classList.add("input-error"); // Macht den Rahmen z.B. rot via CSS

                // Fehlermeldung als Text unter dem Input einfügen
                const errorSpan = document.createElement("span");
                errorSpan.className = "error-message";
                errorSpan.style.cssText = "color: red; font-size: 12px; display: block; margin-top: 4px;";
                errorSpan.textContent = validationResult.message;
                input.parentNode.appendChild(errorSpan);
            }
        });

        return !hasAnyError; // Gibt true zurück, wenn alles fehlerfrei ist
    }
}





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
                        this.uiController.infoTableUI = new DataTable("TableUI", data.payload.infoTables, InfoTableUI_unique);
                        this.uiController.infoFormUI = new DataTable("FormUI", data.payload.infoForms, InfoFormUI_unique);
                    }
                
                    if (data.rows) {
                        // Das Hauptmenü kommt vom Server. Da es im DataTable-Format vorliegt,
                        // behandeln wir es wie eine Tabelle, die gerendert wird.
                        const menuTable = new DataTable("System_Menu", data.rows, data.idColName);

                        // Wir nutzen den Generator (für Menüs oder Listen)
                        // HINWEIS: Hier greifen wir auf das global geladene UI-Schema zu
                        const html = UiGenerator.generateMenu("System_Menue", this.uiController.infoTableUI, menuTable);
                        this.uiController.renderOrUpdateColumn("System_Menue", "MENU", menuTable, html);

                        // // Spalte im UI anhängen (Hier nutzen wir Ihr AppCore-Prinzip)
                        // const targetElement = AppCore.appendColumnHTML("Hauptmenü", html);

                        // // Controller scannt das Menü für Pfeiltasten & Buttons
                        // if (this.uiController) {
                        //     this.uiController.parseContainer(targetElement);
                        //     this.uiController.focusContainer(targetElement);
                        // }
                    }
                    break;

                case "LOCK_UPDATED":
                    // Optional: Sperr-Status im UI visualisieren (z.B. Zeile rot färben)
                    break;

                case "DATA":
                    if (!data.rows) return;

                    // Verwandle die Array-of-Arrays Zeilen in ein echtes DataTable-Objekt
                    const incomingTable = new DataTable(data.tableName || "", data.rows, data.idColName);
                    let generatedHtml = "";

                    // Je nach data.targetType die Antwort-Daten verarbeiten
                    switch (data.targetType) {
                        case "LIST":
                            // Generiert die HTML-Tabelle anhand der UI-Konfigurations-Tabelle
                            generatedHtml = UiGenerator.generateTable(data.tableName || "", this.uiLayoutTable, incomingTable) || "";
                            break;

                        case "FORM":
                            // Konvertiert die erste Zeile der Daten in ein flaches Objekt für das Formular
                            const currentRecordObj = incomingTable.getObject(1); // Holt die Zeile 1 als Key-Value-Paar
                            generatedHtml = UiGenerator.generateForm(data.tableName || "", this.uiLayoutTable, currentRecordObj);
                            break;

                        case "DETAIL":
                            // Analog für Detailansichten
                            generatedHtml = UiGenerator.generateDetail(data.tableName || "", this.uiLayoutTable, incomingTable);
                            break;
                    }

                    // Das generierte HTML in eine neue Spalte rendern und dem Controller übergeben
                    if (generatedHtml && this.uiController) {
                        // Delegiert an den Controller
                        this.uiController.renderOrUpdateColumn(data.tableName, data.targetType, incomingTable, generatedHtml);                        
                        // const targetElement = AppCore.appendColumnHTML(data.tableName, generatedHtml);
                        // AppCore.renderOrUpdateColumn(data.tableName, data.targetType, incomingTable, generatedHtml);

                        // // Der magische Schritt: Der Controller übernimmt Tastatur & Button-Module
                        // this.uiController.parseContainer(targetElement);
                        // this.uiController.focusContainer(targetElement);
                    }
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
            
            // wenn UI - startet mit "ui."
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

export class AppCore {
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
