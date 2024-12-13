// ==================
//   Info Liste
// ==================
// @ts-check


// ===============================
//   Typen
// --------------

// [date|special(30){>0;10}/regex/=default]

/**
 * @typedef {object} InfoFormat
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
 * @typedef {object} InfoObject
 * @property {string} name
 * @property {number} idColNumber
 * @property {number[]} idColNumbers
 * @property {string[]} cols
 * @property {InfoTypes[]} types
 * @property {(string|undefined|null)[]} links
 * @property {InfoFormat[]} [formats]
 * @property {any[]} [data]
 */

/**
 * @typedef {object} InfoList2
 * @property {string} [name]
 * @property {string[]} cols
 * @property {string[]} types
 * @property {string[]} [formats]
 * @property {Map<string,any[]>} data
 */

/**
 * @callback FilterFunc
 * @param {object} [dataObject]
 * @param {string|number} [key]
 * @param {InfoList} [infoList]
 */

/**
 * @callback FilterFieldFunc
 * @param {string} [name]
 * @param {number} [index]
 * @param {InfoList} [infoList]
 */


// ===============================
//   Constanten
// --------------

const regexTemplate = /{{(.*?)}}/g;
const regexFor = /{{(for)}}/g;

/** 
 * Auflistung aller InfoListen
 * @type {Map<string,InfoList>}
 */
export const lists = new Map();


// ===============================
//   Klasse
// --------------

export class InfoList {
    // Parameter
    self = this;
    _name = "";

    /** @type {number} */
    _idColNumber = -1;

    /** @type {number[]} */
    _idColNumbers = [];

    ///** @type {number|number[]} */
    //_idColIndex = 0;

    /** @type {string[]} */
    _cols = [];

    /** @type {string[]} */
    _types = [];

    /** @type {(string|undefined|null)[]} */
    _links = [];

    /** @type {InfoFormat[]} */
    _formats = [];

    /** @type {Map<string|number,any[]>} */
    _data = new Map();

    /** @type {Map<string,any>} */
    prop = new Map();


    set name(newName) {
        if (!newName) {
            newName = GSID();
        }
        this._name = newName;

        // name registrieren
        lists.set(this._name, this);
    }
    get name() {
        return this._name;
    }


