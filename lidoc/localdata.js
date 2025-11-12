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
        try {
            // Datei Handle erstellen
            const fileHandle = await dir.getFileHandle(fileName);

            // Datei Lesen
            const file = await fileHandle.getFile();
            if (file instanceof File) {
                let text = await file.text();
                if (text.startsWith("{") || text.startsWith("[")) {
                    return JSON.parse(text) || text;
                } else {
                    return text;
                }
            } else {
                return "no File";
            }
        } catch (err) {
            console.log("OPFS_read: ", err);
            return "ERROR: OPFS_read";
        }
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
// Safari seit 2016
// edge seit 2020 (funktion getAll)
// ------------------------------------

// Datenbank öffnen
/**
 * Gibt ein IDBDatabase Objekt zurück
 * @param {string} dbName - Name der Datenbank
 * @param {string|Array<string>} [storeName] - Optional Name oder Liste von Namen für neue Datenstores. "dbVersion" muss bei neuen Tabellen/Stores erhöht werden.
 * @param {number} [dbVersion] - Optional Version der Datenbank
 * @returns {Promise<IDBDatabase>}
 */
export async function IDB_open(dbName, storeName, dbVersion) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        request.onerror = (event) => {
            console.error("Why didn't you allow my web app to use IndexedDB?!");
            reject("ERR: Open Database");
        };

        // Wenn Update erforderlich (oder Neuanlage ????)
        request.onupgradeneeded = (event) => {
            /** @type {IDBDatabase} */
            const db = request.result;
            let objStore;
            if (Array.isArray(storeName)) {
                for (let i = 0; i < storeName.length; i++) {
                    // Wenn der ObjektStore noch nicht existiert
                    if (storeName[i] && !db.objectStoreNames.contains(storeName[i])) {
                            objStore = db.createObjectStore(storeName[i]);
                    }
                }
            } else {
                // Wenn der ObjektStore noch nicht existiert
                if (storeName && !db.objectStoreNames.contains(storeName)) {
                        objStore = db.createObjectStore(storeName);
                }
            }
            resolve(db);
        }

        // Wenn alles OK
        request.onsuccess = (event) => {
            /** @type {IDBDatabase} */
            const db = request.result;
            resolve(db);
        };
    });
}

// Schreiben
/**
 * Schreibt Daten in eine IndexedDB
 * @param {string} dbName - Name der Datenbank
 * @param {string} storeName - Name des Datenspeichers(Tabelle) in der Datenabnk
 * @param {string|object|Array<any>} data - Daten String oder Daten Objekt
 * @param {string|number} id - ID des Datensatzes
 * @returns {Promise<string>} liefert "OK" zurück wenn Speichern erfolgreich
 */
export async function IDB_write(dbName, storeName, data, id) {
    if (!storeName || typeof storeName != "string") { return "No StoreName!"; }

    // Datenbank Objekt
    const db = await IDB_open(dbName, storeName);
    if (!db) { return "No Database!"; }

    let objStore;
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");

        // Do something when all the data is added to the database.
        transaction.oncomplete = (event) => {
            resolve("OK");
        };

        transaction.onerror = (event) => {
            // Don't forget to handle errors!
            resolve("Error on write in database");
        };

        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.put(data, id);
        request.onsuccess = (event) => {
            resolve("OK");
        };
    });
}


/**
 * Läd Daten von einer IndexedDB
 * @param {string} dbName - Name der Datenbank
 * @param {string} storeName - Name der Datentabelle
 * @param {string|number} id - ID des Datensatzes
 * @returns {Promise<string|object|Array<any>>} Datensatz oder FehlerText.
 */
