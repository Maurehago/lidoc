//@ts-check
import { GridList, GridNav, GridView, newColList, setNavEvents, GSID, LIST } from "./gridlist.js";


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
const INDEXCOLS = ["path", "info", "view"];

// _index
let indexList = new GridList("_index");
indexList.setCols(INDEXCOLS, "path");

// view für Index
const indexView = new GridView(INDEXCOLS);


// neue Liste
const newList = new GridList("newlist", ["id", "name", "columns"], "id");
const newListView = new GridView(["name Name", "columns Cols separated with ','"]);
const newListNav = new GridNav("newList");


// *** aktuelle Ansicht ***
let currentView = "indexlist";

/** @type {GridList} */
let activeList;

/** @type {GridView} */
let activeView;

let activePath = "";

/** @type {GridNav} */
let activeListNav;

let indexNav = new GridNav("index");
let listNav = new GridNav("list");
let formNav = new GridNav("form");


/** @type {string|number|undefined} */
let activeID;
let isForm = false;
let isList = true;


// ===============================
//   Funktionen
// -------------

/**
 * Liest eine Liste vom Server
 * @param {string} listPath - Pfad zu der JSON Datei mit den Listen Daten
 * @returns {Promise<GridList|number>} Gridliste oder Undefined
 */
async function getList(listPath) {
    if (typeof listPath != "string") { return -1; }

    // Vom Server holen
    const res = await fetch(listPath);
    if (res.ok) {
        const bodyLength = res.headers.get("content-length");
        if (bodyLength != null && bodyLength == "0") { return 404; }
        const obj = await res.json();
        const newList = new GridList(obj.name);
        newList.createFromGridObject(obj);
        return newList;
    } else {
        console.error("fetchError:", res);
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


function indexShowList() {
    const listData = indexList.get(indexNav.id);

    // liste vom Server holen
    getList(listData.path).then((list) => {
        if (typeof list == "number") {
            console.error("Fehler beim laden der liste:", listData.path, list);
            return;
        }

        // view erstellen
        const view = new GridView(listData.view.split(","));
        showList(list, view);
        currentView = "list";
    }).catch((err) => {
        console.error(err);
    })
}

function indexShowForm() {
    showForm(indexList, indexView, indexNav.id);
    currentView = "indexform";
}


function saveForm() {
    const formElm = formNav.elm;
    if (formElm instanceof HTMLFormElement) {
        // Daten in Liste
        const formData = new FormData(formElm);
        const id = activeList.setFormData(formData);

        // formular entfernen
        formElm.innerHTML = "saved!";
        //formNav.isActive = false;

        postList(activeList, activePath);

        // liste neu zeichen
        showList(activeList, activeView);
        if (currentView == "indexform") {
            indexNav.isActive = true;
            currentView = "indexlist";
        } else {
            listNav.isActive = true;
            currentView = "list";
        }

        //isList = true;
        //isForm = false;
    }

}


function cancelForm() {
    if (formElm instanceof HTMLFormElement) {
        formElm.innerHTML = "Canceld!";
    }

    // letzte Navigation lesen
    const lastNav = formNav.lastNav;
    if (lastNav instanceof GridNav) {
        showList(activeList, activeView);
        lastNav.isActive = true;
    } else {
        // indexliste anzeigen
        showList(indexList, indexView);
        indexNav.isActive = true;
    }

    // if (currentView == "indexform") {
    //     indexNav.isActive = true;
    //     currentView = "indexlist";
    // } else {
    //     listNav.isActive = true;
    //     currentView = "list";
    // }
}


// ===============================
//   Events
// ---------



// ===============================
//   init
// --------

export async function init() {
    // IndexListe holen / anlegen
    const newList = await getList(INDEXPATH);
    console.log("newList:", newList);
    if (newList instanceof GridList) {
        indexList = newList;
    } else if (typeof newList == "number") {
        // nicht vorhanden -> neu anlegen
        if (newList == 404) {
            // todo: neu anlegen
            indexList = new GridList("_index");
            indexList.setCols(INDEXCOLS, "path");
            await postList(indexList, INDEXPATH);
        }
    }

    // indexliste anzeigen
    showList(indexList, indexView);



    // Index Navigation 
    if (tableElm) {
        indexNav.elm = tableElm;
    }
    indexNav.okFunction = indexShowList;
    indexNav.ctrlOkFunction = indexShowForm;

    // Aktive setzen
    activeList = indexList;
    activeView = indexView;
    activePath = INDEXPATH;
    activeListNav = indexNav;
    indexNav.isActive = true;

    // // neue Listen Navigation
    // listNav = new GridNav(tableElm);
    // listNav.isActive = true;
    // listNav.okFunction = () => {
    //     showForm(activeList, activeView, listNav.id);
    //     listNav.isActive = false;
    // }
    // listNav.removeFunction = removeFromList;

    // Formular Navigation
    formNav.elm = formElm;
    formNav.okFunction = saveForm;
    formNav.cancelFunction = cancelForm;

    let colList = newColList();
    //console.log("Form active:", formNav.isActive);
    //console.log("colList form:", new GridView(colList.cols).getFormBody(colList));
    if (formElm instanceof HTMLFormElement) {
        formElm.innerHTML = new GridView(colList.cols).getFormBody(colList);
    }

    // Tastatur eingabe registrieren
    setNavEvents();
    // //document.addEventListener("keydown", onKeyDown);
    // document.addEventListener("keydown", (e) => listNav.onKeyDown(e));
    // document.addEventListener("keydown", (e) => formNav.onKeyDown(e));
    // //document.addEventListener("click", onClick);
    // document.addEventListener("click", (e) => listNav.onClick(e));
    // document.addEventListener("click", (e) => formNav.onClick(e));
}
