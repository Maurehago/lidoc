// ===============================
//   Funktionen für die Anzeige
// -----------------------------
// @ts-check

import { DataTable } from "./infotable.js";


// HTML-Template
const base_html = `
<div id="app-container">
  <!-- LINKS: Info-Panel -->
  <aside id="info-panel">
    <h2 id="info-name">Listen Name</h2>
    <p>Einträge gesamt: <span id="info-total">0</span></p>
    <p>Gefiltert: <span id="info-filtered">0</span></p>
    <div id="info-settings"><!-- Aktive Sortierung/Filter hier rein --></div>
  </aside>

  <!-- MITTE: Hauptkomponente -->
  <main id="main-content">
    <!-- Unsichtbarer oder dezenter globaler Filter-Input -->
    <input type="text" id="global-filter" placeholder="Tippen zum Filtern..." autocomplete="off">
    
    <div id="table-wrapper">
      <table id="data-table">
        <thead>
          <tr id="table-header"><!-- Spaltenüberschriften --></tr>
        </thead>
        <tbody id="table-body">
          <!-- Dynamischer Inhalt via JS -->
        </tbody>
      </table>
    </div>
  </main>

  <!-- RECHTS: Details / Formular / Menü -->
  <section id="detail-panel">
    <div id="detail-content"><!-- Details oder Formular hier rein --></div>
  </section>
</div>
`;


// ==================================
//   Funktionen
// -------------




// ==================================
//   Klassen
// ----------

/**
 * @template T
 */
class ListController {
    /**
     * 
     * @param {string} containerId - Element-ID
     * @param {DataTable<T>} dataList - DatenTabelle
     * @param {string} [indexName] - Optional IndexName vom Aktiven Index
     */
    constructor(containerId, dataList, indexName) {
        this.container = document.getElementById(containerId);
        this.dataList = dataList;
        this.indexName = indexName;
        this.selectedRow = 0;
        this.selectedCol = 0;
        this.maxRows = this.dataList.getLength(this.indexName);
    }

    moveUp() {
        if (this.selectedRow > 1) {
            this.selectedRow--;
            this.render();
        }
    }

    moveDown() {
        if (this.selectedRow < this.maxRows - 1) {
            this.selectedRow++;
            this.render();
        }
    }

    /**
     * Liefert das Ausgewählte Datenobjekt zurück
     * @returns {T|undefined} - DatenObjekt oder undefined wenn nicht gefunden
     */
    getSelection() {
        return this.dataList.getObject(this.selectedRow);
    }

    render() {
        // Wird von den spezialisierten Klassen überschrieben
    }
}


/**
 * @template T
 * @extends {ListController<T>}
 */
class TableComponent extends ListController {
    /**
     * 
     * @param {string} containerId - Element-ID
     * @param {DataTable<T>} dataList - DatenTabelle
     * @param {string} [indexName] - Optional IndexName vom Aktiven Index
     * @param {Function} [onSelectionChange] - Optional Funktion die beim Ändern des Datensatzea ausgeführt wird
     */
    constructor(containerId, dataList, indexName, onSelectionChange) {
        super(containerId, dataList, indexName);
        this.onSelectionChange = onSelectionChange; // Callback für Details/Untertabellen
    }

    render() {
        // const keys = this.data.getActiveIndexes ? this.data.getActiveIndexes() : [];
        let html = '<table><thead>';



        html += '<tbody>';
        this.dataList.forEach((obj, index) => {
            //const row = this.data.getRecordById(id);
            const isSelected = index === this.selectedRow;
            html += `<tr class="${isSelected ? 'selected' : ''}" data-id="${id}"><td>${row.name || row.title}</td></tr>`;
        }, this.indexName);

        this.dataList.forEach((obj, index) => {
            const isSelected = index === this.selectedRow;
            html += `<tr class="${isSelected ? 'selected' : ''}" data-id="${index}"><td>${obj.name || obj.title}</td></tr>`;
        });

        html += '</tbody></table>';
        this.container.innerHTML = html;

        // Scroll-In-View
        const selected = this.container.querySelector('.selected');
        selected?.scrollIntoView({ block: 'nearest' });

        // Melde die Änderung an die Detailansicht / Untertabelle
        if (keys[this.selectedIndex]) {
            this.onSelectionChange(keys[this.selectedIndex]);
        }
    }
}


class MenuComponent extends ListController {
    constructor(containerId, menuItems) {
        super(containerId, menuItems); // menuItems ist ein Array [{label: 'Edit', action: ...}]
    }

    render() {
        let html = '<div class="keyboard-menu">';
        this.data.forEach((item, index) => {
            const isSelected = index === this.selectedIndex;
            html += `<div class="menu-item ${isSelected ? 'selected' : ''}">${item.label}</div>`;
        });
        html += '</div>';
        this.container.innerHTML = html;
    }

    execute() {
        const selection = this.getSelection();
        if (selection.data && selection.data.action) {
            selection.data.action(); // Führt die hinterlegte Funktion aus
        }
    }
}

