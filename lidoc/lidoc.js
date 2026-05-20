// ====================
//   lidoc APP
// 2026-05-20
// ====================
// Zeigt Markdown Seiten in einem HTML an
// @ts-check

// ==================
//   Imports
// -----------
// import { parseMd } from "./parsemd.js";
// import  Prism from "../prism/prism.js"

// ==================
//   Types
// -----------

////** @typedef {import("lib.dom.d.ts").HTMLElement} HTMLElement */

/**
 * Konfiguration von Lidoc
 * @typedef {object} Config
 * @property {string} [docPath]    default: "/doc/" - Basis Pfad in dem die Markdown Dokumente liegen. Muss mit einem "/" enden!
 * @property {string} [buildPath]    default: "/build/" - Basis Pfad in dem die HTML Dokumente liegen. Muss mit einem "/" enden!
 */

/**
 * [sub-list] Objekt
 * @typedef {object} SubListObj
 * @property {string} hash
 * @property {any} linkElm
 * @property {any} subElm
 */

// ===============================
//   Parameter
// ------------

/** @type {Config} */
const config = {
    docPath: "/doc/"
    , buildPath: "/build/"
};

// Liste aller [data-lidoc] Elemente
/** @type {NodeListOf<HTMLElement>} */
let lidocElmList = document.querySelectorAll("[data-lidoc]");

/** @type {String} Letzter Verwendeter Pfad */
let lastPath = "";

/** @type {HTMLElement} */
let contentElm = document.getElementById("content") || document.body;

/** @type {HTMLElement|null} */
let navElm = document.getElementById("nav");


/** Liste aller [sub-list] Elemente. Der Key ist "hash" vom vorangestelltem Link(a) 
 * @type {SubListObj[]}
*/
let subList = [];


// ===============================
//   Funktionen
// -------------

/**
 * Gibt die Konfiguration aus
 * @returns {Config}
 */
function getConfig() {
    return config;
}

/**
 * Nimmt Konfigurationen in einem Objekt entgegen
 * und schreibt diese in das Configurationsobjekt
 * @param {Config} obj 
 */
export function setConfig(obj) {
    if (!obj || typeof obj != "object") { return; }
    if (Array.isArray(obj)) { return; }
    Object.assign(config, obj);
}


/**
 * Prüft die URL auf einen Markdown Datei Namen
 * @param {string} siteUrl - relative URL zu der Markdown Seite
 * @returns {string}
 */
function checkSiteUrl(siteUrl) {
    if (!siteUrl) {
        //siteUrl = "./index.md";
        siteUrl = "index.html";
    }

    if (siteUrl.startsWith("#")) {
        // Hash entfernen und Soursepath hinzufügen
        siteUrl = siteUrl.substring(1);
    }

    if (siteUrl.endsWith("/")) {
        //siteUrl += "index.md";
        siteUrl += "index.html";
    }

    //if (!siteUrl.endsWith(".md")) {
    if (!siteUrl.endsWith(".html")) {
        //siteUrl += ".md";
        siteUrl += ".html";
    }
    return siteUrl;
}




// /**
//  * Hash von URL lesen, um Seiteninhalte nachladen zu können
//  * @returns {string} - URL der Markdownseite
//  */
// export function getHashUrl() {
//     let siteUrl = window.location.hash;
//     let parts = siteUrl.split("/");
//     if (parts.length > 1 && parts[0] != lastPath) {
//         //parseSite(siteUrl);
//     }
//     return checkSiteUrl(siteUrl);
// }

/**
 * Text aus Datei vom Server
 * @param {string} url - URL für Text basierte Datei vom Server
 * @returns {Promise<string|undefined>} 
*/
async function fetchText(url) {
    const res = await fetch(url);
    if (res.ok) {
        const text = await res.text();
        return text;
    } else {
        return undefined;
    }
}


/**
 * Alle [sub-list] Elemente laden
 * //@param {any[]} linkList Liste mit Links, denen [sub-list] Elemente folgen
 */
export function setSublist() {
    const linkList = document.querySelectorAll("nav a");
    if (!linkList) { return; }

    // bestehende Liste leeren
    subList = [];

    linkList.forEach((link) => {
        // @ts-ignore
        const linkUrl = link.hash;
        const subListElm = link.nextElementSibling;

        // Wenn Hash und Element
        if (linkUrl) {  //  && subListElm
            subList.push({ hash: linkUrl, linkElm: link, subElm: subListElm });
        }
    });
    // console.log("subList:", subList);
} // setSubList


/**
 * Navigation prüfen
 */
