// ====================
//   lidoc APP
// 2024-09-14
// ====================

// Zeigt Markdown Seiten in einem HTML an

// @ts-check

// ==================
//   Imports
// -----------
import { parseMd } from "./parsemd.js";
// import  Prism from "../prism/prism.js"

// ==================
//   Types
// -----------

//** @typedef {import("lib.dom.d.ts").HTMLElement} HTMLElement */

/**
 * Konfiguration von Lidoc
 * @typedef {object} Config
 * @property {string} docPath    default: "/doc/" - Basis Pfad in dem die Markdown Dokumente liegen. Muss mit einem "/" enden!
 * @property {string} buildPath    default: "/build/" - Basis Pfad in dem die HTML Dokumente liegen. Muss mit einem "/" enden!
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

/** @type {HTMLElement} */
let contentElm = document.getElementById("content") || document.body;

/** @type {HTMLElement} */
let navElm = document.getElementById("nav");


/** @type {Config} */
const config = {
    docPath: "/doc/"
    , buildPath: "/build/"
};

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
export function getConfig() {
    return config;
}

/**
 * Nimmt Konfigurationen in einem Objekt entgegen
 * und schreibt diese in das Configurationsobjekt
 * @param {object} obj 
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
    
    //if (siteUrl.endsWith(".html")) {
    //    siteUrl = siteUrl.replace(".html", ".md");
    //}
    
    //if (!siteUrl.endsWith(".md")) {
    if (!siteUrl.endsWith(".html")) {
        //siteUrl += ".md";
        siteUrl += ".html";
    }
    return siteUrl;
}


/**
 * Hash von URL lesen, um Seiteninhalte nachladen zu können
 * @returns {string} - URL der Markdownseite
 */
export function getHashUrl() {
    let siteUrl = window.location.hash;
    return checkSiteUrl(siteUrl);
}

/**
 * Text aus Datei vom Server
 * @param {string} url - URL für Text basierte Datei vom Server
 * @returns {Promise<string>} 
*/
async function fetchText(url) {
    const res = await fetch(url);
    if (res.ok) {
        const text = await res.text();
        return text;
    } else {
        return "";
    }
}


/**
 * Alle [sub-list] Elemente laden
 * //@param {any[]} linkList Liste mit Links, denen [sub-list] Elemente folgen
 */
export function setSublist() {
    const linkList = document.querySelectorAll("nav a");
    if (!linkList) { return; }

    // console.log("linkList:", linkList);

    // bestehende Liste leeren
    subList = [];

    linkList.forEach((link) => {
        // @ts-ignore
        const linkUrl = link.hash;
        const subListElm = link.nextElementSibling;

        //console.log("subListObj:", linkUrl, subListElm);
        // Wenn Hash und Element
        if (linkUrl) {  //  && subListElm
            subList.push({ hash: linkUrl, linkElm: link, subElm: subListElm });
        }
    });
    // console.log("subList:", subList);
} // setSubList


// Navigation prüfen
/**
 * 
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
    if (!module || !Array.isArray(module)) {return;}
    
    // alle module durchgehen
    for (let i = 0;i < module.length; i++) {
        const modulName = module[i];
        if (!modulName.startsWith("/")) {continue;}
        let m = await import(modulName);

        // init Funktion aufrufen wenn vorhanden
        if (typeof m?.init == "function") {
            m.init();
        }
    }
}



/**
 * Läd und Parsed Content aus einer Markdown Datei
 * Und Zeigt den Inhalt im Element an.
 * @param {string} url - Pfad zur MD Datei die geladen wird
 * @param {HTMLElement} [elm] - OPTIONAL HTMLElement in den der Conten geschrieben wird
 * @returns {Promise<void>}
 */
export async function showContent(url, elm) {
    if (!url) { return; }
    //if (!url.endsWith(".md")) { return; }
    if (!url.endsWith(".html")) { return; }

    // Navigation
    if (navElm instanceof HTMLElement) {
        let latstPos = url.lastIndexOf("/");
        let navPath = url.substring(0, latstPos);
        // todo: hier weiter mit Navigation
    }



    // console.log("siteURL:", url);

    // Markdown als Text holen
    //const mdString = await fetchText(url);
    
    // HTML String holen
    const htmlString = await fetchText(config.buildPath + url);
    //console.log("mdString:", mdString);

    // Markdown in SeitenData parsen
    //const siteData = parseMd(mdString);

    //console.log("siteData:", siteData);

    // todo: Links mit HashTag ausbessern

    // todo: Template mit Inhalt zusammenführen

    // HTML im Body anzeigen
    if (!elm) {elm = contentElm}
    if (elm instanceof HTMLElement) {
        elm.innerHTML = "";
        elm.insertAdjacentHTML("afterbegin", htmlString);
    }

    // const keys = [...siteData.html.keys()];
    // for (let i = 0; i < keys.length; i++) {
    //     const key = keys[i];
    //     const value = siteData.html.get(key) || "";
    //     const cElm = document.getElementById(key);
    //     if (cElm instanceof HTMLElement && value) {
    //         cElm.innerHTML = "";
    //         cElm.insertAdjacentHTML("afterbegin", value);
    //     } else if (key == "content" && !cElm) {
    //         if (contentElm instanceof HTMLElement) {
    //             contentElm.innerHTML = "";
    //             contentElm.insertAdjacentHTML("afterbegin", value);
    //         }
    //     }
    // }

    // siteData.html.forEach((value, key) => {
    //     if (key == "content") {
    //         elm.innerHTML = "";
    //         elm.insertAdjacentHTML("afterbegin", value);
    //         return;
    //     }
    //     const cElm = document.getElementById(key);
    //     if (cElm instanceof HTMLElement) {
    //         cElm.innerHTML = "";
    //         cElm.insertAdjacentHTML("afterbegin", value);
    //     }
    // });
    
    //await loadModule(siteData.data.module);
} // showContent



/**
 * Seite Parsen und anzeigen
 * @returns {Promise<void>}
 */
export async function showSite() {
    const siteUrl = getHashUrl();
    await showContent(siteUrl);
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

// Alle Lidoc elemente lesen
/** @type {NodeListOf<HTMLElement>} */
const lidocElmList = document.querySelectorAll("[data-lidoc]");

let isContent = false;
for (let i = 0; i < lidocElmList.length; i ++) {
    const elm = lidocElmList[i];
    let url = elm.dataset.lidoc || "";
    url = checkSiteUrl(url);

    // ID auf "content" prüfen
    if (elm.id == "content") {
        contentElm = elm;
        isContent = true;
        // prüfen auf hash. Hash überschreibt die angegebene Url bei Content
        if (window.location.hash) {
            url = checkSiteUrl(window.location.hash);
        }
        await showContent(url, contentElm);
    } else if (elm.id == "nav") {
        await showContent(url, elm);
        setSublist();
    } else {
        showContent(url, elm); // kein await notwengig, kann gleichzeitig geladen werden
    }
}

if (!isContent) {
    // wenn noch kein Content geladen
    await showSite();
}

// Navigation prüfen
checkNav();

// Syntax Highlighter
// @ts-ignore
if (window?.Prism) {
    // @ts-ignore
    window.Prism.highlightAll();
}


// =======================
//   Events
// ------------

// Wenn sich der Hash ändert
addEventListener("hashchange", (e) => {
    showSite();
});

