// ==================================
//  Locale Datei Speicher
// Erstellen, laden, Speichern, löschen von Text-basierenden Daten
// ==================================
// @ts-check

// ===================================
// Origin private file system (OPFS)
// verfügbar seit 2023
// ------------------------------------

/** @type {FileSystemDirectoryHandle} */
let dir;

try {
    dir = await navigator.storage.getDirectory();
} catch (err) {
    console.error("Filesystem: ", err);
};

// const fileHandle = await dir.getFileHandle('meineDatei.txt', { create: true });

// Schreiben
// const writable = await fileHandle.createWritable(); 
// await writable.write('Inhalt der Datei'); 
// await writable.close();

// Lesen
// const file = await fileHandle.getFile(); 
// const text = await file.text();

// Schreiben / erstellen
/**
 * Speichert Daten/String in eine Datei im Origin private file system (OPFS)
 * @param {string} fileName - Dateiname der verwendet wird
 * @param {string|object|Array<any>} data - Daten als String, Javascript Objekt, oder Array mit daten in der Reihenfolge der Datenbankfelder
 * @returns {Promise<string>} liefert "OK" zurück wenn Speichern erfolgreich
 */
export async function OPFS_write(fileName, data) {
    if (!fileName || typeof fileName != "string") { return "no Filename!"; }

    // nur wenn Speichern von Dateien möglich
    if (dir instanceof FileSystemDirectoryHandle) {
        // zu speichernde Daten als String
        var dataString = "";

        // Daten prüfen
        if (typeof data == "object") {
            dataString = JSON.stringify(data);
        } else if (typeof data == "string") {
            dataString = data;
        }

        // Datei Handle erstellen
        const fileHandle = await dir.getFileHandle(fileName, { create: true });

        // Datei schreiben
        const writable = await fileHandle.createWritable();
        await writable.write(dataString);
        await writable.close();

        // OK
        return "OK"
    } else {
        return "no File Storage!";
    }
}

// Lesen
/**
 * Läd Daten/String von einer Datei im Origin private file system (OPFS)
 * @param {string} fileName - Datei die gelesen wird
 * @returns {Promise<string>} Inhalt der Datei als Text, oder FehlerText.
 */
export async function OPFS_read(fileName) {
    if (!fileName || typeof fileName != "string") { return "no Filename!"; }

    // nur wenn Speichern von Dateien möglich
    if (dir instanceof FileSystemDirectoryHandle) {

        // Datei Handle erstellen
        const fileHandle = await dir.getFileHandle(fileName);

        // Datei Lesen
        const file = await fileHandle.getFile();
        return await file.text();
    } else {
        return "no File Storage!";
    }
}

// Löschen
/**
 * Löscht eine Datei aus dem Origin private file system (OPFS)
 * @param {string} fileName - Dateiname der zu löschenden Datei
 * @returns {Promise<string|undefined>} - "OK" wenn datei gelöscht werden konnte.
 */
export async function OPFS_remove(fileName) {
    if (!fileName || typeof fileName != "string") { return "no Filename!"; }

    // nur wenn Speichern von Dateien möglich
    if (dir instanceof FileSystemDirectoryHandle) {
        // datei Löschen
        dir.removeEntry(fileName).then(() => {
            return "OK";
        }).catch((err) => {
            return "not deleted!";
        });
    } else {
        return "no File Storage!";
    }
}


// ===================================
// Indexed DB
// verfügbar seit 2015
// ------------------------------------

const IDBName = "db1";
const IDBStoreName = "data";
const IDBStoreId = "id";

// Datenbank öffnen
/**
 * Gibt ein IDBDatabase Objekt zurück
 * @param {string} dbName - Name der Datenbank
 * @returns {Promise<IDBDatabase>}
 */
async function IDB_open(dbName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onerror = (event) => {
            console.error("Why didn't you allow my web app to use IndexedDB?!");
            reject("ERR: Open Database");
        };

        // Wenn Update erforderlich (oder Neuanlage ????)
        request.onupgradeneeded = (event) => {
            /** @type {IDBDatabase} */
            const db = request.result;
            let objStore;
            // Wenn der ObjektStor noch nicht existiert
            if (!db.objectStoreNames.contains(IDBStoreName)) {
                objStore = db.createObjectStore(IDBStoreName, { keyPath: IDBStoreId });
            }
            resolve(db);
        }

        // Wenn alles OK
        request.onsuccess = (event) => {
            resolve(request.result);
        };
    });
}

// Schreiben
/**
 * 
 * @param {string} fileName - Name des Indexes für das Speichern in die Datenbank.
 * @param {string|object|Array<any>} data - Daten als String, Javascript Objekt, oder Array mit daten in der Reihenfolge der Datenbankfelder
 * @returns {Promise<string>} liefert "OK" zurück wenn Speichern erfolgreich
 */
