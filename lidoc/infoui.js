// =========================================================================
//   DYNAMISCHES SPALTEN-UI & KEYBOARD ROUTER (infoui.js)
// =========================================================================
// @ts-check

import { DataTable } from "./infotable.js";

// ==================================
//   Typen
// -------------

/**
 * Knoten für jedes Element im System
 * @typedef {object} InfoNode
 * @property {string} id - UUID oder eindeutiger String (z.B. "jira-PROJ-123", "md-uuid")
 * @property {string} type - 'markdown', 'task', 'jira', 'xwiki', 'pdf', 'schema'
 * @property {string} title - Anzeige Text
 * @property {string} source_path - Pfad / Url zu Markdown,HTML, DB-Tabelle, Jira, XWiki, usw..
 * @property {string} created_at - (datetime) Zeitstempel wann die Node angelegt worden ist
 */
const InfoNode_fields = ["id", "type", "title", "source_path", "created_at"];

/**
 * Knoten/Veknüpfung verknüpft alles mit allem (Richtung unabhängig)
 * @typedef {object} InfoEdge
 * @property {string} source_id - InfoNode.id Quelle
 * @property {string} target_id - InfoNode.id Ziel
 * @property {string} relation_type - 'blocks', 'documents', 'required_for', 'tagged_with'
 */
const InfoEdge_fields = ["source_id", "target_id", "relation_type"];

/**
 * Tags für die schnelle Suche
 * @typedef {object} InfoTag
 * @property {string} node_id - ID der InfoNode zu der dieser Tag gehört
 * @property {string} tag - Name/Bezeichnung des Tags
 */
const InfoTag_fields = ["node_id", "tag"];

/**
 * DatenTypen vom Server, damit diese gleich sind am Client
 * @import {DataRow, DataRows, MessageType, TargetType, ClientServerMessage} from "./bun_infoserver.js"
 */


// HTML-Template: Ein einziger flexibler Container für unendlich anbaubare Spalten nach rechts
const base_html = `
<div id="app-container" style="display: flex; flex-direction: row; overflow-x: auto; width: 100vw; height: 100vh; gap: 10px; padding: 10px; box-sizing: border-box;">
  <!-- Spalten werden hier dynamisch per JS eingehängt -->
</div>
`;


// ============ Beispiel Verwendung =================
// <!-- Die Container, in die die Tabellen generiert werden -->
// <div id="kundenTabellenContainer"></div>
// <div id="artikelTabellenContainer"></div>

// <script type="module">
//     import { DataTable } from "./data-table.js";
//     import { InteractiveTable } from "./infoui.js";

//     // --- Tabelle 1: Kunden ---
//     const kundenDaten = [
//         ["gsid", "name", "stadt"],
//         ["k1", "Max", "Wien"],
//         ["k2", "Anna", "Berlin"]
//     ];
//     const kundenTable = new DataTable("Kunden", kundenDaten, "gsid");
//     const kundenUI = new InteractiveTable(kundenTable, "kundenTabellenContainer");

//     // --- Tabelle 2: Artikel ---
//     const artikelDaten = [
//         ["gsid", "bezeichnung", "preis"],
//         ["a1", "Schraube", 0.15],
//         ["a2", "Hammer", 14.99]
//     ];
//     const artikelTable = new DataTable("Artikel", artikelDaten, "gsid");
//     const artikelUI = new InteractiveTable(artikelTable, "artikelTabellenContainer");

//     // Standardmäßig die erste Tabelle aktivieren
//     InteractiveTable.setActive(kundenUI);
// </script>




export class InteractiveTable {
    // Statische Eigenschaft: Merkt sich global, welche Instanz gerade aktiv ist
    ///** @type {InteractiveTable|null} */
    //static activeInstance = null;

    /** @type {Array<number>} */
    rowIndexes = [];

    /** @type {Array<number>} */
    colIndexes = [];

    /** @type {Array<string>} */
    colNames = [];

    /** @type {Array<string>} */
    colDisplayNames = [];

