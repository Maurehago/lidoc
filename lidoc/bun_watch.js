// ===========================
//   Dokument Build
// wandelt md Dateien in Html um
// benötigt Bun Javascript 
// ===============================
// @ts-check
import Bun from "bun";

import { Glob, write, file, serve } from "bun";
import { mkdir, unlink, rm, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { watch, existsSync } from "node:fs";
import { parseMd } from "./parsemd.js";

// ==============================
//   Parameter
// ------------

let docPath = "./doc"; // Pfad zu den Dokumenten
let buildPath = "./build"; // Pfad zu den Dokumenten
let serverPort = 8080;

// ==============================
//   Funktionen
// -------------

/**
 * Prüft ob ein Pad ein Ordner ist
 * @param {string} path - Pfad der geprüft wird
 * @returns {Promise<boolean>} true wenn Ordner
 */
async function isDirectory(path) {
    try {
        const stats = await stat(path);
        return stats.isDirectory();

        if (stats.isDirectory()) {
            console.log("Das ist ein Ordner");
        } else if (stats.isFile()) {
            console.log("Das ist eine Datei");
        }
    } catch (error) {
        console.error("Pfad existiert nicht oder kein Zugriff");
        return false;
    }
    return false;
}

async function cleanBuildDir() {
    if (existsSync(buildPath)) {
        // Löscht den Ordner rekursiv und erzwingt es (force)
        await rm(buildPath, { recursive: true, force: true });
        console.log("Cleanup build.");
    }

    // Ordner neu erstellen, damit er für den Sync bereit ist
    await mkdir(buildPath, { recursive: true });
}

/**
 * Parsed und kopiert die Quell Dateien
 * @param {string} relativePath - relativer PfadName
 */
async function syncFile(relativePath) {
    const srcPath = join(docPath, relativePath);
    const destPath = join(buildPath, relativePath.replace(".md", ".html"));

    // Sicherstellen, dass Unterordner existiert
    await mkdir(dirname(destPath), { recursive: true });

    if (relativePath.endsWith(".md")) { // Beispiel für "spezielle Endung"
        const content = await file(srcPath).text(); // Inhalt der Datei
        const siteInfo = parseMd(content, { basePath: buildPath });
        // todo: Links Ausbessern (wenn nicht relative Pfade)
        // todo: Tagliste erstellen
        let parsed = siteInfo.html.get("content") || ""; // { ...content, builtAt: Date.now() }; // Parsing-Logik
        // todo: Script Module 

        // // 1. HTML vom Server laden und in ein Element einfügen (z.B. in ein div mit der ID 'ziel-element')
        // fetch('server-teil.html')
        //   .then(response => response.text())
        //   .then(html => {
        //     document.getElementById('ziel-element').innerHTML = html;

        //     // 2. Dynamischen script type="module" Tag erstellen
        //     const script = document.createElement('script');
        //     script.type = 'module';
            
        //     // 3. Den Import und den Funktionsaufruf definieren
        //     script.innerHTML = `
        //       import { init } from './spezielle-datei.js';
        //       init();
        //     `;

        //     // 4. Das Skript dem DOM hinzufügen (z.B. im head oder direkt am Ende des Body)
        //     document.head.appendChild(script);
        //   })
        //   .catch(error => console.error('Fehler beim Laden:', error));



        /** @type {string} */
        const module = siteInfo.data.module || "";
        if (module) {
            // Skript hinzufügen
            parsed += `<script type="module">
    import { init } from "${module}";
    init();
</script>`;
        }
        await write(destPath, parsed);
    } else {
        // Auf Directory prüfen
        const is_dir = await isDirectory(srcPath);
        if (!is_dir) {
            // Bilder und andere Dateien direkt kopieren
            await write(destPath, file(srcPath));
            console.log("File:", srcPath, "->", destPath);
        } else {
            console.log("is Dir:", srcPath);
        }
    }

    // Browser informieren, dass eine Datei aktualisiert wurde
    if (server) {
        server.publish("reload-topic", "reload");
    }
}


async function processAll() {
    const glob = new Glob("**/*"); // Rekursiv alle Dateien
    for (const relativePath of glob.scanSync(docPath)) {
        await syncFile(relativePath);
    }
}

// ==============================
//   Start
// ---------

// Argumente lesen
const args = Bun.argv;
let lastArg = "";
let isBuild = false; // Build Modus
let isClear = false; // Lösch Modus

for (let i = 0; i < args.length; i++) {
    if (args[i] == "--build" || args[i] == "-b") {
        // Build modus
        isBuild = true;
    } else if (args[i] == "--clear" || args[i] == "-c") {
        // Datein vorher löschen
        isClear = true;
    } else if (lastArg == "--port" || lastArg == "-p") {
        serverPort = parseInt(args[i]);
    }

    // letzten Parameter merken
    lastArg = args[i];
}


// ============================
//   Watcher
// ----------
//const watcher = watch(docPath, { recursive: true }, async (event));
watch(docPath, { recursive: true }, async (event, filename) => {
    if (!filename) { return; }

    const sourcePfad = join(docPath, filename || "");
    const targetPfad = join(buildPath, filename || "");

    // event ist entweder 'change'(Inhalt änderung) oder 'rename'(Datei neu, umbenannt, verschoben)
    if (event === 'rename') {

        // Prüfen, ob die Datei noch da ist
        const exists = await Bun.file(sourcePfad).exists();

        if (!exists) {
            // Datei wurde im Quellordner gelöscht oder verschoben
            console.log(`Datei gelöscht: ${filename}`);
            try {
                await unlink(targetPfad);
                console.log(`Gelöscht im Build-Ordner: ${filename}`);
            } catch (e) {
                // Datei existierte evtl. gar nicht im Build
            }
        } else {
            await syncFile(filename);
            console.log(`Datei erstellt oder umbenannt zu: ${filename}`);
        }
    } else if (event === 'change') {
        await syncFile(filename);
        console.log(`Datei Inhalt geändert: ${filename}`);
    }
});
console.log("watch at", docPath, "...");

// for (const event of watcher) {
//     // event.filename ist der Name der betroffenen Datei
//     if (!event.filename) {continue;}    

//     const filename = event.filename;
//     const sourcePfad = join(docPath, filename || "");
//     const targetPfad = join(buildPath, filename || "");

//     // event.eventType ist entweder 'change'(Inhalt änderung) oder 'rename'(Datei neu, umbenannt, verschoben)
//     if (event.eventType === 'rename') {

//         // Prüfen, ob die Datei noch da ist
//         const exists = await Bun.file(sourcePfad).exists();

//         if (!exists) {
//             // Datei wurde im Quellordner gelöscht oder verschoben
//             console.log(`Datei gelöscht: ${filename}`);
//             try {
//                 await unlink(targetPfad);
//                 console.log(`Gelöscht im Build-Ordner: ${filename}`);
//             } catch (e) {
//                 // Datei existierte evtl. gar nicht im Build
//             }
//         } else {
//             await syncFile(filename);
//             console.log(`Datei erstellt oder umbenannt zu: ${filename}`);
//         }
//     } else if (event.eventType === 'change') {
//         await syncFile(filename);
//         console.log(`Datei Inhalt geändert: ${filename}`);
//     }
// }

// --- 2. SERVER LOGIK ---

const server = serve({
    port: serverPort,
    async fetch(req) {
        // WebSocket-Anfrage für Hot Reload
        if (server.upgrade(req)) return;

        const url = new URL(req.url);
        //let path = !url.pathname.includes(".") ? url.pathname + "/index.html" : url.pathname;

        /** @type {string} */
        let path = url.pathname;

        console.log("Path:", path);
        let serverFile = path;
        if (serverFile == "/") {
            serverFile = "./index.html";
            const file = Bun.file(serverFile);
            if (await file.exists()) {
                // Wenn es HTML ist, Reload-Script injizieren
                if (serverFile.endsWith(".html")) {
                    let text = await file.text();
                    text += `
              <script>
                const ws = new WebSocket("ws://" + location.host);
                ws.onmessage = () => location.reload();
                ws.onclose = () => setTimeout(() => location.reload(), 500);
              </script>`;
                    return new Response(text, { headers: { "Content-Type": "text/html" } });
                }
                return new Response(file);
            }
        }


        const file = Bun.file("./" + serverFile);
        if (await file.exists()) {
            return new Response(file);
        }
        return new Response("", { status: 404 });
    },
    websocket: {
        open(ws) { ws.subscribe("reload-topic"); },
        message() { },
    },
});

console.log(`Server läuft auf ${server.url}`);

// ============================
//   Builder
// ----------

if (isClear) { await cleanBuildDir(); }
if (isBuild) { await processAll(); }

// todo: Navigation erstellen lassen - von allen ersten Unterordnern oder nur bestimmten Unterordner
// todo: Tagliste erstellen - eventuell Kategorie(oberster Ordner) und Tags - Suche oder Linkliste für Tags
