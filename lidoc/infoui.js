// =========================================================================
//   DYNAMISCHES SPALTEN-UI & KEYBOARD ROUTER (infoui.js)
// =========================================================================
// @ts-check

import { DataTable } from "./infotable.js";

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
 * Das einheitliche WebSocket-Nachrichtenformat für die Kommunikation zwischen Client und Server.
 * @typedef {Object} ClientServerMessage
 * @property {"GET_DATA" | "REQUEST_LOCK" | "RELEASE_LOCK" | "SAVE_DATA" | "DELETE_DATA" | "SAVE_CONFIG"} type - Aktionstyp
 * @property {string} [driverId] - Ziel-Treiber für die Aktion
 * @property {string} [tableName] - Ziel-Tabelle für die Aktion
 * @property {string} [recordId] - Ziel-Datensatz-ID (falls anwendbar)
 * @property {string} [idColName] - Name der Primärschlüssel-Spalte (Standard meist "gsid")
 * @property {string} [targetType] - Für Navigation: Welcher UI-Typ wird erwartet ("MENU" | "TABLE" | "FORM" | "DETAIL" | "WIZARD")
 * @property {string} [payload] - Freitext-Feld für Payloads (z.B. komplettes Config-JSON oder Schema-JSON)
 * @property {DataRows} [rows] - Das Datenpaket (entweder gesamte Tabelle oder Delta-Array bei SAVE)
 */

// HTML-Template: Ein einziger flexibler Container für unendlich anbaubare Spalten nach rechts
const base_html = `
<div id="app-container" style="display: flex; flex-direction: row; overflow-x: auto; width: 100vw; height: 100vh; gap: 10px; padding: 10px; box-sizing: border-box;">
  <!-- Spalten werden hier dynamisch per JS eingehängt -->
</div>
`;

/**
 * Basis-Controller für alle Spalten-Typen
 * @template T
 */
class ListController {
    /**
     * @param {string} columnId - Eindeutige ID dieser Spalte
     * @param {DataRows} rawRows - Zweidimensionales JSON-Array vom Server
     */
    constructor(columnId, rawRows) {
        this.columnId = columnId;
        this.headers = rawRows[0];
        this.contentRows = rawRows.slice(1);

        this.selectedRow = 0; // Index im contentRows Array (0-basiert)
        this.selectedCol = 0; // Aktive Zelle

        // Erstelle das physische Spalten-Element für den DOM
        this.domElement = document.createElement("div");
        this.domElement.id = `col_${columnId}`;
        this.domElement.className = "ui-column";
        this.domElement.style.cssText = "flex: 0 0 350px; height: 100%; border-right: 1px solid #ccc; display: flex; flex-direction: column; overflow-y: auto;";
    }

    /** Setzt visuelle Aktiv-Klassen auf die ausgewählte Zeile */
    setActive() {
        const rows = this.domElement.querySelectorAll("tbody tr, .menu-item");
        rows.forEach(r => r.classList.remove("active"));

        const activeRow = rows[this.selectedRow];
        if (activeRow) {
            activeRow.classList.add("active");
            activeRow.scrollIntoView({ block: "nearest" });
        }
    }

    moveUp() {
        if (this.selectedRow > 0) {
            this.selectedRow -= 1;
            this.setActive();
        }
    }

    moveDown() {
        if (this.selectedRow < this.contentRows.length - 1) {
            this.selectedRow += 1;
            this.setActive();
        }
    }

    /** Liefert die ID (Wert aus der gsid/id Spalte) der aktuell selektierten Zeile */
    getSelectedId() {
        const idIdx = this.headers.findIndex(h => h === "gsid" || h === "id" || h === "ID" || h === "id" || h === "TableName" || h === "TreiberID");
        if (idIdx !== -1 && this.contentRows[this.selectedRow]) {
            return String(this.contentRows[this.selectedRow][idIdx]);
        }
        return "";
    }

    /** Holt das gesamte selektierte Zeilen-Array */
    getSelectedRowData() {
        return this.contentRows[this.selectedRow];
    }

    render() {
        // Wird von Ableitungen implementiert
    }
}

/**
 * Komponente für klassische Auswahllisten (z.B. Hauptmenü, Tabellenliste)
 * @extends {ListController<any>}
 */
export class MenuComponent extends ListController {
    render() {
        const labelIdx = this.headers.findIndex(h => h === "Label" || h === "Tabelle" || h === "Aktion" || h === "name" || h === "Anzeigename");
        const displayIdx = labelIdx !== -1 ? labelIdx : 0;

        let html = `<div style="padding: 5px; font-weight: bold; background: #eee;">Menü</div>`;
        html += `<div class="menu-list" style="display: flex; flex-direction: column; gap: 2px;">`;

        this.contentRows.forEach((row, idx) => {
            html += `<div class="menu-item" data-index="${idx}" style="padding: 8px; cursor: pointer; border-bottom: 1px solid #f00;">
                ${row[displayIdx] || "Unbekannter Eintrag"}
            </div>`;
        });
        html += `</div>`;

        this.domElement.innerHTML = html;
        this.setActive();
        return this.domElement;
    }
}