    /**
     * @param {DataTable<any>} dataTable - Die Instanz deiner DataTable-Klasse
     * @param {string} driverId - Die ID des Datenbank Treibers
     */
    constructor(dataTable, driverId) {
        this.dataTable = dataTable;
        this.driverId = driverId;
        // this.container = document.getElementById(containerId) || new HTMLDivElement();

        // Container dynamisch generieren statt fixer ID
        this.container = document.createElement("div");
        this.container.className = "table-wrapper";
        this.container.style.cssText = "margin-bottom: 15px; padding: 8px; border: 2px solid #ccc; border-radius: 4px; background: #fff;";

        this.activeRowIdx = 0;   // UI-Zeilenfokus
        this.activeColIdx = 0;   // UI-Spaltenfokus
        this.aktuellerIndexName = undefined; // Sortier-/Filter-Indexname

        // Aktuelle Indexes und Namen lesen
        this.rowIndexes = this.dataTable.getIndexList(this.aktuellerIndexName);
        this.colNames = this.dataTable.getCols();
        this.colIndexes = this.dataTable.getColIndex(this.colNames);
        this.colDisplayNames = this.colNames;

        this.initDOM();
    }

    /** Erstellt das Grundgerüst der Tabelle und registriert das Klick-Event */
    initDOM() {
        this.container.innerHTML = `
            <div class="table-wrapper" style="margin-bottom: 30px; padding: 10px; border: 2px solid #ccc;">
                <h4 class="table-title" style="margin-top:0;">Tabelle: ${this.dataTable.tableName}</h4>
                <table style="border-collapse: collapse; width: 100%; font-family: sans-serif;">
                    <thead><tr class="header-row"></tr></thead>
                    <tbody class="table-body"></tbody>
                </table>
            </div>
        `;

        // Sobald der User in diese Tabelle klickt, wird sie zur aktiven Tabelle
        this.container.addEventListener("click", () => {
            // InteractiveTable.setActiveTable(this);

            // todo: ??? Finde heraus, in welcher Spalte diese Tabelle liegt
            const colIdx = AppCore.columns.findIndex(c => c.components.includes(this));
            if (colIdx !== -1) {
                AppCore.activeColIndex = colIdx;
                AppCore.columns[colIdx].activeComponentIndex = AppCore.columns[colIdx].components.indexOf(this);
                AppCore.columns[colIdx].focus();
            }
        });

        this.render();
    }

    /** 
     * Setzt die aktive Tabelle global und aktualisiert das visuelle Feedback
     * @param {InteractiveTable} instance - Interaktive Tabelle
     */
    static setActiveTable(instance) {
        if (instance instanceof InteractiveTable) {
            // Alten Rahmen entfernen
            //if (InteractiveTable.activeInstance) {
            //    //@ts-ignore
            //    InteractiveTableUI.activeInstance.container.querySelector(".table-wrapper").style.borderColor = "#ccc";
            //}

            // Neue Instanz setzen
            // InteractiveTable.activeInstance = instance;
            // const elm = instance.container.querySelector(".table-wrapper");
            // if (elm instanceof HTMLElement) {
            //     elm.style.borderColor = "#0056b3"; // Blau markieren
            // }
        }
    }

    /** Setzt visuelle Aktiv-Klassen auf die ausgewählte Zeile */
    setActiveCell() {
        // Bestehendes "active" entfernen
        const nodes = this.container.querySelectorAll(".active");
        nodes.forEach(r => r.classList.remove("active"));

        // neues active setzen
        const tbody = this.container.querySelector("tbody");
        if (tbody) {
            const activeRow = tbody.rows[this.activeRowIdx];
            if (activeRow) {
                activeRow.classList.add("active");
                const activeCell = activeRow.cells[this.activeColIdx];

                // Zu aktiver Zeile und Spalte springen 
                activeCell.classList.add("active");
                activeCell.scrollIntoView({ block: "nearest" });
            }
        }
    }