    /**
     * Setzt das ID-Feld und mekt sich den ID-Index.
     * Felder müssen vorher in der Liste existieren.
     * @param {string|number|(string|number)[]} col - ID Spaltenname oder Spaltennummer oder Liste davon, die eine eindeutige ID ergeben
     * @returns {void}
     */
    setIdCol(col) {
        if (typeof col == "string") {
            this._idColNumber = this._cols.indexOf(col);
            this._idColNumbers = [];
        } else if (typeof col == "number") {
            this._idColNumber = col;
            this._idColNumbers = [];
        } else if (Array.isArray(col)) {
            this._idColNumber = -1;
            this._idColNumbers = [];

            // Alle Einträge Prüfen
            for (let i = 0; i < col.length; i++) {
                switch (typeof col[i]) {
                    case "string":
                        this._idColNumbers.push(this._cols.indexOf(col[i] + ""));
                        break;
                    case "number":
                        this._idColNumbers.push(parseInt(col[i] + ""));
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
        if (this._idColNumber > -1) {
            return this._idColNumber;
        } else {
            return this._idColNumbers;
        }
    }


    /**
     * Spaltenname des ID Feldes
     * @returns {string|string[]} SpaltenName oder Liste von Spaltennamen
     */
    get idColName() {
        if (this._idColNumber > -1) {
            return this._cols[this._idColNumber];
        } else {
            /** @type {string[]} */
            const colNames = []
            for (let i = 0; i < this._idColNumbers.length; i++) {
                colNames.push(this._cols[i]);
            }
            return colNames;
        }
    }


    /**
     * Holt aus einer Datenzeile die ID laut gespeicherten idIndex
     * @param {any[]} dataRow - Datenzeile Array
     * @returns {string|number} ID
     */
    getID(dataRow) {
        if (!Array.isArray(dataRow)) {return -1;}

        if (this._idColNumber < 0) {
            let id = "";
            for (let i = 0; i < this._idColNumbers.length; i++) {
                id += dataRow[this._idColNumbers[i]] + "_";
            }
            return id;
        } else {
            return dataRow[this._idColNumber];
        }
    }


    /**
     * Setzt oder löscht, für die Angegebene Spalte, den Link(Verknüpfung) zu einer anderen Liste
     * @param {string|number} col - Spaltenname oder Splaltennummer
     * @param {string|undefined|null} [listName] - Name der InfoListe. Wenn nicht angegeben wird der Link(Verknüpfung) gelöscht.
     * @returns {void}
     */
    setColLink(col, listName) {
        if (typeof col == "string") {
            this._links[this._cols.indexOf(col)] = listName;
        } else if (typeof col == "number") {
            this._links[col] = listName;
        }
    }


    /**
     * Liest den Listennamen der Verknüpften Liste vom angegebenen Feldindex aus
     * @param {string|number} col - Spaltennummer oder Spaltenname
     * @returns {string|undefined|null} Name der Liste. Kann mit lists.get(name) gelesen werden.
     */
    getColLink(col) {
        if (typeof col == "string") {
            return this._links[this._cols.indexOf(col)];
        } else if (typeof col == "number") {
            return this._links[col];
        }
    }
    

    /**
     * Setzt die SpaltenNamen der InfoListe  
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
        if (!cols) {return;}
        let newFields = [];

        if (Array.isArray(cols)) {
            newFields = cols;
        } else if (typeof cols == "string" && seperator) {
            newFields = cols.split(seperator);
        }

        // bestehende Spalten löschen
        // todo: Eventuell mit bestehenden Spalten zusammenmergen ????
        this._cols = new Array(newFields.length);
        this._links = new Array(newFields.length);
        this._types = new Array(newFields.length);

        // alle neuen Spalten durchgehen
        for (let i = 0; i < newFields.length; i++) {
            let name = newFields[i];
            let type = "string";

            // Wenn ein leerzeichen im Namen
            if (name.indexOf(" ") > -1) {
                // Type steht nach namen
                const nameType = name.split(" ");

                this._cols[i] = nameType[0];
                
                if (nameType[2]) {
                    this._links[i] = nameType[2];
                }

                // auf richtige Typen prüfen
                if ("|string|number|boolean|object|list|".indexOf(nameType[1]) > -1) {
                    this._types[i] = nameType[1];

                    //  Wenn keine verknüpfte Liste
                    if ((nameType[1] == "object" || nameType[1] == "list") && !nameType[2]) {
                        // Liste Name wird vom SpaltenNamen angenommen
                        this._links[i] = nameType[0];
                    }
                } else {
                    // wenn kein Typ angegeben dann immer "string"
                    this._types[i] = "string";
                }
            } else {
                this._cols[i] = name;

                // Standard Typ
                this._types[i] = type;
            }
        }

        // ID Spalte setzen
        this.setIdCol(idCol);

        // Daten passen dann nicht mehr zu Spalten und werden gelöscht
        this._data = new Map();
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
        if (typeof obj != "object") {return;}
        if (Array.isArray(obj)) {return;}

        // Eigenschaft Namen vom Objekt lesen
        const keyList = [...Object.keys(obj)];

        // Typ Prüfung
        for (let i = 0; i < keyList.length; i++) {
            switch (typeof keyList[i]) {
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
     * @param {InfoFormat} formatObj 
     */
    setColFormat(col, formatObj) {
        if (!formatObj) {formatObj = {};}
        
        if (typeof col == "string") {
            this._formats[this._cols.indexOf(col)] = formatObj;
        } else if (typeof col == "number") {
            this._formats[col] = formatObj;
        }
    }

    /**
     * Liefert vom der angegebenen Spalte das Format Objekt zurück
     * @param {string|number} col - Splatenname oder SplantenNummer 
     * @returns {InfoFormat|undefined} Format Objekt wenn vorhanden
     */
    getColFormat(col) {
        if (typeof col == "string") {
            return this._formats[this._cols.indexOf(col)]
        } else if (typeof col == "number") {
            return this._formats[col];
        }
    }


    /**
     * Ersetzt alle Daten mit einem neuen InfoObject
     * @param {InfoObject & [any]} obj 
     * @returns {boolean} true wenn die daten übernommen wurden
     */
    createFromInfoObject(obj) {
        try {
            if (!obj) { return false; }
            if (!obj.cols || !obj.types) { return false; }

            // Standard Eigenschaften
            this.name = obj.name;
            this._cols = obj.cols;
            this._types = obj.types;
            this._links = obj.links;
            this._formats = obj.formats || [];

            // idIndex
            this._idColNumber = obj.idColNumber;
            this._idColNumbers = obj.idColNumbers;

            // Daten in Map
            this._data = new Map();
            if (obj.data) {
                const dataLength = obj.data.length;
                for (let i = 0; i < dataLength; i++) {
                    this._data.set(this.getID(obj.data[i]), obj.data[i]);
                    // todo: indexes ????
                }
            }

            // alle anderen Eigensaften
            this.prop = new Map();
            const objKeys = [...Object.keys(obj)];
            for (let i = 0; i < objKeys.length; i++) {
                const key = objKeys[i];

                // Klassen Parameter ignorieren
                if (" name idColNumber idColNumbers cols types links formats data ".indexOf(key) > -1) { continue; }

                this.prop.set(key, obj[key]);
            }
        } catch (err) {
            console.error(err);
            return false;
        }

        return true;
    } // createFromInfoObject


    /**
     * Liefert die Infoliste als Javascript Objekt zurück
     * @returns {InfoObject & any} Infoliste als Javascript Objekt
     */
    getAsInfoObject() {
        const newObj = {};

        // Standard Eigenschaften
        newObj.name = this.name;
        newObj.cols = this._cols;
        newObj.types = this._types;
        newObj.links = this._links;
        newObj.formats = this._formats || [];

        newObj.idColNumber = this._idColNumber;
        newObj.idColNumbers = this._idColNumbers;

        // Daten aus Map
        const keyList = [...this._data.keys()];
        const valueList = [...this._data.values()];
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
     * die Spalten Reihenfolge der Daten bestimmt die "cols" Eigenschaft von der InfoList
     * @param {string|number} key - ID der Zeile 
     * @returns {any[]|undefined}
     */
    getRow(key) {
        return this._data.get(key);
    }


    /**
     * Setzt eine Datenzeile(any[]) in der Liste.  
     * Die Spalten müssen mit allen Spalten in der Liste übereinstimmen.  
     * Wenn vorhanden wird der Datensatz komplett überschrieben.  
     * @param {any[]} dataRow - DatenZeile, die Spalten Reihenfolge und type muss der von der InfoList entsprechen.
     */
    setRow(dataRow) {
        // todo: Prüfen auf Array und die richtigen Datentypen
        this._data.set(this.getID(dataRow), dataRow);
    }


    /**
     * Löscht eine Datenzeile aus der Liste
     * @param {string|number} key - ID des Datenzeile
     * @returns {boolean} true wenn die Datenzeile gelöst wurde
     */
    deleteRow(key) {
        return this._data.delete(key);
    }


    /**
     * Diese Funktion liefert den Datensatz als neues Objekt zurück.
     * Wenn kein Datensatz gefunden, wird ein neues leeres Objekt zurück geliefert.
     * @param {string|number} key 
     * @returns {object}
     */
    getAsObject(key) {
        const obj = {};
        const dataRow = this._data.get(key);
        if (!dataRow) { return obj; }

        // Alle Felder durchgehen
        for (let i = 0; i < this._cols.length; i++) {
            obj[this._cols[i]] = dataRow[i];
        };

        // Objekt zurückgeben
        return obj;
    } // getAsObject


    /**
     * Schreibt die Daten des angegebenen Objektes in die Infoliste.
     * Ist bereits ein Eintrag mit der selben ID vorhanden, so wird diese überschrieben.
     * @param {object} obj - Daten Objekt
     * @returns {string|number|undefined} ID des eingefügten Objektes
     */
    setObject(obj) {
        if (!obj || typeof obj != "object") { return; }

        const dataRow = new Array(this._cols.length);

        const objKeys = [...Object.keys(obj)];
        for (let i = 0; i < objKeys.length; i++) {
            const objKey = objKeys[i];
            const index = this._cols.indexOf(objKey);
            if (index > -1) {
                let value = obj[objKey];
                
                // Bei Objekt oder Liste, in andere Liste Einfügen
                if (typeof value == "object") {
                    // Wenn Link
                    if (typeof this._links[index] == "string") {
                        // FremdListe lesen
                        let foreignList = lists.get(this._links[index]);

                        if (this._types[index] == "object") {
                            // Wenn Liste noch nicht Existiert
                            if (foreignList == undefined) {
                                foreignList = new InfoList(this._links[index]);

                                // ID ist id oder GSID 
                                foreignList.setColsFromObject(value, value.id ? "id" : "GSID");
                            }

                            // Objekt in Subliste einfügen und Value neu setzen
                            value = foreignList.setObject(value);
                        } else if (this._types[index] == "list" && Array.isArray(value)) {
                            // Wenn Liste noch nicht Existiert
                            if (foreignList == undefined) {
                                foreignList = new InfoList(this._links[index]);

                                // ID ist id oder GSID 
                                foreignList.setColsFromObject(value[0], value[0].id ? "id" : "GSID");
                            }

                            const newValue  = [];

                            // Alle Objekte in der Liste durchgehen
                            for (let j = 0; j < value.length; j++) {
                                newValue.push(foreignList.setObject(value[j]));
                            }

                            // neuen Wert setzen
                            value = newValue;
                        }
                    }
                }

                // Wert merken
                dataRow[index] = value;
            }
        }
        
        const id = this.getID(dataRow);
        this._data.set(id, dataRow);
        return id;
    }


    /**
     * Liefert auf Grund des angegebenen Spaltennamen
     * die Position/Nummer der Spalte in der InfoList zurück
     * @param {any} col - Name des gesuchten Feldes
     * @returns {number} - Index Position des gesuchten Feldes. -1 wenn nicht gefunden.
     */
    getColNumber(col) {
        if (typeof col == "string") {
            if (col.indexOf(" ") >= 0) {
                col = col.split(" ")[0];
            }
            return this._cols.indexOf(col);
        } else if (typeof col == "number") {
            return col;
        }
        return -1;
    }


    /**
     * Liefert eine Liste an Positionen/Nummern der angegebenen Spaltennamen zurück.
     * Für Spaltennamen die nicht in der InfoListe gefunden werden, wird -1 als Position zurück gegeben.
     * @param {string[]} colNameList - Liste mit Feldnamen
     * @returns {number[]} - Liste mit Spalten-Positionen der gesuchten Spalten. -1 wenn die Spalte nicht in der Infoliste gefunden wurde.
     */
    getColNumbers(colNameList) {
        if (!colNameList || !Array.isArray(colNameList)) {
            return [];
        }

        /** @type {number[]} */
        const indexes = [];

        for (let i = 0; i < colNameList.length; i++) {
            let colName = colNameList[i];
            if (colName.indexOf(" ") >= 0) {
                colName = colName.split(" ")[0];
            }
            indexes.push(this._cols.indexOf(colName));
        };

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
        const index = this.getColNumber(col);

        if (index > -1) {
            const dataRow = this._data.get(row);
            if (dataRow) {
                return dataRow[index];
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

        let dataRow = this._data.get(row);
        if (!dataRow) {
            return;
        }

        const index = this.getColNumber(col);
        if (index > -1) {
            const colType = this._types[index];

            // Wert setzen
            switch (colType) {
                case "string":
                    dataRow[index] = "" + value;
                    break;

                default:
                    dataRow[index] = value;
            }
        }
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

        const dataRow = this._data.get(row);
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
        return [...this._data.keys()];
    }
    /**
     * gibt eine Liste aller Id's zurück
     * @alias getIdList
     * @returns {(string|number)[]} Liste aller ID's
     */
    keys() {
        return [...this._data.keys()];
    }


    getRows() {
        return  [...this._data.values()];
    }


    /**
     * Gibt eine Liste mit sortierten Zeilen zurück die nach angegebenen Spalten sortiert sind.
     * @param {string[]} sortCols - Liste mit Spalten nach denen sortiert wird
     * @returns {Array[]} sortierte Zeilen
     * @example
     * const sortList = dataList.getSortKeyList(["name", "hausnummer"]);
     */
    getSortRows(sortCols) {
        // Alle Datenzeile in einer liste
        const rowList = [...this._data.values()];
  
        // wenn keine SortierungsSpalten angegeben
        if (!Array.isArray(sortCols)) {
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
            } else  {
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
                    if (a[colIndex[i]] > b[colIndex[i]]) { return -1; }
                    if (a[colIndex[i]] < b[colIndex[i]]) { return 1; }
                } else {
                    // Aufsteigend
                    if (a[colIndex[i]] > b[colIndex[i]]) { return 1; }
                    if (a[colIndex[i]] < b[colIndex[i]]) { return -1; }
                }
            } // alle Felder vergleichen

            // alle gleich
            return 0;
        });

        return rowList;
    } // getSortKeyList


    // Infoliste in einen String umwandeln
    /**
     * liefert die InfoListe als JSON String zurück
     * @returns {string} Infoliste als JSON String
     */
    stringify() {
        // in JSON String umwandeln
        return JSON.stringify(this.getAsInfoObject());
    } // stringify


    // Liest einen JSON-String in die InfoList ein
    /**
     * 
     * @param {string} listString - JSON String eines InfoData Objektes
     * @returns {boolean} true wenn diese Infoliste erstellt wurde.
     */
    parse(listString) {
        if (typeof listString != "string") {
            return false;
        }

        // Infoliste setzen
        return this.createFromInfoObject(JSON.parse(listString));
    } // parse


     /**
     * Konstruktor mit InfoList Objekt oder JSON-String
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
} // Class InfoList


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
    return template.replace(regex, function(match, capture) {
      return obj[capture] || "";
    });
}



// // Seiten Navigation
// // path, name, title, date
// export function InfoNav(iList) {
//     const self = InfoNav;

//     // Eigenschaften
//     self.infoList = iList;
//     self.sortFields = [];
//     self.sortIndex = null;
//     self.sortFields = ["path", "date DESC", "title", "name"];
//     self.elmID = "";

//     let pathIndex = -1;
//     let nameIndex = -1;
//     let titleIndex = -1;
//     let dateIndex = -1;

//     function setIndexes() {
//         if (self.infoList instanceof InfoList) {
//             pathIndex = self.infoList.getFieldIndex("path");
//             nameIndex = self.infoList.getFieldIndex("name");
//             titleIndex = self.infoList.getFieldIndex("title");
//             dateIndex = self.infoList.getFieldIndex("date");

//             self.sortIndex = self.infoList.getSortIndex(self.sortFields);
//         } else {
//             pathIndex = -1;
//             nameIndex = -1;
//             titleIndex = -1;
//             dateIndex = -1;
//         }
//     }

//     // bei Start ausführen
//     setIndexes()

//     //  Setzt die InfoListe für die Tabelle
//     self.setInfoList = function (iList) {
//         self.infoList = iList;
//         setIndexes();
//     }

//     // Sortierung
//     self.setSortIndex = function (sortIndex) {
//         if (Array.isArray(sortIndex)) {
//             self.sortIndex = sortIndex;
//         }
//     }

//     self.showNav = function (elm) {
//         // Prüfen
//         if (!elm && self.elmID != "") {
//             elm = document.body.querySelector(self.elmID);
//         }
//         if (elm instanceof HTMLElement) {
//             self.elmID = elm.id;
//         } else {
//             return;
//         }
//         if ((!self.infoList) instanceof InfoList) {
//             return;
//         }

//         // Feldindex aktualisiern
//         setIndexes();

//         // Navigation Objekt
//         function NavObj() {
//             const self = this;

//             self.active = false;
//             self.title = "";
//             self.path = "";
//             self.isDir = false;
//             self.children = [];
//         };

//         let dirList = new Map();

//         // // Basis Navigation Objekt
//         let baseNav = new NavObj();
//         baseNav.url = "/";
//         baseNav.isDir = true;
//         dirList.set("/", baseNav);

//         // Aktuellen Pfad lesen
//         const fullPath = window.location.pathname;

//         // Eltern Navigations Objekt holen
//         function getDirObj(path) {
//             let lastPos = path.lastIndexOf("/");
//             let parentPath = path.substring(0, lastPos);
//             if (parentPath == "") {
//                 parentPath = "/";
//             }

//             // test:
//             console.log("dirPath:", path);

//             let obj = dirList.get(parentPath);
//             if (!obj) {
//                 obj = new NavObj();
//                 obj.title = parentPath.substring(parentPath.lastIndexOf("/") + 1);
//                 obj.path = parentPath;
//                 obj.isDir = true;
//                 dirList.set(parentPath, obj);

//                 // in Eltern Element hinzufügen
//                 parent = getDirObj(parentPath);
//                 parent.children.push(obj);
//             }

//             // aktiv prüfen
//             if (fullPath.startsWith(parentPath)) {
//                 obj.active = true;
//             }
//             return obj;
//         } // getDirObj

//         // ListItem
//         function dataToNavList(data) {
//             if (!data) { return; }

//             // Pfad lesen
//             let path = data[pathIndex];
//             if (!path) {
//                 return "";
//             }

//             // Titel festlegen
//             let title = data[titleIndex];
//             let name = data[nameIndex];
//             if (!title) {
//                 title = name;
//             }

//             // Pfade
//             if (path.endsWith("/")) {
//                 path += name + ".html";
//             } else {
//                 path += "/" + name + ".html";
//             }

//             let dirObj = getDirObj(path);

//             if (name == "index") {
//                 dirObj.title = title;
//                 return;
//             }

//             let obj = new NavObj();
//             obj.path = path;
//             obj.title = title;

//             // auf aktiv prüfen
//             if (path == fullPath) {
//                 obj.active = true;
//             }

//             // In Directory einfügen
//             dirObj.children.push(obj);
//         } // dataToNavList


//         // wenn Index
//         if (self.sortIndex && self.sortIndex.length > 0) {
//             // Alle Daten nach Index durchgehen
//             self.sortIndex.forEach((value) => {
//                 const data = self.infoList.Data.get(value);
//                 dataToNavList(data);
//             });
//         } else {
//             // Alle Einträge in der map
//             self.infoList.Data.forEach((data, key) => {
//                 dataToNavList(data);
//             });
//         }

//         // HTML zusammenbauen
//         let navString = "<ul>";

//         // liste aller KindElemente prüfen
//         function setNavString(navObj) {
//             if (!navObj instanceof NavObj) { return; }

//             let navText = navObj.title;
//             let attr = "";
//             if (navObj.isDir) {
//                 if (navObj.active) {
//                     navText = "-&nbsp;" + navText;
//                     //attr = " style='background-color: rgb(255 255 255 /0.2);'";
//                 } else {
//                     navText = "+&nbsp;" + navText;
//                 }
//             } else {
//                 // kein Ordner
//                 if (navObj.active) {
//                     attr = " style='background-color: rgb(255 255 255 /0.2);'";
//                     //attr = " class='" + css_color_highlight + "'";
//                 }
//             }

//             let navLink = "<a href='" + navObj.path + "'>" + navText + "</a>";
//             navString += "<li" + attr + ">" + navLink;

//             // wenn Directory
//             if (navObj.active && navObj.isDir) {
//                 navString += "<ul>";
//                 navObj.children.forEach(setNavString);
//                 navString += "</ul>";
//             }

//             // Listen Element abschliessen
//             navString += "</li>"
//         } // setNavString

//         // test:
//         console.log("dirList:", dirList);

//         // Alle Kindelemente vom Basis Nav durchgehen
//         baseNav.children.forEach(setNavString);

//         // abschliessen
//         navString += "</ul>";

//         // navigation erzeugen
//         elm.insertAdjacentHTML("beforeend", navString);
//     } // showNav
// } // InfoNav



// //  Info Tabelle
// export function InfoTable(iList, col_list, col_titles) {
//     const self = InfoTable;

//     // Eigenschaften
//     self.infoList = iList;
//     self.cols = col_list;
//     self.colTitles = col_titles || [];
//     self.sortFields = [];
//     self.sortIndex = [];
//     self.elmID = "";
//     self.activeRowID = "";

//     // todo: Gruppierung
//     // todo: Filter
//     // todo: Formular


//     //  Setzt die InfoListe für die Tabelle
//     self.setInfoList = function (iList) {
//         self.infoList = iList;
//     }

//     // Setzt die Spalten
//     self.setCols = function (col_list, col_titles) {
//         self.cols = col_list;
//         if (col_titles) {
//             self.colTitles = col_titles;
//         }
//     }

//     // Sortierung
//     self.setSortIndex = function (sortIndex) {
//         self.sortIndex = sortIndex;
//     }

//     // todo: Gruppierungen

//     // todo: filter

//     // todo: Formular

//     // Tabellen Daten lesen
//     let getDataHTML = function () {
//         let tableDataString = "";
//         const fieldIndex = self.infoList.getFieldIndexes(self.cols);
//         const fieldTypes = self.infoList.Types;

//         // console.log("#getDataHTML");

//         // Daten in String
//         function dataToString(data, id) {
//             let dataString = "";

//             // Datenzeile
//             dataString = '<tr id="' + id + '">';

//             // Feldindex durchgehen
//             fieldIndex.forEach((index) => {
//                 let content = data[index];
//                 let attr = "";
//                 const type = fieldTypes[index];
//                 if (type == "int" || type == "num") {
//                     attr = " text-r"; // Leerzeichen davor
//                 } else if (type == "bool") {
//                     attr = " text-c"; // Leerzeichen davor
//                 } else if (type == "str") {
//                     content = content.replaceAll("\n", "</br>");
//                 }
//                 dataString += "<td" + attr + ">" + content + "</td>";
//             });

//             // Ende Datenzeile
//             dataString += "</tr>";

//             return dataString;
//         } // dataToString

//         // wenn Index
//         if (self.sortIndex && self.sortIndex.length > 0) {
//             // Alle Daten nach Index durchgehen
//             self.sortIndex.forEach((value) => {
//                 const data = self.infoList.Data.get(value);
//                 tableDataString += dataToString(data, value);
//             });
//         } else {
//             // Alle Einträge in der map
//             self.infoList.Data.forEach((data, key) => {
//                 tableDataString += dataToString(data, key);
//             });
//         }

//         // console.log("tableDataString");

//         return tableDataString;
//     } // getTableDataHTML

//     // Daten Anzeigen
//     self.showData = function (elm) {
//         // Prüfen
//         if (!elm && self.elmID != "") {
//             elm = document.body.querySelector(self.elmID);
//         }
//         if (elm instanceof HTMLTableElement) {
//             self.elmID = elm.id;
//         } else {
//             return;
//         }
//         if ((!self.infoList) instanceof InfoList) {
//             return;
//         }
//         if (!Array.isArray(self.cols)) {
//             return;
//         }

//         // console.log("showData:");

//         // Body Element
//         const tbodyElm = elm.querySelector("tbody");
//         if (!tbodyElm) {
//             tbodyElm = document.createElement("tbody");
//             elm.appendChild(tbodyElm);
//         }

//         // console.log("tbodyElm:", tbodyElm);

//         // HTML Daten von Liste erzeugen und anzeigen
//         const innerHTML = getDataHTML();
//         // console.log("innerHTML:", innerHTML);
//         tbodyElm.insertAdjacentHTML("beforeend", innerHTML);
//     } // schowData

//     // Aktive Zeile festlegen
//     let setActive = function (id) {
//         let newElm = document.body.getElementById(id);
//         let oldElm = document.body.getElementById(self.activeRowID);
//         if (oldElm) {
//             oldElm.classList.remove(css_color_highlight);
//         }
//         if (newElm) {
//             newElm.classList.add(css_color_highlight);
//             self.activeRowID = id;
//         }
//     } // setActive

//     // ====================
//     //   Events
//     // ---------

//     // Auf Taste prüfen
//     let checkKeys = function (e) {
//         console.log("keycode:", e.code);
//         switch (e.code) {
//             case "ArrowUp":
//                 e.preventDefault();
//                 e.stopImmediatePropagation();
//                 // Navigation prüfen
//                 checkKeyNav(self, "up");
//                 //e.preventDefault();
//                 break;
//             case "ArrowDown":
//                 e.preventDefault();
//                 e.stopImmediatePropagation();
//                 // Navigation prüfen
//                 checkKeyNav(self, "down");
//                 //e.preventDefault();
//                 break;
//             case "PageDown":
//                 e.preventDefault();
//                 e.stopImmediatePropagation();
//                 // Navigation prüfen
//                 checkKeyNav(self, "pageDown");
//                 break;
//             case "PageUp":
//                 e.preventDefault();
//                 e.stopImmediatePropagation();
//                 // Navigation prüfen
//                 checkKeyNav(self, "pageUp");
//                 break;
//             case "Home":
//                 e.preventDefault();
//                 e.stopImmediatePropagation();
//                 // Navigation prüfen
//                 checkKeyNav(self, "pos1");
//                 break;
//             case "End":
//                 e.preventDefault();
//                 e.stopImmediatePropagation();
//                 // Navigation prüfen
//                 checkKeyNav(self, "end");
//                 break;
//             case "ArrowRight":
//                 // some code here…
//                 break;
//             case "ArrowLeft":
//                 // some code here…
//                 break;
//             case "Enter":
//                 // some code here…
//                 break;
//             case "Insert":
//                 // some code here…
//                 break;
//             case "Delete":
//                 // some code here…
//                 break;
//         }
//     }

//     // auf click prüfen
//     let checkClick = function (e) {
//         if (!e) {
//             return;
//         }

//         let target = e.target;
//         if (target && target.tagName == "TD") {
//             // todo: Spalte und Zeile Merken

//             // todo: auf aktiv setzen
//         }

//     }

//     //   Event Handler
//     // -------------------------

//     // Events Registrieren
//     self.registerEvents = function (elm) {
//         window.addEventListener("keydown", checkKeys, false);
//         // window.addEventListener("keyup", this.#checkKeys, false);

//         // todo: click Event
//     }

//     // Events entfernen
//     self.unregisterEvents = function (elm) {
//         window.removeEventListener("keydown", checkKeys, false);
//         // window.removeEventListener("keyup", this.#checkKeys, false);

//         // todo: click Event
//     }
// } // InfoTable

// // aktuelles Datensatz Element holen
// function getActiveRow(infoTable) {
//     let currentElm;

//     // Wenn eine Aktive Row festgelegt
//     if (infoTable.activeRowID) {
//         currentElm = document.querySelector("#" + infoTable.activeRowID);
//     } else {
//         let tableElm = document.querySelector("#" + infoTable.elmID);
//         if (!tableElm) { return null; }
//         let tbody = tableElm.querySelector("tbody");
//         if (tbody) {
//             currentElm = tbody.querySelector("tr");
//             if (!currentElm) { return null; }
//         }
//     }
//     return currentElm;
// } // getActiveRow




// // Tastatur Navigation Prüfung
// function checkKeyNav(infoTable, direction) {
//     // console.log(infoTable);
//     if (!infoTable) { return; }

//     let currentElm = getActiveRow(infoTable);
//     if (!currentElm) { return; }

//     // nächstes Element
//     let nextElm;
//     let count = 10; // Anzahl der nächsten elemente -1
//     let elm = currentElm;

//     // console.log("currentElm2:", currentElm);
//     switch (direction) {
//         case "down":
//             // Next Element
//             nextElm = currentElm.nextElementSibling;
//             break;

//         case "up":
//             // Voriges Element
//             nextElm = currentElm.previousElementSibling;
//             break;

//         case "end":
//             // letztes Element
//             nextElm = currentElm.parentNode.lastElementChild;
//             break;

//         case "pos1":
//             // Voriges Element
//             nextElm = currentElm.parentNode.firstElementChild;
//             break;

//         case "pageDown":
//             while (elm && count) {
//                 nextElm = elm;
//                 elm = elm.nextElementSibling;
//                 count -= 1;
//             }
//             break;

//         case "pageUp":
//             while (elm && count) {
//                 nextElm = elm;
//                 elm = elm.previousElementSibling;
//                 count -= 1;
//             }
//             break;

//         default:
//             break;
//     }


//     if (direction == "down") {
//         // Next Element
//         nextElm = currentElm.nextElementSibling;
//     } else if (direction == "up") {
//         // Voriges Element
//         nextElm = currentElm.previousElementSibling;
//     } else if (direction == "pageDown") {
//         let count = 10; // Anzahl der nächsten elemente -1
//         let elm = currentElm;
//         while (elm && count) {
//             nextElm = elm;
//             elm = elm.nextElementSibling;
//             count -= 1;
//         }
//     } else if (direction == "pageUp") {
//         let count = 10; // Anzahl der nächsten elemente -1
//         let elm = currentElm;
//         while (elm && count) {
//             nextElm = elm;
//             elm = elm.previousElementSibling;
//             count -= 1;
//         }
//     }

//     // wenn neues Next Element
//     if (nextElm) {
//         currentElm.classList.remove(css_color_highlight);
//         nextElm.classList.add(css_color_highlight);
//         infoTable.activeRowID = nextElm.id;
//         nextElm.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });    // { behavior: "smooth", block: "end", inline: "nearest" }
//     }
// } // checkKeyNav

// // Funktion die alle Tabellen mit Daten füllt
// // tabelle muss ein "data-ilist" Attribut haben, welches den Pfad und Schrägstrich(/) getrennt den Namen der Liste angibt
// // z.B.: <table data-ilist="test/liste1">
// // für die Anzuzeigenden Spalten muss die Tabelle Spalten (th oder td) mit dem Attribut "data-col" haben, welches den Spaltennamen angibt
// // z.B.: <tr><th data-col="feld1">Test 1</th><th data-col="feld2">Test 2</th></tr>
// // im <tbody> der Tabelle, werden dann die Daten als HTML eingefügt.
// export function checkTables() {
//     // Alle Tabellen lesen
//     const tables = document.querySelectorAll("table[data-ilist]");

//     // alle Tabellen durchgehen
//     tables.forEach((tableElm) => {
//         // const tbodyElm = tableElm.querySelector("tbody");
//         const sortString = tableElm.getAttribute("data-sort");
//         // if (tbodyElm) {
//         //     tbodyElm.innerHTML = "";
//         // } else {
//         //     tbodyElm = tableElm;
//         // }

//         // Infolist Information lesen
//         const iListInfo = tableElm.dataset.ilist.split("/"); // iListInfo[0] = Path / iListInfo [1] = Name

//         // infoList erzeugen
//         const iList = new InfoList();
//         if (iListInfo.length == 1) {
//             iList.Name = iListInfo[0];
//         } else {
//             iList.Path = iListInfo[0];
//             iList.Name = iListInfo[1];
//         }

//         // Alle Kopfspalten
//         const fields = [];
//         const heads = tableElm.querySelectorAll("[data-col]");
//         heads.forEach((headElm) => {
//             // Feldnamen einfügen
//             fields.push(headElm.dataset.col);
//         }); // forEach Head Element

//         // InfoTabelle erstellen
//         const infoTable = new InfoTable(iList, fields);
//         tableElm.infoTable = infoTable;

//         // Infolist Daten holen
//         iList.fetch().then(() => {
//             // test:
//             // console.log("infoList:", iList);

//             // Sortierung
//             let sortIndex = null;
//             if (sortString) {
//                 sortIndex = iList.getSortIndex(sortString.split(","));
//             }
//             infoTable.setSortIndex(sortIndex);

//             // HTML Daten von Tabelle erzeugen und anzeigen
//             infoTable.showData(tableElm);
//             // const innerHTML = iList.getTableDataHTML(fields, sortIndex);
//             // tbodyElm.insertAdjacentHTML("beforeend", innerHTML);

//             // Events registrieren todo: eventuell Optional?
//             infoTable.registerEvents(tableElm);
//         });
//     }); // forEach Table Element
// } // checkTables


// // Funktion die alle NavigationsElemente mit Daten füllt
// // nav muss ein "data-ilist" Attribut haben, welches den Pfad und Schrägstrich(/) getrennt den Namen der Liste angibt
// // optional kann noch eine Sortierung nach den Feldern path,date,title,name angegeben werden
// // z.B.: <nav data-ilist="lidoc/sites" data-sort="path,date,title,name">
// export function checkNav() {
//     // Alle Tabellen lesen
//     const navs = document.querySelectorAll("nav[data-ilist]");

//     // alle gefunden NavigationsElemente durchgehen
//     navs.forEach((navElm) => {
//         // const tbodyElm = tableElm.querySelector("tbody");
//         const sortString = navElm.getAttribute("data-sort");

//         // Infolist Information lesen
//         const iListInfo = navElm.dataset.ilist.split("/"); // iListInfo[0] = Path / iListInfo [1] = Name

//         // infoList erzeugen
//         const iList = new InfoList();
//         if (iListInfo.length == 1) {
//             iList.Name = iListInfo[0];
//         } else {
//             iList.Path = iListInfo[0];
//             iList.Name = iListInfo[1];
//         }

//         // InfoTabelle erstellen
//         const infoNav = new InfoNav(iList);
//         navElm.infoNav = infoNav;

//         // Infolist Daten holen
//         iList.fetch().then(() => {
//             // test:
//             // console.log("infoList:", iList);

//             // Sortierung
//             let sortIndex = null;
//             if (sortString) {
//                 sortIndex = iList.getSortIndex(sortString.split(","));
//                 infoNav.setSortIndex(sortIndex);
//             } else {
//                 sortIndex = iList.getSortIndex("path", "date", "title", "name");
//                 infoNav.setSortIndex(sortIndex);
//             }


//             // HTML Daten von Navigation erzeugen und anzeigen
//             infoNav.showNav(navElm);
//         });
//     }); // forEach Nav Element
// } // checkNav
