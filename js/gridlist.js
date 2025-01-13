// ==================
//   Info Liste
// ==================
// @ts-check


// ===============================
//   Typen
// --------------

// [date|special(30){>0;10}/regex/=default]

/**
 * @typedef {object} ColFormat
 * @property {boolean} [optional] - Wenn der Wert NULL sein Kann oder nicht angegeben
 * @property {"date"|"datetime"|"time"|"period"|null} [date] - "null" oder "undefined" wenn nicht vorhanden. Wenn type "number" dann ist es ein UNIX timestamp in millisekunden. Monate("2024-11"), Wochen("2024W12") sind vom DateFormat "date"
 * @property {string} [subtype] - Name eines Speziellen Types 
 * @property {string|number|boolean} [default] - Defaultwert, der beim Anlegen gesetzt wird
 * @property {number} [size] - Größe (gesamt)
 * @property {number} [decimals] - Anzahl der Dezimalstellen 
 * @property {number} [min] - Minimalwert
 * @property {number} [max] - Maimalwert
 * @property {number} [greater] - Größer als angegeben (exklusive der angegebenen zahl)
 * @property {number} [lower] - Kleiner als angegeben (kleiner der angegeben zahl)
 * @property {string} [regex] - Regular Expression zum Testen eines Wertes
 * @property {any} [defaultValue] - Standard-Wert der Eigenschafft
 * @property {boolean} [charToBool] - true wenn der Charakter "J" in "true" umgewandelt werden soll.
 */

/** @typedef {"string"|"number"|"boolean"|"object"|"list"} InfoTypes */

/**
 * @typedef {object} GridObject
 * @property {string} name
 * @property {number} idColNumber
 * @property {number[]} idColNumbers
 * @property {string[]} cols
 * @property {object} findex
 * @property {InfoTypes[]} types
 * @property {(string|undefined|null)[]} links
 * @property {ColFormat[]} [formats]
 * @property {any[]} [data]
 */


// ===============================
//   Constanten
// --------------

const regexTemplate = /{{(.*?)}}/g;
const regexFor = /{{(for)}}/g;

/** 
 * Auflistung aller GridListen
 * @type {Map<string,GridList>}
 */
export const lists = new Map();


// ===============================
//   Klasse
// --------------

/**
 * @class
 */
export class GridList {
    // Parameter
    // self = this;
    #name = "";

    /** @type {number} */
    #idColNumber = -1;

    /** @type {number[]} */
    #idColNumbers = [];

    /** @type {string[]} */
    #cols = [];
    get cols() {
        return this.#cols;
    }

    /** @type {object} */
    #findex = {};

    /** @type {string[]} */
    #types = [];

    /** @type {(string|undefined|null)[]} */
    #links = [];

    /** @type {ColFormat[]} */
    #formats = [];

    /** @type {Map<string|number,any[]>} */
    #data = new Map();

    /** @type {Map<string,any>} */
    prop = new Map();

    /** @type {Map<string,Array[]>} */
    #index = new Map();

    set name(newName) {
        if (!newName) {
            newName = GSID();
        }
        this.#name = newName;

        // name registrieren
        lists.set(this.name, this);
    }
    get name() {
        return this.#name;
    }


    /**
     * Setzt das ID-Feld und mekt sich den ID-Index.
     * Felder müssen vorher in der Liste existieren.
     * @param {string|number|(string|number)[]} col - ID Spaltenname oder Spaltennummer oder Liste davon, die eine eindeutige ID ergeben
     * @returns {void}
     */
    setIdCol(col) {
        if (typeof col == "string") {
            //this.#idColNumber = this.#cols.indexOf(col);
            this.#idColNumber = this.#findex[col];
            this.#idColNumbers = [];
        } else if (typeof col == "number") {
            this.#idColNumber = col;
            this.#idColNumbers = [];
        } else if (Array.isArray(col)) {
            this.#idColNumber = -1;
            this.#idColNumbers = [];

            // Alle Einträge Prüfen
            for (let i = 0; i < col.length; i++) {
                switch (typeof col[i]) {
                    case "string":
                        //this.#idColNumbers.push(this.#cols.indexOf(col[i] + ""));
                        this.#idColNumbers.push(this.#findex[col[i] + ""]);
                        break;
                    case "number":
                        this.#idColNumbers.push(parseInt(col[i] + ""));
                        break;

                    default:
                        break;
                }
            }
        }
    }
    /**
     * @param {string|number|(string|number)[]} col
     */
    set idCol(col) {
        this.setIdCol(col);
    }
    /**
     * @returns {number|number[]}
     */
    get idCol() {
        if (this.#idColNumber > -1) {
            return this.#idColNumber;
        } else {
            return this.#idColNumbers;
        }
    }