export async function IDB_read(dbName, storeName, id) {
    if (!dbName || typeof dbName != "string") { return "No DBName!"; }
    if (!storeName || typeof storeName != "string") { return "No StoreName!"; }

    // Datenbank Objekt
    const db = await IDB_open(dbName, storeName);
    if (!db) { return "no Database!"; }

    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(storeName, "readwrite");
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.get(id);

            request.onerror = (event) => {
                // Don't forget to handle errors!
                resolve("Error on read from database");
            };

            request.onsuccess = (event) => {
                resolve(request.result); // Datensatz
            };
        } catch (err) {
            console.error("IDB_read: ", err);
            resolve("IDB_read: Error");
        }
    });
}

/**
 * Läd alle Datensätze eines Datenstores von einer IndexedDB
 * @param {string} dbName - Name der Datenbank
 * @param {string} storeName - Name der Datentabelle
 * @returns {Promise<string|Array<any>>} Inhalt der Datei als Text, oder FehlerText.
 */
export async function IDB_getAll(dbName, storeName) {
    if (!dbName || typeof dbName != "string") { return "No DBName!"; }
    if (!storeName || typeof storeName != "string") { return "No StoreName!"; }

    // Datenbank Objekt
    const db = await IDB_open(dbName, storeName);
    if (!db) { return "no Database!"; }

    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(storeName, "readwrite");
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.getAll();

            request.onerror = (event) => {
                // Don't forget to handle errors!
                resolve("Error on read from database");
            };

            request.onsuccess = (event) => {
                resolve(request.result); // Liste von Datensätzen
            };
        } catch (err) {
            console.error("IDB_read: ", err);
            resolve("IDB_read: Error");
        }
    });
}



// Löschen
/**
 * Löscht eine Datei aus dem Local Storrage
 * @param {string} dbName - Name der Datenbank
 * @param {string} storeName - Name der Datentabelle
 * @param {string|number} id - ID des Datensatzes
 * @returns {Promise<string|undefined>} - "OK" wenn datei gelöscht werden konnte.
 */