/**
 * Komponente für die tabellarische Datenansicht (InfoTable)
 * @extends {ListController<any>}
 */
export class TableComponent extends ListController {
    render() {
        let html = `<table style="width: 100%; border-collapse: collapse;">`;
        html += `<thead><tr style="position: sticky; top: 0; background: #ddd;">`;

        this.headers.forEach(h => {
            html += `<th style="border: 1px solid #ccc; padding: 6px; text-align: left;">${h}</th>`;
        });
        html += `</tr></thead><tbody>`;

        this.contentRows.forEach((row, rIdx) => {
            html += `<tr data-index="${rIdx}" style="cursor: pointer;">`;
            row.forEach(cell => {
                html += `<td style="border: 1px solid #ccc; padding: 6px;">${cell !== null ? cell : ""}</td>`;
            });
            html += `</tr>`;
        });
        html += `</tbody></table>`;

        this.domElement.innerHTML = html;
        this.setActive();
        return this.domElement;
    }
}

/**
 * Komponente für die Datensatz-Modifikation (Generiert Formular aus Datenzeilen)
 */
export class FormComponent {
    /**
     * @param {string} columnId 
     * @param {DataRows} rawRows - Zeile 0: Header, Zeile 1: Werte
     */
    constructor(columnId, rawRows) {
        this.columnId = columnId;
        this.headers = rawRows[0];
        this.values = rawRows[1] || this.headers.map(() => ""); // Leere Werte bei neuem Eintrag

        this.domElement = document.createElement("div");
        this.domElement.id = `col_${columnId}`;
        this.domElement.className = "ui-column form-column";
        this.domElement.style.cssText = "flex: 0 0 400px; height: 100%; padding: 10px; display: flex; flex-direction: column; overflow-y: auto; box-sizing: border-box;";
    }

    render() {
        let html = `<form id="active-form" style="display: flex; flex-direction: column; gap: 10px;">`;

        this.headers.forEach((header, idx) => {
            const isId = header?.toLowerCase() === "gsid" || header.toLowerCase() === "id";
            html += `<div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-weight: bold; font-size: 12px;">${header.toUpperCase()}</label>
                <input type="text" name="${header}" value="${this.values[idx] !== null ? this.values[idx] : ""}" 
                       ${isId ? "readonly style='background: #eee; cursor: not-allowed;'" : ""} 
                       style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
            </div>`;
        });

        html += `<button type="submit" style="margin-top: 10px; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Speichern (ENTER)</button>`;
        html += `</form>`;

        this.domElement.innerHTML = html;

        // Ersten nicht-schreibgeschützten Input automatisch fokussieren
        setTimeout(() => {
            /** @type {HTMLInputElement|null} */
            const firstInput = this.domElement.querySelector("input:not([readonly])");
            firstInput?.focus();
        }, 50);

        return this.domElement;
    }

    /**
     * Sammelt alle geänderten Daten und baut das geforderte Delta-Array
     * @returns {DataRows} [ [Headers], [Inputs] ]
     */
    getFormDataRows() {
        const form = this.domElement.querySelector("form");
        if (!form) return [this.headers, this.values];

        const formData = new FormData(form);
        /** @type {DataRow} */
        const rowValues = [];

        this.headers.forEach(header => {
            rowValues.push(formData.get(header)?.toString() || null);
        });

        return [this.headers, rowValues];
    }
}

/**
 * Zentraler Tastatur-Router & WebSocket Orchestrator
 * @template T
 */
export class KeyboardRouter {
    /**
     * @param {string} appContainerId - Container für die Miller Columns
     * @param {WebSocket} socket - Aktive WebSocket-Verbindung zum Bun Proxy
     */
    constructor(appContainerId, socket) {
        /** @type {Array<ListController<T>|FormComponent>} Spaltenkette von links nach rechts */
        this.componentStack = [];
        this.container = document.getElementById(appContainerId);
        this.socket = socket;

        this.initGlobalListener();
    }

    /**
     * Pusht eine neue Daten-Spalte rechts an die Kette an
     * @param {ListController<T>|FormComponent} component 
     */
    pushActive(component) {
        // Render das DOM Element
        const renderedNode = component.render();
        if (this.container && renderedNode) {
            this.container.appendChild(renderedNode);
            this.componentStack.push(component);
            // Automatischer Horizontaler Scroll nach ganz rechts zur neuen Spalte
            this.container.scrollLeft = this.container.scrollWidth;
        }
    }