    /** Zeichnet die Tabelle komplett neu basierend auf dem aktuellen Zustand */
    render() {
        const tableHeader = this.container.querySelector("thead");
        const tableBody = this.container.querySelector("tbody");

        // todo: Spalten Namen von Einstellung lesen
        this.colNames = this.dataTable.getCols();
        this.colIndexes = this.dataTable.getColIndex(this.colNames);

        // Datenzeilen-Indizes holen (Kopfzeile 0 herausfiltern)
        this.rowIndexes = this.dataTable.getIndexList(this.aktuellerIndexName);
        //const rowList = this.dataTable.getIndexList(this.aktuellerIndexName);

        // Kopfzeile Anzeigen
        // todo: Sortierung und Filter visuell???
        if (tableHeader instanceof HTMLElement) {
            let html = "";
            for (let i = 0; i < this.colIndexes.length; i++) {
                html += `<th>${this.colDisplayNames[i]}</th>`;
            }
            tableHeader.innerHTML = `<tr>${html}</tr>`;
        }


        if (tableBody instanceof HTMLElement) {
            tableBody.innerHTML = "";
            let html = "";

            for (let i = 0; i < this.rowIndexes.length; i++) {
                const rowIndex = this.rowIndexes[i];
                if (rowIndex == 0) { continue; }
                const row = this.dataTable.getRow(rowIndex);
                if (!row) { continue; }

                if (rowIndex == this.activeRowIdx) {
                    html += `<tr data-index="${rowIndex}" class="active">`;
                } else {
                    html += `<tr data-index="${rowIndex}">`;
                }

                // Für jede spalte
                for (let j = 0; j < this.colIndexes.length; j++) {
                    if (rowIndex == this.activeRowIdx && this.activeColIdx == j) {
                        html += `<td class="active">${row[this.colIndexes[j]]}</td>`;
                    } else {
                        html += `<td>${row[this.colIndexes[j]]}</td>`;
                    }
                }

                // ende der Zeile
                html += "</tr>";
            }

            // in HTML einfügen
            tableBody.insertAdjacentHTML("afterbegin", html);
        }
    }

    /** 
     * Verarbeitet die Tastatur-Events (wird vom globalen Listener aufgerufen) 
     * @param {KeyboardEvent} e - Tastatur ereigniss vom globalen Listener
     */
    handleKeyDown(e) {
        //const aktuelleIndizes = this.dataTable.getIndexList(this.aktuellerIndexName).filter(idx => idx !== 0);
        //const cols = this.dataTable.getCols();

        // bestimmt ob die komplette Tabelle neu erstellt werden muss
        let is_table_refresh = false;

        // 1. Navigation
        if (e.key === "ArrowUp" && this.activeRowIdx > 0) { this.activeRowIdx--; e.preventDefault(); }
        if (e.key === "ArrowDown" && this.activeRowIdx < this.rowIndexes.length - 1) { this.activeRowIdx++; e.preventDefault(); }
        if (e.key === "ArrowLeft" && this.activeColIdx > 0) { this.activeColIdx--; e.preventDefault(); }
        if (e.key === "ArrowRight" && this.activeColIdx < this.colIndexes.length - 1) { this.activeColIdx++; e.preventDefault(); }

        // ENTER-Taste gedrückt -> Daten-Verknüpfung auflösen und nächste Spalte triggern!
        if (e.key === "Enter") {
            e.preventDefault();
            this.triggerSelection();
            return;
        }

        // 2. S = Sortieren
        if (e.key.toLowerCase() === "s") {
            const aktiveSpaltenName = this.colNames[this.activeColIdx];
            this.dataTable.sort([aktiveSpaltenName], this.aktuellerIndexName, "sortiert");
            this.aktuellerIndexName = "sortiert";

            // Tabelle muss neu erstellt werden
            is_table_refresh = true;
        }

        // 3. F = Filtern nach Zellwert
        if (e.key.toLowerCase() === "f") {
            const realRowIdx = this.rowIndexes[this.activeRowIdx];
            const aktiveSpaltenName = this.colNames[this.activeColIdx];
            const zellWert = this.dataTable.getCellValue(realRowIdx, aktiveSpaltenName);

            /** @type {Object<string,any>} */
            const query = {};
            query[aktiveSpaltenName] = zellWert;

            this.dataTable.findAll(query, this.aktuellerIndexName, "gefiltert");
            this.aktuellerIndexName = "gefiltert";
            this.activeRowIdx = 0; // Fokus zurücksetzen

            // Tabelle muss neu erstellt werden
            is_table_refresh = true;
        }

        // 4. R = Filter/Sortierung zurücksetzen
        if (e.key.toLowerCase() === "r") {
            this.aktuellerIndexName = undefined;

            // Tabelle muss neu erstellt werden
            is_table_refresh = true;
        }

        // Nach jeder Aktion neu zeichnen
        if (is_table_refresh) {
            this.render();
        } else {
            this.setActiveCell();
        }
    }

