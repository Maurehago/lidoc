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
        this.selectedRow = 1; // ZeilenIndex der Tabelle
        this.selectedCol = 0; // SpaltenIndex der Tabelle
        this.maxRows = this.dataList.getLength(this.indexName);
        this.maxCols = this.dataList.getCols().length;
    }

    /**
     * Entfernt den Aktiv Status von der Zeile und Spalte
     */
    removeActive() {
        if (this.container instanceof HTMLTableElement) {
            this.container?.rows[this.selectedRow].classList.remove("active");
            this.container?.rows[this.selectedRow].cells[this.selectedCol].classList.remove("active");
        }
    }

    /**
     * Setzt den Aktiv Status auf Aktuelle Zeile und Spalte
     */
    setActive() {
        if (this.container instanceof HTMLTableElement) {
            if (!this.container?.rows[this.selectedRow]) { return; }
            this.container?.rows[this.selectedRow].classList.add("active");
            this.container?.rows[this.selectedRow].cells[this.selectedCol].classList.add("active");

            // Scroll-In-View
            const selected = this.container?.rows[this.selectedRow].cells[this.selectedCol];
            selected?.scrollIntoView({ block: 'nearest' });
            //selected?.scrollIntoView();
        }
    }

    moveUp() {
        if (this.selectedRow > 1) {
            this.removeActive();
            this.selectedRow -= 1;
            this.setActive();
        }
    }

    moveDown() {
        if (this.selectedRow < this.maxRows - 1) {
            this.removeActive();
            this.selectedRow += 1;
            this.setActive();
        }
    }

    moveLeft() {
        if (this.selectedCol > 0) {
            this.removeActive();
            this.selectedCol -= 1;
            this.setActive();
        }
    }

    moveRight() {
        if (this.selectedCol < this.maxCols - 1) {
            this.removeActive();
            this.selectedCol += 1;
            this.setActive();
        }
    }

    /**
     * Liefert das Ausgewählte Datenobjekt zurück
     * @returns {T|undefined} - DatenObjekt oder undefined wenn nicht gefunden
     */
    getSelectedObj() {
        if (this.container instanceof HTMLTableElement) {
            return this.dataList.getObject(parseInt(this.container?.rows[this.selectedRow].dataset["id"] || ""));
        }
    }

    render() {
        // Wird von den spezialisierten Klassen überschrieben
    }
}


/**
 * @template T
 * @extends {ListController<T>}
 */
export class TableComponent extends ListController {
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
        this.cols = dataList.getCols();
    }

    /**
     * Rendert das HTML mit angegebenen Spaltennamen
     */
    render() {
        if (!this.container) { return; }
        // const keys = this.data.getActiveIndexes ? this.data.getActiveIndexes() : [];
        let html = '<thead><tr color-p style="top:0px; position: sticky;">';

        // alle spalten durchgehen
        for (let i = 0; i < this.cols.length; i++) {
            html += `<th>${this.cols[i]}</th>`;
        }


        html += '</tr></thead><tbody>';
        let rowIndex = 0;
        this.dataList.forEach((obj, index) => {
            //const row = this.data.getRecordById(id);
            //const isSelected = index == parseInt(this.selectedRowElm?.dataset["id"] || "");
            html += `<tr data-id="${index}">`;
            for (let i = 0; i < this.cols.length; i++) {
                //@ts-ignore
                html += `<td>${obj[this.cols[i]] || " "}</td>`;
            }
            html += `</tr>`;

            rowIndex += 1; // nächsete Zeilennummer
        }, this.indexName);

        html += '</tbody>';
        this.container.innerHTML = "";
        this.container.insertAdjacentHTML("afterbegin", html);

        // Tabelle setzen
        this.tableElm = this.container.querySelector('table');

        // Scroll-In-View
        this.setActive();

        // Melde die Änderung an die Detailansicht / Untertabelle
        if (this.onSelectionChange && this.selectedRow) {
            const obj = this.getSelectedObj();
            this.onSelectionChange(obj);
        }
    }
}


/**
 * @template T
 * @extends {ListController<T>}
 */
class MenuComponent extends ListController {
    //     /**
    //      * 
    //      * @param {string} containerId - Element-ID
    //      * @param {DataTable<T>} dataList - DatenTabelle
    //      * @param {string} [indexName] - Optional IndexName vom Aktiven Index
    //      * @param {Function} [onSelectionChange] - Optional Funktion die beim Ändern des Datensatzea ausgeführt wird
    //      */
    //     constructor(containerId, menuItems) {
    //         super(containerId, menuItems); // menuItems ist ein Array [{label: 'Edit', action: ...}]
    //     }

    //     render() {
    //         let html = '<div class="keyboard-menu">';
    //         this.data.forEach((item, index) => {
    //             const isSelected = index === this.selectedIndex;
    //             html += `<div class="menu-item ${isSelected ? 'selected' : ''}">${item.label}</div>`;
    //         });
    //         html += '</div>';
    //         this.container.innerHTML = html;
    //     }

