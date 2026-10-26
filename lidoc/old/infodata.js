// ====================
//   Infodata
// ====================
// @ts-check


// ===========================
//   Typen
// --------


/** 
 * Callback Funktion die für die Sortierung verwendet wird
 * @template T
 * @callback CallbackSortFunction
 * @param {T} A - 1. Objekt für vergleich
 * @param {T} B - 2. Objekt für vergleich
 * @returns {number} Bei Aufsteigend: (A > B) => 1; (A < B) => -1; (A == B) => 0
 */

/** 
 * Callback Funktion die für jede Gruppe ausgeführt wird
 * @template T
 * @callback CallbackGroupFunction
 * @param {Array<T>} objList - Liste mit gefilterten Datensatz Objekten, pro Gruppe
 * @param {Array<string|number>} [idList] - Liste mit ID's der gefilterten Datenzeilen pro Gruppe
 * @param {Array<string|number>} [list] - Gesammte ID-Liste nach optionalen Index
 */

/** 
 * Callback Funktion die für alle Datensätze ausgeführt wird.  
 * Wenn die Funktion "true" zurückliefert, wird der Datensatz in die neue Liste und Index aufgenommen.
 * @template T
 * @callback CallbackFilterFunction
 * @param {T} obj - Datensatz Objekt
 * @param {number} [index] - Position in der Liste nach Index
 * @param {Array<string|number>} [list] - Gesammte ID-Liste nach optionalen Index
 * @returns {boolean|undefined} Wenn "true" dann kommt der Datensatz in die neue gefilterte Liste.
 */

/** 
 * Callback Funktion die für alle Datensätze ausgeführt wird.  
 * Wenn die Funktion "true" zurückliefert, wird die ganze For-Schleife abgebochen.
 * @template T
 * @callback CallbackForFunction
 * @param {T} obj - Datensatz Objekt
 * @param {number} [index] - Position in der Liste nach Index
 * @param {Array<string|number>} [list] - Gesammte ID-Liste nach optionalen Index
 * @returns {boolean|undefined} Wenn "true" dann Abbruch der Schleife
 */

/** 
 * Callback Funktion die ein Datensatz Objekt in ein anderes Objekt konvertiert.  
 * Lieftert das neue Objekt zurück.
 * @template T
 * @callback CallbackConvertFunction
 * @param {T} obj - Datensatz Objekt
 * @param {number} [index] - Position in der Liste nach Index
 * @param {Array<string|number>} [list] - Übergebene Liste mit ID's
 * @returns {T} Konvertiertes Objekt
 */


/** 
 * Callback Funktion die für alle Datensätze ausgeführt wird.  
 * Wenn die Funktion "true" zurückliefert, wird der Datensatz in die neue Liste und Index aufgenommen.
 * @callback CallbackFormatFunction
 * @param {Array<any>} values - Datensatz Werte
 * @param {number} [index] - Position in der Liste nach Index
 * @param {Array<string|number>} [list] - Gesammte ID-Liste nach optionalen Index
 * @returns {Array<any>|undefined|false} Wenn Array dann kommt der Datensatz in die neue Liste.
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
 * @param {boolean} [large] - "true" Wenn in langer Form
 * @returns {string}
 */
