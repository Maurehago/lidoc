// ====================
//  Index Controler
// -----------------
// @ts-check

// =======================
//   Imports
// ----------

import { GridList, GridNav, GridView, setNavEvents } from "./gridlist.js";


// =======================
//   Elemente
// ------------

const menuElm = document.getElementById("menue");
const tableElm = document.getElementById("table");
const formElm = document.getElementById("form");


// =======================
//   Instanzen
// --------------

// Navigation
const menueNav = new GridNav("menue", menuElm);
const tableNav = new GridNav("table");
const formNav = new GridNav("form");
const dataListNav = new GridNav("dataList");
const documentListNav = new GridNav("documentList");
const newListFormNav = new GridNav("newListForm");

// Listen
const newListGrid = new GridList("newList", ["name string*", "path string*", "cols string*", "idCol string*"], "path");
// newListGrid.setColDataFormat("name", { required: true });
// newListGrid.setColDataFormat("path", { required: true });
// newListGrid.setColDataFormat("cols", { required: true });
// newListGrid.setColDataFormat("idCol", { required: true });

const tableGrid = new GridList("table");


// Views
const tableView = new GridView();
tableView.dateFormat = "yyyy-mm-dd";
const newListFormView = new GridView(["name name (required)", "path path (required)", "cols cols comma(,) seperated (requred)", "idCol ID Column (required)"]);


// =======================
//   Variablen
// ------------

// Pfad für Aktuelle Liste
let activeListPath = "";



// =======================
//   Funktionen
// --------------

/** Zeigt die Menüansicht an */
function showMenue() {
    tableElm?.classList.add("hidden");
    formElm?.classList.add("hidden");
    menuElm?.classList.remove("hidden");
}


/** Zeigt die Tabellenansicht an */
function showTable() {
    formElm?.classList.add("hidden");
    menuElm?.classList.add("hidden");
    tableElm?.classList.remove("hidden");
}


/** Zeigt die FormularAnsicht an */
function showForm() {
    menuElm?.classList.add("hidden");
    tableElm?.classList.add("hidden");
    formElm?.classList.remove("hidden");
}



async function getList(path) {
    console.log("getList Path:", path);
    const res = await fetch("/data/" + path);
    if (res.ok) {
        const obj = await res.json();
        return obj;
    } else {
        console.error("getList:", res.status);
    }
}


/**
 * Schickt eine Liste an den Server zum Speichern.
 * @param {GridList} list - GridListe die an den Server geschickt wird.
 * @param {string} path - Pfad zum Speichern der Datei. Muss mit "/data/" beginnen und die Dateiendung ".json" haben.
 * @returns {Promise<boolean>}
 */
async function postList(list, path) {
    const res = await fetch("/data/" + path, { method: "POST", body: list.stringify(), headers: { "content-type": "text/json" } });
    if (res.ok) {
        return true;
    } else {
        return false;
    }
}


/**
 * Zeigt von der angegebenen Auflistung von Pfaden eine Liste an.
 * @param {Array<string>} dataList - Liste mit Pfaden zu JSON InfoDatenListen
 */
function showDataList(dataList) {
    let html = "<thead color-p2 pos-sticky pos-t-l><tr><th>Path</th></tr></thead>";
    html += "<tbody>";

    for (let i = 0; i < dataList.length; i++) {
        html += `<tr data-id="${dataList[i]}"><td>${dataList[i]}</td></tr>`;
    }

    html += "</tbody>";
    showTable();
    if (tableElm instanceof HTMLTableElement) {
        tableElm.innerHTML = "";
        tableElm.insertAdjacentHTML("afterbegin", html);
        dataListNav.elm = tableElm;
        dataListNav.setActiveElm(tableElm.rows[dataListNav.rowIndex]);
    }
}


/**
 * Läd eine Liste aller Datenlisten (.json) vom Ordner "/data/" an.
 * Und Zeigt die Liste an(showDataList()).
 * @async
 */
async function getDataList() {
    const res = await fetch("/dir/?path=/data/&pattern=**/*.json");
    if (res.ok) {
        const fileList = await res.json();
        showDataList(fileList);
    }
}


/**
 * Läd eine Liste von Markdown Dokumenten vom Server
 * @async
 */
async function getDocumentList() {
    const res = await fetch("/dir/?path=/&pattern=**/*.md");
    if (res.ok) {
        const fileList = await res.json();
        console.log("fileList:", fileList);
        //showDataList(fileList);
    }
}


/**
 * Führt ausgewählten Menüpunkt aus
 */
function menueSelect() {
    switch (menueNav.id) {
        case "list":
            // todo: Liste Navigation
            console.log("menue List");
            dataListNav.isActive = true;
            break;

        case "doc":
            // todo: Dokumente Navigation
            console.log("menue Doc");
            documentListNav.setActive();
            break;

        default:
            break;
    }
}