    //     execute() {
    //         const selection = this.getSelection();
    //         if (selection.data && selection.data.action) {
    //             selection.data.action(); // Führt die hinterlegte Funktion aus
    //         }
    //     }
}

class FormComponent {
    /**
     * 
     * @param {string} containerId - Element-ID
     * param {DataTable<T>} dataList - DatenTabelle
     * param {string} [indexName] - Optional IndexName vom Aktiven Index
     * param {Function} [onSelectionChange] - Optional Funktion die beim Ändern des Datensatzea ausgeführt wird
     */
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        //this.onSave = onSave;
        //this.onCancel = onCancel;
        this.currentId = null;
    }

    //     open(id, recordData) {
    //         this.currentId = id;
    //         this.container.innerHTML = `
    //       <form id="active-form">
    //         <input type="text" id="field-name" value="${recordData.name || ''}" focus>
    //         <input type="text" id="field-value" value="${recordData.value || ''}">
    //       </form>
    //     `;
    //         this.container.querySelector('input').focus();
    //     }

    render() {

    }

    submit() {
        //const updated = {
        //    name: document.getElementById('field-name').value,
        //    value: document.getElementById('field-value').value
        //};
        //this.onSave(this.currentId, updated);
    }

    close() {
        //this.container.innerHTML = '';
        //this.onCancel();
    }
}


/**
 * @template T
 */
export class KeyboardRouter {
    /**
     * @param {string} filterInputId - ID vom FilterFeld
     */
    constructor(filterInputId) {
        /** @type {Array<TableComponent<T>|FormComponent>} */
        this.componentStack = []; // Stapel für aktive Komponenten (z.B. [Haupttabelle, Menü])
        this.filterInput = document.getElementById(filterInputId);
        this.initGlobalListener();
    }

    // Setzt eine neue aktive Komponente oben auf den Stapel
    /**
     * 
     * @param {TableComponent<T>|FormComponent} component 
     */
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
        window.document.addEventListener("click", (e) => {
            const target = e.target;
            if (target instanceof HTMLElement) {
                // Tabelle suchen
                const table = target.closest("table");
                if (table) {
                    // Position im ComponentStack ermitteln                    
                    const componentIndex = this.componentStack.findIndex(comp => comp.container === table);
                    if (componentIndex !== -1) {
                        const component = this.componentStack[componentIndex];

                        if (component instanceof TableComponent) {
                            // neue aktive Zelle finden
                            const cell = target.closest("td");
                            const row = target.closest("tr");
                            if (cell instanceof HTMLTableCellElement && row instanceof HTMLTableRowElement) {
                                component.removeActive();
                                component.selectedCol = cell.cellIndex;
                                component.selectedRow = row.rowIndex;
                                component.setActive();
                            }
                        }

                        // Komponentenstack berichtigen
                        this.componentStack.splice(componentIndex + 1);
                    }
                }
            }
        });


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
                case 'ArrowLeft':
                    e.preventDefault();
                    active.moveLeft();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    active.moveRight();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (active instanceof MenuComponent) {
                        //active.execute();
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
                    } else if (this.filterInput instanceof HTMLInputElement) {
                        // Wenn wir auf der untersten Ebene sind: Filter löschen
                        this.filterInput.value = '';
                        // active.data.clearFilter(); // Falls deine Klasse das hat
                        active.render();
                    }
                    break;
                default:
                    // Type-by-Default: Nur wenn eine Daten-Tabelle aktiv ist und kein Menü
                    if (active instanceof TableComponent && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        if (this.filterInput) {
                            this.filterInput.focus();
                        }
                    }
                    break;
            }
        });
    }

    // Hilfsmethoden für den Workflow
    /**
     * 
     * @param {TableComponent<T>} tableComponent 
     */
    triggerDefaultTableAction(tableComponent) {
        //const selection = tableComponent.getSelection();
        //console.log("Standard-Aktion für ID:", selection?.id);
    }

    /**
     * 
     * @param {TableComponent<T>} tableComponent 
     */
    openContextMenuFor(tableComponent) {
        // Wird im Orchestrator definiert
    }
}


// ======================================
//   Webscocket
// --------------

// Beispielhafter WebSocket-Empfangconst socket = new WebSocket('ws://localhost:3000');

// socket.addEventListener('message', (event) => {
//     const message = JSON.parse(event.data);

//     switch (message.action) {
//         case 'INITIAL_DATA':
//         case 'UPDATE_BATCH':
//             // Deine Klasse mit den neuen Rohdaten füttern
//             myDataManager.loadData(message.payload);
//             // UI neu zeichnen (Index-Listen greifen automatisch)
//             uiController.renderList();
//             break;

//         case 'SERVER_ACK':
//             // Bestätigung vom Bun-Server, dass ein Update gespeichert wurde
//             console.log("Gespeichert:", message.id);
//             break;
//     }
// });
// Initialisierungconst myDataManager = new DeineDatenKlasse();const uiController = new UIController(myDataManager, socket);