export function getGSID(large) {
    if (large) {
        return new Date().getTime().toString(36) +
            crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    } else {
        return new Date().getTime().toString(36) +
            crypto.getRandomValues(new Uint16Array(1))[0].toString(36);
    }
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
 * @param {any} obj - Objekt mit der Eigenschaft
 * @param {string} prop - Eigenschaft Pfad mit "." getrennt
 * @returns {any|undefined} Wert der Eigenschaft oder "undefined" wenn nicht vorhanden
 */
function getPropValue(obj, prop) {
    if (typeof obj !== 'object') { return undefined; }
    if (typeof prop !== 'string') { return undefined; }

    // Replace [] notation with dot notation
    //prop = prop.replace(/\[["'`](.*)["'`]\]/g,".$1")

    const parts = prop.split(".");
    let value = obj;
    for (let i = 0; i < parts.length; i++) {
        if (value[parts[i]] == undefined) { return undefined; }
        value = value[parts[i]];
    }
    return value;
}


// ===========================
//   List
// --------

/**
 * @template T
 * @extends {Map<string|number,T>}
 */
export class DataMap extends Map {
    /** @type {function} */
    #class = () => { };

    /** @type {Array<string>} */
    #properties = [];
    get properties() {
        return [...this.#properties];
    }

    /** @type {string|Array<string>} */
    #idname = [];

    #indexList = new Map();

    /**
     * Liefert die ID eines Objektes zurück
     * @param {T} obj - Datenobjekt mit dem idFeld
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
     * Liefert eine Liste aller IDs vom angegeben Index oder allen Datensätzen zurück.  
     * Existiert der Index nicht, wird eine leere Liste zurück gegeben.
     * @param {string|Array<string|number>} [index] - Indexname
     * @returns {Array<string|number>} IDs der Datzensätze
     */
    getIndex(index) {
        if (!index) {
            return [...this.keys()];
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
     * Setzt ein objekt in die Liste. Die ID wird aus den Einstellungen und dem Objekt-Eigenschaften gelesen.
     * @param {T} obj - Obekt das in die Liste aufgenommen wird.
     */
    setObject(obj) {
        const id = this.getID(obj);
        this.set(id, obj);
    }

    /**
     * Fügt eine Array Wert-Liste als Objekte in die List ein.
     * Die erste Zeile muss die Namen der Spalten(Eigenschaften) enthalten.
     * @param {Array<any>} list 
     * @param {boolean} [clear] - Optional wenn bestehende Liste zuvor gelöscht wird
     * @returns {void}
    */
    setValueArray(list, clear) {
        if (!Array.isArray(list)) { return; }

        if (clear) {
            // Daten zurücksetzen
            this.clear();
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
            this.set(this.getID(obj), obj);
        }
    }


    /**
     * Fügt eine Array Objekt-Liste als Objekte in die List ein.  
     * Mit der optionalen Konvertierungs Funktion kann das Objekt in ein anderes Objekt, oder Objekt Eigenschaften ausgebessert werden vor dem Speichern in die Liste.  
     * @param {Array<T>} list 
     * @param {boolean} [clear] - Optional wenn bestehende Liste zuvor gelöscht wird
     * @param {CallbackConvertFunction<T>} [convertFu] - Optionale Funktion die das Objekt vor dem Speichern konvertiert
     * @returns {void}
    */
    setObjArray(list, clear, convertFu) {
        if (!Array.isArray(list)) { return; }

        if (clear) {
            // Daten zurücksetzen
            this.clear();
        }

        const isConvert = typeof (convertFu) == "function";

        // alle Objekte durchgehen
        for (let i = 0; i < list.length; i++) {
            let obj = list[i];
            // Wenn Konvertierung
            if (isConvert) {
                obj = convertFu(list[i], i);
            }
            // Objekt in Liste speichern
            this.set(this.getID(obj), obj);
        }
    }


    /**
     * Liefert ein Array mit Arrays von Eigenschaften eines Objektes zurück
     * @param {string} [index] - Optionale Name des zu verendenden Indexes
     * @param {Array<string>} [colNames] - Optional Namen der Spalten die gelesen werden
     * @param {CallbackFormatFunction} [formatFu] - Optional Funktion welche die Daten formatiert.
     * @returns {Array<any>} Array mit Eigenschaften. Der erste Eintrag enthält sie Spalten/Feld/Property Namen.
     */
    getValueArray(index, colNames, formatFu) {
        const list = [];
        const ids = this.getIndex(index);

        // Spalten die gelesen werden
        let cols = [];
        if (Array.isArray(colNames)) {
            cols = colNames;
        } else {
            cols = this.#properties;
        }

        // Prüfen auf Formatierungs Funktion
        const isFormatFu = typeof formatFu == "function";

        // Erste Zeile mit Feldnamen
        list.push(cols);

        for (let i = 0; i < ids.length; i++) {
            const obj = this.get(ids[i]);

            if (obj) {
                // Neue Eigenschaftsliste
                /** @type {Array<any>} */
                const a = [];
                for (let j = 0; j < cols.length; j++) {
                    // Wert der Property in die Eigenschaftsliste
                    // todo: was tun wein Eigenschaft-Wert ein Objekt ist? 
                    //@ts-ignore
                    a.push(obj[cols[j]]);
                }

                // Wenn Formatierungs Funktion
                if (isFormatFu) {
                    let newA = formatFu(a, i, ids);
                    if (Array.isArray(newA)) {
                        list.push(newA);
                    }
                } else {
                    // Datensatz als Array in die Liste
                    list.push(a);
                }
            }
        }
        return list;
    }


    /**
     * Liefert einen JSON-String mit einer Liste von Arrays von Eigenschaften aller Objekte vom index zurück.  
     * In der ersten Zeile stehen die Spaltennamen.  
     * @param {string} [index] - Optionale Name des zu verendenden Indexes. Wenn nicht angegeben werden alle Objekte zurückgegeben.
     * @param {Array<string>} [colNames] - Optional Namen der Spalten die gelesen werden
     * @returns {string} JSON-String.
     */
    getAsJSON(index, colNames) {
        return JSON.stringify(this.getValueArray(index, colNames));
    }


    /**
     * Erstellt Einträge in der DataMap anhand von einem JSON-String mit einer Liste von Eigenschaften. In der ersten Zeile müssen die Spaltennamen stehen.
     * @param {string} jsonString - JSON String mit Liste von Arrays
     * @param {boolean} [clear] - true wenn die Liste zuvor gelöscht wird
     */
    setFromJSON(jsonString, clear) {
        const list = JSON.parse(jsonString);
        if (Array.isArray(list)) {
            this.setValueArray(list, clear);
        }
    }


    /**
     * Liefert einen String von Eigenschaften aller Objekte vom index zurück.  
     * In der ersten Zeile stehen die Spaltennamen.  
     * Die Zeilen werden durch "▲"(ASCII 30) getrennt und die Spalten mit "▼" (ASCII 31). Somit bleiben Sonderzeichen, Zeilenumbrüche, Tabulatoren, Komas, usw. erhalten.
     * @param {string} [index] - Optionale Name des zu verendenden Indexes. Wenn nicht angegeben werden alle Objekte zurückgegeben.
     * @param {Array<string>} [colNames] - Optional Namen der Spalten die gelesen werden
     * @returns {string} CSV-String.
     */
    getAsText(index, colNames) {
        let list = "";
        const ids = this.getIndex(index);

        // Spalten die gelesen werden
        let cols = [];
        if (Array.isArray(colNames)) {
            cols = colNames;
        } else {
            cols = this.#properties;
        }

        // Erste Zeile mit Feldnamen
        list += `${cols.join('▼')}"▲`;

        for (let i = 0; i < ids.length; i++) {
            const obj = this.get(ids[i]);

            if (obj) {
                // Neue Eigenschaftsliste
                let a = "";
                for (let j = 0; j < cols.length; j++) {
                    // Wert der Property in die Eigenschaftsliste
                    // todo: was tun wein Eigenschaft-Wert ein Objekt ist? 
                    //@ts-ignore
                    const value = obj[cols[j]];
                    if (a) { a += "▼";}
                    if (typeof value == "undefined") {
                        // keine zusätzliche Daten
                    } else {
                        a += value;
                    }
                }
                list += a + "▲";
            }
        }
        return list;
    }

    /**
     * Erstellt Einträge in der DataMap anhand von einem Text der mit Trennzeichen(▲ ASCII 30 für Zeilentrennung, ▼ ASCII 31 für Spaltentrennung) getrennt ist.
     * @param {string} text - Text mit Trennzeichen
     * @param {boolean} [clear] - Optional "true" wenn Liste zuvor gelöscht wird.
     */
    setFromText(text, clear) {
        if (!text) {return;}
        const list = text.split("▲"); // Zeilentrennzeichen ASCII 30
        if (!Array.isArray(list)) { return; }

        if (clear) {
            // Daten zurücksetzen
            this.clear();
        }

        // erste Zeile sind Feldnamen
        if (list.length < 1) { return; }
        const properties = list[0].split("▼"); // SpaltenTrennzeichen ASCII 31

        // alle Datenzeilen durchgehen
        for (let i = 1; i < list.length; i++) {
            // @ts-ignore neue Klasse
            const obj = new this.#class();
            const values = list[i].split("▼"); // SpaltenTrennzeichen ASCII 31

            // alle Spalten durchgehen
            for (let j = 0; j < properties.length; j++) {
                obj[properties[j]] = values[j];
            }

            // in Daten setzen
            this.set(this.getID(obj), obj);
        }
    }

    /**
     * Liefert ein Array mit Objekten laut angegeben index zurück. Wird kein Index angegeben, werden alle Objekte zurückgeliefert.  
     * Wenn keine Konvertierungs-Funktion angegeben, werden die Originalen Objekte zurückgegeben(referenzen)
     * @param {string|Array<string|number>} [index] - Optional Name des Indexes oder Liste mit Key's
     * @param {CallbackConvertFunction<T>} [convertFu] - Optional Funktion welche die Objekte(Kopien) konvertiert.
     * @returns {Array<any>} Array mit Objekten
     */
    getObjArray(index, convertFu) {
        const list = [];
        const ids = this.getIndex(index);

        // Prüfen auf Formatierungs Funktion
        const isFormatFu = typeof convertFu == "function";

        for (let i = 0; i < ids.length; i++) {
            const obj = this.get(ids[i]);

            // Wenn Formatierungs Funktion
            if (isFormatFu && obj) {
                let newObj = Object.assign({}, convertFu(obj, i, ids));
                if (typeof newObj == "object") {
                    list.push(newObj);
                }
            } else {
                // Datensatz als Array in die Liste
                list.push(obj);
            }
        }
        return list;
    }


    /**
     * Löscht Datensatz mit angegebener ID aus der liste
     * @param {string|Array<string|number>} index - ID oder Liste mit Ids zum Löschen
     */
    deleteWithIndex(index) {
        let list = this.getIndex(index);
        for (let i = 0; i < list.length; i++) {
            this.delete(list[i]);
        }
    }

    /**
     * Sucht ein Objekt aus der Liste das einen bestimmten Wert hat und gibt das erte gefundene Objekt zurück.
     * @param {string} propName - Name der Eigenschaft
     * @param {any} value - Wert nach dem gesucht wird 
     * @param {string} [index] - Optional Index der für die Suche verwendet wird 
     * @returns {T|undefined}
     */
    findByValue(propName, value, index) {
        let list = this.getIndex(index);
        for (let i = 0; i < list.length; i++) {
            const obj = this.get(list[i]);
            //@ts-ignore
            if (obj && obj[propName] == value) {
                return obj;
            }
        }
    }

    /**
     * Sucht ein Objekt aus der Liste das mit dem übergebenen Objekt übereinstimmt und gibt das erte gefundene Objekt zurück.
     * @param {Object<string,any>} quest - Wert nach dem gesucht wird 
     * @param {string} [index] - Optional Index der für die Suche verwendet wird 
     * @returns {T|undefined}
     */
    findByObj(quest, index) {
        const list = this.getIndex(index);
        const keys = Object.keys(quest);

        /**
         * Sucht nach allen Eigenschaften
         * @param {Object<string,any>} obj 
         * @returns {boolean}
         */
        function find(obj) {
            for (let i = 0; i < keys.length; i++) {
                if (obj[keys[i]] != quest[keys[i]]) {
                    return false;
                }
            }
            return true;
        }

        for (let i = 0; i < list.length; i++) {
            const obj = this.get(list[i]);
            if (obj && find(obj)) {
                return obj;
            }
        }
    }


    /**
     * Sucht alle Objekte aus der Liste das mit dem übergebenen Objekt übereinstimmen und gibt eine ObjektListe zurück.
     * @param {Object<string,any>} quest - Wert nach dem gesucht wird 
     * @param {string} [index] - Optional Index der für die Suche verwendet wird 
     * @returns {Array<T>}
     */
    findAll(quest, index) {
        const list = this.getIndex(index);
        const keys = Object.keys(quest);
        const objList = [];

        /**
         * Sucht nach allen Eigenschaften
         * @param {Object<string,any>} obj 
         * @returns {boolean}
         */
        function find(obj) {
            for (let i = 0; i < keys.length; i++) {
                if (obj[keys[i]] != quest[keys[i]]) {
                    return false;
                }
            }
            return true;
        }

        for (let i = 0; i < list.length; i++) {
            const obj = this.get(list[i]);
            if (obj && find(obj)) {
                objList.push(obj);
            }
        }

        return objList;
    }


    /**
     * Gibt ein Array an Werten für die Spalten(fieldList) eines Datensatzes(id) zurück.
     * @param {string|number} rowID - ID des Datensatzes
     * @param {Array<string>} colList - Liste mit Spaltennamen
     * @returns {Array<any>} Liste mit Werten der angegebenen Spalten
     */
    getColValues(rowID, colList) {
        if (rowID == undefined) { return []; }
        if (!colList || !Array.isArray(colList)) {
            return [];
        }

        const dataRow = this.get(rowID);
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
     * Wenn kein "index" angegeben, werden alle Daten sortiert.
     * Wenn "index" angegeben, werden nur die Daten unter diesem Index sortiert.
     * Wenn "newIndex" angegeben, wird die Sortierung unter "newIndex" abgelegt.
     * @param {Array<string>|CallbackSortFunction<T>} sortCols - Liste mit Spalten nach denen Sortiert wird oder eine Sortierungsfunktion
     * @param {string|Array<string|number>} [index] - Index Name oder Liste mit ID's der zum sortieren verwendet wird.
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
            if (!obj) { return rowList; }

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
                //@ts-ignore
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
            // this.#indexList.set(index, rowList);
            //this.#sortCols.set(index, sCols);
            //this.#sortColsDirection.set(index, sDirection);
        }
        return rowList;
    } // sort


    /**
     * Gibt eine gefilterte Liste mit Datensätzen IDs zurück.  
     * Wenn index Angegeben werden die Daten zum Filtern vom bestehenden Index genommen.  
     * Wenn newIndex angegeben, wird die gefilterte Liste unter dem "newIndex" abgelegt.
     * @param {CallbackFilterFunction<T>} fu - Filterfunktion muss "true" oder "false" zurückgeben. Wenn "true" wird der Datensatz in die gefilterte Liste aufgenommen. 
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

            if (obj && fu(obj, i, rowList)) {
                newList.push(rowList[i]);
            }
        }

        // neuen Index speichern
        if (typeof newIndexName == "string") {
            this.#indexList.set(newIndexName, newList);
        } else if (typeof index == "string") {
            //this.#indexList.set(index, newList);
        }
        return newList;
    }

    /**
     * Führt die angegebene Funktion für jeden Datensatz, oder jeden Datensatz im angegebenen index, aus.  
     * Als Parameter wird die Datenzeile als Objekt übergeben. 
     * @param {CallbackForFunction<T>} fu - Funktion die pro Datensatz ausgeführt wird
     * @param {string} [index] - optionaler Index Name oder Liste von ID's der als Datenquelle verwendet wird
     * @returns {void}
     * @example
     * const namensListe = [];
     * adresslistList.forEach((row, listIndex, rowList) => {namensListe.push(row.vorname + " " + row.nachname);});
     * console.log(namensListe);
     */
    forEachIndex(fu, index) {
        // Daten zum Filtern
        const rowList = this.getIndex(index);
        if (typeof fu != "function") { return; }

        // alle durchgehen
        for (let i = 0; i < rowList.length; i++) {
            const obj = this.get(rowList[i]);
            // Funktion ausführen
            if (obj && fu(obj, i, rowList)) { break; };
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
     * @param {CallbackGroupFunction<T>} fu - Funktion die für jede Gruppierung aufgerufen wird.
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
        /** @type {Array<Array<T>>} */
        const groupObjList = [];

        // alle durchgehen
        for (let i = 0; i < rowList.length; i++) {
            //let istNewGroup = false;
            const obj = this.get(rowList[i]);

            if (obj) {
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
     * @param {string|Array<string>} [idName] - Optional Name des ID Feldes oder Liste mit Namen wenn nur durch mehrere Spalten eindeutig
     */
    constructor(obj, idName) {
        super();
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
    }
}

