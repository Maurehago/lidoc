// ====================
//   lidoc APP
// 2024-09-08
// ====================
// @ts-check

// Erstellt aus Markdown Dateien und Templates HTML-Seiten

import { parseMd } from "./parsemd.js";

// Hash von URL lesen, um Seiteninhalte nachladen zu können
let siteUrl = window.location.hash;
if (!siteUrl) {
    siteUrl = "#/index.html";
}

// Listen Laden

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


// Seite Parsen und anzeigen
/**
 * 
 * @param {string} siteUrl - URL zu der Seite die angezeigt wird
 */
async function showSite(siteUrl) {
    if (!siteUrl) {return;}
    if (!siteUrl.endsWith(".html")) {return;}

    console.log("siteURL:", siteUrl);

    // @ts-ignore
    const body = window.document.body;
    if (!body) {return;}

    // URL für Markdown vom Server
    let mdUrl = siteUrl.replace(".html", ".md");

    // Seitenurl ausbessern wenn absolut
    if (mdUrl.startsWith("#/")) {
        mdUrl = mdUrl.replace("#/", "/src/");
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

    // HTML im Body anzeigen
    body.innerHTML = "";
    body.insertAdjacentHTML("afterbegin", siteData.html);
} // 

// Seite Anzeigen
showSite(siteUrl);
