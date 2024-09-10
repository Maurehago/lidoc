// ====================
//   lidoc APP
// 2024-09-08
// ====================

// Erstellt aus Markdown Dateien und Templates HTML-Seiten

// @ts-check

// ==================
//   Imports
// -----------
import { parseMd } from "./parsemd.js";


// ==================
//   Types
// -----------

//** @typedef {import("lib.dom.d.ts").HTMLElement} HTMLElement */


// ===============================
//   Parameter
// ------------

const sourcePath = "/src/"; // Pfad in dem die Markdown Sourse Dateien liegen


// Hash von URL lesen, um Seiteninhalte nachladen zu können


// ===============================
//   Funktionen
// -------------

/**
 * Hash von URL lesen, um Seiteninhalte nachladen zu können
 * @returns {string} - URL der Markdownseite
 */
export function getHashUrl() {
    let siteUrl = window.location.hash;
    if (!siteUrl) {
        siteUrl = "#/index.md";
    }
    if (siteUrl.endsWith("/")) {
        siteUrl += "index.md";
    }
    if (siteUrl.endsWith(".html")) {
        siteUrl = siteUrl.replace(".html", ".md");
    }
    if (!siteUrl.endsWith(".md")) {
        siteUrl += ".md";
    }
    return siteUrl;
}

/**
 * Text aus Datei vom Server
 * @param {string} url - URL für Text basierte Datei vom Server
 * @returns {Promise<string>} 
*/
async function fetchText(url) {
    const res = await fetch(url);
    const text = await res.text();
    return text;
}


// Listen Laden

/**
 * Läd und Parsed Content aus einer Markdown Datei
 * Und Zeigt den Inhalt im Element an.
 * @param {any} elm - HTMLElement
 * @param {string} url - Pfad zur MD Datei die geladen wird
 * @returns {Promise<void>}
 */
export async function showContent(elm, url) {
    if (!url) { return; }
    if (!url.endsWith(".md")) { return; }

    console.log("siteURL:", url);

    // URL für Markdown vom Server
    let mdUrl = url;

    // Seitenurl ausbessern wenn absolut
    if (mdUrl.startsWith("#/")) {
        mdUrl = mdUrl.replace("#/", sourcePath);
    } else {
        mdUrl = mdUrl.replace("#", "");
    }

    console.log("mdURL:", mdUrl);

    // Markdown als Text holen
    const mdString = await fetchText(mdUrl);
    console.log("mdString:", mdString);

    // Markdown in SeitenData parsen
    const siteData = parseMd(mdString);

    console.log("siteData:", siteData);

    // todo: Links mit HashTag ausbessern

    // todo: Template mit Inhalt zusammenführen

    // HTML im Body anzeigen
    elm.innerHTML = "";
    elm.insertAdjacentHTML("afterbegin", siteData.html.get("content"));
} // showSite



/**
 * Seite Parsen und anzeigen
 * @param {any} elm - URL zu der Seite die angezeigt wird
 */
export function showSite(elm) {
    const siteUrl = getHashUrl();
    showContent(elm, siteUrl);
} // showSite

// Seite Anzeigen
// showSite();
