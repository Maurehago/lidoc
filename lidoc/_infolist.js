//@ts-check
import { GridList, GridView, GSID, lists } from "./gridlist.js";


// ================================
//   Elemente
// -----------
const tableElm = document.getElementById("table");
const tableHeadElm = tableElm?.querySelector("thead");
const tableBodyElm = tableElm?.querySelector("tbody");
const formElm = document.getElementById("form");


// ================================
//   Typen
// -----------

/**
 * @typedef {object} AktivObject
 * @property {number} [row] - Aktive Zeile der Liste/ Formular
 * @property {number} [col] - Aktive Spalte der Liste/ Formular
 * @property {number} [index] - Aktiver Index der Liste
 */


// ===============================
//   Konstanten und Variablen
// ----------------------------

const INDEXPATH = "/data/_index.json";
const INDEXCOLS = ["id", "path", "info"];

// _index
let indexList = new GridList("_index");
indexList.setCols(INDEXCOLS, "id");

// Liste für Index
const indexView = new GridView(INDEXCOLS);


// *** Aktive ***
let activeElm = null;

/** @type {GridList} */
let activeList;

/** @type {GridView} */
let activeView;

let activePath = "";
let activeIndex;

/** @type {string|number|undefined} */
let activeID;
let isForm = false;
let isList = true;


// ===============================
//   Funktionen
// -------------

/**
 * Setzt das Aktive Element
 * @param {HTMLElement|Element|null} [elm] - Obptional Element das Aktiv gesetzt wird
 */
function setActiveElm(elm) {
    // Wenn bereits ein Aktives Element
    if (activeElm instanceof HTMLElement) {
        activeElm.classList.remove("active");
    }

    if (elm instanceof HTMLElement) {
        elm.classList.add("active");
        activeElm = elm;
    } else {
        activeElm = null;
    }
}



/**
 * Liest eine Liste vom Server
 * @param {string} listName - Name der Liste
 * @param {string} listPath - Pfad zu der JSON Datei mit den Listen Daten
 * @returns {Promise<GridList|number>} Gridliste oder Undefined
 */
async function getList(listName, listPath) {
    if (typeof listName != "string") { return -1; }
    if (typeof listPath != "string") { return -1; }

    // Vom Server holen
    const res = await fetch(listPath);
    if (res.ok) {
        const json = await res.json();
        const newList = new GridList(listName);
        newList.createFromGridObject(json);
        return newList;
    } else {
        return res.status;
    }
}


/**
 * Schickt eine GridList an den Server
 * @param {GridList} list - GridListe die an den Server geschickt wird
 * @param {string} listPath - Pfad unter dem die Liste abgelegt wird.
 * @returns {Promise<number>} Response Status
 */
async function postList(list, listPath) {
    if (!(list instanceof GridList)) { return -1; }
    if (typeof listPath != "string") { return -1; }

    // Vom Server holen
    const res = await fetch(listPath, { method: "POST", body: list.stringify() });
    if (res.ok) {
        return res.status;
    } else {
        return res.status;
    }
}


/**
 * Zeigt eine Liste mit einer bestimmten View an.
 * @param {GridList} list - Liste mit Daten
 * @param {GridView} view - Listen Ansicht
 */
function showList(list, view) {
    if (tableHeadElm instanceof HTMLElement) {
        tableHeadElm.innerHTML = view.getThead(indexList);
    }
    if (tableBodyElm instanceof HTMLElement) {
        tableBodyElm.innerHTML = "";
        tableBodyElm.insertAdjacentHTML("afterbegin", view.getTbody(list));
    }
}


/**
 * Setzt die Aktive Spalte in einem Form Element
 * @param {number} [colNumber] - Name der aktiven Spalte
 */
function setActiveFormElm(colNumber) {
    // Merken ob Aktive Liste oder Formulsr
    isList = false;
    isForm = true;

    let elm = formElm?.firstElementChild;

    if (typeof colNumber == "number") {
        // todo: Element herausfinden
        elm = formElm?.children[colNumber];
    } else {
        activeIndex = 0;
    }

    if (elm) {
        setActiveElm(elm);
        const input = elm.querySelector("input");
        if (input instanceof HTMLInputElement) {
            input.focus();
            input.select();
            //input.setSelectionRange(0, input.value.length);
        }
    }
}


/**
 * Setzt die aktive Zeile in einer Liste
 * @param {number} [rowIndex] - Zeilen-Index/Position (Kopfzeile wird mit eingerechnet == 0)
 */
function setActiveRowElm(rowIndex) {
    // Merken ob Aktive Liste oder Formulsr
    isList = true;
    isForm = false;

    if (tableElm instanceof HTMLTableElement) {
        const elm = tableElm.rows[rowIndex || 0];
        activeID = elm.dataset.id;
        setActiveElm(elm);
        activeIndex = rowIndex;
    }
}


/**
 * Zeigt ein Formular für die angegebe Liste an
 * @param {GridList} list - Liste mit Daten
 * @param {GridView} form - View für Formular
 * @param {string|number} [id] - DatensatzID, wenn nicht angegeben dann wird ein neuer Datensatz erzeugt
 */