    /*** Analysiert die Auswahl und fordert die nächste logische Spalte an*/
    triggerSelection() {
        const realRowIdx = this.rowIndexes[this.activeRowIdx];
        const recordId = this.dataTable.getCellValue(realRowIdx, this.dataTable.idColumnName);
        console.log(`Auswahl in ${this.dataTable.tableName}: Datensatz-ID ${recordId}`);

        // Signal an den Orchestrator senden, um die Folge-Daten zu laden
        DataOrchestrator.loadNextSpalte(
            this.driverId,
            this.dataTable.tableName,
            recordId);
    }
}




// Repräsentiert eine visuelle Spalte im UI
export class InteractiveCol {
    constructor(title = "Spalte") {
        this.domElement = document.createElement("div");
        this.domElement.className = "ui-column";
        // Flexibles, fixes Spaltenlayout
        this.domElement.style.cssText = "display: flex; flex-direction: column; width: 350px; min-width: 350px; height: 100%; background: white; border: 1px solid #dee2e6; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); box-sizing: border-box; padding: 10px; overflow-y: auto;";

        this.titleElement = document.createElement("h3");
        this.titleElement.innerText = title;
        this.titleElement.style.cssText = "margin: 0 0 10px 0; font-size: 1.1em; color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 5px;";
        this.domElement.appendChild(this.titleElement);

        /** @type {Array<InteractiveTable|any>} Komponenten innerhalb dieser Spalte */
        this.components = [];
        this.activeComponentIndex = 0;
    }

    get activeComponent() {
        return this.components[this.activeComponentIndex] || null;
    }

    /**
     * Fügt eine Tabelle, ein Formular oder Detailansicht in die Spalte ein
     * @param {InteractiveTable|any} component 
     */
    addComponent(component) {
        this.components.push(component);
        if (component instanceof InteractiveTable) {
            this.domElement.appendChild(component.container);
            if (this.components.length === 1) {
                component.container.style.borderColor = "#ccc"; // Standard-Zustand
            }
        }
    }

    focus() {
        // Visuelles Highlight für die aktive Spalte
        AppCore.columns.forEach(c => c.domElement.style.borderColor = "#dee2e6");
        this.domElement.style.borderColor = "#007bff";

        if (this.activeComponent && this.activeComponent.setActiveCell) {
            this.activeComponent.setActiveCell();
        }
    }
}