export async function IDB_write(fileName, data) {
    if (!fileName || typeof fileName != "string") { return "no FileName!"; }

    // Datenbank Objekt
    const db = await IDB_open(IDBName);
    if (!db) { return "no Database!"; }

    // zu speichernde Daten als String
    let dataString = "";

    // Daten prüfen
    if (typeof data == "object") {
        dataString = JSON.stringify(data);
    } else if (typeof data == "string") {
        dataString = data;
    }

    // Datenbank Item Objekt - Datenzeile
    const dataObj = { id: fileName, data: dataString };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(IDBStoreName, "readwrite");

        // Do something when all the data is added to the database.
        transaction.oncomplete = (event) => {
            resolve("OK");
        };

        transaction.onerror = (event) => {
            // Don't forget to handle errors!
            resolve("Error on write in database");
        };

        const objectStore = transaction.objectStore(IDBStoreName);
        const request = objectStore.put(dataObj);
        request.onsuccess = (event) => {
            resolve("OK");
        };
    });
}


/**
 * Läd Daten/String vom Local Storrage
 * @param {string} fileName - Datei die gelesen wird
 * @returns {Promise<string>} Inhalt der Datei als Text, oder FehlerText.
 */
export async function IDB_read(fileName) {
    if (!fileName || typeof fileName != "string") { return "no FileName!"; }

    // Datenbank Objekt
    const db = await IDB_open(IDBName);
    if (!db) { return "no Database!"; }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(IDBStoreName, "readwrite");
        const objectStore = transaction.objectStore(IDBStoreName);
        const request = objectStore.get(fileName);

        request.onerror = (event) => {
            // Don't forget to handle errors!
            resolve("Error on read from database");
        };

        request.onsuccess = (event) => {
            resolve(request.result.data); // Data ist die Eigenschaft der Datenobjektes {id: "", data: ""}
        };
    });
}


// Löschen
/**
 * Löscht eine Datei aus dem Local Storrage
 * @param {string} fileName - Dateiname der zu löschenden Datei
 * @returns {Promise<string|undefined>} - "OK" wenn datei gelöscht werden konnte.
 */
export async function IDB_remove(fileName) {
    if (!fileName || typeof fileName != "string") { return "no FileName!"; }

    // Datenbank Objekt
    const db = await IDB_open(IDBName);
    if (!db) { return "no Database!"; }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(IDBStoreName, "readwrite");
        const objectStore = transaction.objectStore(IDBStoreName);
        const request = objectStore.delete(fileName);

        request.onerror = (event) => {
            // Don't forget to handle errors!
            resolve("Error on delete from database");
        };

        request.onsuccess = (event) => {
            resolve("OK"); // Data ist die Eigenschaft der Datenobjektes {id: "", data: ""}
        };
    });
}


// ===================================
// Local Storrage
// verfügbar seit 2015
// ------------------------------------

// Schreiben
/**
 * 
 * @param {string} fileName - Dateiname der verwendet wird
 * @param {string|object|Array<any>} data - Daten als String, Javascript Objekt, oder Array mit daten in der Reihenfolge der Datenbankfelder
 * @returns {Promise<string>} liefert "OK" zurück wenn Speichern erfolgreich
 */
export async function LS_write(fileName, data) {
    if (!fileName || typeof fileName != "string") { return "no Filename!"; }

    // zu speichernde Daten als String
    var dataString = "";

    // Daten prüfen
    if (typeof data == "object") {
        dataString = JSON.stringify(data);
    } else if (typeof data == "string") {
        dataString = data;
    }

    try {
        localStorage.setItem(fileName, dataString);
        return "OK";
    } catch (err) {
        return "Error on LocalStorrage";
    }
}


/**
 * Läd Daten/String vom Local Storrage
 * @param {string} fileName - Datei die gelesen wird
 * @returns {Promise<string>} Inhalt der Datei als Text, oder FehlerText.
 */
export async function LS_read(fileName) {
    if (!fileName || typeof fileName != "string") { return "no Filename!"; }

    return localStorage.getItem(fileName) || "not found in LocalStorrage!";
}


// Löschen
/**
 * Löscht eine Datei aus dem Local Storrage
 * @param {string} fileName - Dateiname der zu löschenden Datei
 * @returns {Promise<string|undefined>} - "OK" wenn datei gelöscht werden konnte.
 */
export async function LS_remove(fileName) {
    if (!fileName || typeof fileName != "string") { return "no Filename!"; }

    localStorage.removeItem(fileName);
    return "OK";
}

// todo: LocalFile Classe anlegen, die je nach verfügbarkeit des Datenspeichers Daten speichert, liest oder löscht.
