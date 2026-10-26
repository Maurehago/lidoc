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
    /** @type {InteractiveTable|null} */
    static activeInstance = null;

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
     * @param {string} containerId - Die ID des HTML-Elements (z.B. ein <div>), wo die Tabelle rein soll
     */
    constructor(dataTable, containerId) {
        this.dataTable = dataTable;
        this.container = document.getElementById(containerId) || new HTMLDivElement();

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
            InteractiveTable.setActiveTable(this);
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
            if (InteractiveTable.activeInstance) {
                //@ts-ignore
                InteractiveTableUI.activeInstance.container.querySelector(".table-wrapper").style.borderColor = "#ccc";
            }

            // Neue Instanz setzen
            InteractiveTable.activeInstance = instance;
            const elm = instance.container.querySelector(".table-wrapper");
            if (elm instanceof HTMLElement) {
                elm.style.borderColor = "#0056b3"; // Blau markieren
            }
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
}



// Spalte mit Tabelle(n) und/oder Details(md) oder Formular 
class InteractiveCol {
    /**
     * @param {string} nodeID - Die Instanz deiner DataTable-Klasse
     * @param {string} containerId - Die ID des HTML-Elements (z.B. ein <div>), wo die Tabelle rein soll
     */
    constructor(nodeID, containerId) {
        this.container = document.getElementById(containerId) || new HTMLDivElement();

        this.activeRowIdx = 0;   // UI-Zeilenfokus

        // Aktuelle Nodeverknüpgungen laden ??

        // Anzeige setzen
        this.initDOM();
    }

    /** Erstellt das Grundgerüst der Tabelle und registriert das Klick-Event */
    initDOM() {
        this.container.innerHTML = `
        `;

        // Sobald der User in diese Tabelle klickt, wird sie zur aktiven Tabelle
        this.container.addEventListener("click", () => {
            InteractiveTable.setActiveTable(this);
        });

        this.render();
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
                    break;

                case "LOCK_UPDATED":
                    break;

                case "DATA":
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


/**
 * Registriert globale Tatsturereignisse für die Tabellen Navigation 
 */
export function registerEvents() {
    // Einmaliger globaler Event-Listener für das gesamte Dokument
    window.addEventListener("keydown", (e) => {
        // Nur ausführen, wenn überhaupt eine Tabelle aktiv/fokussiert ist
        if (InteractiveTable.activeInstance) {
            InteractiveTable.activeInstance.handleKeyDown(e);
        }
    });
}