export async function IDB_remove(dbName, storeName, id) {
    if (!dbName || typeof dbName != "string") { return "No DBName!"; }
    if (!storeName || typeof storeName != "string") { return "No StoreName!"; }

    // Datenbank Objekt
    const db = await IDB_open(dbName, storeName);
    if (!db) { return "no Database!"; }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.delete(id);

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
 * @param {string} storeName - Speichername der verwendet wird
 * @param {string|object|Array<any>} data - Daten als String, Javascript Objekt, oder Array mit daten in der Reihenfolge der Datenbankfelder
 * @returns {Promise<string>} liefert "OK" zurück wenn Speichern erfolgreich
 */
export async function LS_write(storeName, data) {
    if (!storeName || typeof storeName != "string") { return "no storeName!"; }

    // zu speichernde Daten als String
    var dataString = "";

    // Daten prüfen
    if (typeof data == "object") {
        dataString = JSON.stringify(data);
    } else if (typeof data == "string") {
        dataString = data;
    }

    try {
        localStorage.setItem(storeName, dataString);
        return "OK";
    } catch (err) {
        return "Error on LocalStorrage";
    }
}


/**
 * Läd Daten/String vom Local Storrage
 * @param {string} storeName - Datei die gelesen wird
 * @returns {Promise<string>} Inhalt der Datei als Text, oder FehlerText.
 */
export async function LS_read(storeName) {
    if (!storeName || typeof storeName != "string") { return "no storeName!"; }

    let text = localStorage.getItem(storeName) || "not found in LocalStorrage!";
    if (text.startsWith("{") || text.startsWith("[")) {
        return JSON.parse(text) || text;
    } else {
        return text;
    }
}


// Löschen
/**
 * Löscht eine Datei aus dem Local Storrage
 * @param {string} storeName - Dateiname der zu löschenden Datei
 * @returns {Promise<string|undefined>} - "OK" wenn datei gelöscht werden konnte.
 */
export async function LS_remove(storeName) {
    if (!storeName || typeof storeName != "string") { return "no storeName!"; }

    localStorage.removeItem(storeName);
    return "OK";
}



// LocalData
export class LocalData {
    /** @type {"auto"|"opfs"|"idb"|"ls"} */
    #storeType = "idb";
    #dbName = "";

    /**
     * DatenStor Typ
     * @type {"auto"|"opfs"|"idb"|"ls"}
     */
    get type() {
        return this.#storeType;
    }

    /**
     * Schreibt Daten Local 
     * @param {string} storeName - Name des Datenspeichers
     * @param {string|object|Array<any>} data - Daten
     * @param {string|number} [id] - Optional ID des Datensatzes bei IndexedDB
     * @returns {Promise<string>}
     */
    async write(storeName, data, id) {
        switch (this.#storeType) {
            case "opfs":
                return await OPFS_write(storeName, data);
                break;
            case "idb":
                if (id != undefined) {
                    return await IDB_write(this.#dbName, storeName, data, id);
                } else {
                    return "No Datarow ID!";
                }
                break;
            case "ls":
                return await LS_write(storeName, data);
                break;
            default:
                return "";
                break;
        }
    }


    /**
     * Liest Lokale Daten 
     * @param {string} storeName - Name des Datenspeichers
     * @param {string|number} [id] - Optional ID des Datensatzes bei IndexedDB
     * @returns {Promise<string|object|Array<any>>}
     */
    async read(storeName, id) {
        switch (this.#storeType) {
            case "opfs":
                return await OPFS_read(storeName);
                break;
            case "idb":
                if (id != undefined) {
                    return await IDB_read(this.#dbName, storeName, id);
                } else {
                    return "No Datarow ID!";
                }
                break;
            case "ls":
                return await LS_read(storeName);
                break;
            default:
                return "";
                break;
        }
    }

    /**
     * Liefert eine Liste aller Datensatzobjekte in einer IndexedDB zurück.
     * Ist der Typ nicht "idb" wird ein leeres Array zurückgegeben.
     * @param {string} storeName - DatenStore Name
     * @returns {Promise<string|Array<any>>}
     */
    async getAll(storeName) {
        if (this.#storeType != "idb") { return "Type is not 'idb'!";}
        return await IDB_getAll(this.#dbName, storeName);
    }

    /**
     * Löscht lokale Daten
     * @param {string} storeName - Datenspeicher
     * @param {string|number} [id] - ID des Datensatzes bei IndexedDB
     * @returns {Promise<string|undefined>}
     */
    async remove(storeName, id) {
        switch (this.#storeType) {
            case "opfs":
                return await OPFS_remove(storeName);
                break;
            case "idb":
                if (id != undefined) {
                    return await IDB_remove(this.#dbName, storeName, id);
                } else {
                    return "No Data ID!";
                }
                break;
            case "ls":
                return await LS_remove(storeName);
                break;
            default:
                return "";
                break;
        }
    }

    /**
     * 
     * @param {"auto"|"opfs"|"idb"|"ls"} [type] - Optional Typ des Datenspeichers 
     * @param {string} [dbName] - Optional Datenbank Name. Muss beim typ "idb" angegeben werden.
     */
    constructor(type = "auto", dbName) {
        if (type == "opfs") {
            if (!dir) {
                // todo: Fehler Geht net
                console.log("LocalData: no OPFS!");
            }
        } else if (type == "idb") {
            if (!indexedDB) {
                // todo: Fehler
                console.log("LocalData: no IndexedDB!");
            }
        } else if (type == "ls") {
            if (!localStorage) {
                // todo: Fehler
                console.log("LocalData: no LocalStorage!");
            }
        } else if (type == "auto") {
            if (dir) {
                type = "opfs";
            } else if (indexedDB) {
                type = "idb";
            } else if (localStorage) {
                type = "ls";
            } else {
                // todo: Fehler
                console.log("LocalData: no local Storage Technologie!");
                return;
            }
        }
        
        this.#storeType = type;
        this.#dbName = dbName || "localdata";
    }
}
