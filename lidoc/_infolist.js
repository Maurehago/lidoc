//@ts-check
import { GridList, GridNav, GridView, newColList, GSID, LIST } from "./gridlist.js";


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

let listNav;
let formNav;


/** @type {string|number|undefined} */
let activeID;
let isForm = false;
let isList = true;


// ===============================
//   Funktionen
// -------------

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
 * Entfernt einen Eintrag aus der aktiven Liste
 */
function removeFromList() {
    const id = listNav.id;
    activeList.deleteRow(id);
    showList(activeList, activeView);
    postList(activeList, activePath);
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
    formNav.isActive = true;
    // setActiveFormElm();
}


function saveForm() {
    if (formElm instanceof HTMLFormElement) {
        // Daten in Liste
        const formData = new FormData(formElm);
        const id = activeList.setFormData(formData);

        // formular entfernen
        formElm.innerHTML = "saved!";
        formNav.isActive = false;

        postList(activeList, activePath);

        // liste neu zeichen
        showList(activeList, activeView);
        listNav.isActive = true;

        //isList = true;
        //isForm = false;
    }

}


function cancelForm() {
    if (formElm instanceof HTMLFormElement) {
        formElm.innerHTML = "Canceld!";
    }
    formNav.isActive = false;
    listNav.isActive = true;
}


// ===============================
//   Events
// ---------



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
    //activeIndex = 1;
    //setActiveRowElm(1);

    // neue Listen Navigation
    listNav = new GridNav(tableElm);
    listNav.isActive = true;
    listNav.okFunction = () => {
        showForm(activeList, activeView, listNav.id);
        listNav.isActive = false;
    }
    listNav.removeFunction = removeFromList;

    // neue Formular Navigation
    formNav = new GridNav(formElm);
    formNav.isActive = false;
    formNav.okFunction = saveForm;
    formNav.cancelFunction = cancelForm;

    let colList = newColList();
    console.log("colList:", colList);
    //console.log("colList form:", new GridView(colList.cols).getFormBody(colList));
    if (formElm instanceof HTMLFormElement) {
        formElm.innerHTML = new GridView(colList.cols).getFormBody(colList);
    }

    // Tastatur eingabe registrieren
    //document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keydown", (e) => listNav.onKeyDown(e));
    document.addEventListener("keydown", (e) => formNav.onKeyDown(e));
    //document.addEventListener("click", onClick);
    document.addEventListener("click", (e) => listNav.onClick(e));
    document.addEventListener("click", (e) => formNav.onClick(e));
}