    /**
     * Schneidet alle Spalten rechts ab einem bestimmten Index ab
     * @param {number} colIndex 
     */
    clearColumnsFrom(colIndex) {
        while (this.componentStack.length > colIndex) {
            const removed = this.componentStack.pop();
            if (removed && removed.domElement && this.container) {
                this.container.removeChild(removed.domElement);
            }
        }
    }

    /** @returns {ListController<T>|FormComponent} */
    getActiveComponent() {
        return this.componentStack[this.componentStack.length - 1];
    }

    /** @returns {number} */
    getActiveIndex() {
        return this.componentStack.length - 1;
    }

    initGlobalListener() {
        // MAUS-KLICK: Wechselt die aktive Spalte und wirft rechte Spalten ab
        window.document.addEventListener("click", (e) => {
            const target = e.target;
            if (target instanceof HTMLElement) {
                const columnDom = target.closest(".ui-column");
                if (columnDom) {
                    const colIdx = this.componentStack.findIndex(comp => comp.domElement === columnDom);
                    if (colIdx !== -1 && colIdx < this.getActiveIndex()) {
                        // Benutzer klickt in eine linke Spalte -> Schneide alles rechts davon ab
                        this.clearColumnsFrom(colIdx + 1);
                        this.getActiveComponent().setActive();
                    }
                }
            }
        });

        // TASTATUR-STEUERUNG
        window.addEventListener('keydown', (e) => {
            const active = this.getActiveComponent();
            if (!active) return;
            // Formular-Zustand (Tippen erlaubt, ENTER speichert)
            if (active instanceof FormComponent) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    // Lock freigeben beim Verlassen des Formulars!
                    const prevComp = this.componentStack[this.getActiveIndex() - 1];
                    if (prevComp instanceof ListController) {
                        this.socket.send(JSON.stringify({
                            type: "RELEASE_LOCK"
                            , driverId: prevComp.domElement.dataset.driverId
                            , tableName: prevComp.domElement.dataset.tableName
                            , recordId: prevComp.getSelectedId()
                        }));
                    } this.clearColumnsFrom(this.getActiveIndex());
                    // Schließe Formular-Spalte
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const prevComp = this.componentStack[this.getActiveIndex() - 1];
                    if (prevComp instanceof ListController) {
                        // Sende das Delta-Speicherpaket an den Server
                        this.socket.send(JSON.stringify({
                            type: "SAVE_DATA"
                            , driverId: prevComp.domElement.dataset.driverId
                            , tableName: prevComp.domElement.dataset.tableName
                            , recordId: prevComp.getSelectedId()
                            , rows: active.getFormDataRows()
                        }));
                    }
                } return;
            }
            // Listen-Zustand (Pfeiltasten-Navigation)
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    active.moveDown();
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    active.moveUp();
                    break;

                case 'Enter':
                    e.preventDefault();
                    const selectedId = active.getSelectedId();
                    const currentIdx = this.getActiveIndex();
                    // Wenn wir im Hauptmenü oder der Tabellenliste sind -> Fordere Tabellendaten an (GET_DATA)
                    if (active instanceof MenuComponent) {
                        this.clearColumnsFrom(currentIdx + 1);
                        // Spalten rechts abreißen
                        const rowData = active.getSelectedRowData();
                        const targetType = String(rowData[active.headers.indexOf("TargetType")]);
                        this.socket.send(JSON.stringify({
                            type: "GET_DATA"
                            , targetType: targetType
                            , payload: selectedId
                            , driverId: active.domElement.dataset.driverId || selectedId
                            , tableName: selectedId
                        }));
                    }
                    // Wenn wir in einer Daten-Tabelle stehen -> Fordere Editier-Rechte an (REQUEST_LOCK)
                    else if (active instanceof TableComponent) {
                        this.clearColumnsFrom(currentIdx + 1);
                        this.socket.send(JSON.stringify({
                            type: "REQUEST_LOCK"
                            , driverId: active.domElement.dataset.driverId
                            , tableName: active.domElement.dataset.tableName
                            , recordId: selectedId
                        }));
                    } break;

                case 'Delete': 
                    //case 'Backspace':
                    // Datensatz löschen über ENTF-Taste
                    if (active instanceof TableComponent) {
                        e.preventDefault();
                        if (confirm(`Datensatz '${active.getSelectedId()}' wirklich unwiderruflich löschen?`)) {
                            this.socket.send(JSON.stringify({
                                type: "DELETE_DATA"
                                , driverId: active.domElement.dataset.driverId
                                , tableName: active.domElement.dataset.tableName
                                , recordId: active.getSelectedId()
                            }));
                        }
                    }
                    break;

                case 'Escape':
                    e.preventDefault();
                    if (this.componentStack.length > 1) {
                        this.clearColumnsFrom(this.getActiveIndex());
                    }

                    break;
            }
        });
    }
}