function showForm(list, form, id) {
    if (formElm instanceof HTMLFormElement) {
        formElm.innerHTML = "";
        formElm.insertAdjacentHTML("afterbegin", form.getFormBody(list));
    }

    // wenn eine ID
    if (id !== undefined) {
        let obj = list.get(id);
        let cols = form.getCols();
        // alle FormularFelder
        for (let i = 0; i < cols.length; i++) {
            const elm = formElm?.querySelector(`[name="${cols[i]}"`);
            if (elm instanceof HTMLInputElement) {
                elm.value = obj[cols[i]];
            }
        }
    }

    // 1. Formelement als Aktiv
    setActiveFormElm();
}





// ===============================
//   Events
// ---------

/**
 * Wenn eine Taste gedrückt wird
 * @param {KeyboardEvent} e - Tastatur Event
 */
function onKeyDown(e) {
    //console.log("repeat:", e.repeat);
    //console.log("key:", e.key);

    // Wenn wiederholung(Taste wird lange gehalten) dann abbrechen
    if (e.repeat) { return; }

    // toto: auf Liste, Zeile und Spalte prüfen oder auf Formular prüfen
    let index = activeIndex;
    let cols = [];
    let id = activeID;
    if (isForm) {
        cols = activeView.getCols();
    }


    // wenn controll
    if (e.ctrlKey) {
        switch (e.key) {
            case "s":
                // todo: Speichern
                if (isForm) {
                    e.preventDefault();
                    if (formElm instanceof HTMLFormElement) {
                        // Daten in Liste
                        const formData = new FormData(formElm);
                        const id = activeList.setFormData(formData);

                        // formular entfernen
                        formElm.innerHTML = "saved!";

                        postList(activeList, activePath);

                        // liste neu zeichen
                        showList(activeList, activeView);

                        isList = true;
                        isForm = false;
                    }
                }
                break;
        }

        return;
    }

    // Je nach taste
    switch (e.key) {
        case "Tab":
            if (isForm || isList) {
                e.preventDefault();
                if (e.shiftKey) {
                    index -= 1;
                } else {
                    index += 1;
                }
            }
            // setActiveElm();
            break;
        case "Insert":
            // todo: neue zeile
            if (isList) {
                showForm(activeList, activeView);
            }
            break;
        case "Delete":
            // todo: Zeile löschen
            break;
        case "Enter":
            // todo: Zeile Bearbeiten
            if (isForm) {
                e.preventDefault();
                index += 1;
            } else if (isList) {
                e.preventDefault();
                showForm(activeList, activeView, id);
            }
            break;
        case " ":
            // todo: Zeile Bearbeiten??? oder andere auswahl
            break;
        case "ArrowDown":
            // todo: Nächte Zeile
            if (isForm || isList) {
                e.preventDefault();
                index += 1;
            }
            break;
        case "ArrowUp":
            // todo: vorige Zeile
            if (isForm || isList) {
                e.preventDefault();
                index -= 1;
            }
            break;
        case "ArrowRight":
            // todo: nach rechts
            break;
        case "ArrowLeft":
            // todo: nach links
            break;
        case "PageDown":
            // todo: Seite nach unten
            break;
        case "PageUp":
            // todo: Seite nach oben
            break;
        case "Escape":
            // todo: Abbrechen
            if (isForm) {
                e.preventDefault();
                if (formElm instanceof HTMLFormElement) {
                    // formular entfernen
                    formElm.innerHTML = "saved!";

                    // liste neu zeichen
                    showList(activeList, activeView);

                    isList = true;
                    isForm = false;
                }
            }
        break;
    }


    // Wenn sich der Index geäntert hat
    if (index != activeIndex) {
        if (isForm) {
            if (index >= cols.length) {
                index = 0;
            }
            if (index < 0) {
                index = cols.length - 1;
            }
            activeIndex = index;
            setActiveFormElm(activeIndex);
        } else if (isList && tableElm instanceof HTMLTableElement) {
            if (index < 1) {index = 1;}
            if ( index > tableElm.rows.length -1) {
                index = tableElm.rows.length -1;
            }
            activeIndex = index;
            setActiveRowElm(index);
        }
    }
} // Taste prüfen


/**
 * Wenn auf ein Element geklickt wird
 * @param {MouseEvent} e - Maus Event  
 */
function onClick(e) {
    // wenn Liste
    if (isList) {
        let target = e.target;
        if (target instanceof HTMLElement) {
            let rowElm = target.closest("tr");
            if (rowElm instanceof HTMLTableRowElement) {
                const id = rowElm.dataset.id;
                setActiveRowElm(rowElm.rowIndex);
                showForm(activeList, activeView, id);
            }
        }
    }
}



// ===============================
//   init
// --------

export async function init() {
    // IndexListe holen / anlegen
    const newList = await getList("_index", INDEXPATH);
    if (newList instanceof GridList) {
        indexList = newList;
    } else if (typeof newList == "number") {
        // nicht vorhanden -> neu anlegen
        if (newList == 404) {
            // todo: neu anlegen
            indexList = new GridList("_index");
            indexList.setCols(INDEXCOLS, "id");
            await postList(indexList, INDEXPATH);
        }
    }

    // indexliste anzeigen
    showList(indexList, indexView);
    activeList = indexList;
    activeView = indexView;
    activePath = INDEXPATH;
    activeIndex = 1;
    setActiveRowElm(1);

    // Tastatur eingabe registrieren
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
}