/**
 * Zeigt ein Formular für eine neue Liste an
 */
function showNewListForm() {
    // Form HTML lesen
    const html = newListFormView.getFormBody(newListGrid);
    if (formElm instanceof HTMLFormElement) {
        formElm.innerHTML = "";
        formElm.insertAdjacentHTML("afterbegin", html);
        newListFormNav.elm = formElm;
    }

    // Formular anzeigen
    showForm();

    // Formular Navigation setzen
    newListFormNav.setActive();
}


/**
 * Erstellt eine neue Liste
 * @returns {void}
 */
function createNewList() {
    if (!(formElm instanceof HTMLFormElement)) { return; }

    const formData = new FormData(formElm);

    const name = "" + formData.get("name");
    if (!name) { return; }
    const path = "" + formData.get("path");
    if (!path) { return; }
    const cols = "" + formData.get("cols");
    if (!cols) { return; }
    const idCol = "" + formData.get("idCol");
    if (!idCol) { return; }

    // Liste erstellen
    const newList = new GridList(name, cols.split(","), idCol);

    // Liste (speichern) an den Server schicken
    postList(newList, path).then((isOk) => {
        dataListNav.setActive();
    })
}


/** 
 * Zeigt die Aktuelle Daten als Tabelle an 
 * @param {boolean} [isNewList] - Optional wenn neue Liste, dann wird die Aktive Position(Cursor) auf 0, 0 gesetzt.
 */
function showList(isNewList) {
    if (tableElm instanceof HTMLTableElement) {
        let html = `<thead color-p2 pos-sticky pos-t-l>${tableView.getThead(tableGrid)}</thead>`;
        html += `<tbody>${tableView.getTbody(tableGrid)}</tbody>`;
        tableElm.innerHTML = "";
        tableElm.insertAdjacentHTML("afterbegin", html);
        tableNav.elm = tableElm;
        showTable();
        if (isNewList) {
            tableNav.setActive(0, 0);
        } else {
            tableNav.setActive();
        }
    }
}


/** Läd und zeigt die Liste vom activeListPath */
function getAndShowList() {
    getList(activeListPath).then((obj) => {
        tableGrid.createFromGridObject(obj);
        tableView.setCols(tableGrid.cols);
        showList(true);
    });
}

/**
 * Zeigt ein Formular mit einem Datensatz an
 * @param {string|number} [id] - Optional DatansatzID
 */
function showRowForm(id) {
    if (formElm instanceof HTMLFormElement) {
        let html = tableView.getFormBody(tableGrid, id);
        formElm.innerHTML = "";
        formElm.insertAdjacentHTML("afterbegin", html);
        formNav.elm = formElm;
    }
    showForm();
}


/** Listen Eintrag Neuanlage */
function addDataRow() {
    showRowForm();
    formNav.setActive();
}


function editDataRow() {
    if (tableNav.id != undefined) {
        showRowForm(tableNav.id);
    } else {
        showRowForm();
    }
    // Navigation Aktiv
    formNav.setActive(tableNav.colIndex);
}


function saveDataRow() {
    if (formElm instanceof HTMLFormElement) {
        const formData = new FormData(formElm);
        // Formdata in Listen element
        tableGrid.setFormData(formData);

        // An Server schicken
        postList(tableGrid, activeListPath);
    }
    //tableNav.setActive();
    showList();
}


// =======================
//   Init
// --------------
export function init() {
    // --- Menü ---
    menueNav.onActiveFunction = showMenue;
    menueNav.okFunction = menueSelect;

    // --- Daten Navigation ---
    dataListNav.onActiveFunction = getDataList;
    dataListNav.cancelFunction = () => menueNav.isActive = true;    // Menü wieder aktiv setzen
    dataListNav.addFunction = showNewListForm;
    dataListNav.okFunction = () => {
        activeListPath = "" + dataListNav.id;
        getAndShowList();
    }


    // --- Dokument Navigation ---
    documentListNav.onActiveFunction = getDocumentList;
    documentListNav.cancelFunction = () => menueNav.setActive();    // Menü wieder aktiv setzen


    // --- newListForm ---
    newListFormNav.cancelFunction = () => dataListNav.setActive();    // Listen Navigation wieder aktiv setzen
    newListFormNav.okFunction = createNewList;

    // --- aktuelle Liste ---
    tableNav.cancelFunction = () => dataListNav.setActive();
    tableNav.addFunction = addDataRow;
    tableNav.okFunction = editDataRow;

    // --- aktives Formular ---
    formNav.cancelFunction = () => showList();
    formNav.okFunction = saveDataRow;

    // aktive Navigation setzen
    menueNav.isActive = true;

    // events Registrieren
    setNavEvents();
}

// =======================
//   Events
// ------------
