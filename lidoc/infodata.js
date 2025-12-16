// ====================
//   Infodata
// ====================
// @ts-check


// ===========================
//   Typen
// --------

/** 
 * Callback Funktion die für die Sortierung verwendet wird
 * @callback CallbackSortFunction
 * @param {Object<string,any>} A - 1. Objekt für vergleich
 * @param {Object<string,any>} B - 2. Objekt für vergleich
 * @returns {number} Bei Aufsteigend: (A > B) => 1; (A < B) => -1; (A == B) => 0
 */

/** 
 * Callback Funktion die für jede Gruppe ausgeführt wird
 * @callback CallbackGroupFunction
 * @param {Array<any>} objList - Liste mit gefilterten Datensatz Objekten, pro Gruppe
 * @param {Array<string|number>} [idList] - Liste mit ID's der gefilterten Datenzeilen pro Gruppe
 * @param {Array<string|number>} [list] - Gesammte ID-Liste nach optionalen Index
 */

/** 
 * Callback Funktion die für alle Datensätze ausgeführt wird.  
 * Wenn die Funktion "true" zurückliefert, wird der Datensatz in die neue Liste und Index aufgenommen.
 * @callback CallbackFilterFunction
 * @param {any} obj - Datensatz Objekt
 * @param {number} [index] - Position in der Liste nach Index
 * @param {Array<string|number>} [list] - Gesammte ID-Liste nach optionalen Index
 * @returns {boolean|undefined} Wenn "true" dann kommt der Datensatz in die neue gefilterte Liste.
 */

/** 
 * Callback Funktion die für alle Datensätze ausgeführt wird.  
 * Wenn die Funktion "true" zurückliefert, wird die ganze For-Schleife abgebochen.
 * @callback CallbackForFunction
 * @param {any} obj - Datensatz Objekt
 * @param {number} [index] - Position in der Liste nach Index
 * @param {Array<string|number>} [list] - Gesammte ID-Liste nach optionalen Index
 * @returns {boolean|undefined} Wenn "true" dann Abbruch der Schleife
 */

/** 
 * Callback Funktion die für alle Spalten ausgeführt wird.  
 * Wenn die Funktion "true" zurückliefert, wird die ganze For-Schleife abgebochen.
 * @callback CallbackForColFunction
 * @param {string} colName - Name der Spalte
 * @param {Array<string>} [colList] - Liste der Spalten-Namen
 * @returns {boolean|undefined} Wenn "true" dann Abbruch der Schleife
 */


// ===================================
//   Funktionen
// -------------

/**
 * Gibt eine neue GlobalShortId zurück
 * @returns {string}
 */
export function getGSID() {
    return new Date().getTime().toString(36) +
        crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}

/**
 * Prüft ob ein Wert eine Zahl ist
 * @param {string} string - Text zum Prüfen
 * @returns 
 */
export function isNumber(string) {
    return !isNaN(Number(string));
}

/**
 * Prüft ob ein Objekt eine Klasse ist
 * @param {object} obj - Zu prüfendes Objekt
 * @returns {boolean} "true" wenn angegebenes Objet eine Klasse ist
 */
export function isClass(obj) {
    return typeof obj === 'function' && obj.prototype && obj.prototype.constructor === obj;
}

/**
 * Liefert einen Wert von einem Objekt Pfad(z.B.: von kunde, "adresse.hausnummer") zurück
 * @param {Object<string,any>} obj - Objekt mit der Eigenschaft
 * @param {string} prop - Eigenschaft Pfad mit "." getrennt
 * @returns {any|undefined} Wert der Eigenschaft oder "undefined" wenn nicht vorhanden
 */