class FormComponent {
    constructor(containerId, onSave, onCancel) {
        this.container = document.getElementById(containerId);
        this.onSave = onSave;
        this.onCancel = onCancel;
        this.currentId = null;
    }

    open(id, recordData) {
        this.currentId = id;
        this.container.innerHTML = `
      <form id="active-form">
        <input type="text" id="field-name" value="${recordData.name || ''}" focus>
        <input type="text" id="field-value" value="${recordData.value || ''}">
      </form>
    `;
        this.container.querySelector('input').focus();
    }

    submit() {
        const updated = {
            name: document.getElementById('field-name').value,
            value: document.getElementById('field-value').value
        };
        this.onSave(this.currentId, updated);
    }

    close() {
        this.container.innerHTML = '';
        this.onCancel();
    }
}


class KeyboardRouter {
    constructor(filterInputId) {
        this.componentStack = []; // Stapel für aktive Komponenten (z.B. [Haupttabelle, Menü])
        this.filterInput = document.getElementById(filterInputId);
        this.initGlobalListener();
    }

    // Setzt eine neue aktive Komponente oben auf den Stapel
    pushActive(component) {
        this.componentStack.push(component);
        component.render();
    }

    // Geht zur vorherigen Komponente zurück (z.B. Menü schließen)
    popActive() {
        if (this.componentStack.length > 1) {
            this.componentStack.pop();
            this.getActive().render();
        }
    }

    getActive() {
        return this.componentStack[this.componentStack.length - 1];
    }

    initGlobalListener() {
        window.addEventListener('keydown', (e) => {
            const active = this.getActive();
            if (!active) return;

            // FALL 1: Ein Formular ist aktiv -> Reines Formular-Handling
            if (active instanceof FormComponent) {
                if (e.key === 'Escape') { e.preventDefault(); active.close(); }
                if (e.key === 'Enter') { e.preventDefault(); active.submit(); }
                return; // Verhindert Listen-Navigation während des Tippens im Input
            }

            // FALL 2: Eine Liste ist aktiv (Tabelle, Untertabelle, Menü)
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
                    if (active instanceof MenuComponent) {
                        active.execute();
                    } else if (active instanceof TableComponent) {
                        // Wenn Enter auf einer Tabelle gedrückt wird: Aktion ausführen (z.B. Editieren)
                        this.triggerDefaultTableAction(active);
                    }
                    break;
                case ' ': // Leertaste öffnet z.B. das Menü
                    e.preventDefault();
                    if (active instanceof TableComponent) {
                        this.openContextMenuFor(active);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    if (this.componentStack.length > 1) {
                        this.popActive();
                    } else {
                        // Wenn wir auf der untersten Ebene sind: Filter löschen
                        this.filterInput.value = '';
                        // active.data.clearFilter(); // Falls deine Klasse das hat
                        active.render();
                    }
                    break;
                default:
                    // Type-by-Default: Nur wenn eine Daten-Tabelle aktiv ist und kein Menü
                    if (active instanceof TableComponent && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        this.filterInput.focus();
                    }
                    break;
            }
        });
    }

    // Hilfsmethoden für den Workflow
    triggerDefaultTableAction(tableComponent) {
        const selection = tableComponent.getSelection();
        console.log("Standard-Aktion für ID:", selection.id);
    }

    openContextMenuFor(tableComponent) {
        // Wird im Orchestrator definiert
    }
}




/**
 * @template T
 */
class UIController {
    /**
     * @param {DataTable<T>} dataManagerInstance 
     * @param {WebSocket} websocketClient 
     */
    constructor(dataManagerInstance, websocketClient) {
        this.data = dataManagerInstance; // Deine bestehende Klasse
        this.ws = websocketClient;

        // UI Zustand
        this.selectedIndex = 0;
        this.currentView = 'list'; // 'list', 'menu', 'form'

        // DOM Cache
        this.dom = {
            filterInput: document.getElementById('global-filter'),
            tableBody: document.getElementById('table-body'),
            detailContent: document.getElementById('detail-content'),
            infoTotal: document.getElementById('info-total'),
            infoFiltered: document.getElementById('info-filtered')
        };

        this.initEvents();
    }

    // ===============================
    //   init
    // -------

