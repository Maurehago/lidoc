//@ts-check
import { GridList, GridView, GSID, lists } from "./gridlist.js";


// ================================
//   Elemente
// -----------
const tableElm = document.getElementById("table");
const tableHeadElm = tableElm?.querySelector("thead");
const tableBodyElm = tableElm?.querySelector("tbody");
const formElm = document.getElementById("form");

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
    if (typeof listName != "string") {return -1;}
    if (typeof listPath != "string") {return -1;}

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
    if (!(list instanceof GridList)) {return -1;}
    if (typeof listPath != "string") {return -1;}

    // Vom Server holen
    const res = await fetch(listPath, {method:"POST", body: list.stringify()});
    if (res.ok) {
        return res.status;
    } else {
        return res.status;
    }
}


/**
 * Zeigt die Index Liste an.
 */
function showIndexList() {
    if (tableHeadElm instanceof HTMLElement) {
        tableHeadElm.innerHTML = indexView.getThead(indexList);
    }
    if (tableBodyElm instanceof HTMLElement) {
        tableBodyElm.innerHTML = "";
        tableBodyElm.insertAdjacentHTML("afterbegin", indexView.getTbody(indexList));
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
    showIndexList();
}