function getPropValue(obj, prop) {
    if (typeof obj !== 'object') {return undefined;}
    if (typeof prop !== 'string') {return undefined;}

    // Replace [] notation with dot notation
    //prop = prop.replace(/\[["'`](.*)["'`]\]/g,".$1")

    const parts = prop.split(".");
    let value = obj;
    for (let i = 0; i < parts.length; i++) {
        if (value[parts[i]] == undefined) {return undefined;}
        value = value[parts[i]];
    }
    return value;

    // return prop.split('.').reduce(function(prev, curr) {
    //     return prev ? prev[curr] : undefined
    // }, obj || self)
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
//   List
// --------

export class List {
    /** @type {function} */
    #class = () => { };

    #dbName = "";
    #storeName = "";

    /** @type {Array<string>} */
    #properties = [];

    /** @type {string|Array<string>} */
    #idname = [];

    #data = new Map();

    #indexList = new Map();

    /**
     * Liefert die ID eines Objektes zurück
     * @param {Object<string,any>} obj - Datenobjekt mit dem idFeld
     * @returns {string|number} ID
     */
    getID(obj) {
        if (Array.isArray(this.#idname)) {
            let id = "";
            for (let i = 0; i < this.#idname.length; i++) {
                id += getPropValue(obj, this.#idname[i]) + "_";
                //id += obj[this.#idname[i]] + "_";
            }
            return id;
        } else {
            return getPropValue(obj, this.#idname);
        }
    }


    /**
     * Liefert eine Liste aller IDs vom angegeben Index oder allen Datensätzen zurück
     * @param {string|Array<string|number>} [index] - Indexname
     * @returns {Array<string|number>} IDs der Datzensätze
     */
    getIndex(index) {
        if (!index) {
            return [...this.#data.keys()];
        } else {
            if (Array.isArray(index)) { return index; }
            return this.#indexList.get(index) || [];
        }
    }


    /**
     * Prüft ob ein bestimmter index in der Liste vorhanden ist
     * @param {string} index - Index Name
     * @returns {boolean} "true" wenn Index mit dem Namen vorhanden
     */
    hasIndex(index) {
        return this.#indexList.has(index);
    }


    /**
     * Liefert ein Array mit Arrays von Eigenschaften eines Objektes zurück
     * @param {string} [index] - Optionale Name des zu verendenden Indexes
     * @returns {Array<any>} Array mit Eigenschaften. Der erste Eintrag enthält sie Spalten/Feld/Property Namen.
     */
    toArrays(index) {
        const list = [];
        const ids = this.getIndex(index);
        
        // Erste Zeile mit Feldnamen
        list.push(this.#properties);

        for (let i = 0; i < ids.length; i++) {
            const obj = this.#data.get(ids[i]);
            
            // Neue Eigenschaftsliste
            const a = [];
            for (let j = 0; j < this.#properties.length; j++) {
                // Wert der Property in die Eigenschaftsliste
                // todo: was tun wein Eigenschaft-Wert ein Objekt ist? 
                a.push(obj[this.#properties[j]]);
            }
            // Datensatz als Array in die Liste
            list.push(a);
        }
        return list;
    }

    /**
     * Fügt eine Array Liste als Objekte in die List ein
     * @param {Array<any>} list 
     * @param {boolean} [clear] - Optional wenn bestehende Liste zuvor gelöscht wird
     * @returns 
     */
    fromArrays(list, clear) {
        if (!Array.isArray(list)) { return; }

        if (clear) {
            // Daten zurücksetzen
            this.#data = new Map();
        }

        // erste Zeile sind Feldnamen
        if (list.length < 1) { return; }
        const properties = list[0];

        // alle Datenzeilen durchgehen
        for (let i = 1; i < list.length; i++) {
            // @ts-ignore neue Klasse
            const obj = new this.#class();

            // alle Spalten durchgehen
            for (let j = 0; j < properties.length; j++) {
                obj[properties[j]] = list[i][j];
            }

            // in Daten setzen
            this.#data.set(this.getID(obj), obj);
        }
    }


    /**
     * Setz eine Instanz in eine Liste
     * @param {Object<string,any>} obj - Instanz
     * @returns {Object<string,any>} Class-Instanz vom Objekt
     */
    set(obj) {
        if (obj instanceof this.#class) {
            this.#data.set(this.getID(obj), obj);
            return obj;
        } else if (typeof obj == "object") {
            // @ts-ignore
            const newObj = new this.#class();
            Object.assign(newObj, obj);
            this.#data.set(this.getID(newObj), newObj);
            return newObj;
        }
        return obj;
    }


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

        if (index) {
            // Alle Datensätze durchgehen
            for (let i = 0; i < rowList.length; i++) {
                objList.set(rowList[i], this.get(rowList[i]));
            }

            // Speichern
            return await IDB_write(this.#dbName, this.#storeName, objList, "map");
        } else {
            return await IDB_write(this.#dbName, this.#storeName, this.#data, "map");
        }

    }

    /**
     * Gibt das angegebene Objekt zurück
     * @param {string|number} key - ID der Instanz
     * @returns {Object<string,object|undefined>}
     */
    get(key) {
        return this.#data.get(key);
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
            return this.#data.get(key);
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
     * Löscht Datensat mit angegebener ID aus der liste
     * @param {string|number|Array<string|number>} key - ID oder Liste mit Ids zum Löschen
     */
    delete(key) {
        if (Array.isArray(key)) {
            for (let i = 0; i < key.length; i++) {
                this.#data.delete(key[i]);
            }
        } else {
            this.#data.delete(key);
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
                    this.#data.delete(key[i]);
                }
            } else {
                res = await IDB_remove(this.#dbName, this.#storeName, key) || "";
                if (res != "OK") {return res;}
                this.#data.delete(key);
            }
            return res;
        } else {
            return "No Database!";
        }
    }


    /**
     * Gibt ein Array an Werten für die Spalten(fieldList) eines Datensatzes(id) zurück.
     * @param {string|number} rowID - ID des Datensatzes
     * @param {Array<string>} colList - Liste mit Spaltennamen oder Spaltennummern
     * @returns {Array<any>} Liste mit Werten der angegebenen Spalten
     */
    getColValues(rowID, colList) {
        if (rowID == undefined) { return []; }
        if (!colList || !Array.isArray(colList)) {
            return [];
        }

        const dataRow = this.#data.get(rowID);
        if (!dataRow) { return []; }

        const valueList = [];

        for (let i = 0; i < colList.length; i++) {
            valueList.push(getPropValue(dataRow, colList[i]));
        };

        return valueList;
    }


    /**
     * Sortiert die Daten nach angegebenen Spalten. Groß-Kleinschreibung bei Texten wird ignoriert.  
     * Aufsteigend: A > B = 1  
     * Wenn der "index" noch nicht existiert, werden alle Daten sortiert.
     * Wenn "index" angegeben und "newIndex" nicht angegeben, werden die Daten unter diesem Index sortiert, und unter dem selben Index abgelegt.
     * Wenn "index" und "newIndex" angegeben, werden alle Daten sortiert und unter "newIndex" abgelegt.
     * @param {Array<string>|CallbackSortFunction} sortCols - Liste mit Spalten nach denen Sortiert wird oder eine Sortierungsfunktion
     * @param {string|Array<string|number>} [index] - Index Name oder Liste mit ID's der zum sortieren verwendet wird, oder wenn nicht vorhanden, nach dem Sortieren gesetzt wird.
     * @param {string} [newIndexName] - Index Name der nach dem Sortieren gesetzt wird.
     * @returns {Array<string|number>} sortierte Liste mit ID's
     * @example
     * const sortList = dataList.sortRows(["name", "hausnummer DESC"], "sortListe");
     */
    sort(sortCols, index, newIndexName) {
        // Alle Datenzeile in einer liste
        const rowList = this.getIndex(index);

        // Wenn Sortierungs Funktion
        if (typeof sortCols == "function") {
            // @ts-ignore
            rowList.sort(sortCols);
        } else {
            // wenn keine SortierungsSpalten angegeben
            if (!Array.isArray(sortCols)) {
                // nur Index merken
                if (typeof index == "string") { this.#indexList.set(index, rowList); }
                // unsortierte Liste mit ID's
                return rowList;
            }

            // Feld Indexes lesen und Sortier Reihenfolge
            const colLength = sortCols.length;
            const orderIndex = new Array(colLength);
            const isString = new Array(colLength);
            const sCols = new Array(colLength);
            const sDirection = new Array(colLength);

            // 1. Datensatz lesen
            let obj = this.get(rowList[0]);
            if (!obj) {return rowList;}

            // Alle sortierspalten durchgehen
            for (let i = 0; i < colLength; i++) {
                let col = sortCols[i];
                let direction = 1; // 1 = Aufsteigend sortieren / -1 = Absteigend sortieren

                // prüfen auf Sortier Richtung
                const fieldData = col.split(" ");
                sCols[i] = fieldData[0]; // Spaltennamen für spätere Verwendung merken
                sDirection[i] = "ASC";
                if (fieldData[1]?.trim().toUpperCase() == "DESC") {
                    direction = -1;
                    sDirection[i] = "DESC"; // Sortierrichtung für spätere Verwendung merken
                }    

                orderIndex[i] = direction;
                isString[i] = typeof obj[sCols[i]] == "string" ? true : false; // dataType?.type == "string" ? true : false;
            }


            // Sortieren
            rowList.sort((a, b) => {
                const aRow = this.get(a) || {};
                const bRow = this.get(b) || {};

                // Prüfen
                for (let i = 0; i < colLength; i++) {
                    const aValue = getPropValue(aRow, sCols[i]);
                    const bValue = getPropValue(bRow, sCols[i]);
                    if (aValue == undefined && bValue == undefined) {
                        continue;
                    } else if (aValue != undefined && bValue == undefined) {
                        if (orderIndex[i] < 0) {
                            // Absteigend
                            return -1;
                        } else {
                            // Aufsteigend
                            return 1;
                        }
                    } else if (aValue == undefined && bValue != undefined) {
                        if (orderIndex[i] < 0) {
                            // Absteigend
                            return 1;
                        } else {
                            // Aufsteigend
                            return -1;
                        }
                    }

                    // absteigend
                    if (orderIndex[i] < 0) {
                        //if (typeof aRow[colIndex[i]] == "string" && typeof bRow[colIndex[i]] == "string") {
                        if (isString[i]) {
                            // @ts-ignore
                            if (aValue.toLowerCase() > bValue.toLowerCase()) { return -1; }
                            // @ts-ignore
                            if (aValue.toLowerCase() < bValue.toLowerCase()) { return 1; }
                        } else {
                            // @ts-ignore
                            if (aValue > bValue) { return -1; }
                            // @ts-ignore
                            if (aValue < bValue) { return 1; }
                        }
                    } else {
                        // Aufsteigend
                        if (isString[i]) {
                            // @ts-ignore
                            if (aValue.toLowerCase() > bValue.toLowerCase()) { return 1; }
                            // @ts-ignore
                            if (aValue.toLowerCase() < bValue.toLowerCase()) { return -1; }
                        } else {
                            // @ts-ignore
                            if (aValue > bValue) { return 1; }
                            // @ts-ignore
                            if (aValue < bValue) { return -1; }
                        }
                    }
                } // alle Felder vergleichen

                // alle gleich
                return 0;
            });
        }

        // neuen Index speichern
        if (typeof newIndexName == "string") {
            this.#indexList.set(newIndexName, rowList);
            //this.#sortCols.set(newIndexName, sCols);
            //this.#sortColsDirection.set(newIndexName, sDirection);
        } else if (typeof index == "string") {
            this.#indexList.set(index, rowList);
            //this.#sortCols.set(index, sCols);
            //this.#sortColsDirection.set(index, sDirection);
        }
        return rowList;
    } // sort


    /**
     * Gibt eine gefilterte Liste mit Datensätzen IDs zurück.  
     * Wenn index Angegeben werden die Daten zum Filtern vom bestehenden Index genommen.  
     * Wenn newIndex angegeben, wird die gefilterte Liste unter dem "newIndex" abgelegt.
     * @param {CallbackFilterFunction} fu - Filterfunktion muss "true" oder "false" zurückgeben. Wenn "true" wird der Datensatz in die gefilterte Liste aufgenommen. 
     * @param {string|Array<string|number>} [index] - optionaler Index Name oder Liste von ID's, wenn Daten von einem bestehenden Index genommen werden. 
     * @param {string} [newIndexName] - Index unter dem die gefilterte Liste abgelegt wird.
     * @returns {Array<string|number>} Gefilterte Liste mit ID's 
     */
    filter(fu, index, newIndexName) {

        // Daten zum Filtern
        let rowList = this.getIndex(index);
        if (typeof fu != "function") { return rowList; }

        const newList = [];

        // alle durchgehen
        for (let i = 0; i < rowList.length; i++) {
            const obj = this.get(rowList[i]);

            if (fu(obj, i, rowList)) {
                newList.push(rowList[i]);
            }
        }

        // neuen Index speichern
        if (typeof newIndexName == "string") {
            this.#indexList.set(newIndexName, newList);
        } else if (typeof index == "string") {
            this.#indexList.set(index, newList);
        }
        return newList;
    }

    /**
     * Führt die angegebene Funktion für jeden Datensatz, oder jeden Datensatz im angegebenen index, aus.  
     * Als Parameter wird die Datenzeile als Objekt übergeben. 
     * @param {CallbackForFunction} fu - Funktion die pro Datensatz ausgeführt wird
     * @param {string} [index] - optionaler Index Name oder Liste von ID's der als Datenquelle verwendet wird
     * @returns {void}
     * @example
     * const namensListe = [];
     * adresslistList.forEach((row, listIndex, rowList) => {namensListe.push(row.vorname + " " + row.nachname);});
     * console.log(namensListe);
     */
    forEach(fu, index) {
        // Daten zum Filtern
        const rowList = this.getIndex(index);
        if (typeof fu != "function") { return; }

        // alle durchgehen
        for (let i = 0; i < rowList.length; i++) {
            const obj = this.get(rowList[i]);
            // Funktion ausführen
            if (fu(obj, i, rowList)) { break; };
        }
    }


    /**
     * Führt für jede Spalte die angegebene Funktion aus.
     * @param {CallbackForColFunction} fu - Funktion die für jede Spalte ausgeführt wird
     * @param {Array<string>} [cols] - Optional Namen der Spalten 
     * @returns {void}
     */
    forCols(fu, cols) {
        if (typeof fu != "function") { return; }
        if (!Array.isArray(cols)) {
            cols = this.#properties;
        }

        // alle Spalten durchgehen
        for (let i = 0; i < cols.length; i++) {
            // Funktion ausführen
            // (SpaltenName, Liste mit SpaltenNamen)
            if (fu(cols[i], cols)) { break; };
        }
    }


    /**
     * Führt die Angegebene Funktion, pro Gruppierung nach den Angegebenen Spalten, aus.
     * @param {CallbackGroupFunction} fu - Funktion die für jede Gruppierung aufgerufen wird.
     * @param {Array<string>} colList - Liste der Spalten nach denen Gruppiert wird.
     * @param {string|Array<string|number>} [index] - Optionaler Index der für die Gruppierung verwendet wird.
     * @returns {void}
     */
    forGroup(fu, colList, index) {
        // Daten zum Filtern
        const rowList = this.getIndex(index);
        if (typeof fu != "function") { return; }

        const groupIndex = new Map(); // merkt sich den Index der Gruppe

        /** @type {Array<Array<string|number>>} */
        const groupList = [];
        /** @type {Array<Array<object>>} */
        const groupObjList = [];

        // alle durchgehen
        for (let i = 0; i < rowList.length; i++) {
            //let istNewGroup = false;
            const obj = this.get(rowList[i]);

            // Gruppenwert lesen
            const groupValue = this.getColValues(rowList[i], colList).join("_");

            // Wenn Gruppenwert vorhanden
            if (groupIndex.has(groupValue)) {
                const j = groupIndex.get(groupValue);
                groupList[j].push(rowList[i]);
                groupObjList[j].push(obj);
            } else {
                // Gruppenwert noch nicht vorhanden
                const newGroupList = [rowList[i]];
                const newgroupObjList = [obj];
                groupList.push(newGroupList);
                groupObjList.push(newgroupObjList);
                groupIndex.set(groupValue, groupList.length - 1);
            }
        } // for jeder Datensatz

        // alle Gruppierten Listen durchgehen
        for (let i = 0; i < groupList.length; i++) {
            // funktion ausführen
            fu(groupObjList[i], groupList[i], rowList);
        }
    }


    /**
     * Erzeugt eine List Instanz
     * @param {Function|Object<string,any>} obj - Klasse oder Constructor Funktion
     * @param {string|Array<string>} idName - Name des ID Feldes oder Liste mit Namen wenn nur durch mehrere Spalten eindeutig
     * @param {string} [dbName] - Optional Datenbankname der IndexedDB in der die Liste gespeichert wird. 
     */
    constructor(obj, idName, dbName) {
        // auf Klasse Prüfen
        if (typeof obj === 'function' && obj.prototype && obj.prototype.constructor === obj) {
            this.#class = obj;
            // @ts-ignore
            this.#properties = Object.keys(new this.#class());
        } else if (typeof obj == "object") {
            this.#class = obj.constructor;
            this.#properties = Object.keys(obj);
        }

        // wenn idName
        this.#idname = idName || "GSID";
        this.#dbName = dbName || "";
        this.#storeName = this.#class.name;
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