function checkNav() {
    // Alle [sub-list] Elemente durchgehen
    // console.log("sublist:", subList);
    const hashUrl = location.hash;

    subList.forEach((obj) => {
        if (hashUrl.startsWith(obj.hash)) {
            obj.subElm?.classList.remove("hidden");
            // console.log("hash:", hashUrl, obj.hash);
            if (hashUrl == obj.hash) {
                obj.linkElm.classList.add("active");
            } else {
                obj.linkElm.classList.remove("active");
            }
        } else {
            obj.subElm?.classList.add("hidden");
            obj.linkElm.classList.remove("active");
            // console.log("hidden:", obj.elm);
        }
    })
}


/**
 * Läd erforderliche Javascript Module für die Seite.  
 * Es können nur Module mit absoluten Pfad (beginnend mit "/") geladen werden.
 * @param {Array<string>} module - Liste mit Modul Namen
 * @returns {Promise<void>}
 */
async function loadModule(module) {
    if (!module || !Array.isArray(module)) { return; }

    // alle module durchgehen
    for (let i = 0; i < module.length; i++) {
        const modulName = module[i];
        if (!modulName.startsWith("/")) { continue; }
        let m = await import(modulName);

        // init Funktion aufrufen wenn vorhanden
        if (typeof m?.init == "function") {
            m.init();
        }
    }
}



/**
 * Holt die gewünschte HTML-Datei(url) vom Server und zeigt diese im angegebenen Element an.
 * @param {string} url - Pfad zur Datei die geladen wird
 * @param {HTMLElement} [elm] - OPTIONAL HTMLElement wo der Inhalt rein geschrieben wird
 * @returns {Promise<void>}
 */
export async function showContent(url, elm) {
    if (!url) { return; }
    if (!url.endsWith(".html")) { return; }

    // HTML String holen
    const htmlString = await fetchText(config.buildPath + url);

    // HTML anzeigen wenn gefunden, sonst wird nichts verändert
    if (!elm) { elm = contentElm }
    if (elm instanceof HTMLElement && htmlString != undefined) {
        elm.innerHTML = "";
        elm.insertAdjacentHTML("afterbegin", htmlString);
    }
} // showContent


/**
 * Analysiert die HTML Seite auf [data-lidoc] Elemente
 * @param {string} siteUrl - Url von Hash
 * @param {string} startPath - Pfad ab dem die Reletiven urls starten
 */
async function parseSite(siteUrl, startPath) {
    lidocElmList = document.querySelectorAll("[data-lidoc]");

    // Alle [data-lidoc] Elemente durchgehen
    for (let i = 0; i < lidocElmList.length; i++) {
        const elm = lidocElmList[i];
        let url = elm.dataset.lidoc || "";
        
        // Wenn Content -> soll Hash Url laden
        if (url == "_content") {
            // content Element merken
            contentElm = elm;
            await showContent(checkSiteUrl(siteUrl), contentElm);
        } else {
            // URL auflösen
            if (!url.startsWith("/")) {
                url = startPath + url;
            }
            url = checkSiteUrl(url);

            // Daten von Url lesen
            await showContent(url, elm);

            // Wenn Navigation
            if (elm.tagName == "NAV") {
                // Menüliste setzen
                setSublist();
            }
        }
    }
}


/**
 * Seite Parsen und anzeigen
 * @returns {Promise<void>}
 */
export async function showSite() {
    // Hash lesen
    let siteUrl = window.location.hash;
    
    // Pfad aufsplitten
    let parts = siteUrl.split("/");
    
    // Prüfen ob der erste Teil mit dem letzten Startpfad zusammenpasst
    if (parts[0] != lastPath) {
        const startPath = parts[0].substring(parts[0].indexOf("#") +1) + "/";
        
        // Inhalte der ganzen Seite prüfen (incl. Header, Footer und Nav)
        await parseSite(siteUrl, startPath);
        lastPath = parts[0];
    } else {
        if (!lastPath) {
            // Inhalte der ganzen Seite prüfen (incl. Header, Footer und Nav)
            await parseSite(siteUrl, "/");
            lastPath = "/";
        } else {
            // nur Content ausbessern
            await showContent(checkSiteUrl(siteUrl));
        }
    }

    // test:
    console.log("lastPath:", lastPath);

    checkNav();

    // Syntax Highlighter
    // @ts-ignore
    if (window?.Prism) {
        // @ts-ignore
        window.Prism.highlightAll();
    }
} // showSite


// =======================
//  Defaults
// ---------------


// showSite();


// =======================
//   Events
// ------------

// Wenn sich der Hash ändert
addEventListener("hashchange", (e) => {
    showSite();
});

