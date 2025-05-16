// ====================
//  Index Controler
// -----------------
// @ts-check

// =======================
//   Imports
// ----------

import { GridNav, setNavEvents } from "./gridlist.js";


// =======================
//   Elemente
// ------------

const menuElm = document.getElementById("menue");
const tableElm = document.getElementById("table");
const formElm = document.getElementById("form");


// =======================
//   Instanzen
// --------------
const menueNav = new GridNav("menue", menuElm);
const dataListNav = new GridNav("dataList");

// =======================
//   Variablen
// ------------



// =======================
//   Funktionen
// --------------

function showMenue() {
    tableElm?.classList.add("hidden");
    formElm?.classList.add("hidden");
    menuElm?.classList.remove("hidden");
}


function showTable() {
    formElm?.classList.add("hidden");
    menuElm?.classList.add("hidden");
    tableElm?.classList.remove("hidden");
}


function showForm() {
    menuElm?.classList.add("hidden");
    tableElm?.classList.add("hidden");
    formElm?.classList.remove("hidden");
}


function showDataList(dataList) {
    let html = "<thead><tr><th>Path</th></tr></thead>";
    html += "<tbody>";

    for(let i=0;i < dataList.length; i++) {
        html += `<tr data-id="${dataList[i]}"><td>${dataList[i]}</td></tr>`;
    }

    html += "</tbody>";
    if (tableElm instanceof HTMLTableElement) {
        tableElm.innerHTML = "";
        tableElm.insertAdjacentHTML("afterbegin", html);
    }
    showTable();
    dataListNav.elm = tableElm;
}


async function getDataList() {
    const res = await fetch("/dir/?path=/data/&pattern=**/*.json");
    if (res.ok) {
        const fileList = await res.json();
        showDataList(fileList);
    }
}


function cancelDatalist() {
    menueNav.isActive = true;
}

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
            break;

        default:
            break;
    }
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
    dataListNav.cancelFunction = cancelDatalist;


    // aktive Navigation setzen
    menueNav.isActive = true;

    // events Registrieren
    setNavEvents();
}

// =======================
//   Events
// ------------
