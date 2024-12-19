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
            this.#idColNumber = this.#cols.indexOf(col);
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
                        this.#idColNumbers.push(this.#cols.indexOf(col[i] + ""));
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
     * @param {any[]} dataRow - Datenzeile Array
     * @returns {string|number} ID
     */
    getID(dataRow) {
        if (!Array.isArray(dataRow)) {return -1;}

        if (this.#idColNumber < 0) {
            let id = "";
            for (let i = 0; i < this.#idColNumbers.length; i++) {
                id += dataRow[this.#idColNumbers[i]] + "_";
            }
            return id;
        } else {
            return dataRow[this.#idColNumber];
        }
    }


    /**
     * Setzt oder löscht, für die Angegebene Spalte, den Link(Verknüpfung) zu einer anderen Liste
     * @param {string|number} col - Spaltenname oder Splaltennummer
     * @param {string|undefined|null} [listName] - Name der GridListe. Wenn nicht angegeben wird der Link(Verknüpfung) gelöscht.
     * @returns {void}
     */
    setColLink(col, listName) {
        if (typeof col == "string") {
            this.#links[this.#cols.indexOf(col)] = listName;
        } else if (typeof col == "number") {
            this.#links[col] = listName;
        }
    }


    /**
     * Liest den Listennamen der Verknüpften Liste vom angegebenen Feldindex aus
     * @param {string|number} col - Spaltennummer oder Spaltenname
     * @returns {string|undefined|null} Name der Liste. Kann mit lists.get(name) gelesen werden.
     */
    getColLink(col) {
        if (typeof col == "string") {
            return this.#links[this.#cols.indexOf(col)];
        } else if (typeof col == "number") {
            return this.#links[col];
        }
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
        if (!cols) {return;}
        let newFields = [];

        if (Array.isArray(cols)) {
            newFields = cols;
        } else if (typeof cols == "string" && seperator) {
            newFields = cols.split(seperator);
        }

        // bestehende Spalten löschen
        // todo: Eventuell mit bestehenden Spalten zusammenmergen ????
        this.#cols = new Array(newFields.length);
        this.#links = new Array(newFields.length);
        this.#types = new Array(newFields.length);

        // alle neuen Spalten durchgehen
        for (let i = 0; i < newFields.length; i++) {
            let name = newFields[i];
            let type = "string";

            // Wenn ein leerzeichen im Namen
            if (name.indexOf(" ") > -1) {
                // Type steht nach namen
                const nameType = name.split(" ");

                this.#cols[i] = nameType[0];
                
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

                // Standard Typ
                this.#types[i] = type;
            }
        }

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
     * @param {ColFormat} formatObj 
     */
    setColFormat(col, formatObj) {
        if (!formatObj) {formatObj = {};}
        
        if (typeof col == "string") {
            this.#formats[this.#cols.indexOf(col)] = formatObj;
        } else if (typeof col == "number") {
            this.#formats[col] = formatObj;
        }
    }

    /**
     * Liefert vom der angegebenen Spalte das Format Objekt zurück
     * @param {string|number} col - Splatenname oder SplantenNummer 
     * @returns {ColFormat|undefined} Format Objekt wenn vorhanden
     */
    getColFormat(col) {
        if (typeof col == "string") {
            return this.#formats[this.#cols.indexOf(col)]
        } else if (typeof col == "number") {
            return this.#formats[col];
        }
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
     * Liefert die Gridliste als Javascript Objekt zurück
     * @returns {GridObject & any} Gridliste als Javascript Objekt
     */
    getAsGridObject() {
        const newObj = {};

        // Standard Eigenschaften
        newObj.name = this.name;
        newObj.cols = this.#cols;
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
     * @param {any[]} dataRow - DatenZeile, die Spalten Reihenfolge und type muss der von der GridList entsprechen.
     */
    setRow(dataRow) {
        // todo: Prüfen auf Array und die richtigen Datentypen
        this.#data.set(this.getID(dataRow), dataRow);
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
    getObjFromRow(dataRow) {
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
        return this.getObjFromRow(this.#data.get(key) || []);
    } // getAsObject


    /**
     * Schreibt die Daten des angegebenen Objektes in die Gridliste.
     * Ist bereits ein Eintrag mit der selben ID vorhanden, so wird diese überschrieben.
     * @param {object} obj - Daten Objekt
     * @returns {string|number|undefined} ID des eingefügten Objektes
     */
    setObject(obj) {
        if (!obj || typeof obj != "object") { return; }

        const dataRow = new Array(this.#cols.length);

        const objKeys = [...Object.keys(obj)];
        for (let i = 0; i < objKeys.length; i++) {
            const objKey = objKeys[i];
            const index = this.#cols.indexOf(objKey);
            if (index > -1) {
                let value = obj[objKey];
                
                // Bei Objekt oder Liste, in andere Liste Einfügen
                if (typeof value == "object") {
                    // Wenn Link
                    if (typeof this.#links[index] == "string") {
                        // FremdListe lesen
                        let foreignList = lists.get(this.#links[index]);

                        if (this.#types[index] == "object") {
                            // Wenn Liste noch nicht Existiert
                            if (foreignList == undefined) {
                                foreignList = new GridList(this.#links[index]);

                                // ID ist id oder GSID 
                                foreignList.setColsFromObject(value, value.id ? "id" : "GSID");
                            }

                            // Objekt in Subliste einfügen und Value neu setzen
                            value = foreignList.setObject(value);
                        } else if (this.#types[index] == "list" && Array.isArray(value)) {
                            // Wenn Liste noch nicht Existiert
                            if (foreignList == undefined) {
                                foreignList = new GridList(this.#links[index]);

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
        this.#data.set(id, dataRow);
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
            return this.#cols.indexOf(col);
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
            let colName = colNameList[i];
            if (typeof colName == "string") {
                if (colName.indexOf(" ") >= 0) {
                    colName = colName.split(" ")[0];
                }
                indexes.push(this.#cols.indexOf(colName));
            } else if (typeof colName == "number") {
                indexes.push(colName);
            }
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
            dataRow = new Array(this.#cols.length);
            
            // ID in neue Datenzeile setzen
            if (this.#idColNumber > -1) {
                dataRow[this.#idColNumber] = row;
            } else if (typeof row == "string") {
                const ids = row.split("_");
                for (let i = 0; i < this.#idColNumbers.length; i++){
                    dataRow[this.#idColNumbers[i]] = ids[i];
                }
            }

            // Neu anlegen
            this.#data.set(row, dataRow);
        }

        const index = this.getColNumber(col);
        if (index > -1) {
            const colType = this.#types[index];

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
     * @param {(string|number)[]} [idList] - optionale Liste mit Datensatz ID's
     * @returns {Array[]}
     */
    getRows(idList) {
        if (Array.isArray(idList)) {
            /** @type {Array[]} */
            const newList = [];
            
            // alle Keys durchgehen
            for (let i = 0; i < idList.length; i++) {
                newList.push(this.#data.get(idList[i]) || []);
            }
            return newList;
        } else {
            return  [...this.#data.values()];
        }
    }

    /**
     * Liefert eine Liste von Datenzeilen, die dem angegeben Index entsprechen, zurück
     * @param {string} index - Index Name
     * @returns {Array[]} Liste mit indizierten Datenzeilen
     */
    getIndexRows(index) {
        return this.#index.get(index || "") || [...this.#data.values()];
    }


    /**
     * Merkt sich alle Datenzeilen, oder die Datenzeilen vom "oldIndex", unter angegebenen Index(newIndex)
     * @param {string} newIndex - Index Name unter dem die Datenzeilen angelegt werden
     * @param {string} [oldIndex] - optional Index Name von dem die Daten gelesen werden
     * @returns {void}
     */
    setIndex(newIndex, oldIndex) {
        if (typeof newIndex != "string") {return;}
        if (typeof oldIndex == "string") {
            this.#index.set(newIndex, this.#index.get(oldIndex) || []);
        } else {
            this.#index.set(newIndex, [...this.#data.values()]);
        }
    }


    /**
     * Sortiert die Daten nach angegebenen Spalten. Groß-Kleinschreibung bei Texten wird ignoriert.
     * Wenn "index" angegeben, und der Index vorhanden ist, werden die Daten unter diesem Index sortiert, und unter dem selben Index abgelegt.
     * Wenn "index" angegeben, und noch nicht angelegt, werden alle Daten sortiert und unter dem Index abgelegt.
     * @param {(string|number)[]} sortCols - Liste mit Spalten nach denen Sortiert wird
     * @param {string} [index] - Index der zum sortieren verwendet wird, oder wenn nicht vorhanden, gesetzt wird.
     * @returns {Array[]} sortierte Zeilen
     * @example
     * const sortList = dataList.sortRows(["name", "hausnummer DESC"], "sortListe");
     */
    sortRows(sortCols, index) {
        // Alle Datenzeile in einer liste
        const rowList = this.#index.get(index || "") || [...this.#data.values()];
  
        // wenn keine SortierungsSpalten angegeben
        if (!Array.isArray(sortCols)) {
            if (index) { this.#index.set(index, rowList);}
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
                    if (typeof a[colIndex[i]] == "string") {
                        if (a[colIndex[i]].toLowerCase() > b[colIndex[i]].toLowerCase()) { return -1; }
                        if (a[colIndex[i]].toLowerCase() < b[colIndex[i]].toLowerCase()) { return 1; }
                    } else {
                        if (a[colIndex[i]] > b[colIndex[i]]) { return -1; }
                        if (a[colIndex[i]] < b[colIndex[i]]) { return 1; }
                    }
                } else {
                    // Aufsteigend
                    if (typeof a[colIndex[i]] == "string") {
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

        if (index) { this.#index.set(index, rowList);}
        return rowList;
    } // getSortRows


    /**
     * Gibt eine gefilterte Liste mit Datensätzen zurück.  
     * Wenn index Angegeben werden die Daten zum Filtern vom bestehenden Index genommen.
     * Wenn newIndex angegeben, wird die gefilterte Liste unter dem "newIndex" abgelegt.
     * @param {Function} fu - Filterfunktion muss "true" oder "false" zurückgeben. Wenn "true" wird der Datensatz in die gefilterte Liste aufgenommen. 
     * @param {string} [index] - optionaler Index, wenn Daten von einem bestehenden Index genommen werden. 
     * @param {string} [newIndex] - Index unter dem die gefilterte Liste abgelegt wird.
     * @returns {Array[]} Gefilterte Liste
     */
    filter(fu, index, newIndex) {

        // Daten zum Filtern
        const rowList = this.#index.get(index || "") || [...this.#data.values()];
        if (typeof fu != "function") {return rowList;}

        const newList = [];

        // alle durchgehen
        for (let i = 0; i < rowList.length; i++) {
            const obj = this.getObjFromRow(rowList[i]);
            
            if (fu(obj)) {
                newList.push(rowList[i]);
            }
        }

        if (newIndex) {
            this.#index.set(newIndex, newList);
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
     * @param {string} [index] - optionaler Index, wenn Daten von einem bestehenden Index genommen werden. 
     * @param {string} [newIndex] - Index unter dem die gefilterte Liste abgelegt wird.
     * @returns {Array[]} Gefilterte Liste
     */
    filterGroup(colList, fu, index, newIndex) {

        // Daten zum Filtern
        const rowList = this.#index.get(index || "") || [...this.#data.values()];
        if (typeof fu != "function") {return rowList;}

        const newList = [];
        const groupCols = this.getColNumbers(colList);
        const groupValues = new Array(groupCols.length);
        let groupList = [];
        
        // alle durchgehen
        for (let i = 0; i < rowList.length; i++) {
            let istNewGroup = false;
            
            // auf neue Gruppe prüfen
            for (let j = 0; j < groupCols.length; j++) {
                const value = rowList[i][groupCols[j]];
                if (value != groupValues[j] ) {
                    istNewGroup = true;
                    groupValues[j] = value;
                }
            }

            // wenn neue gruppe
            if (istNewGroup) {
                // wenn FilterFunktion == true
                if (i > 0 && fu(groupList)) {
                    for (let k = 0; k < groupList.length; k++) {
                        newList.push(groupList[k]);
                    }
                }

                // Gruppe zurücksetzen
                groupList = [];
                istNewGroup = false;
            }
            
            // Datensatz in Gruppe
            groupList.push(rowList[i])
        } // for jeder Datensatz
        
        // Letze Gruppe
        if (fu(groupList)) {
            for (let k = 0; k < groupList.length; k++) {
                newList.push(groupList[k]);
            }
        }


        if (newIndex) {
            this.#index.set(newIndex, newList);
        }
        return newList;
    } 



    /**
     * Führt die angegebene Funktion für jeden Datensatz, oder jeden Datensatz im angegebenen index, aus.  
     * Als Parameter wird die Datenzeile als Objekt übergeben. 
     * @param {Function} fu - Funktion die pro Datensatz ausgeführt wird
     * @param {string} [index] - optionaler Index der als Datenquelle verwendet wird
     * @returns {void}
     * @example
     * const namensListe = [];
     * adresslistList.forEach((objekt) => {namensListe.push(objekt.vorname + " " + objekt.nachname);});
     * console.log(namensListe);
     */
    forEach(fu, index) {
        // Daten zum Filtern
        const rowList = this.#index.get(index || "") || [...this.#data.values()];
        if (typeof fu != "function") {return;}

        // alle durchgehen
        for (let i = 0; i < rowList.length; i++) {
            const obj = this.getObjFromRow(rowList[i]);
            // Funktion ausführen
            if (fu(obj)) {break;};
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

//  GridTableRows
export class GridTableRows {
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
            if(typeof col == "string") {
                const pos1 = col.indexOf(" ");
                if (pos1 > -1) {
                    const name = col.substring(0,pos1);
                    const tag = col.substring(pos1 +1);
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
     * @param {Object} row - Datenzeile Objekt
     * @returns {string} HTML String der Datenzeile
     */
    getRowHtml(row) {
        const rowID = this.getRowID(row);
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
        this.#gridList.forEach((/** @type {Object} */row) => {
            html += this.getRowHtml(row);
        }, index);

        // html zurückgeben
        return html;
    }

    
    /**
     * GridTableBody
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
    return template.replace(regex, function(match, capture) {
      return obj[capture] || "";
    });
}