// RealtimeSync.js - Wiederverwendbares Client-Modul
export class RealtimeSync {
    /**
     * @param {string} serverUrl - ServerPfad 
     */
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
        this.ws = null;
    }

    /** Gesperrte Datensätze */
    lockedData = new Map();

    /** 
     * Callback Funktion wenn ein Datensatz gesperrt wird
     * @type {function|null} */
    onLock = null

    /** 
     * Callback Funktion wenn ein Datensatz entsperrt wird
     * @type {function|null} */
    onUnlock = null

    /** 
     * Callback Funktion wenn ein Datensatz bearbeitet wird
     * @type {function|null} */
    onEdit = null

    /** 
     * Callback Funktion wenn die Session abläuft
     * @type {function|null} */
    onSessionTimeout = null

    /** 
     * Callback Funktion wenn die Session abläuft
     * @type {function|null} */
    onDashboard = null

    /** 
     * Callback Funktion wenn Daten ankommen
     * @type {function|null} */
    onDataReceived = null


    /**
     * Stellt eine Verbindung mit dem Server her
     */
    connect() {
        //this.currentUserId = currentUserId;
        this.ws = new WebSocket(`${this.serverUrl}`);

        this.ws.onmessage = (event) => {
            /** @type {ClientServerMessage} */
            const data = JSON.parse(event.data);

            // Test
            console.log("vom Server: ", data);

            switch (data.type) {
                case "ERROR":
                    // todo: Fehler anzeigen
                    console.error(data.payload);
                    break;

                case "INITIAL_STATE":
                    // Erste Spalte mit dem Hauptmenü generieren!
                    if (data.rows) {
                        const menuTable = new DataTable("Hauptmenü", data.rows, "ID");
                        const firstCol = new InteractiveCol("Hauptmenü");
                        const uiTable = new InteractiveTable(menuTable, data.driverId || "system");

                        firstCol.addComponent(uiTable);
                        AppCore.appendColumn(firstCol);
                        firstCol.focus();
                    }
                    break;

                case "LOCK_UPDATED":
                    break;

                case "DATA":
                    if (data.rows) {
                        // Wenn der Orchestrator auf Daten wartet, geben wir sie ihm
                        if (typeof this.onDataReceived === "function") {
                            this.onDataReceived(data.rows);
                        }
                    }
                    break;

                case "LOCK_DENIED":
                    break;

                case "LOCK_RELEASED_CONFIRMED":
                    break;

                case "SAVE_SUCCESS":
                    break;

                case "DATA_MUTATED":
                    break;

                case "DELETE_SUCCESS":
                    break;

                case "UI_CONFIG_RECOV":
                    // Antwort vom Server mit der Schablone
                    if (data.payload) {
                        const config = JSON.parse(data.payload);

                        // data.rows könnte hier deine InfoEdge-Verknüpfungen enthalten!
                        if (typeof this.onUiConfigReceived === "function") {
                            this.onUiConfigReceived(config, data.rows || []);
                        }
                    }
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
}

// =========================================================================
//   ZENTRALER DATEN-ORCHESTRATOR
// =========================================================================

// Zentraler Anwendungs-Manager (Orchestrator)
export class AppCore {
    /** @type {Array<InteractiveCol>} */
    static columns = [];
    /** @type {number} Index der aktuell aktiven Spalte */
    static activeColIndex = 0;
    /** @type {RealtimeSync|null} */
    static sync = null;
    /** @type {any|null} Hier wird die Schema-Instanz zur Abfrage abgelegt */
    static currentSchema = null;

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

        // Synchronisation starten
        AppCore.sync = new RealtimeSync(serverUrl);
        AppCore.sync.connect();

        // Globale Tastatur registrieren
        AppCore.registerGlobalEvents();
    }

    /**
     * Fügt eine neue Spalte hinzu und entfernt alle nachfolgenden (macOS Finder Style)
     * @param {InteractiveCol} col 
     */
    static appendColumn(col) {
        const container = document.getElementById("app-container");
        if (!container) return;

        // Alle UI-Elemente nach der aktuellen aktiven Spalte entfernen
        while (AppCore.columns.length > AppCore.activeColIndex + 1) {
            const oldCol = AppCore.columns.pop();
            oldCol?.domElement.remove();
        }

        AppCore.columns.push(col);
        container.appendChild(col.domElement);

        // Automatisch nach rechts scrollen
        container.scrollTo({ left: container.scrollWidth, behavior: "smooth" });
    }

    static registerGlobalEvents() {
        window.addEventListener("keydown", (e) => {
            // Horizontaler Spaltenwechsel mit Alt + ArrowLeft / ArrowRight
            if (e.altKey && e.key === "ArrowLeft") {
                if (AppCore.activeColIndex > 0) {
                    AppCore.activeColIndex--;
                    AppCore.columns[AppCore.activeColIndex].focus();
                }
                e.preventDefault();
                return;
            }
            if (e.altKey && e.key === "ArrowRight") {
                if (AppCore.activeColIndex < AppCore.columns.length - 1) {
                    AppCore.activeColIndex++;
                    AppCore.columns[AppCore.activeColIndex].focus();
                }
                e.preventDefault();
                return;
            }

            // Vertikale Navigation/Aktionen an die aktive Tabelle/Spalte weiterreichen
            const activeCol = AppCore.columns[AppCore.activeColIndex];
            if (activeCol && activeCol.activeComponent) {
                activeCol.activeComponent.handleKeyDown(e);
            }
        });
    }
}

// =========================================================================
//   DYNAMISCHES EINGABE-FORMULAR
// =========================================================================
export class InteractiveForm {
    /**
     * @param {string} driverId
     * @param {string} tableName
     * @param {string} recordId
     * @param {Object} fieldsConfig - Die vordefinierte Spalten- & Label-Konfiguration
     * @param {Object} currentData - Die aktuellen Werte aus der DB
     */
    constructor(driverId, tableName, recordId, fieldsConfig, currentData) {
        this.driverId = driverId;
        this.tableName = tableName;
        this.recordId = recordId;
        this.fieldsConfig = fieldsConfig; // z.B. { name: { label: "Kundenname", type: "text" } }
        this.currentData = currentData;
        this.hasLock = false;

        this.container = document.createElement("div");
        this.container.className = "form-wrapper";
        this.container.style.cssText = "padding: 15px; border: 2px solid #ccc; border-radius: 4px; background: #fff; display: flex; flex-direction: column; gap: 10px;";

        this.initDOM();
    }

    initDOM() {
        let fieldsHtml = `<h4 style="margin:0 0 10px 0;">Bearbeiten: ${this.tableName}</h4>`;

        // Generiere Eingabefelder basierend auf der vordefinierten Server-Konfiguration
        for (const [fieldName, config] of Object.entries(this.fieldsConfig)) {
            const value = this.currentData[fieldName] ?? "";
            fieldsHtml += `
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 0.85em; font-weight: bold; color: #555;">${config.label}</label>
                    <input type="${config.type || 'text'}" data-field="${fieldName}" value="${value}" disabled 
                           style="padding: 6px; border: 1px solid #ccc; border-radius: 4px; background: #f8f9fa;">
                </div>
            `;
        }

        fieldsHtml += `
            <div style="margin-top: 10px; font-size: 0.8em; color: #666;" class="lock-status">
                Drücke <kbd>E</kbd> zum Bearbeiten (Sperre anfordern)
            </div>
        `;

        this.container.innerHTML = fieldsHtml;

        // Klick aktiviert die Spalte
        this.container.addEventListener("click", () => {
            this.focusThisCol();
        });
    }

    focusThisCol() {
        const colIdx = AppCore.columns.findIndex(c => c.components.includes(this));
        if (colIdx !== -1) {
            AppCore.activeColIndex = colIdx;
            AppCore.columns[colIdx].activeComponentIndex = AppCore.columns[colIdx].components.indexOf(this);
            AppCore.columns[colIdx].focus();
        }
    }

    /**
     * Steuerung des Formulars über die Tastatur
     */
    handleKeyDown(e) {
        // E = Edit-Modus (Sperre beim Server anfordern)
        if (e.key.toLowerCase() === "e" && !this.hasLock) {
            e.preventDefault();
            this.requestServerLock();
        }

        // ENTER = Speichern, wenn Sperre aktiv ist
        if (e.key === "Enter" && this.hasLock) {
            e.preventDefault();
            this.saveData();
        }

        // ESCAPE = Abbrechen / Sperre freigeben
        if (e.key === "Escape" && this.hasLock) {
            e.preventDefault();
            this.releaseServerLock();
        }
    }

    requestServerLock() {
        console.log("Fordere Datensatz-Sperre an...");
        AppCore.sync?.ws?.send(JSON.stringify({
            type: "REQUEST_LOCK",
            driverId: this.driverId,
            tableName: this.tableName,
            recordId: this.recordId
        }));
    }

    // Wird aufgerufen, wenn der Server LOCK_UPDATED / LOCK_CONFIRMED sendet
    enableEditing(success) {
        const statusEl = this.container.querySelector(".lock-status");
        const inputs = this.container.querySelectorAll("input");

        if (success) {
            this.hasLock = true;
            if (statusEl) statusEl.innerHTML = "<span style='color: green;'>🔒 Gesperrt für dich. Enter zum Speichern, Esc zum Abbrechen.</span>";
            inputs.forEach(input => {
                input.removeAttribute("disabled");
                input.style.background = "#fff";
            });
            // Fokus auf das erste Eingabefeld setzen
            inputs[0]?.focus();
        } else {
            if (statusEl) statusEl.innerHTML = "<span style='color: red;'>⚠️ Datensatz wird von anderem Benutzer bearbeitet!</span>";
        }
    }

    saveData() {
        const inputs = this.container.querySelectorAll("input");
        const updatedData = {};

        inputs.forEach(input => {
            const field = input.getAttribute("data-field");
            if (field) updatedData[field] = input.value;
        });

        console.log("Sende bearbeitete Daten an Server...", updatedData);
        AppCore.sync?.ws?.send(JSON.stringify({
            type: "SAVE_DATA",
            driverId: this.driverId,
            tableName: this.tableName,
            recordId: this.recordId,
            payload: JSON.stringify(updatedData)
        }));

        this.disableFields();
    }

    releaseServerLock() {
        AppCore.sync?.ws?.send(JSON.stringify({
            type: "RELEASE_LOCK",
            driverId: this.driverId,
            tableName: this.tableName,
            recordId: this.recordId
        }));
        this.disableFields();
    }

    disableFields() {
        this.hasLock = false;
        const statusEl = this.container.querySelector(".lock-status");
        const inputs = this.container.querySelectorAll("input");

        if (statusEl) statusEl.innerHTML = "Drücke <kbd>E</kbd> zum Bearbeiten";
        inputs.forEach(input => {
            input.setAttribute("disabled", "true");
            input.style.background = "#f8f9fa";
        });
        window.focus(); // Fokus zurück aufs Fenster für Keyboard-Router
    }
}


// =========================================================================
//   ZENTRALER DATA ORCHESTRATOR (DEKLARATIV & DATEIBASIERT)
// =========================================================================

// folgende Überlegungen:
// Beim Start "index"(.html oder .md) vom server abrufen und in der ersten Spalte darstellen
// Dieses muss ein Hauptmenü enthalten mit dem Aufbau | "Bezeichnung" | "Link" | welches Bestimmt(Link) was zu welchem Menüpunkt gehört
// Wenn in dieser Liste "ENTER" oder geklickt wird, wird die verknüpfte .html oder .md abgerufen
// nach dem Einbau in die nächste Spalte muss diese HTML geparst werden um Listen und Formulare nachzuladen. (eventuell den HTML-Parser (lidoc.js) erweitern) 


export class DataOrchestrator {
    /**
     * Steuert dynamisch, welche UI-Datei geladen und wie die nächste Spalte gerendert wird
     * @param {string} driverId 
     * @param {string} tableName 
     * @param {string} recordId 
     */
    static async loadNextSpalte(driverId, tableName, recordId) {
        if (!AppCore.sync || !AppCore.sync.ws) return;

        // 1. Hole UI-Definition und verknüpfte Edges vom Server
        AppCore.sync.ws.send(JSON.stringify({
            type: "GET_UI_CONFIG",
            tableName: tableName
        }));

        // Callback, wenn der Server die UI-Schablone und Edges zurücksendet
        AppCore.sync.onUiConfigReceived = (uiConfig, edges) => {
            const nextCol = new InteractiveCol(uiConfig.title || `Details: ${tableName}`);

            // 2. PRÜFEN: Welcher UI-Typ ist in der Konfigurationsdatei vordefiniert?
            if (uiConfig.viewType === "form") {
                // Echte Daten für das Formular anfordern
                AppCore.sync.ws.send(JSON.stringify({
                    type: "GET_DATA",
                    driverId: driverId,
                    tableName: tableName,
                    recordId: recordId,
                    idColName: "gsid"
                }));

                // Wenn die echten Tabellendaten eintreffen, Formular bauen
                AppCore.sync.onDataReceived = (serverRows) => {
                    const rowData = serverRows;

                    const formComponent = new InteractiveForm(
                        driverId,
                        tableName,
                        recordId,
                        uiConfig.fields, // Schablone für Übersetzungen & Reihenfolge
                        rowData
                    );

                    nextCol.addComponent(formComponent);

                    // Verknüpfte Relationen (Edges) als Liste unter dem Formular anzeigen
                    if (edges && edges.length > 0) {
                        DataOrchestrator.renderAttachedEdges(nextCol, edges, driverId, recordId);
                    }
                };

            } else if (uiConfig.viewType === "table") {
                // ... Hier wird analog eine vordefinierte Untertabelle verarbeitet
            }

            // Spalte im UI anhängen und Fokus setzen
            AppCore.appendColumn(nextCol);
            AppCore.activeColIndex = AppCore.columns.length - 1;
            AppCore.columns[AppCore.activeColIndex].focus();
        };
    }

    /**
     * Rendert eine Liste verknüpfter Unter-Elemente (Edges) direkt in die Spalte
     */
    static renderAttachedEdges(columnInstance, edges, driverId, currentRecordId) {
        const edgeContainer = document.createElement("div");
        edgeContainer.style.cssText = "margin-top: 15px; padding: 10px; background: #f1f3f5; border-radius: 4px;";
        edgeContainer.innerHTML = `<h5 style='margin:0 0 5px 0;'>Verknüpfte Informationen:</h5>`;

        // Generiere Links basierend auf der InfoEdge-Struktur (source_id -> target_id)
        const listHtml = edges.map(edge => {
            return `<div class="edge-link" data-target="${edge.target_table}" style="padding: 4px; color: #007bff; cursor: pointer; text-decoration: underline;">
                » ${edge.relation_label} (${edge.target_title})
            </div>`;
        }).join("");

        edgeContainer.insertAdjacentHTML("beforeend", listHtml);
        columnInstance.domElement.appendChild(edgeContainer);

        // Klick auf eine Verknüpfung triggert die nächste Spalte (macOS Finder Style)
        edgeContainer.querySelectorAll(".edge-link").forEach(el => {
            el.addEventListener("click", () => {
                const targetTable = el.getAttribute("data-target");
                if (targetTable) {
                    DataOrchestrator.loadNextSpalte(driverId, targetTable, currentRecordId);
                }
            });
        });
    }
}


// /**
//  * Registriert globale Tatsturereignisse für die Tabellen Navigation
//  */
// export function registerEvents() {
//     // Einmaliger globaler Event-Listener für das gesamte Dokument
//     window.addEventListener("keydown", (e) => {
//         // Nur ausführen, wenn überhaupt eine Tabelle aktiv/fokussiert ist
//         if (InteractiveTable.activeInstance) {
//             InteractiveTable.activeInstance.handleKeyDown(e);
//         }
//     });
// }

// =================================================
//   Beispiel
// -----------

// <!DOCTYPE html>
// <html lang="de">
// <head>
//     <meta charset="UTF-8">
//     <title>Echtzeit Spalten Anwendung</title>
// </head>
// <body>
//     <script type="module">
//         import { AppCore } from "./infoui.js";
//         import { Schema } from "./infoschema.js";

//         // 1. App starten (Verbindung zum Bun Server aufbauen)
//         AppCore.init("ws://localhost:3000/socket");

//         // 2. Optional: Globales Schema laden (wird später über einen HTTP/WS-Endpunkt vom Server bezogen)
//         // AppCore.currentSchema = myLoadedSchemaInstance;
//     </script>
// </body>
// </html>

// # Zusammenfassung der Funktionsweise bei Tastaturbedienung:
// - Erster Zustand: Der Client verbindet sich. Der Server schickt INITIAL_STATE. Spalte 1 (Hauptmenü) baut sich auf.
// - Navigation: Mit ArrowUp / ArrowDown navigierst du durch die Zeilen. Mit ArrowLeft / ArrowRight durch die Spalten-Zellen.
// - Auswahl (ENTER): Drückst du auf einem Treiber oder Kunden-Eintrag ENTER, fängt das die Tabelle ab und ruft DataOrchestrator.loadNextSpalte auf.
// - Server-Anfrage: Der Orchestrator schickt eine saubere ClientServerMessage an den Bun-Server.
// - Dynamischer Anbau: Der Server antwortet mit DATA, die RealtimeSync fängt es ab, baut eine neue Unter-Laufzeit-Tabelle (DataTable), steckt sie in eine neue InteractiveCol und schiebt das UI flüssig nach rechts weiter. Mit Alt + ArrowLeft wechselst du jederzeit die Spalte zurück.