    /**
     * Spaltenname des ID Feldes
     * @returns {string|string[]} SpaltenName oder Liste von Spaltennamen
     */
    get idColName() {
        if (this.#idColNumber > -1) {
            return this.#cols[this.#idColNumber];
        } else {
            /** @type {string[]} */
            const colNames = []
            for (let i = 0; i < this.#idColNumbers.length; i++) {
                colNames.push(this.#cols[i]);
            }
            return colNames;
        }
    }


    /**
     * Holt aus einer Datenzeile die ID laut gespeicherten idIndex
     * @param {any[]|object} dataRow - Datenzeile Array
     * @returns {string|number} ID
     */
    getID(dataRow) {
        if (typeof dataRow != "object") { return -1; }

        // wenn Array
        if (Array.isArray(dataRow)) {
            if (this.#idColNumber < 0) {
                let id = "";
                for (let i = 0; i < this.#idColNumbers.length; i++) {
                    id += dataRow[this.#idColNumbers[i]] + "_";
                }
                return id;
            } else {
                return dataRow[this.#idColNumber] || -1;
            }
        } else {
            // Wenn Objekt
            if (this.#idColNumber < 0) {
                let id = "";
                for (let i = 0; i < this.#idColNumbers.length; i++) {
                    id += dataRow[this.#cols[this.#idColNumbers[i]]] + "_";
                }
                return id;
            } else {
                return dataRow[this.#cols[this.#idColNumber]] || -1;
            }
        }
    } // getID


    /**
     * Setzt oder löscht, für die Angegebene Spalte, den Link(Verknüpfung) zu einer anderen Liste
     * @param {string|number} col - Spaltenname oder Splaltennummer
     * @param {string|undefined|null} [listName] - Name der GridListe. Wenn nicht angegeben wird der Link(Verknüpfung) gelöscht.
     * @returns {void}
     */
    setColLink(col, listName) {
        this.#links[this.getColNumber(col)] = listName;
    }


    /**
     * Liest den Listennamen der Verknüpften Liste vom angegebenen Feldindex aus
     * @param {string|number} col - Spaltennummer oder Spaltenname
     * @returns {string|undefined|null} Name der Liste. Kann mit lists.get(name) gelesen werden.
     */
    getColLink(col) {
        return this.#links[this.getColNumber(col)];
    }


    /**
     * Setzt die SpaltenNamen der GridListe  
     * Der Typ der neuen Spalten wird auf "string" gesetzt, außer es wird nach dem Spaltennamen mit einem Leerzeichen getrennt, der Typ angegeben.  
     * Der Typ darf nur einen der folgenden Texte enthalten:  
     * "string" | "number" | "boolean" | "object" | "list"  
     * !!!ACHTUNG!!! es werden dabei alle bestehenden Daten gelöscht.
     * @param {string|string[]} cols - Liste Mit Spaltennamen, oder String mit Trennzeichen getrennt
     * @param {string|string[]} idCol - Spaltenname des ID Feldes, oder Liste von Spaltennamen, die eine eindeutige Kennung ergeben.
     * @param {string} [seperator] - Trennzeichen muss angegeben werden wenn fieldList ein String mit Trennzeichen ist
     * @returns {void}
     */
    setCols(cols, idCol, seperator) {
        if (!cols) { return; }
        let newFields = [];

        if (Array.isArray(cols)) {
            newFields = cols;
        } else if (typeof cols == "string" && seperator) {
            newFields = cols.split(seperator);
        }

        // bestehende Spalten löschen
        // todo: Eventuell mit bestehenden Spalten zusammenmergen ????
        this.#cols = new Array(newFields.length);
        this.#findex = {};
        this.#links = new Array(newFields.length);
        this.#types = new Array(newFields.length);

        // alle neuen Spalten durchgehen
        for (let i = 0; i < newFields.length; i++) {
            let name = newFields[i].trim();
            let type = "string";

            // Wenn ein leerzeichen im Namen
            if (name.indexOf(" ") > -1) {
                // Type steht nach namen
                const nameType = name.split(" ");

                this.#cols[i] = nameType[0];

                // SpaltenIndex merken
                this.#findex[nameType[0]] = i;

                if (nameType[2]) {
                    this.#links[i] = nameType[2];
                }

                // auf richtige Typen prüfen
                if ("|string|number|boolean|object|list|".indexOf(nameType[1]) > -1) {
                    this.#types[i] = nameType[1];

                    //  Wenn keine verknüpfte Liste
                    if ((nameType[1] == "object" || nameType[1] == "list") && !nameType[2]) {
                        // Liste Name wird vom SpaltenNamen angenommen
                        this.#links[i] = nameType[0];
                    }
                } else {
                    // wenn kein Typ angegeben dann immer "string"
                    this.#types[i] = "string";
                }
            } else {
                this.#cols[i] = name;

                // SpaltenIndex merken
                this.#findex[name] = i;

                // Standard Typ
                this.#types[i] = type;
            } // if else indexof(" ")
        } // for newFields

        // ID Spalte setzen
        this.setIdCol(idCol);

        // Daten passen dann nicht mehr zu Spalten und werden gelöscht
        this.#data = new Map();
    } // setCols


    /**
     * Setzt die Spalten der Liste anhand eines Javascript Objektes.  
     * Die Feldtypen werden von den Werten in den Eigenschaften bestimmt.  
     * Ist der Wert nicht ermittelbar, wird "string" angenommen.  
     * Ist der Wert ein "object" oder "array", so wird der ListenName(Verlinkung) gleich dem Eigenschaftsnamen angenommen.  
     * @param {object} obj - Objekt dessen Eigenschaften als Spaltennamen registriert werden
     * @param {string} idCol - Name der Eigenschaft die als Eindeutige ID genommen wird
     * @returns {void}
     */
    setColsFromObject(obj, idCol) {
        if (typeof obj != "object") { return; }
        if (Array.isArray(obj)) { return; }

        // Eigenschaft Namen vom Objekt lesen
        const keyList = [...Object.keys(obj)];

        // Typ Prüfung
        for (let i = 0; i < keyList.length; i++) {
            switch (typeof obj[keyList[i]]) {
                case "bigint":
                    keyList[i] = keyList[i] + " number";
                    break;
                case "boolean":
                    keyList[i] = keyList[i] + " boolean";
                    break;
                case "number":
                    keyList[i] = keyList[i] + " number";
                    break;
                case "object":
                    if (Array.isArray(keyList[i])) {
                        keyList[i] = keyList[i] + " list " + keyList[i];
                    } else {
                        keyList[i] = keyList[i] + " object " + keyList[i];
                    }
                    break;

                default:
                    break;
            }
        }

        // Spalten setzen
        this.setCols(keyList, idCol);
    }


    /**
     * Setzt für die angegebene Spalte die Format einstellungen
     * @param {string|number} col 
     * @param {ColFormat} formatObj 
     */
    setColFormat(col, formatObj) {
        if (!formatObj) { formatObj = {}; }
        this.#formats[this.getColNumber(col)] = formatObj;
    }

    /**
     * Liefert vom der angegebenen Spalte das Format Objekt zurück
     * @param {string|number} col - Splatenname oder SplantenNummer 
     * @returns {ColFormat|undefined} Format Objekt wenn vorhanden
     */
    getColFormat(col) {
        return this.#formats[this.getColNumber(col)];
    }


    /**
     * Ersetzt alle Daten mit einem neuen GridObject
     * @param {GridObject & [any]} obj 
     * @returns {boolean} true wenn die daten übernommen wurden
     */
    createFromGridObject(obj) {
        try {
            if (!obj) { return false; }
            if (!obj.cols || !obj.types) { return false; }

            // Standard Eigenschaften
            this.name = obj.name;
            this.#cols = obj.cols;
            this.#findex = obj.findex;
            this.#types = obj.types;
            this.#links = obj.links;
            this.#formats = obj.formats || [];

            // idIndex
            this.#idColNumber = obj.idColNumber;
            this.#idColNumbers = obj.idColNumbers;

            // Daten in Map
            this.#data = new Map();
            if (obj.data) {
                const dataLength = obj.data.length;
                for (let i = 0; i < dataLength; i++) {
                    this.#data.set(this.getID(obj.data[i]), obj.data[i]);
                    // todo: indexes ????
                }
            }

            // alle anderen Eigensaften
            this.prop = new Map();
            const objKeys = [...Object.keys(obj)];
            for (let i = 0; i < objKeys.length; i++) {
                const key = objKeys[i];

                // Klassen Parameter ignorieren
                if (" name idColNumber idColNumbers cols findex types links formats data ".indexOf(key) > -1) { continue; }

                this.prop.set(key, obj[key]);
            }
        } catch (err) {
            console.error(err);
            return false;
        }

        return true;
    } // createFromInfoObject


    /**
     * Liefert die Gridliste als Javascript Objekt zurück
     * @returns {GridObject & any} Gridliste als Javascript Objekt
     */
    getAsGridObject() {
        const newObj = {};

        // Standard Eigenschaften
        newObj.name = this.name;
        newObj.cols = this.#cols;
        newObj.findex = this.#findex;
        newObj.types = this.#types;
        newObj.links = this.#links;
        newObj.formats = this.#formats || [];

        newObj.idColNumber = this.#idColNumber;
        newObj.idColNumbers = this.#idColNumbers;

        // Daten aus Map
        const keyList = [...this.#data.keys()];
        const valueList = [...this.#data.values()];
        const dataLength = keyList.length;

        /** @type {any[]} */
        newObj.data = [];

        valueList.forEach(value => {
            newObj.data.push(value);
        })

        // alle anderen Eigensaften
        const propKeys = [...this.prop.keys()];
        for (let i = 0; i < propKeys.length; i++) {
            newObj[propKeys[i]] = this.prop.get(propKeys[i]);
        }

        return newObj;
    } // getAsInfoObj()


    /**
     * Diese Funktion liefert eine Zeile(Array/Slice) zurück
     * die Spalten Reihenfolge der Daten bestimmt die "cols" Eigenschaft von der GridList
     * @param {string|number} key - ID der Zeile 
     * @returns {any[]|undefined}
     */
    getRow(key) {
        return this.#data.get(key);
    }


    /**
     * Setzt eine Datenzeile(any[]) in der Liste.  
     * Die Spalten müssen mit allen Spalten in der Liste übereinstimmen.  
     * Wenn vorhanden wird der Datensatz komplett überschrieben.  
     * !!! WICHTIG !!! - Bereits vorhandenen sortierte oder gruppierte Indexes werden nicht angepasst.
     * @param {any[]} dataRow - DatenZeile, die Spalten Reihenfolge und type muss der von der GridList entsprechen.
     * @returns {string|number} ID das Datensatzes.
     */
    setRow(dataRow) {
        if (!Array.isArray(dataRow)) { return -1; }

        // neue Datenzeilen
        // Prüfen / lesen von bestehender Datenzeile
        let isNewRow = false;
        const id = this.getID(dataRow);
        let newRow = this.getRow(id)
        if (newRow == undefined) {
            newRow = new Array(this.#cols.length);
            isNewRow = true;
        }

        // alle registrierten Spalten durchgehen        
        for (let i = 0; i < this.#cols.length; i++) {
            // nur wenn Objekt den Key hat
            if (dataRow[i] == undefined) { continue; }

            // Wert setzen
            this.#setCellValue(newRow, i, dataRow[i]);
        } // for this#cols

        // wenn neue Datenzeile
        if (isNewRow) {
            this.#data.set(id, dataRow);
        }

        return id;
    }


    /**
     * Löscht eine Datenzeile aus der Liste
     * @param {string|number} key - ID des Datenzeile
     * @returns {boolean} true wenn die Datenzeile gelöst wurde
     */
    deleteRow(key) {
        return this.#data.delete(key);
    }


    /**
     * Gibt einen Datensatz als Objekt zurück
     * @param {Array[]} dataRow - Datensatz Zeile 
     * @returns {object} Datensatz als Objekt
     */
    #getObjFromRow(dataRow) {
        const obj = {};
        if (!dataRow) { return obj; }

        // Alle Felder durchgehen
        for (let i = 0; i < this.#cols.length; i++) {
            obj[this.#cols[i]] = dataRow[i];
        };

        // Objekt zurückgeben
        return obj;
    }

    /**
     * Diese Funktion liefert den Datensatz als neues Objekt zurück.
     * Wenn kein Datensatz gefunden, wird ein neues leeres Objekt zurück geliefert.
     * @param {string|number} key 
     * @returns {object}
     */
    getAsObject(key) {
        return this.#getObjFromRow(this.#data.get(key) || []);
    } // getAsObject

    /**
     * Diese Funktion liefert den Datensatz als neues Objekt zurück.
     * Wenn kein Datensatz gefunden, wird ein neues leeres Objekt zurück geliefert.
     * @param {string|number} key 
     * @returns {object}
     */
    get(key) {
        return this.#getObjFromRow(this.#data.get(key) || []);
    }


    /**
     * Erstellt eine neue Datenzeile. Wenn die "id" angegeben wird diese Datenzeile der Liste hinzugefügt.
     * @param {string|number} [id] - Optionale neue ID der Datenzeile
     * @returns {any[]} neue Datenzeile
     */
    #newRow(id) {
        // neue Datenzeile
        const dataRow = new Array(this.#cols.length);

        if (id != undefined) {
            // ID in neue Datenzeile setzen
            if (this.#idColNumber > -1) {
                dataRow[this.#idColNumber] = id;
            } else if (typeof id == "string") {
                const ids = id.split("_");
                for (let i = 0; i < this.#idColNumbers.length; i++) {
                    dataRow[this.#idColNumbers[i]] = ids[i];
                }
            }

            // Neu anlegen
            this.#data.set(id, dataRow);
        }

        // neue Datenzeile zurückgeben
        return dataRow;
    }


    /**
     * Interne Funktion zum setzen eines wertes in eine Datenzeile
     * @param {any[]} dataRow - Datenzeile
     * @param {string|number} col - Name oder index der Spalte
     * @param {any} value - Wert der gesetzt wird
     */
    #setCellValue(dataRow, col, value) {
        if (!Array.isArray(dataRow)) { return; }

        const i = this.getColNumber(col);

        // link lesen
        const link = this.#links[i] || "";

        // Typ prüfen
        switch (this.#types[i]) {
            case "string":
                dataRow[i] = value + "";
                break;
            case "number":
                if (!Number.isNaN(value)) {
                    dataRow[i] = value;
                } else {
                    dataRow[i] = -1;
                }
                break;
            case "boolean":
                if (typeof value == "boolean") {
                    dataRow[i] = value;
                } else if (typeof value == "string") {
                    if (value == "" || value == "false" || value == "0") {
                        dataRow[i] = false;
                    } else {
                        dataRow[i] = true;
                    }
                } else {
                    dataRow[i] = true;
                }
                break;
            case "object":
                if (Array.isArray(value)) {
                    // Wert nicht ändern
                } else if (typeof value == "object") {
                    // FremdListe lesen
                    let foreignList = lists.get(link);
                    if (foreignList == undefined) {
                        // neue Liste
                        foreignList = new GridList(link);
                        foreignList.setColsFromObject(value, value.id ? "id" : "GSID");
                    }
                    // Objekt in Subliste einfügen und ID als Wert
                    dataRow[i] = foreignList.setObject(value);
                } else {
                    // bereits ein Key ???
                    dataRow[i] = value;
                }
                break;
            case "list":
                if (Array.isArray(value)) {
                    if (typeof value[0] == "object") {
                        let foreignList = lists.get(link);
                        if (foreignList == undefined) {
                            // neue Liste
                            foreignList = new GridList(link);
                            foreignList.setColsFromObject(value[0], value[0].id ? "id" : "GSID");
                        }
                        // Objekt in Subliste einfügen und ID als Wert
                        dataRow[i] = foreignList.setObject(value);
                    } else {
                        // Bereits eine Key Liste ???
                        dataRow[i] = value;
                    }
                }
                break;
            default:
                dataRow[i] = value;
                break;
        }
    }


    /**
     * Schreibt die Daten des angegebenen Objektes in die Gridliste.
     * Ist bereits ein Eintrag mit der selben ID vorhanden, so wird dieser überschrieben.  
     * !!! WICHTIG !!! - Bereits vorhandenen sortierte oder gruppierte Indexes werden nicht angepasst.
     * @param {object} obj - Daten Objekt
     * @returns {string|number|undefined|any[]} ID des eingefügten Objektes
     */
    setObject(obj) {
        if (!obj || typeof obj != "object") { return; }
        if (Array.isArray(obj)) {
            const newIds = [];
            for (let i = 0; i < obj.length; i++) {
                newIds.push(this.setObject(obj[i]));
            }
            return newIds;
        }

        // neue Datenzeilen
        // Prüfen / lesen von bestehender Datenzeile
        let isNewRow = false;
        const id = this.getID(obj);
        let dataRow = this.getRow(id)
        if (dataRow == undefined) {
            dataRow = this.#newRow(id);
            isNewRow = true;
        }

        // alle registrierten Spalten durchgehen        
        for (let i = 0; i < this.#cols.length; i++) {
            const key = this.#cols[i];

            // nur wenn Objekt den Key hat
            if (obj[key] == undefined) { continue; }

            // Wert lesen
            let value = obj[key];

            this.#setCellValue(dataRow, i, value);
        } // for this#cols

        // Neue Datenzeile wird schon bei "this.#newRow(id)" angelegt.
        // wenn neue Datenzeile
        //if (isNewRow) {
        //    this.#data.set(id, dataRow);
        //}
        return id;
    }


    /**
     * Liefert auf Grund des angegebenen Spaltennamen
     * die Position/Nummer der Spalte in der GridList zurück
     * @param {string|number} col - Name der gesuchten Splate
     * @returns {number} - Index Position des gesuchten Feldes. -1 wenn nicht gefunden.
     */
    getColNumber(col) {
        if (typeof col == "string") {
            if (col.indexOf(" ") >= 0) {
                col = col.split(" ")[0];
            }
            //return this.#cols.indexOf(col);
            return this.#findex[col];
        } else if (typeof col == "number") {
            return col;
        }
        return -1;
    }


    /**
     * Liefert eine Liste an Positionen/Nummern der angegebenen Spaltennamen zurück.
     * Für Spaltennamen die nicht in der GridListe gefunden werden, wird -1 als Position zurück gegeben.
     * @param {(string|number)[]} colNameList - Liste mit Feldnamen
     * @returns {number[]} - Liste mit Spalten-Positionen der gesuchten Spalten. -1 wenn die Spalte nicht in der Gridliste gefunden wurde.
     */
    getColNumbers(colNameList) {
        if (!colNameList || !Array.isArray(colNameList)) {
            return [];
        }

        /** @type {number[]} */
        const indexes = [];

        for (let i = 0; i < colNameList.length; i++) {
            indexes.push(this.getColNumber(colNameList[i]));
        }

        return indexes;
    }


    /**
     * Liest den Wert einer Spalte(field) vom angegebenen Datensatz(id) aus.
     * @param {string|number} row - ID des Datensatzes(Zeile)
     * @param {string|number} col - Feldname von dem der Wert gelesen wird
     * @returns {any|undefined} Wert vom angegebenen Datensatz-Feld 
     */
    getCellValue(row, col) {
        if (!row) { return undefined; }
        const colIndex = this.getColNumber(col);

        if (colIndex > -1) {
            const dataRow = this.#data.get(row);
            if (dataRow) {
                return dataRow[colIndex];
            }
            return undefined;
        } else {
            return undefined;
        }
    }


    /**
     * Setzt den Wert(value) einer Spalte im Datensatz(id)  
     * Die Zelle muss in der Liste vorhanden sein
     * @param {string|number} row - ID des Datenzeile
     * @param {string|number} col - SpaltenName oder nummer
     * @param {any} value - Wert der für das angegebene Feld gesetzt wird
     * @returns {void}
     */
    setCellValue(row, col, value) {
        if (row == undefined || col == undefined) { return; }

        let dataRow = this.#data.get(row);
        if (!dataRow) {
            // neue Datenzeile
            dataRow = this.#newRow(row);
        }

        // Zellenwert setzen
        this.#setCellValue(dataRow, col, value);
    } // setCellValue


    /**
     * Gibt ein Array an Werten für die Spalten(fieldList) eines Datensatzes(id) zurück.
     * @param {string|number} row - ID des Datensatzes
     * @param {(string|number)[]} colList - Liste mit Spaltennamen oder Spaltennummern
     * @returns {any[]} Liste mit Werten der angegebenen Spalten
     */
    getColValues(row, colList) {
        if (row == undefined) { return []; }
        if (!colList || !Array.isArray(colList)) {
            return [];
        }

        const dataRow = this.#data.get(row);
        if (!dataRow) { return []; }

        const valueList = [];

        for (let i = 0; i < colList.length; i++) {
            const index = this.getColNumber(colList[i]);
            valueList.push(dataRow[index]);
        };

        return valueList;
    }


    /**
     * Gibt eine Liste aller Id's zurück
     * @returns {(string|number)[]} Liste aller ID's
     */
    getIdList() {
        // Alle Keys von der map
        return [...this.#data.keys()];
    }
    /**
     * gibt eine Liste aller Id's zurück
     * @alias getIdList
     * @returns {(string|number)[]} Liste aller ID's
     */
    keys() {
        return [...this.#data.keys()];
    }


    /**
     * Liefert alle Datenzeilen, oder nur die Datenzeilen mit angegebener ID, in einer Liste zurück.
     * @param {string|(string|number)[]} [index] - optional Index oder Liste mit Datensatz ID's
     * @returns {Array[]}
     */
    getRows(index) {
        if (Array.isArray(index)) {
            /** @type {Array[]} */
            const newList = [];

            // alle Keys durchgehen
            for (let i = 0; i < index.length; i++) {
                newList.push(this.#data.get(index[i]) || []);
            }
            return newList;
        } else if (typeof index == "string") {
            return this.#index.get(index || "") || [...this.#data.values()];
        } else {
            return [...this.#data.values()];
        }
    }


    /**
     * Merkt sich alle Datenzeilen, oder die Datenzeilen vom "oldIndex", unter angegebenen Index(newIndex)
     * @param {string} newIndexName - Index Name unter dem die Datenzeilen angelegt werden
     * @param {string} [oldIndexName] - optional Index Name von dem die Daten gelesen werden
     * @returns {void}
     */
    setIndex(newIndexName, oldIndexName) {
        if (typeof newIndexName != "string") { return; }
        if (typeof oldIndexName == "string") {
            this.#index.set(newIndexName, this.#index.get(oldIndexName) || []);
        } else {
            this.#index.set(newIndexName, [...this.#data.values()]);
        }
    }


    /**
     * Sortiert die Daten nach angegebenen Spalten. Groß-Kleinschreibung bei Texten wird ignoriert.
     * Wenn "index" angegeben, und der Index vorhanden ist, werden die Daten unter diesem Index sortiert, und unter dem selben Index abgelegt.
     * Wenn "index" angegeben, und noch nicht angelegt, werden alle Daten sortiert und unter dem Index abgelegt.
     * @param {(string|number)[]} sortCols - Liste mit Spalten nach denen Sortiert wird
     * @param {string} [indexName] - Index Name der zum sortieren verwendet wird, oder wenn nicht vorhanden, gesetzt wird.
     * @returns {Array[]} sortierte Zeilen
     * @example
     * const sortList = dataList.sortRows(["name", "hausnummer DESC"], "sortListe");
     */
    sortRows(sortCols, indexName) {
        // Alle Datenzeile in einer liste
        const rowList = this.#index.get(indexName || "") || [...this.#data.values()];

        // wenn keine SortierungsSpalten angegeben
        if (!Array.isArray(sortCols)) {
            if (indexName) { this.#index.set(indexName, rowList); }
            return rowList;
        }

        // Feld Indexes lesen und Sortier Reihenfolge
        const colLength = sortCols.length;
        const colIndex = new Array(colLength);
        const orderIndex = new Array(colLength);

        for (let i = 0; i < colLength; i++) {
            let col = sortCols[i];
            let direction = 1; // 1 = Aufsteigend sortieren / -1 = Absteigend sortieren
            let index = -1;

            if (typeof col == "string" && col.indexOf(" ") >= 0) {
                const fieldData = col.split(" ");
                index = this.getColNumber(fieldData[0]);
                if (fieldData[1].trim().toUpperCase() == "DESC") {
                    direction = -1;
                }
            } else {
                index = this.getColNumber(col);
            }

            colIndex[i] = index;
            orderIndex[i] = direction;
        }


        // Sortieren
        rowList.sort((a, b) => {
            // Prüfen
            for (let i = 0; i < colLength; i++) {
                // absteigend
                if (orderIndex[i] < 0) {
                    if (typeof a[colIndex[i]] == "string" && typeof b[colIndex[i]] == "string") {
                        if (a[colIndex[i]].toLowerCase() > b[colIndex[i]].toLowerCase()) { return -1; }
                        if (a[colIndex[i]].toLowerCase() < b[colIndex[i]].toLowerCase()) { return 1; }
                    } else {
                        if (a[colIndex[i]] > b[colIndex[i]]) { return -1; }
                        if (a[colIndex[i]] < b[colIndex[i]]) { return 1; }
                    }
                } else {
                    // Aufsteigend
                    if (typeof a[colIndex[i]] == "string" && typeof a[colIndex[i]] == "string") {
                        if (a[colIndex[i]].toLowerCase() > b[colIndex[i]].toLowerCase()) { return 1; }
                        if (a[colIndex[i]].toLowerCase() < b[colIndex[i]].toLowerCase()) { return -1; }
                    } else {
                        if (a[colIndex[i]] > b[colIndex[i]]) { return 1; }
                        if (a[colIndex[i]] < b[colIndex[i]]) { return -1; }
                    }
                }
            } // alle Felder vergleichen

            // alle gleich
            return 0;
        });

        if (indexName) { this.#index.set(indexName, rowList); }
        return rowList;
    } // getSortRows


    /**
     * Gibt eine gefilterte Liste mit Datensätzen zurück.  
     * Wenn index Angegeben werden die Daten zum Filtern vom bestehenden Index genommen.  
     * Wenn newIndex angegeben, wird die gefilterte Liste unter dem "newIndex" abgelegt.
     * @param {Function} fu - Filterfunktion muss "true" oder "false" zurückgeben. Wenn "true" wird der Datensatz in die gefilterte Liste aufgenommen. 
     * @param {string} [indexName] - optionaler Index, wenn Daten von einem bestehenden Index genommen werden. 
     * @param {string} [newIndexName] - Index unter dem die gefilterte Liste abgelegt wird.
     * @returns {Array[]} Gefilterte Liste
     */
    filter(fu, indexName, newIndexName) {

        // Daten zum Filtern
        const rowList = this.#index.get(indexName || "") || [...this.#data.values()];
        if (typeof fu != "function") { return rowList; }

        const newList = [];

        // alle durchgehen
        for (let i = 0; i < rowList.length; i++) {
            const obj = this.#getObjFromRow(rowList[i]);

            if (fu(obj, i, rowList)) {
                newList.push(rowList[i]);
            }
        }

        if (newIndexName) {
            this.#index.set(newIndexName, newList);
        }
        return newList;
    }


    /**
     * Gibt eine gefilterte Liste mit Datensätzen zurück.  
     * Die Filterfunktion wird mit einer Liste von Datensätzen aufgerufen, die in der angegebenen Spaltenliste(colList) den selben Wert haben.  
     * Wenn index angegeben werden die Daten zum Filtern vom bestehenden Index genommen.
     * Wenn newIndex angegeben, wird die gefilterte Liste unter dem "newIndex" abgelegt.
     * @param {(string|number)[]} colList - Spalten Namen oder Nummern nach dem Gruppiert wird. 
     * @param {Function} fu - Filterfunktion muss "true" oder "false" zurückgeben. Wenn "true" werden alle Datensätze der Gruppe in die gefilterte Liste aufgenommen.
     * @param {string} [indexName] - optionaler Index, wenn Daten von einem bestehenden Index genommen werden. 
     * @param {string} [newIndexName] - Index unter dem die gefilterte Liste abgelegt wird.
     * @returns {Array[]} Gefilterte Liste
     */
    filterGroup(colList, fu, indexName, newIndexName) {

        // Aggregatfunktionen
        // count()
        // sum()
        // avg()
        // min()
        // max()
        

        // Daten zum Filtern
        const rowList = this.#index.get(indexName || "") || [...this.#data.values()];
        if (typeof fu != "function") { return rowList; }

        const newList = [];
        const newObjList = [];
        const groupCols = this.getColNumbers(colList);
        const groupValues = new Array(groupCols.length);
        let groupList = [];
        let groupObjList = [];

        // alle durchgehen
        for (let i = 0; i < rowList.length; i++) {
            let istNewGroup = false;

            // auf neue Gruppe prüfen
            for (let j = 0; j < groupCols.length; j++) {
                const value = rowList[i][groupCols[j]];
                if (value != groupValues[j]) {
                    istNewGroup = true;
                    groupValues[j] = value;
                }
            }

            // wenn neue gruppe
            if (istNewGroup) {
                // wenn FilterFunktion == true
                if (i > 0 && fu(groupObjList)) {
                    newList.push(...groupList);
                    newObjList.push(...groupObjList);
                }

                // Gruppe zurücksetzen
                groupList = [];
                groupObjList = [];
                istNewGroup = false;
            }

            // Datensatz in Gruppe
            groupList.push(rowList[i])
            groupObjList.push(this.#getObjFromRow(rowList[i]));
        } // for jeder Datensatz

        // Letze Gruppe
        if (fu(groupObjList)) {
            newList.push(...groupList);
            newObjList.push(...groupObjList);
        }

        if (newIndexName) {
            this.#index.set(newIndexName, newList);
        }
        return newObjList;
    }


    /**
     * Führt die angegebene Funktion für jeden Datensatz, oder jeden Datensatz im angegebenen index, aus.  
     * Als Parameter wird die Datenzeile als Array übergeben. 
     * @param {Function} fu - Funktion die pro Datensatz ausgeführt wird
     * @param {string} [indexName] - optionaler Index Name der als Datenquelle verwendet wird
     * @returns {void}
     * @example
     * const namensListe = [];
     * adresslistList.forEach((row, listIndex, rowList) => {namensListe.push(row[1] + " " + row[2]);});
     * console.log(namensListe);
     */
    forEach(fu, indexName) {
        // Daten zum Filtern
        const rowList = this.#index.get(indexName || "") || [...this.#data.values()];
        if (typeof fu != "function") { return; }

        // alle durchgehen
        for (let i = 0; i < rowList.length; i++) {
            // Funktion ausführen
            if (fu(rowList[i], i, rowList)) { break; };
        }
    }


    /**
     * Führt die angegebene Funktion für jeden Datensatz, oder jeden Datensatz im angegebenen index, aus.  
     * Als Parameter wird die Datenzeile als Objekt übergeben. 
     * @param {Function} fu - Funktion die pro Datensatz ausgeführt wird
     * @param {string} [indexName] - optionaler Index Name der als Datenquelle verwendet wird
     * @returns {void}
     * @example
     * const namensListe = [];
     * adresslistList.forEach((objekt, listIndex, rowList) => {namensListe.push(objekt.vorname + " " + objekt.nachname);});
     * console.log(namensListe);
     */
    forEachObj(fu, indexName) {
        // Daten zum Filtern
        const rowList = this.#index.get(indexName || "") || [...this.#data.values()];
        if (typeof fu != "function") { return; }

        // alle durchgehen
        for (let i = 0; i < rowList.length; i++) {
            const obj = this.#getObjFromRow(rowList[i]);
            // Funktion ausführen
            if (fu(obj, i, rowList)) { break; };
        }
    }

    // Gridliste in einen String umwandeln
    /**
     * liefert die GridListe als JSON String zurück
     * @returns {string} Gridliste als JSON String
     */
    stringify() {
        // in JSON String umwandeln
        return JSON.stringify(this.getAsGridObject());
    } // stringify


    // Liest einen JSON-String in die GridList ein
    /**
     * 
     * @param {string} listString - JSON String eines InfoData Objektes
     * @returns {boolean} true wenn diese Gridliste erstellt wurde.
     */
    parse(listString) {
        if (typeof listString != "string") {
            return false;
        }

        // Gridliste setzen
        return this.createFromGridObject(JSON.parse(listString));
    } // parse


    /**
    * Konstruktor mit GridList Objekt oder JSON-String
    * @param {string} name - Javascript Objekt oder JSON-String
    * @param {string[]} [colList] - Optionale Liste mit Spaltennamen
    * @param {string|string[]} [idCol] - Name der ID Spalte oder mehreren Splalten die die ID ergeben. Muss angegeben werden wenn colList angegeben.
    */
    constructor(name, colList, idCol) {
        this.name = name;
        if (colList) {
            this.setCols(colList, idCol || colList[0]);
        }
    }
} // Class GridList


// List -> row -> col -> cell

//  GridView
/**
 * @class
 */
export class GridView {
    /** @type {string[]} */
    #colTags = [];
    get colTags() {
        return this.#colTags;
    }

    /** @type {string} */
    #rowTag = "tr";
    set rowTag(value) {
        this.#rowTag = value;
    }
    get rowTag() {
        return this.#rowTag;
    }

    /** @type {number[]} */
    #colNumbers = [];

    /** @type {string[]} */
    #cols = [];
    /** @param {string[]} value */
    set cols(value) {
        this.setCols(value);
    }
    get cols() {
        return this.#cols;
    }

    /** @type {string|string[]} */
    #rowIDNames

    /** @type {GridList} */
    #gridList
    /** @param {GridList} value - GridListe */
    set gridList(value) {
        this.setGridList(value);
    }
    get gridList() {
        return this.#gridList;
    }

    /** @type {Map<string|Function>} */
    colFunc = new Map();

    /** @type {Function} */
    rowFunc;

    /**
     * Setzt die Spalten die im HTML erstellt werden
     * @param {(string|number)[]} cols - Listen mit Spaltennamen. Optional mit Leerzeichen getrennt der TagName.
     */
    setCols(cols) {
        this.#cols = [];
        this.#colTags = [];
        this.#colNumbers = [];

        for (let i = 0; i < cols.length; i++) {
            const col = cols[i];
            if (typeof col == "string") {
                const pos1 = col.indexOf(" ");
                if (pos1 > -1) {
                    const name = col.substring(0, pos1);
                    const tag = col.substring(pos1 + 1);
                    this.#cols.push(name);
                    this.#colTags.push(tag);
                    this.#colNumbers.push(this.#gridList.getColNumber(name));
                } else {
                    this.#cols.push(col);
                    this.#colTags.push("td");
                    this.#colNumbers.push(this.#gridList.getColNumber(col));
                }
            } else if (typeof col == "number") {
                this.#cols.push(this.#gridList.cols[col]);
                this.#colTags.push("td");
                this.#colNumbers.push(col);
            }
        }
    }

    /**
     * Setzt die Gridliste(Daten) für das Generieren des HTML-Strings
     * @param {GridList} gridList - Gridliste mit Daten
     */
    setGridList(gridList) {
        this.#gridList = gridList;

        // ID Namen Merken
        this.#rowIDNames = gridList.idColName;
    }




    /**
     * Liefert den HTML-String eine Spalte zurück
     * @param {Object} row - Datenzeile
     * @param {number} colNumber - Spaltennummer
     * @returns {string} HTML-String der Spalte
     */
    getColHtml(row, colNumber) {
        let colName = this.#cols[colNumber];
        let tagName = this.#colTags[colNumber] || "td";
        const colIndex = this.#colNumbers[colNumber];
        let attr = "";

        // Auf ZellenAnpassung prüfen
        if (this.colFunc.has(colName)) {
            // Funktion mit (SpalteName, SpalteWert, Zeile, SpalteIndex)
            attr = " " + this.colFunc.get(colName)(colName, row);
        }

        return `<${tagName}${attr}>${row[colName]}</${tagName}>`;
    }


    /**
     * Gibt die ID des Datensatzobjektes zurück
     * @param {Object} row - Datensatz Objekt
     * @returns {string|number} ID
     */
    getRowID(row) {
        let id;
        if (Array.isArray(this.#rowIDNames)) {
            id = "";
            for (let i = 0; i < this.#rowIDNames.length; i++) {
                id += row[this.#rowIDNames[i]] + "_";
            }
        } else {
            id = row[this.#rowIDNames];
        }
        return id;
    }


    /**
     * Liefert einen HTML-String der Datenzeile zurück
     * @param {any[]} row - Datenzeile Objekt
     * @param {string|number} listIndex - Index in der Liste
     * @param {any[][]} list - Liste aus der die Datenzeile kommt
     * @returns {string} HTML String der Datenzeile
     */
    getRowHtml(row, listIndex, list) {
        const rowID = this.#gridList.getID(row);
        const tableRowID = this.#gridList.name + '_' + rowID;
        const tagName = this.#rowTag || "tr";
        let attr = "";

        // Auf Zeilenanpassung prüfen
        if (this.rowFunc) {
            attr = " " + this.rowFunc(row);
        }

        let html = `<${tagName} id="${tableRowID}"${attr}>`;

        // Alle Spalten durchgehen
        for (let i = 0; i < this.#cols.length; i++) {
            html += this.getColHtml(row, i);
        }
        return html + `</${tagName}>`;
    }


    /**
     * Liefert den HTML-String als "tbody" von den Daten der GridList zurück
     * @param {string} index - optionaler Index-Name
     * @returns {string} HTML-String vom Table-Body
     */
    getHtml(index) {
        let html = "";

        // alle Zeilen durchgehen
        // todo: ForEach und ForEachObj macht keinen grossen Unterschied
        this.#gridList.forEachObj((/** @type {any[]} */row, /** @type {string|number} */i, /** {any[][]} */ list) => {
            html += this.getRowHtml(row, i, list);
        }, index);

        // html zurückgeben
        return html;
    }


    /**
     * GridTableBody
     * @constructor
     * @param {GridList} gridList - GridListe mit daten
     */
    constructor(gridList) {
        if (gridList instanceof GridList) {
            this.setGridList(gridList);
        }
    }
} // class GridTableRows




// ===============================
//   Funktionen
// --------------

// Global Short Identifier
export function GSID() {
    return new Date().getTime().toString(36) +
        crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}

function templateMe(template, obj) {
    var regex = /{{(.*?)}}/g;
    return template.replace(regex, function (match, capture) {
        return obj[capture] || "";
    });
}