    initEvents() {
        // 1. Globaler Tastatur-Listener
        window.addEventListener('keydown', (e) => {

            // WENN WIR IM EDITIER-MODUS (FORMULAR) SIND:
            if (this.currentView === 'form') {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.closeForm();
                }
                return; // Normale Tippgeräusche im Formular erlauben, keine Listen-Navi!
            }

            // WENN WIR IM MENÜ SIND:
            if (this.currentView === 'menu') {
                e.preventDefault();
                this.handleMenuNavigation(e.key);
                return;
            }

            // WENN WIR IN DER LISTE SIND (Standard):
            const keys = this.getActiveKeys();

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (this.selectedIndex < keys.length - 1) {
                        this.selectedIndex++;
                        this.renderList();
                    }
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    if (this.selectedIndex > 0) {
                        this.selectedIndex--;
                        this.renderList();
                    }
                    break;

                case 'Enter':
                    e.preventDefault();
                    if (keys[this.selectedIndex]) {
                        this.openEditForm(keys[this.selectedIndex]);
                    }
                    break;

                case ' ': // Leertaste öffnet das Kontext-Menü
                    e.preventDefault();
                    this.openContextActionMenu(keys[this.selectedIndex]);
                    break;

                case 'Escape':
                    e.preventDefault();
                    this.dom.filterInput.value = '';
                    this.data.clearFilter(); // Methode deiner Klasse
                    this.selectedIndex = 0;
                    this.renderList();
                    break;

                default:
                    // "Type-by-Default": Wenn der User einfach tippt, Fokus ins Filterfeld
                    // Ignoriere Funktionstasten (F1-F12, Alt, Strg, etc.)
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        this.dom.filterInput.focus();
                    }
                    break;
            }
        });

        // 2. Filter-Input Event (Echtzeit-Filterung während des Tippens)
        this.dom.filterInput.addEventListener('input', (e) => {
            const query = e.target.value;
            this.data.applyFilter(query); // Methode deiner Klasse setzt die Index-Liste neu
            this.selectedIndex = 0; // Zurück zum ersten Treffer
            this.renderList();
        });
    }

    // =======================
    //   Anzeige
    // -----------

    // Gibt die aktuell gefilterte/sortierte ID-Liste deiner Klasse zurück
    getActiveKeys() {
        // Hier nutzt du deine vorhandene Index-Liste
        return this.data.getActiveIndexes();
    }

    renderList() {
        const keys = this.getActiveKeys();
        let html = '';

        keys.forEach((id, index) => {
            const rowData = this.data.getRecordById(id); // Methode deiner Klasse
            const isSelected = index === this.selectedIndex;

            // WICHTIG: data-id für das Event-Handling und CSS-Klasse für Selektion
            html += `
        <tr data-id="${id}" class="${isSelected ? 'selected' : ''}">
          <td>${rowData.name}</td>
          <td>${rowData.value}</td>
        </tr>
      `;
        });

        this.dom.tableBody.innerHTML = html;

        // Info-Panel aktualisieren
        this.dom.infoTotal.textContent = this.data.getTotalCount();
        this.dom.infoFiltered.textContent = keys.length;

        // Automatisch in die Ansicht scrollen falls nötig
        if (keys.length > 0) {
            const selectedRow = this.dom.tableBody.querySelector('.selected');
            selectedRow?.scrollIntoView({ block: 'nearest' });
            this.renderDetails(keys[this.selectedIndex]);
        }
    }

    renderDetails(id) {
        if (!id || this.currentView !== 'list') return;
        const rowData = this.data.getRecordById(id);

        // Einfache Darstellung der Details rechts
        this.dom.detailContent.innerHTML = `
      <h3>Details für ${rowData.name}</h3>
      <pre>${JSON.stringify(rowData, null, 2)}</pre>
    `;
    }

    // =====================================
    //   Formular
    // ------------

    openEditForm(id) {
        this.currentView = 'form';
        const rowData = this.data.getRecordById(id);

        this.dom.detailContent.innerHTML = `
    <div class="modal-form">
      <h3>Datensatz bearbeiten (ID: ${id})</h3>
      <form id="edit-form">
        <label>Name: <input type="text" id="form-name" value="${rowData.name}"></label>
        <label>Wert: <input type="text" id="form-value" value="${rowData.value}"></label>
        <p class="hint">[Enter] Speichern | [Esc] Abbrechen</p>
      </form>
    </div>
  `;

        // Fokus auf das erste Eingabefeld setzen
        document.getElementById('form-name').focus();

        // Formular-spezifischer Listener für das Absenden
        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();

            const updatedData = {
                id: id,
                name: document.getElementById('form-name').value,
                value: document.getElementById('form-value').value
            };

            // Über den WebSocket an Bun senden
            this.ws.send(JSON.stringify({ action: 'UPDATE', payload: updatedData }));

            this.closeForm();
        });
    }

    closeForm() {
        this.currentView = 'list';
        this.renderList();
        this.dom.filterInput.focus(); // Fokus zurück zur Schnellfilterung
    }
}


// ======================================
//   Webscocket
// --------------

// Beispielhafter WebSocket-Empfangconst socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);

    switch (message.action) {
        case 'INITIAL_DATA':
        case 'UPDATE_BATCH':
            // Deine Klasse mit den neuen Rohdaten füttern
            myDataManager.loadData(message.payload);
            // UI neu zeichnen (Index-Listen greifen automatisch)
            uiController.renderList();
            break;

        case 'SERVER_ACK':
            // Bestätigung vom Bun-Server, dass ein Update gespeichert wurde
            console.log("Gespeichert:", message.id);
            break;
    }
});
// Initialisierungconst myDataManager = new DeineDatenKlasse();const uiController = new UIController(myDataManager, socket);

