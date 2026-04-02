// ====================
//   Infodata
// ====================
// @ts-check

import { DataList } from "./infodata.js";


// ===========================
//   Typen
// --------


// ===================================
//   Funktionen
// -------------


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
 * @param {string|object|Array<any>|Map<string|number,any>} data - Daten String, Daten Objekt oder Map von Daten
 * @param {string|number} id - ID des Datensatzes. Wird bei Map nicht verwendet.
 * @returns {Promise<string>} liefert "OK" zurück wenn Speichern erfolgreich
 */
export async function IDB_write(dbName, storeName, data, id) {
    if (!storeName || typeof storeName != "string") { return "No StoreName!"; }

    // Datenbank Objekt
    const db = await IDB_open(dbName, storeName);
    if (!db) { return "No Database!"; }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const objectStore = transaction.objectStore(storeName);

        // Wenn eine Map von Daten
        if (data instanceof Map) {
            const keys = [...data.keys()];
            for (let i = 0; i < keys.length; i++) {
                objectStore.put(data.get(keys[i]), keys[i]);
            }
        } else {
            objectStore.put(data, id);
        }

        // Do something when all the data is added to the database.
        transaction.oncomplete = (event) => {
            resolve("OK");
        };

        transaction.onerror = (event) => {
            // Don't forget to handle errors!
            resolve("Error on write in database");
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
 * @returns {Promise<string>} - "OK" wenn datei gelöscht werden konnte.
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
            resolve("OK"); 
        };
    });
}


// ===========================
//  IndexedDB Liste
// -----------------

export class IDBList extends DataList {
    #dbName = "";
    #storeName = "";

    /**
     * Speichert den Datensatz in der Liste und in der Datenbank die beim Erstellen der Liste definiert worden ist.  
     * Der StorName ist der Klassenname.
     * @param {object} obj - Datensatz der gespeichert wird
     * @returns {Promise<string>} "OK" wenn gespeichert, sonnst eine Fehlermeldung
     */
    async write(obj) {
        // objekt in Liste
        obj = this.set(obj);
        const id = this.getID(obj);
        if (this.#dbName) {
            // Objekt in Datenbank
            return await IDB_write(this.#dbName, this.#storeName, obj, id);
        } else {
            return "No Database!";
        }
    }


    /**
     * Speichert alle Objekte der Liste oder nur die vom angegebenen Index in die IndexedDB Datenbank
     * @param {string} index - Optional Indexname
     * @returns {Promise<string>} "OK" wenn gespeichert
     */
    async writeAll(index) {
        const rowList = this.getIndex(index);

        // Liste mit Objekten
        const objList = new Map();

        // Alle Datensätze durchgehen
        for (let i = 0; i < rowList.length; i++) {
            objList.set(rowList[i], this.get(rowList[i]));
        }

        // Speichern
        return await IDB_write(this.#dbName, this.#storeName, objList, "map");
    }


    /**
     * Liest einen Datensatz aus der Datenbank und legt in in der Liste ab.  
     * Gibt den Datensatz als Klassen-Instanz oder eine Fehlermeldung zurück.
     * @param {string|number} key - ID des Datensatzes
     * @returns {Promise<string|object|undefined>} Fehlermeldung oder Klasseninstanz
     */
    async read(key) {
        let obj = {};
        if (this.#dbName) {
            const res = await IDB_read(this.#dbName, this.#storeName, key);
            if (typeof res == "string") {
                return res;
            }

            // @ts-ignore - Neue Klasseninstanz
            const obj = new this.#class();
            Object.assign(obj, res);

            // objekt in Liste setzen
            this.set(obj);
            return obj;
        } else {
            return this.get(key);
        }
    }


    /**
     * Ließt alle Datensätze von der IndexedDB in diese Liste
     * @returns {Promise<string>} "OK" wenn geladen, sonnst eine Fehlermeldung
     */
    async readAll() {
        if (this.#dbName) {
            const list = await IDB_getAll(this.#dbName, this.#storeName);
            if (typeof list == "string") {
                return list;
            }

            // Alle Datensätze durchgehen
            for (let i = 0; i < list.length; i++) {
                // @ts-ignore - Instanz erstellen
                const obj = new this.#class();
                Object.assign(obj, list[i]);
                this.set(obj);
            }

            // OK
            return "OK";
        } else {
            return "No Database!";
        }
    }


    /**
     * Löscht Datensätze aus der Datenbank und der Liste
     * @param {string|number|Array<string|number>} key - ID oder Liste mit IDs der dzu löschenden Datensätze
     * @returns {Promise<string>} "OK" wenn alle gelöscht
     */
    async deleteInDB(key) {
        if (this.#dbName) {
            let res = "";
            if (Array.isArray(key)) {
                for (let i = 0; i < key.length; i++) {
                    res = await IDB_remove(this.#dbName, this.#storeName, key[i]) || "";
                    if (res != "OK") {return res;}
                    this.delete(key[i]);
                }
            } else {
                res = await IDB_remove(this.#dbName, this.#storeName, key) || "";
                if (res != "OK") {return res;}
                this.delete(key);
            }
            return res;
        } else {
            return "No Database!";
        }
    }


    /**
     * Erzeugt eine List Instanz
     * @param {Function|Object<string,any>} obj - Klasse oder Constructor Funktion
     * @param {string|Array<string>} idName - Name des ID Feldes oder Liste mit Namen wenn nur durch mehrere Spalten eindeutig
     * @param {string} [dbName] - Optional Datenbankname der IndexedDB in der die Liste gespeichert wird. 
     */
    constructor(obj, idName, dbName) {
        // DataList Constructor
        super(obj, idName);

        this.#dbName = dbName || "";
        this.#storeName = obj.constructor.name;
    }
}


// =========================
//   Datenspeicher
// für einzelne Objekte
// ---------------------

export class Store {
    #dbName = "";
    #storeName = "";

    /**
     * Speichert Daten in die IndexedDB
     * @param {string|number} id - ID des Datensatzes
     * @param {any} data - Daten zum Speichern
     * @returns {Promise<string>} "OK" wenn Speichern erfolgreich
     */
    async write(id, data) {
        if (this.#dbName && this.#storeName) {
            return await IDB_write(this.#dbName, this.#storeName, data, id);
        } else {
            return "No Database or Store!";
        }
    }

    /**
     * Speichert Daten in die IndexedDB
     * @param {string|number} id - ID des Datensatzes
     * @returns {Promise<any>} Daten oder Fehlermeldung
     */
    async read(id) {
        if (this.#dbName && this.#storeName) {
            return await IDB_read(this.#dbName, this.#storeName, id);
        } else {
            return "No Database or Store!";
        }
    }

    /**
     * Speichert Daten in die IndexedDB
     * @param {string|number} id - ID des Datensatzes
     * @returns {Promise<string>} "OK" wenn Speichern erfolgreich
     */
    async delete(id) {
        if (this.#dbName && this.#storeName) {
            return await IDB_remove(this.#dbName, this.#storeName, id);
        } else {
            return "No Database or Store!";
        }
    }

    /**
     * Erstellt eine Instanz eines lokalen Datenspeichers
     * @param {string} dbName - Name der Datenbank
     * @param {string} storeName - Name des Datenspeichers(Tabelle)
     */
    constructor(dbName, storeName) {
        this.#dbName = dbName || "";
        this.#storeName = storeName || "";
    }
}
