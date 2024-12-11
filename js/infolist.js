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
 * @property {string|string[]} idField
 * @property {number|number[]} [idIndex]
 * @property {string[]} fields
 * @property {InfoTypes[]} types
 * @property {(string|undefined|null)[]} links
 * @property {InfoFormat[]} [formats]
 * @property {any[]} [data]
 */

/**
 * @typedef {object} InfoList2
 * @property {string} [name]
 * @property {string[]} fields
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

    /** @type {string|string[]} */
    _idField = "";

    /** @type {number|number[]} */
    _idIndex = 0;

    /** @type {string[]} */
    _fields = [];

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
     * @param {string|string[]} idField - ID Feldname oder Liste mit Feldnamen die eine eindeutige ID ergeben
     * @returns {void}
     */
    setIdField(idField) {
        if (!idField) {return;}

        this._idField = idField;

        // idIndex
        if (Array.isArray(this._idField)) {
            // Liste von Feldern ergeben ID
            this._idIndex = [];
            for (let i = 0; i < this._idField.length; i++) {
                this._idIndex.push(this._fields.indexOf(this._idField[i]));
            }
        } else {
            // ID-Index setzen
            this._idIndex = this._fields.indexOf(this._idField);
        }
    }
    /**
     * @param {string | string[]} fieldName
     */
    set idField(fieldName) {
        this.setIdField(fieldName);
    }
    get idField() {
        return this._idField;
    }


    /**
     * Index (Spalte) des ID Feldes
     */
    get idIndex() {
        return this._idIndex;
    }


    /**
     * Holt aus einer Datenzeile die ID laut gespeicherten idIndex
     * @param {any[]} dataRow - Datenzeile Array
     * @returns {string|number} ID
     */
    getID(dataRow) {
        if (!Array.isArray(dataRow)) {return -1;}

        if (Array.isArray(this._idIndex)) {
            let id = "";
            for (let i = 0; i < this._idIndex.length; i++) {
                id += dataRow[this._idIndex[i]] + "_";
            }
            return id;
        } else {
            return dataRow[this._idIndex];
        }
    }


    /**
     * Setzt oder löscht, für den angegebenen FeldIndex, den Link(Verknüpfung) zu einer anderen Liste
     * @param {number} fieldIndex - Index vom Feld(Spalte)
     * @param {string|undefined|null} [listName] - Name der InfoListe. Wenn nicht angegeben wird der Link(Verknüpfung) gelöscht.
     * @returns {void}
     */
    setFieldIndexLink(fieldIndex, listName) {
        if (!fieldIndex || typeof fieldIndex != "number") {return;}
        if (fieldIndex > -1) {
            this._links[fieldIndex] = listName;
        }
    }


    /**
     * Setzt oder löscht, für den angegebenen Feldnamen, den Link(Verknüpfung) zu einer anderen Liste
     * @param {string} fieldName - Index vom Feld(Spalte)
     * @param {string|undefined|null} [listName] - Name der InfoListe. Wenn nicht angegeben wird der Link(Verknüpfung) gelöscht.
     * @returns {void}
     */
    setFieldLink(fieldName, listName) {
        if (!fieldName || typeof fieldName != "string") {return;}
        this.setFieldIndexLink(this._fields.indexOf(fieldName), listName);
    }


    /**
     * Liest den Listennamen der Verknüpften Liste vom angegebenen Feldindex aus
     * @param {number} fieldIndex - Index des Feldes(Spalte)
     * @returns {string|undefined|null} Name der Liste. Kann mit lists.get(name) gelesen werden.
     */
    getFieldIndexLink(fieldIndex) {
        if (typeof fieldIndex == "number" && fieldIndex > -1) {
            return this._links[fieldIndex];
        }
    }
    

    /**
     * Liest den Listennamen der Verknüpften Liste vom angegebenen Feldname aus
     * @param {string} fieldName - Index des Feldes(Spalte)
     * @returns {string|undefined|null} Name der Liste. Kann mit lists.get(name) gelesen werden.
     */
    getFieldLink(fieldName) {
        if (typeof fieldName == "string") {
            return this.getFieldIndexLink(this._fields.indexOf(fieldName));
        }
    }


    /**
     * Setzt die Feldnamen der InfoListe  
     * Der Typ des neuen Feldes wird auf "string" gesetzt, außer es wird nach dem Feldnamen mit einem Leerzeichen getrennt, der Typ angegeben.  
     * Der Typ darf nur einen der folgenden Texte enthalten:  
     * "string" | "number" | "boolean" | "object" | "list"  
     * !!!ACHTUNG!!! es werden dabei alle bestehenden Daten gelöscht.
     * @param {string|string[]} fieldList - Liste Mit Feldnamen, oder String mit Trennzeichen getrennt
     * @param {string|string[]} idField - Feldname des ID Feldes, oder Liste von Feldnamen, die eine eindeutige Kennung ergeben.
     * @param {string} [seperator] - Trennzeichen muss angegeben werden wenn fieldList ein String mit Trennzeichen ist
     * @returns {void}
     */
    setFields(fieldList, idField, seperator) {
        if (!fieldList) {return;}
        let newFields = [];

        if (Array.isArray(fieldList)) {
            newFields = fieldList;
        } else if (typeof fieldList == "string" && seperator) {
            newFields = fieldList.split(seperator);
        }

        // bestehende Felder löschen
        // todo: Eventuell mit bestehenden Feldern zusammenmergen ????
        this._fields = new Array(newFields.length);
        this._links = new Array(newFields.length);
        this._types = new Array(newFields.length);

        // alle neuen felder durchgehen
        for (let i = 0; i < newFields.length; i++) {
            let name = newFields[i];
            let type = "string";

            // Wenn ein leerzeichen im Namen
            if (name.indexOf(" ") > -1) {
                // Type steht nach namen
                const nameType = name.split(" ");

                this._fields[i] = nameType[0];
                
                if (nameType[2]) {
                    this._links[i] = nameType[2];
                }

                // auf richtige Typen prüfen
                if ("|string|number|boolean|object|list|".indexOf(nameType[1]) > -1) {
                    this._types[i] = nameType[1];

                    //  Wenn keine verknüpfte Liste
                    if ((nameType[1] == "object" || nameType[1] == "list") && !nameType[2]) {
                        // Liste Name wird vom FeldNamen(SpaltenNamen) angenommen
                        this._links[i] = nameType[0];
                    }
                } else {
                    // wenn kein Typ angegeben dann immer "string"
                    this._types[i] = "string";
                }
            } else {
                this._fields[i] = name;

                // Standard Typ
                this._types[i] = type;
            }
        }

        // ID Feld setzen
        this.setIdField(idField);

        // Daten passen dann nicht mehr zu Feldern und werden gelöscht
        this._data = new Map();
    } // setFields


    /**
     * Setzt die Felder(Spalten) der Liste anhand eines Javascript Objektes.  
     * Die Feldtypen werden von den Werten in den Eigenschaften bestimmt.  
     * Ist der Wert nicht ermittelbar, wird "string" angenommen.  
     * Ist der Wert ein "object" oder "array", so wird der ListenName(Verlinkung) gleich dem Eigenschaftsnamen angenommen.  
     * @param {object} obj - Objekt dessen Eigenschaften als Feldnamen registriert werden
     * @param {string} idField - Name der Eigenschaft die als Eindeutige ID genommen wird
     * @returns {void}
     */
    setFieldsFromObject(obj, idField) {
        if (typeof obj != "object") {return;}
        if (Array.isArray(obj)) {return;}

        // Eigenschaft Namen vom Objekt lesen
        const keyList = Object.keys(obj);

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


        // Felder setzen
        this.setFields(keyList, idField);
    }


    /**
     * Setzt für den Angegebenen Feldindex, die Format einstellungen
     * @param {number} fieldIndex 
     * @param {InfoFormat} formatObj 
     */
    setFieldIndexFormat(fieldIndex, formatObj) {
        if (!fieldIndex || typeof fieldIndex != "number" || fieldIndex < 0) {return;}
        if (!formatObj) {formatObj = {};}

        // Format für Spalte ablegen
        this._formats[fieldIndex] = formatObj;
    }

    /**
     * Liefert vom angegebenen Feldindex das Format Objekt zurück
     * @param {number} fieldIndex - Feld Index
     * @returns {InfoFormat|undefined} Format Objekt wenn vorhanden
     */
    getFieldIndexFormat(fieldIndex) {
        if (typeof fieldIndex == "number" && fieldIndex > -1) {
            return this._formats[fieldIndex];
        }
    }


    /**
     * Setzt für den Angegebenen Feldnamen, die Format einstellungen
     * @param {string} fieldName 
     * @param {InfoFormat} formatObj 
     */
    setFieldFormat(fieldName, formatObj) {
        if (!fieldName || typeof fieldName != "string") {return;}
        if (!formatObj) {formatObj = {};}

        // an der Richtigen Spalte das Format Objekt ablegen
        this.setFieldIndexFormat(this._fields.indexOf(fieldName), formatObj);
    }


    /**
     * 
     * @param {string} fieldName - Feldname
     * @returns {InfoFormat|undefined} Format Objekt wenn vorhanden
     */
    getFieldFormat(fieldName) {
        if (typeof fieldName == "string") {
            return this.getFieldIndexFormat(this._fields.indexOf(fieldName));
        }
    }


    /**
     * Ersetzt alle Daten mit einem neuen InfoObject
     * @param {InfoObject & [any]} newData 
     * @returns {boolean} true wenn die daten übernommen wurden
     */
    setData(newData) {
        try {
            if (!newData) { return false; }
            if (!newData.fields || !newData.types) { return false; }

            // Standard Eigenschaften
            this.name = newData.name;
            this._fields = newData.fields;
            this._types = newData.types;
            this._links = newData.links;
            this._formats = newData.formats || [];

            // idIndex
            this.setIdField(newData.idField)

            // Daten in Map
            this._data = new Map();
            if (newData.data) {
                const dataLength = newData.data.length;
                for (let i = 0; i < dataLength; i++) {
                    this._data.set(this.getID(newData.data[i]), newData.data[i]);
                    // todo: indexes ????
                }
            }

            // alle anderen Eigensaften
            this.prop = new Map();
            const objKeys = Object.keys(newData);
            for (let i = 0; i < objKeys.length; i++) {
                const key = objKeys[i];

                // Klassen Parameter ignorieren
                if (" name idField idIndex fields types links formats data ".indexOf(key) > -1) { continue; }

                this.prop.set(key, newData[key]);
            }
        } catch (err) {
            console.error(err);
            return false;
        }

        return true;
    } // setData()


    /**
     * Liefert die Infoliste als Javascript Objekt zurück
     * @returns {InfoObject & any} Infoliste als Javascript Objekt
     */
    getAsData() {
        const newData = {};

        // Standard Eigenschaften
        newData.name = this.name;
        newData.fields = this._fields;
        newData.types = this._types;
        newData.links = this._links;
        newData.formats = this._formats || [];

        newData.idField = this.idField;

        // Daten aus Map
        const keyList = this._data.keys();
        const dataLength = this._data.size;
        newData.data = new Array(dataLength);

        for (let i = 0; i < dataLength; i++) {
            newData.data[i] = this._data.get(keyList[i]);
        }

        // alle anderen Eigensaften
        const propKeys = this.prop.keys();
        for (let i = 0; i < this.prop.size; i++) {
            newData[propKeys[i]] = this.prop.get(propKeys[i]);
        }

        return newData;
    } // getAsData()


    /**
     * Diese Funktion liefert ein Array/Slice für einen Datensatz zurück
     * die Feldnamen und die Reihenfolge der Daten bestimmt die "Fields" Eigenschaft von der InfoList
     * @param {string|number} key - ID Des Datensatzes 
     * @returns {any[]|undefined}
     */
    getDataRow(key) {
        return this._data.get(key);
    }


    /**
     * Setzt einen Datensatz(any[]) mit der id in der Liste.
     * Wenn vorhanden wird der Datensatz komplett überschrieben.
     * @param {any[]} dataRow - Datenliste, die Feld Reihenfolge und type muss der von der InfoList entsprechen.
     */
    setDataRow(dataRow) {
        // todo: Prüfen auf Array und die richtigen Datentypen
        this._data.set(this.getID(dataRow), dataRow);
    }


    /**
     * Löscht einen Datensatz aus der Liste
     * @param {string|number} key - ID des Datensatzes
     * @returns {boolean} true wenn der Datensatz gelöst wurde
     */
    deleteDataRow(key) {
        return this._data.delete(key);
    }


    /**
     * Diese Funktion liefert den Datensatz als neues Objekt zurück.
     * Wenn kein Datensatz gefunden, wird ein neues leeres Objekt zurück geliefert.
     * @param {string|number} key 
     * @returns {object}
     */
    getObject(key) {
        const obj = {};
        const dataRow = this._data.get(key);
        if (!dataRow) { return obj; }

        // Alle Felder durchgehen
        for (let i = 0; i < this._fields.length; i++) {
            obj[this._fields[i]] = dataRow[i];
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

        const dataRow = new Array(this._fields.length);

        const objKeys = Object.keys(obj);
        for (let i = 0; i < objKeys.length; i++) {
            const objKey = objKeys[i];
            const index = this._fields.indexOf(objKey);
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
                                foreignList.setFieldsFromObject(value, value.id ? "id" : "GSID");
                            }

                            // Objekt in Subliste einfügen und Value neu setzen
                            value = foreignList.setObject(value);
                        } else if (this._types[index] == "list" && Array.isArray(value)) {
                            // Wenn Liste noch nicht Existiert
                            if (foreignList == undefined) {
                                foreignList = new InfoList(this._links[index]);

                                // ID ist id oder GSID 
                                foreignList.setFieldsFromObject(value[0], value[0].id ? "id" : "GSID");
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
     * Liefert auf Grund des angegebenen Feldnamen(field)
     * die Position/Index der Spalte in der InfoList zurück
     * @param {string} field - Name des gesuchten Feldes
     * @returns {number} - Index Position des gesuchten Feldes. -1 wenn nicht gefunden.
     */
    getFieldIndex(field) {
        return this._fields.indexOf(field);
    }


    /**
     * Liefert eine Liste an Positionen/Indexes der angegebenen Spaltennamen(fieldList) zurück.
     * Für Feldnamen die nicht in der InfoListe gefunden werden, wird -1 als Position zurück gegeben.
     * @param {string[]} fieldList - Liste mit Feldnamen
     * @returns {number[]} - Liste mit Index-Positionen der gesuchten Felder. -1 wenn das Feld nicht in der Infoliste gefunden wurde.
     */
    getFieldIndexList(fieldList) {
        if (!fieldList || !Array.isArray(fieldList)) {
            return [];
        }

        const fieldListLength = fieldList.length;
        const indexes = new Array(fieldListLength);

        for (let i = 0; i < fieldListLength; i++) {
            let field = fieldList[i];
            if (field.indexOf(" ") >= 0) {
                field = field.split(" ")[0];
            }
            indexes[i] = this._fields.indexOf(field);
        };

        return indexes;
    }


    /**
     * Liest den Wert einer Spalte(field) vom angegebenen Datensatz(id) aus.
     * @param {string|number} key - ID des Datensatzes
     * @param {string} field - Feldname von dem der Wert gelesen wird
     * @returns {any|undefined} Wert vom angegebenen Datensatz-Feld 
     */
    getValue(key, field) {
        if (!key) { return undefined; }
        if (!field) { return undefined; }

        const index = this._fields.indexOf(field);
        if (index > -1) {
            const dataRow = this._data.get(key);
            if (dataRow) {
                return dataRow[index];
            }
            return undefined;
        } else {
            return undefined;
        }
    }


    /**
     * Setzt den Wert(value) einer Spalte(field) im Datensatz(id)
     * @param {string|number} key - ID des Datensatzes
     * @param {string} field - Feldname
     * @param {any} value - Wert der für das angegebene Feld gesetzt wird
     * @returns {void}
     */
    setValue(key, field, value) {
        if (key == undefined || !field) { return; }

        let dataRow = this._data.get(key);
        if (!dataRow) {
            dataRow = new Array(this._fields.length);
            this._data.set(key, dataRow);
        }

        const index = this._fields.indexOf(field);

        if (index > -1) {
            const fieldType = this._types[index];

            // Wert setzen
            switch (fieldType) {
                case "str":
                    dataRow[index] = "" + value;
                    break;

                default:
                    dataRow[index] = value;
            }
        }
    } // setValue


    /**
     * Gibt ein Array an Werten für die Spalten(fieldList) eines Datensatzes(id) zurück.
     * @param {string|number} key - ID des Datensatzes
     * @param {string[]} fieldList - List mit Feldnamen
     * @returns {any[]} Liste mit Werten der angegebenen Feldnamen
     */
    getFieldValueList(key, fieldList) {
        if (key == undefined) { return []; }
        if (!fieldList || !Array.isArray(fieldList)) {
            return [];
        }

        const dataRow = this._data.get(key);
        if (!dataRow) { return []; }

        const fieldListLength = fieldList.length;
        const valueList = new Array(fieldListLength);

        for (let i = 0; i < fieldListLength; i++) {
            let field = fieldList[i];
            if (field.indexOf(" ") >= 0) {
                field = field.split(" ")[0];
            }
            const index = this._fields.indexOf(field);
            valueList[i] = dataRow[index];
        };

        return valueList;
    }


    /**
     * 
     * @param {string|number} key - ID des Datensatzes
     * @param {number[]} fieldIndexList - Feldindex Nummer Liste
     * @returns {any[]} Liste mit Werten der angegebenen Feldnamen
     */
    getFieldIndexValueList(key, fieldIndexList) {
        if (key == undefined) { return []; }
        if (!fieldIndexList || !Array.isArray(fieldIndexList)) {
            return [];
        }

        const dataRow = this._data.get(key);
        if (!dataRow) { return []; }

        const fieldIndexListLength = fieldIndexList.length;
        const valueList = new Array(fieldIndexListLength);

        for (let i = 0; i < fieldIndexListLength; i++) {
            const index = fieldIndexList[i];
            valueList[i] = dataRow[index];
        };

        return valueList;
    }


    /**
     * Gibt eine Liste aller Keys zurück
     * @returns {(string|number)[]} Liste aller Keys
     */
    getKeyList() {
        // Alle Keys von der map
        const dataKeys = this._data.keys();
        const keysLength = this._data.size;

        const indexList = new Array(keysLength);
        for (let i = 0; i < keysLength; i++) {
            indexList[i] = dataKeys[i];
        }
        return indexList;
    }
    /**
     * gibt eine Liste aller Keys zurück
     * @alias getKeyList
     * @returns {(string|number)[]} Liste aller Keys
     */
    keys() {
        return this.getKeyList();
    }


    /**
     * Gibt eine Liste mit Keys zurück die nach angegebenen Feldern sortiert sind.
     * @param {string[]} sortFields - Liste mit Feldern nach denen sortiert wird
     * @returns {(string|number)[]} sortierte Indexliste
     * @example
     * const sortList = dataList.getSortKeyList(["name", "hausnummer"]);
     */
    getSortKeyList(sortFields) {
        // Alle Keys von der map
        const dataKeys = this._data.keys();
        const keysLength = this._data.size;

        const keyList = new Array(keysLength);
        for (let i = 0; i < keysLength; i++) {
            keyList[i] = dataKeys[i];
        }

        // wenn keine Sortierungsfelder angegeben
        if (!Array.isArray(sortFields)) {
            return keyList;
        }

        // Feld Indexes lesen und Sortier Reihenfolge
        const fieldLength = sortFields.length;
        const fieldIndex = new Array(fieldLength);
        const orderIndex = new Array(fieldLength);

        for (let i = 0; i < fieldLength; i++) {
            let field = sortFields[i];
            let direction = 1; // 1 = Aufsteigend sortieren / -1 = Absteigend sortieren
            if (field.indexOf(" ") >= 0) {
                const fieldData = field.split(" ");
                field = fieldData[0];
                if (fieldData[1].trim().toUpperCase() == "DESC") {
                    direction = -1;
                }
            }
            fieldIndex[i] = this._fields.indexOf(field);
            orderIndex[i] = direction;
        }


        // Sortieren
        keyList.sort((a, b) => {
            const dataA = this._data.get(a) || "";
            const dataB = this._data.get(b) || "";

            // Prüfen
            for (let i = 0; i < fieldLength; i++) {
                // absteigend
                if (orderIndex[i] < 0) {
                    if (dataA[fieldIndex[i]] > dataB[fieldIndex[i]]) { return -1; }
                    if (dataA[fieldIndex[i]] < dataB[fieldIndex[i]]) { return 1; }
                } else {
                    // Aufsteigend
                    if (dataA[fieldIndex[i]] > dataB[fieldIndex[i]]) { return 1; }
                    if (dataA[fieldIndex[i]] < dataB[fieldIndex[i]]) { return -1; }
                }
            } // alle Felder vergleichen

            // alle gleich
            return 0;
        });

        return keyList;
    } // getSortKeyList


    /**
     * Geht alle Datensätze, oder die in der Angegeben Keylist, durch 
     * und führt für jeden Datensatz die angegebene Funktion aus.
     * @param {FilterFunc} func - Callback Funktion die bei jedem Datensatz aufgerufen wird
     * @param {(string|number)[]} [keyList] - Liste mit Datensatz Keys
     */
    forEach(func, keyList) {
        if (typeof func != "function") {return;}
        
        // Wenn ein Key Index angegeben
        if (keyList && Array.isArray(keyList)) {
            const keysLength = keyList.length;

            for (let i = 0; i < keysLength; i++) {
                // Funktion ausführen
                func(this.getObject(keyList[i]), keyList[i], this);
            }
        } else {
            const dataKeys = this._data.keys();
            let dataKesyLength = this._data.size;

            for (let i = 0; i < dataKesyLength; i++) {
                // Funktion ausführen
                func(this.getObject(dataKeys[i]), dataKeys[i], this);
            }
        }
    }


    /**
     * 
     * @param {FilterFieldFunc} func - Callback Funktion für jedes Feld 
     * @param {string[]} [fieldList] - Optional Liste mit Feldnamen 
     * @returns {void}
     */
    forEachField(func, fieldList) {
        if (typeof func != "function") {return;}
        
        let fields = this._fields;
        if (fieldList && Array.isArray(fieldList)) {fields = fieldList;}
        
        const fieldsLength = fields.length;

        for (let i = 0; i < fieldsLength; i++) {
            // Funktion ausführen
            func(fields[i], i, this);
        }
    }



    // Infoliste in einen String umwandeln
    /**
     * liefert die InfoListe als JSON String zurück
     * @returns {string} Infoliste als JSON String
     */
    stringify() {
        // in JSON String umwandeln
        return JSON.stringify(this.getAsData());
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
        return this.setData(JSON.parse(listString));
    } // parse




    /**
     * Konstruktor mit InfoList Objekt oder JSON-String
     * @param {string} name - Javascript Objekt oder JSON-String
     * @param {string[]} [fieldList] - Optionale Liste mit Feldnamen
     * @param {string} [idField] - Name des ID Feldes. Muss angegeben werden wenn fieldList angegeben.
     */
    constructor(name, fieldList, idField) {
        this.name = name;
        if (fieldList) {
            this.setFields(fieldList, idField || fieldList[0]);
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
