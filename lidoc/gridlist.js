// ==================
//   Info Liste
// ==================
// @ts-check

// todo: Umbauen so das Verknüpfte Tabellen(link) auch Daten abgerufen/ Gruppiert (max, min, sum, ..) werden können

// ===============================
//   Imports
// --------------

import { formatDate } from "./infodate.js";


// ===============================
//   Typen
// --------------

// [date|special(30){>0;10}/regex/=default]

// colname = ColFormatID - es kann das selbe Format bei mehreren Spalten angewendet werden - Listen Übergreifend
// colName = Caption/Label - Anzeige Überschrift/Titel für die Spalte
// colname = ArributeID - es kann das Selbe Attribute bei mehreren Spalten angewendet werden - Listen Übergreifend

/**
 * @typedef {object} DataFormat
 * @property {string} [name] - Name der Spalte
 * @property {string} [type] - Typ der Spalte
 * @property {string} [domain] - Name eines Speziellen abgeleiteten Types 
 * @property {boolean} [required] - Wenn der Wert erforderlich ist
 * @property {string} [inlist] - Name einer Aufzählung. Muss Inhalt von angegebener Aufzählung sein
 * @property {"date"|"datetime"|"time"|"period"|null} [date] - "null" oder "undefined" wenn nicht vorhanden. Wenn type "number" dann ist es ein UNIX timestamp in millisekunden. Monate("2024-11"), Wochen("2024W12") sind vom DateFormat "date"
 * @property {number} [minSize] - minimale String Länge
 * @property {number} [maxSize] - maximale String Länge
 * @property {number} [decimals] - Anzahl der Dezimalstellen 
 * @property {number} [min] - Minimalwert
 * @property {number} [max] - Maimalwert
 * @property {number} [greater] - Größer als angegeben (exklusive der angegebenen zahl)
 * @property {number} [lower] - Kleiner als angegeben (kleiner der angegeben zahl)
 * @property {string} [regex] - Regular Expression zum Testen eines Wertes
 * @property {any} [defaultValue] - Standard-Wert der Eigenschafft
 * @property {boolean} [charToBool] - true wenn der Charakter "J" in "true" umgewandelt werden soll.
 * @property {boolean} [readonly] - true wenn wert nicht bearbeitet werden darf.
 * @property {boolean} [password] - true wenn es ein Passwort Feld ist.
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
 * @property {Array<string|undefined|null>} links
 * @property {DataFormat[]} [formats]
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
export const LIST = new Map();
export const ENUM = {
    colDataType: ["string", "number", "boolean", "object", "list"]
    , colDateType: ["date", "datetime", "time", "period"]
};

/** @type {GridNav} */
export let activeNav;

// ===============================
//   Funktionen
// --------------

// Global Short Identifier
/**
 * Gibt eine neue GlobalShortId zurück
 * @returns {string}
 */
export function GSID() {
    return new Date().getTime().toString(36) +
        crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}


/**
 * Liefert einen Formartierten String mit angegebener Maske zurück. 
 * @param {string} text - Text der in das Format geschrieben wird
 * @param {string} mask - Formatstring mit Pattern als Ersetzungszeichen
 * @param {string} [pattern] - Optional Ersetzungszeichen. Default "_"
 * @param {string} [base] - Optional Kommazeichen. Default "."
 * @returns {string} Format-String mit ersetzten Zeichen
 */
export function maskString(text, mask, pattern, base) {
    if (typeof text != "string") {
        text = "" + text;
    }

    if (!pattern) { pattern = "_"; }

    // Ausgangspunkt ermitteln
    let posText = text.lastIndexOf(".");
    let posMask = mask.lastIndexOf(".");
    if (typeof base == "string") {
        posText = text.lastIndexOf(base);
        posMask = mask.lastIndexOf(base);
    } else {
        base = ".";
    }

    let firstText = "";
    let lastText = text;
    let firstMask = "";
    let lastMask = mask;

    // Wenn Kommastelle
    if (posMask > -1) {
        firstText = text.substring(0, posText);
        lastText = text.substring(posText + 1);
        firstMask = mask.substring(0, posMask);
        lastMask = mask.substring(posMask + 1);
    }

    // in linke Richtung suchen
    let pos1 = -1;
    for (let i = 0; i < lastText.length; i++) {
        pos1 = lastMask.indexOf(pattern, pos1 + 1);
        if (pos1 > -1) {
            lastMask = lastMask.replace(pattern, lastText[i]);
        }
    }

    if (!firstMask) {
        return lastMask.replaceAll(pattern, "");
    }

    // in rechte Richtung suchen
    pos1 = firstMask.length;
    for (let i = firstText.length - 1; i >= 0; i--) {
        pos1 = firstMask.lastIndexOf(pattern, pos1 - 1);
        if (pos1 > -1) {
            firstMask = firstMask.substring(0, pos1) + firstText[i] + firstMask.substring(pos1 + 1);
        }
    }

    return (firstMask + base + lastMask).replaceAll(pattern, "");
}


/**
 * Gibt einen String mit formartierter Zahl zurück.  
 * z.B.: formatNumber(1234.5, 2, ",") => "1234,50"  
 * z.B.: formatNumber(-1234.5678, 2, ",", "___ ___,___") => "-1 234,57_"  
 * @param {string|number} num - Zahl die formatiert wird
 * @param {number} decimals - Anzahl der Dezimalstellen
 * @param {string} [base] - Optional Kommerzeichen. Default = "." 
 * @param {boolean} [seperate] - Optional Tausender Trennzeichen (thin space)
 * @returns {string} Formatierte Zahl
 */
export function formatNumber(num, decimals, base, seperate) {
    if (!decimals) { decimals = 0; }
    if (typeof decimals == "string") {
        decimals = parseInt(decimals);
    }

    let numString = "";
    if (typeof num == "string") {
        // Falsche Komma(",") ersetzen 
        let posPoint = num.lastIndexOf(".");
        let posKomma = num.lastIndexOf(",");
        if (posKomma > posPoint) {
            num = num.substring(0, posKomma) + "." + num.substring(posKomma + 1);
        } else {
            num = num.replaceAll(",", "");
        }
        numString = parseFloat(num).toFixed(decimals);
    } else if (typeof num == "number") {
        numString = "" + num.toFixed(decimals);
    } else {
        numString = "" + parseFloat("0").toFixed(decimals);
    }

    if (seperate) {
        // * schmales Leerzeichen 	U+2009 	8201 	THIN SPACE 	&#8201; 	&#x2009; 	&thinsp;
        // * schmales nicht umbrechendes Leerzeichen 	U+202F 	8239 	NARROW NO-BREAK SPACE 	&#8239; 	&#x202f; 	n. z.    // Dezimalstellen
        // 123 456 789.123 456 789
        const smalSpace = String.fromCharCode(8239);

        let pos1 = numString.indexOf(".");
        let pos2 = pos1 > -1 ? pos1 - 3 : numString.length - 3;
        while (pos2 > 0) {
            //if (pos2 < numString.length && pos2 != pos1) {
            numString = numString.substring(0, pos2) + smalSpace + numString.substring(pos2);
            //}
            pos2 -= 3;
        }
    }

    // Kommazeichen setzen
    if (typeof base == "string" && base != ".") {
        numString = numString.replace(".", base);
    }


    return numString;
}


/**
 * @param {string} template
 * @param {Object<string,any>} obj
 */
function templateMe(template, obj) {
    var regex = /{{(.*?)}}/g;
    return template.replace(regex, function (/** @type {any} */ match, /** @type {string | number} */ capture) {
        return obj[capture] || "";
    });
}


/**
 * Registriert Tastatur-/ Maus-Ereigniss für die Navigation
 */
export function setNavEvents() {
    /**
     * @param {KeyboardEvent} e - Maus Event  
     */
    function keydown(e) {
        if (activeNav instanceof GridNav) {
            activeNav.onKeyDown(e);
        }
    }

    /**
     * @param {MouseEvent} e - Maus Event  
     */
    function click(e) {
        if (activeNav instanceof GridNav) {
            activeNav.onClick(e);
        }
    }

    // Tastatur und Maus Event registrieren
    document.addEventListener("keydown", (e) => keydown(e));
    document.addEventListener("click", (e) => click(e));
}



export function newColList() {
    const cols = [
        "GSID"
        , "name"
        , "type"
        , "required boolean"
        , "link"
        , "date"
        , "inlist"
        , "domain"
        , "minSize number"
        , "maxSize number"
        , "decimals number"
        , "min number"
        , "max number"
        , "greater number"
        , "lower number"
        , "regex"
        , "defaultValue"
        , "charToBool boolean"
        , "readonly boolean"
        , "password boolean"
    ];

    const newList = new GridList("_cols", cols, "GSID");
    newList.setColDataFormat("GSID", { readonly: true, required: true });
    newList.setColDataFormat("name", { required: true });
    newList.setColDataFormat("type", { required: true, inlist: "colDataType" });
    newList.setColDataFormat("date", { inlist: "colDateType" });
    return newList;
}


// ===============================
//   Klasse
// --------------

/**
 * @class GridList
 */
export class GridList {
    /** Name der Liste @type {string} */
    #name = "";
    set name(newName) {
        if (!newName) {
            newName = GSID();
        }
        this.#name = newName;

        // name registrieren
        LIST.set(this.name, this);
    }
    get name() {
        return this.#name;
    }

    /** Nummer der ID-Spalte @type {number} */
    #idColNumber = -1;

    /** Nummern der ID-Spalte wenn mehrere Spalten eine eindeutige ID ergeben @type {number[]} */
    #idColNumbers = [];

    /** Liste Mit SpaltenNamen @type {string[]} */
    #cols = [];
    get cols() {
        return this.#cols;
    }

    /** Objekt wo Key = Spaltenname und Value = Index der Spalte @type {Object<string,number>} */
    #findex = {};

    /** Liste mit Typbezeichnung für jede Spalte @type {InfoTypes[]} */
    #types = [];

    /** Liste mit Namen zu verlinkten Liste für die jeweilige Spalte @type {Array<string|undefined|null>} */
    #links = [];

    /** Liste mit Format Objekten für die einzelnen Spalten @type {DataFormat[]} */
    #formats = [];

    /** Interner Datenspeicher @type {Map<string|number,any[]>} */
    #data = new Map();

    /** 
     * MAP mit Index für Sortierung und Filter der Daten.  
     * Key ist der IndexName und Value ist eine Liste mit Datensatz ID's der sortierten/gefilterten Datenzeilen
     *  @type {Map<string,Array<string|number>>} 
     */
    #index = new Map();

    /**
     * Map mit SortIndex als Key und Array mit Spalten nach denen sortiert wurde
     * @type {Map<string,Array<string>>}
     */
    #sortCols = new Map();

    /**
     * Map mit SortIndex als Key und Array mit Spalten für Sortierrichtung
     * @type {Map<string,Array<string>>}
     */
    #sortColsDirection = new Map();


    /** Anzahl der Datenzeile in der Liste @type {number} */
    get length() {
        return this.#data.size;
    }


    /**
     * Setzt das ID-Feld und mekt sich den ID-Index.
     * Felder müssen vorher in der Liste existieren.
     * @function setIdCol
     * @param {string|number|Array<string|number>} colName - ID Spaltenname oder Spaltennummer oder Liste davon, die eine eindeutige ID ergeben
     */
    setIdCol(colName) {
        if (typeof colName == "string" && colName.indexOf(",") > 0) {
            colName = colName.split(",").map(name => { return name.trim(); });
        }

        if (typeof colName == "string") {
            //this.#idColNumber = this.#cols.indexOf(col);
            this.#idColNumber = this.#findex[colName];
            if (this.#idColNumber == undefined && colName == "GSID") {
                let cIndex = this.#cols.indexOf("GSID");
                if (cIndex < 0) {
                    cIndex = this.#cols.push("GSID") - 1;
                    this.#types[cIndex] = "string";
                }
                this.#findex.GSID = cIndex;
                this.#idColNumber = cIndex;
            }
            this.#idColNumbers = [];

            // Format erforderlich setzen
            const colFormat = this.getColDataFormat(this.#idColNumber);
            if (!colFormat) {
                this.setColDataFormat(this.#idColNumber, { required: true });
            } else {
                colFormat.required = true;
            }
        } else if (typeof colName == "number") {
            this.#idColNumber = colName;
            this.#idColNumbers = [];
            // Format erforderlich setzen
            const colFormat = this.getColDataFormat(colName);
            if (!colFormat) {
                this.setColDataFormat(colName, { required: true });
            } else {
                colFormat.required = true;
            }
        } else if (Array.isArray(colName)) {
            this.#idColNumber = -1;
            this.#idColNumbers = [];

            // Alle Einträge Prüfen
            for (let i = 0; i < colName.length; i++) {
                let colNumber = -1;
                switch (typeof colName[i]) {
                    case "string":
                        //this.#idColNumbers.push(this.#cols.indexOf(col[i] + ""));
                        colNumber = this.#findex[colName[i] + ""];
                        break;
                    case "number":
                        colNumber = parseInt(colName[i] + "");
                        // this.#idColNumbers.push(parseInt(colName[i] + ""));
                        break;

                    default:
                        break;
                }
                this.#idColNumbers.push(colNumber);

                // Format erforderlich setzen
                const colFormat = this.getColDataFormat(colNumber);
                if (!colFormat) {
                    this.setColDataFormat(colNumber, { required: true });
                } else {
                    colFormat.required = true;
                }
            }
        }
    }
    /**
     * @param {string|number|Array<string|number>} colName - Name der Spalte
     */
    set idCol(colName) {
        this.setIdCol(colName);
    }
    /**
     * @returns {string|string[]}
     */
    get idCol() {
        if (this.#idColNumber > -1) {
            return this.#cols[this.#idColNumber];
        } else {
            const ids = [];
            for (let i = 0; i < this.#idColNumbers.length; i++) {
                ids.push(this.#cols[this.#idColNumbers[i]]);
            }
            return ids;
        }
    }


    /**
     * Holt aus einer Datenzeile die ID laut gespeicherten idIndex
     * @function getID
     * @param {any[]|Object<string,any>|FormData} dataRow - Datenzeile Array oder Objekt
     * @returns {string|number|undefined} ID
     */
    getID(dataRow) {
        if (typeof dataRow != "object") { return undefined; }

        // auf GSID prüfen
        let isGSID = false;
        if (this.#cols[this.#idColNumber] == "GSID") {
            isGSID = true;
        }

        // wenn Array
        if (Array.isArray(dataRow)) {
            if (this.#idColNumber < 0) {
                let id = "";
                for (let i = 0; i < this.#idColNumbers.length; i++) {
                    let id2 = dataRow[this.#idColNumbers[i]];
                    if (id2 == undefined || id2 == null || id2 === "") {
                        return undefined;
                    }
                    id += id2 + "_";
                }
                return id;
            } else {
                let id = dataRow[this.#idColNumber];
                if (id == undefined || id == null || id === "") {
                    if (isGSID) {
                        id = GSID();
                        dataRow[this.#idColNumber] = id;
                    } else {
                        return undefined;
                    }
                }
                return id;
            }
        } else {
            // Wenn Objekt
            if (this.#idColNumber < 0) {
                let id = "";
                for (let i = 0; i < this.#idColNumbers.length; i++) {
                    let id2;
                    if (dataRow instanceof FormData) {
                        id2 = dataRow.get(this.#cols[this.#idColNumbers[i]]);
                    } else {
                        id2 = dataRow[this.#cols[this.#idColNumbers[i]]];
                    }
                    if (id2 == undefined || id2 == null || id2 === "") {
                        return undefined;
                    }
                    id += id2 + "_";
                }
                return id;
            } else {
                let id;
                if (dataRow instanceof FormData) {
                    id = dataRow.get(this.#cols[this.#idColNumber]);
                } else {
                    id = dataRow[this.#cols[this.#idColNumber]];
                }
                if (id == undefined || id == null || id === "") {
                    if (isGSID) {
                        id = GSID();
                        if (dataRow instanceof FormData) {
                            dataRow.set("GSID", id);
                        } else {
                            dataRow.GSID = id;
                        }
                    } else {
                        return undefined;
                    }
                }
                return id;
            }
        }
    } // getID


    /**
     * Setzt oder löscht, für die Angegebene Spalte, den Link(Verknüpfung) zu einer anderen Liste
     * @function setColLink
     * @param {string|number} col - Spaltenname oder Splaltennummer
     * @param {string|undefined|null} [listName] - Name der GridListe. Wenn nicht angegeben wird der Link(Verknüpfung) gelöscht.
     * @returns {void}
     */
    setColLink(col, listName) {
        this.#links[this.getColNumber(col)] = listName;
    }


    /**
     * Liest den Listennamen der Verknüpften Liste vom angegebenen Feldindex aus
     * @function getColLink
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
     * @function setCols
     * @param {string|string[]} cols - Liste Mit Spaltennamen, oder String mit Trennzeichen getrennt
     * @param {string|string[]} idCol - Spaltenname des ID Feldes, oder Liste von Spaltennamen, die eine eindeutige Kennung ergeben. Zum generieren einer eindeutigen ID kann auch "GSID" angegeben werden.
     * @param {string} [seperator] - Trennzeichen muss angegeben werden wenn fieldList ein String mit Trennzeichen ist
     */
    setCols(cols, idCol, seperator) {
        if (!cols) { return; }
        /**
         * @type {string | any[]}
         */
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
            let name = ("" + newFields[i]).trim();

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
                //if ("|string|number|boolean|object|list|".indexOf(nameType[1]) > -1) {
                if (nameType[1] == "string" || nameType[1] == "number" || nameType[1] == "boolean") {
                    this.#types[i] = nameType[1];
                } else if (nameType[1] == "object" || nameType[1] == "list") {
                    this.#types[i] = nameType[1];
                    
                    //  Wenn keine verknüpfte Liste
                    if (!nameType[2]) {
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
                this.#types[i] = "string";
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
     * @function setColsFromObject
     * @param {Object<string,any>} obj - Objekt dessen Eigenschaften als Spaltennamen registriert werden
     * @param {string|Array<string>} idCol - Name der Eigenschaft die als Eindeutige ID genommen wird. Für eine ID Generierung kann auch "GSID" angegeben werden.
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
     * Fügt eine neue Spalte der Liste hinzu.
     * @param {string|Array<string>} colName - Name (und Type, link) der Spalte oder eine Liste von Spalten
     * @returns {number|Array<number>} Index oder Liste von Indexes für die hinzugefügten Spalten.
     */
    addCol(colName) {
        // Liste im ID's
        const idList = this.getIndex();

        if (Array.isArray(colName)) {
            /** @type {Array<number>} */
            const indexList = [];
            for (let i = 0; i < colName.length; i++) {
                // Spalte hinzufügen neu aufrufen
                let newIndex = this.addCol(colName[i]);
                if (typeof newIndex == "number") {
                    indexList.push(newIndex);
                }
            }
            return indexList;
        }

        if (typeof colName != "string") { return -1; }
        colName = colName.trim();
        let index = -1;

        // Wenn ein leerzeichen im Namen
        if (colName.indexOf(" ") > -1) {
            // Type steht nach namen
            const nameType = colName.split(" ");

            // Spalte hinzufügen
            index = this.#cols.push(nameType[0]) - 1;

            // SpaltenIndex merken
            this.#findex[nameType[0]] = index;

            if (nameType[2]) {
                this.#links[index] = nameType[2];
            }

            // auf richtige Typen prüfen
            if ("|string|number|boolean|object|list|".indexOf(nameType[1]) > -1) {
                //@ts-ignore
                this.#types[index] = nameType[1];

                //  Wenn keine verknüpfte Liste
                if ((nameType[1] == "object" || nameType[1] == "list") && !nameType[2]) {
                    // Liste Name wird vom SpaltenNamen angenommen
                    this.#links[index] = nameType[0];
                }
            } else {
                // wenn kein Typ angegeben dann immer "string"
                this.#types[index] = "string";
            }
        } else {
            // Spalte hinzufügen
            index = this.#cols.push(colName) - 1;
            //this.#cols[i] = name;

            // SpaltenIndex merken
            this.#findex[colName] = index;

            // Standard Typ
            this.#types[index] = "string";
        } // if else indexof(" ")

        // Spalte in Daten einfügen
        let value;
        switch (this.#types[index]) {
            case "number":
                value = 0;
                break;
            case "boolean":
                value = false;
                break;
            case "object":
                value = {};
                break;
            case "list":
                value = [];
                break;
            default:
                // string
                value = "";
                break;
        }
        for (let i = 0; i < idList.length; i++) {
            if (index > 0) {
                const row = this.#data.get(idList[i]);
                row?.push(value);
            }
        }

        // index der neuen Spalte zurückgeben
        return index;
    } // addCol


    /**
     * Entfernt eine Spalte aus der Liste.  
     * ACHTUNG! Die Daten der Spalte werden gelöscht.  
     * ID-Spalten können nicht gelöscht werden.
     * @param {string} colName - Name der Spalte die entfernt wird
     * @returns {void}
     */
    removeCol(colName) {
        if (typeof colName != "string") { return; }
        const colIndex = this.getColNumber(colName);

        // ID Spalten dürfen nicht gelöscht werden
        if (colIndex < 0 || colIndex == this.#idColNumber || this.#idColNumbers.indexOf(colIndex) > -1) {
            return;
        }

        // Liste im ID's
        const idList = this.getIndex();

        // Es darf beim löschen kein Fehler passieren.
        try {
            // Spalten aus Daten löschen
            for (let i = 0; i < idList.length; i++) {
                const row = this.#data.get(idList[i]);
                // todo: Verlinkte Daten löschen ????
                row?.splice(colIndex, 1);
            }

            // Spalte löschen
            delete this.#findex[colName];
            this.#links.splice(colIndex, 1);
            this.#formats.splice(colIndex, 1);
            this.#types.splice(colIndex, 1);
            this.#cols.splice(colIndex, 1);
        } catch (err) {
            // todo: bei Fehler zurücksetzen???
        }
    } // removeCol


    /**
     * Git den Typ der Spalte als String zurück
     * @param {string|number} col - Spaltenname oder Nummer
     * @returns {InfoTypes} Typ als string
     */
    getColType(col) {
        return this.#types[this.getColNumber(col)];
    }


    /**
     * Setzt für die angegebene Spalte die Format einstellungen
     * @function setColDataFormat
     * @param {string|number} col - Spaltenname oder Nummer
     * @param {DataFormat} formatObj - FormatObjekt für die Spalte
     */
    setColDataFormat(col, formatObj) {
        if (!formatObj) { formatObj = {}; }
        this.#formats[this.getColNumber(col)] = formatObj;
    }

    /**
     * Liefert vom der angegebenen Spalte das Format Objekt zurück
     * @param {string|number} col - Splatenname oder SplantenNummer 
     * @returns {DataFormat|undefined} Format Objekt wenn vorhanden
     */
    getColDataFormat(col) {
        return this.#formats[this.getColNumber(col)];
    }


    /**
     * Ersetzt alle Daten mit einem neuen GridObject
     * @param {GridObject} obj - Grid Objekt
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
                    let id = this.getID(obj.data[i]);
                    if (id != undefined) {
                        // nur Datensätze mit ID kommen in die Liste!!!
                        this.#data.set(id, obj.data[i]);
                    }
                }
            }
        } catch (err) {
            console.error(err);
            return false;
        }

        return true;
    } // createFromInfoObject


    /**
     * Liefert die Gridliste als Javascript Objekt zurück
     * @returns {GridObject} Gridliste als Javascript Objekt
     */
    getAsGridObject() {
        /** @type {GridObject} */
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
        const valueList = [...this.#data.values()];

        /** @type {any[]} */
        const data = [];
        newObj.data = data;

        valueList.forEach(value => {
            data.push(value);
        })

        return newObj;
    } // getAsInfoObj()


    /**
     * Diese Funktion liefert eine Zeile(Array/Slice) zurück
     * die Spalten Reihenfolge der Daten bestimmt die "cols" Eigenschaft von der GridList
     * @param {string|number} key - ID der Zeile 
     * @returns {any[]|undefined}
     */
    #getRow(key) {
        return this.#data.get(key);
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
     * @param {any[]} dataRow - Datensatz Zeile 
     * @returns {object} Datensatz als Objekt
     */
    #getObjFromRow(dataRow) {
        /** @type {Object<string,any>} */
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
     * @param {string|number} rowID 
     * @returns {object}
     */
    get(rowID) {
        return this.#getObjFromRow(this.#data.get(rowID) || []);
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
                } else if (typeof value == "number" && value != 0) {
                    dataRow[i] = true;
                } else {
                    dataRow[i] = false;
                }
                break;
            case "object":
                if (Array.isArray(value)) {
                    // Wert nicht ändern
                } else if (typeof value == "object") {
                    // FremdListe lesen
                    let foreignList = LIST.get(link);
                    if (foreignList == undefined) {
                        // neue Liste
                        foreignList = new GridList(link);
                        let id = "id"
                        if (value.id == undefined) {
                            // erzeuge eine GSID
                            value.GSID = GSID();
                            id = "GSID";
                        }

                        foreignList.setColsFromObject(value, id);
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
                        let foreignList = LIST.get(link);
                        if (foreignList == undefined) {
                            // neue Liste
                            foreignList = new GridList(link);
                            let id = "id"
                            if (value[0].id == undefined) {
                                // erzeuge eine GSID
                                value[0].GSID = GSID();
                                id = "GSID";
                            }
                            foreignList.setColsFromObject(value[0], id);
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
     * Ist bereits ein Eintrag mit der selben ID vorhanden, so wird vorhandene Eigenschaften überschrieben.  
     * !!! WICHTIG !!! - Bereits vorhandenen sortierte oder gruppierte Indexes werden nicht angepasst.
     * @param {Object<string,any>} obj - Daten Objekt
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

        // nur Datensätze mit ID kommen in die Liste
        if (id == undefined) { return id; }

        let dataRow = this.#getRow(id)
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
     * Setzt Formdaten in die Liste
     * @param {FormData} formData - Formular Daten Objekt
     * @returns {string|number|undefined} ID des Datensatzes
     */
    setFormData(formData) {
        if (!formData || typeof formData != "object") { return; }

        // neue Datenzeilen
        // Prüfen / lesen von bestehender Datenzeile
        let isNewRow = false;
        const id = this.getID(formData);

        // nur Datensätze mit ID kommen in die Liste
        if (id == undefined) { return id; }

        let dataRow = this.#getRow(id)
        if (dataRow == undefined) {
            dataRow = this.#newRow(id);
            isNewRow = true;
        }

        // alle registrierten Spalten durchgehen        
        for (let i = 0; i < this.#cols.length; i++) {
            const key = this.#cols[i];

            // nur wenn Objekt den Key hat
            if (!formData.has(key)) { continue; }

            // Wert lesen
            let value = formData.get(key);

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
     * @returns {number} - Index Position der gesuchten Spalte. -1 wenn nicht gefunden.
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
     * @param {Array<string|number>} colNameList - Liste mit Feldnamen
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
     * @param {string|number} rowID - ID des Datensatzes(Zeile)
     * @param {string|number} colName - Feldname von dem der Wert gelesen wird
     * @returns {any|undefined} Wert vom angegebenen Datensatz-Feld 
     */
    getCellValue(rowID, colName) {
        if (!rowID) { return undefined; }
        const colIndex = this.getColNumber(colName);

        if (colIndex > -1) {
            const dataRow = this.#data.get(rowID);
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
     * @param {string|number} rowID - ID des Datenzeile
     * @param {string|number} colName - SpaltenName oder nummer
     * @param {any} value - Wert der für das angegebene Feld gesetzt wird
     * @returns {void}
     */
    setCellValue(rowID, colName, value) {
        if (rowID == undefined || colName == undefined) { return; }

        let dataRow = this.#data.get(rowID);
        if (!dataRow) {
            // neue Datenzeile
            dataRow = this.#newRow(rowID);
        }

        // Zellenwert setzen
        this.#setCellValue(dataRow, colName, value);
    } // setCellValue


    /**
     * Gibt ein Array an Werten für die Spalten(fieldList) eines Datensatzes(id) zurück.
     * @param {string|number} rowID - ID des Datensatzes
     * @param {Array<string|number>} colList - Liste mit Spaltennamen oder Spaltennummern
     * @returns {any[]} Liste mit Werten der angegebenen Spalten
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
            const index = this.getColNumber(colList[i]);
            valueList.push(dataRow[index]);
        };

        return valueList;
    }


    /**
     * Gibt eine Liste aller Id's zurück
     * @returns {Array<string|number>} Liste aller ID's
     */
    getIdList() {
        // Alle Keys von der map
        return [...this.#data.keys()];
    }
    /**
     * gibt eine Liste aller Id's zurück
     * @alias getIdList
     * @returns {Array<string|number>} Liste aller ID's
     */
    keys() {
        return [...this.#data.keys()];
    }


    /**
     * Liefert alle Datenzeilen als Objekte, oder nur die Datenzeilen mit angegebenen Index oder Liste von IDs, in einer Liste zurück.
     * @param {string|Array<string|number>} [index] - Optional Index oder Liste mit Datensatz ID's
     * @returns {object[]} Liste mit Datenobjekten
     */
    getRows(index) {
        const newList = [];
        const indexList = this.getIndex(index);

        // alle Keys durchgehen
        for (let i = 0; i < indexList.length; i++) {
            newList.push(this.get(indexList[i]));
        }
        return newList;
    }


    /**
     * Merkt sich alle Datenzeilen, oder die Datenzeilen vom "oldIndex", unter angegebenen Index(newIndex)
     * @param {string} newIndexName - Index Name unter dem die Datenzeilen angelegt werden
     * @param {string|Array<string|number>} [oldIndex] - optional bestehender Index(Name oder ID-Liste) von dem die Daten gelesen werden
     * @returns {void}
     */
    setIndex(newIndexName, oldIndex) {
        if (typeof newIndexName != "string") { return; }
        if (Array.isArray(oldIndex)) {
            this.#index.set(newIndexName, oldIndex);
        } else if (typeof oldIndex == "string") {
            this.#index.set(newIndexName, this.#index.get(oldIndex) || [...this.#data.keys()]);
        } else {
            this.#index.set(newIndexName, [...this.#data.keys()]);
        }
    }


    /**
     * Liefert eine Liste aller Datensatz(Zeilen) ID's zurück wenn kein "index" angegeben.  
     * Bei "index" wird die ID-Liste vom bestehenden Index zurückgegeben.  
     * Oder wenn "index" bereits eine Liste, dann wird die Liste zurück gegeben.
     * @param {string|Array<string|number>} [index] - Optionaler Name des Index
     * @returns {Array<string|number>} Liste mit ID's vom Index
     */
    getIndex(index) {
        let rowList = [];
        if (Array.isArray(index)) {
            rowList = index;
        } else if (typeof index == "string") {
            rowList = this.#index.get(index) || [...this.#data.keys()];
        } else {
            rowList = [...this.#data.keys()];
        }
        return rowList;
    }


    /**
     * Prüft ob der Index bereits in der Liste existiert
     * @param {string} indexName - Name des gesuchten Index
     * @returns {boolean} true wenn Index vorhanden
     */
    hasIndex(indexName) {
        return this.#index.has(indexName);
    }


    /**
     * Sortiert die Daten nach angegebenen Spalten. Groß-Kleinschreibung bei Texten wird ignoriert.
     * Wenn "index" angegeben, und der Index vorhanden ist, werden die Daten unter diesem Index sortiert, und unter dem selben Index abgelegt.
     * Wenn "index" angegeben, und noch nicht angelegt, werden alle Daten sortiert und unter dem Index abgelegt.
     * @param {Array<string|number>} sortCols - Liste mit Spalten nach denen Sortiert wird
     * @param {string|Array<string|number>} [index] - Index Name oder Liste mit ID's der zum sortieren verwendet wird, oder wenn nicht vorhanden, nach dem Sortieren gesetzt wird.
     * @param {string} [newIndexName] - Index Name der nach dem Sortieren gesetzt wird.
     * @returns {Array<string|number>} sortierte Liste mit ID's
     * @example
     * const sortList = dataList.sortRows(["name", "hausnummer DESC"], "sortListe");
     */
    sortRows(sortCols, index, newIndexName) {
        // Alle Datenzeile in einer liste
        const rowList = this.getIndex(index);

        // wenn keine SortierungsSpalten angegeben
        if (!Array.isArray(sortCols)) {
            // nur Index merken
            if (typeof index == "string") { this.#index.set(index, rowList); }
            // unsortierte Liste mit ID's
            return rowList;
        }

        // Feld Indexes lesen und Sortier Reihenfolge
        const colLength = sortCols.length;
        const colIndex = new Array(colLength);
        const orderIndex = new Array(colLength);
        const isString = new Array(colLength);
        const sCols = new Array(colLength);
        const sDirection = new Array(colLength);

        // Alle sortierspalten durchgehen
        for (let i = 0; i < colLength; i++) {
            let col = sortCols[i];
            let direction = 1; // 1 = Aufsteigend sortieren / -1 = Absteigend sortieren
            let index = -1;

            // wenn Spaltenname eine String
            if (typeof col == "string" && col.indexOf(" ") >= 0) {
                // prüfen auf Sortier Richtung
                const fieldData = col.split(" ");
                index = this.getColNumber(fieldData[0]);
                sCols[i] = fieldData[0]; // Spaltennamen für spätere Verwendung merken
                sDirection[i] = "ASC";
                if (fieldData[1].trim().toUpperCase() == "DESC") {
                    direction = -1;
                    sDirection[i] = "DESC"; // Sortierrichtung für spätere Verwendung merken
                }
            } else {
                // Wenn Spalte eine Nummer
                // Name der Spalte setzen
                sCols[i] = this.#cols[col];
                sDirection[i] = "ASC";
                index = this.getColNumber(col);
            }

            colIndex[i] = index;
            orderIndex[i] = direction;
            isString[i] = this.#types[index] == "string" ? true : false;
        }


        // Sortieren
        rowList.sort((a, b) => {
            const aRow = this.#getRow(a) || [];
            const bRow = this.#getRow(b) || [];

            // Prüfen
            for (let i = 0; i < colLength; i++) {
                if (!aRow[colIndex[i]] && !bRow[colIndex[i]]) {
                    continue;
                } else if (aRow[colIndex[i]] && !bRow[colIndex[i]]) {
                    if (orderIndex[i] < 0) {
                        // Absteigend
                        return -1;
                    } else {
                        // Aufsteigend
                        return 1;
                    }
                } else if (!aRow[colIndex[i]] && bRow[colIndex[i]]) {
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
                        if (aRow[colIndex[i]].toLowerCase() > bRow[colIndex[i]].toLowerCase()) { return -1; }
                        if (aRow[colIndex[i]].toLowerCase() < bRow[colIndex[i]].toLowerCase()) { return 1; }
                    } else {
                        if (aRow[colIndex[i]] > bRow[colIndex[i]]) { return -1; }
                        if (aRow[colIndex[i]] < bRow[colIndex[i]]) { return 1; }
                    }
                } else {
                    // Aufsteigend
                    if (isString[i]) {
                        if (aRow[colIndex[i]].toLowerCase() > bRow[colIndex[i]].toLowerCase()) { return 1; }
                        if (aRow[colIndex[i]].toLowerCase() < bRow[colIndex[i]].toLowerCase()) { return -1; }
                    } else {
                        if (aRow[colIndex[i]] > bRow[colIndex[i]]) { return 1; }
                        if (aRow[colIndex[i]] < bRow[colIndex[i]]) { return -1; }
                    }
                }
            } // alle Felder vergleichen

            // alle gleich
            return 0;
        });

        // neuen Index speichern
        if (typeof newIndexName == "string") {
            this.#index.set(newIndexName, rowList);
            this.#sortCols.set(newIndexName, sCols);
            this.#sortColsDirection.set(newIndexName, sDirection);
        } else if (typeof index == "string") {
            this.#index.set(index, rowList);
            this.#sortCols.set(index, sCols);
            this.#sortColsDirection.set(index, sDirection);
        }
        return rowList;
    } // getSortRows



    /**
     * Gruppiert die Daten anch angegeben Spalten, und liefert eine Liste mit Gruppierungs-Objekten zurück.  
     * Für die Aggregate können "sum", "count", "min" oder "max" - angegeben werden.
     * noch nicht implementiert "average"(Durchschnitt), "mean"(mittelwert), "total"(laufende Summe)
     * @param {string|Array<string>} cols - Spalten nach denen Gruppiert wird
     * @param {string|Array<string>|undefined} [aggr] - Spalten nach denen Summe, Anzahl, Minimum oder Maximum berechnet wird.
     * @param {string} [index] - Optional Index der für die Gruppierung verwerndet wird.
     * @returns {Array<object>} ObjektListe mit einem Objekt das die Gruppe darsetellt und einer Eigenschaft "_sublist" welche die ID's der Datenzeilen die für die Gruppe verwendet worden sind beinhaltet.
     * @example
     * // "sum", "count", "min", "max" - noch nicht implementiert "average"(Durchschnitt), "mean"(mittelwert), "total"(laufende Summe)
     * // pos = ID
     * | pos | artikel | preis |
     * | 1   | A       | 2     |
     * | 2   | A       | 4     |
     * | 3   | B       | 5     |
     * 
     * let list = gridList.getGroupByCols("artikel", ["preis sum", "artikel count"]);
     * 
     * list => 
     * | pos | artikel | preis | preis_sum | artikel_count | _sublist |
     * | 1   | A       | 2     | 6         | 2             | [1, 2]   |
     * | 3   | B       | 5     | 5         | 1             | [3]      |
     */
    getGroupByCols(cols, aggr, index) {
        let colList = ["_"];
        if (Array.isArray(cols)) {
            colList = cols;
        } else if (typeof cols == "string" && cols) {
            colList = [cols];
        }

        const idList = this.getIndex(index);
        let aggrCols = [];
        const objList = [];
        const keyMap = new Map();

        // Aggregate lesen
        if (Array.isArray(aggr)) {
            for (let i = 0; i < aggr.length; i++) {
                aggrCols.push(aggr[i].split(" "));
            }
        } else if (typeof aggr == "string") {
            aggrCols = aggr.split(" ");
        }

        // Alle Datenzeilen durchgehen
        for (let i = 0; i < idList.length; i++) {
            // Objekt lesen
            const obj = this.get(idList[i]);
            let key = "";
            for (let j = 0; j < colList.length; j++) {
                if (j > 0) { key += "_"; }
                key += obj[colList[j]];
            }

            // Vorhandenen Key prüfen
            let keyObj = keyMap.get(key);
            if (keyObj) {
                // alle agregate prüfen
                for (let j = 0; j < aggrCols.length; j++) {
                    const colName = aggrCols[j][0];
                    const value = obj[colName];
                    switch (aggrCols[j][1]) {
                        case "sum":
                            keyObj[colName + "_sum"] += value || 0;
                            break;
                        case "count":
                            keyObj[colName + "_count"] += 1;
                            break;
                        case "min":
                            if (value != undefined && value < keyObj[colName + "_min"]) {
                                keyObj[colName + "_min"] = value;
                            }
                            break;
                        case "max":
                            if (value != undefined && value > keyObj[colName + "_max"]) {
                                keyObj[colName + "_max"] = value;
                            }
                            break;
                    }
                } // alle Aggrgat Spalten
                keyObj._sublist.push(idList[i]);
            } else {
                // Gruppierungsobjekt noch nicht vorhanden
                // alle agregate prüfen
                for (let j = 0; j < aggrCols.length; j++) {
                    const colName = aggrCols[j][0];
                    switch (aggrCols[j][1]) {
                        case "sum":
                            obj[colName + "_sum"] = obj[colName] || 0;
                            break;
                        case "count":
                            obj[colName + "_count"] = 1;
                            break;
                        case "min":
                            obj[colName + "_min"] = obj[colName] || "";
                            break;
                        case "max":
                            obj[colName + "_max"] = obj[colName] || "";
                            break;
                    }
                } // for alle Aggregierungs Spalten

                // Liste für ID's
                obj._sublist = [idList[i]];

                // Objekt merken
                keyMap.set(key, obj);
                objList.push(obj);
            }
        } // alle ID's durchgehen

        // Objektliste zurückgeben
        return objList;
    }


    /**
     * Gibt eine gefilterte Liste mit Datensätzen zurück.  
     * Wenn index Angegeben werden die Daten zum Filtern vom bestehenden Index genommen.  
     * Wenn newIndex angegeben, wird die gefilterte Liste unter dem "newIndex" abgelegt.
     * @param {Function} fu - Filterfunktion muss "true" oder "false" zurückgeben. Wenn "true" wird der Datensatz in die gefilterte Liste aufgenommen. 
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
            this.#index.set(newIndexName, newList);
        } else if (typeof index == "string") {
            this.#index.set(index, newList);
        }
        return newList;
    }


    /**
     * Gibt eine gefilterte Liste mit Datensatz ID's zurück.  
     * Die Filterfunktion wird mit einer Liste von Datensätzen aufgerufen, die in der angegebenen Spaltenliste(colList) den selben Wert haben.  
     * Wenn index angegeben werden die Daten zum Filtern vom bestehenden Index genommen.
     * Wenn newIndex angegeben, wird die gefilterte Liste unter dem "newIndex" abgelegt.
     * @param {Array<string|number>} colList - Spalten Namen oder Nummern nach dem Gruppiert wird. 
     * @param {Function} fu - Filterfunktion muss "true" oder "false" zurückgeben. Wenn "true" werden alle Datensätze der Gruppe in die gefilterte Liste aufgenommen.
     * @param {string|Array<string|number>} [index] - optionaler Index oder Liste von ID's, wenn Daten von einem bestehenden Index genommen werden. 
     * @param {string} [newIndexName] - Index unter dem die gefilterte Liste abgelegt wird.
     * @returns {Array<string|number>} Gefilterte Liste mit ID's
     */
    filterGroup(colList, fu, index, newIndexName) {
        // Aggregatfunktionen
        // count()
        // sum()
        // avg()
        // min()
        // max()


        // Daten zum Filtern
        const rowList = this.getIndex(index);
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
                const value = this.getCellValue(rowList[i], groupCols[j]);
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
            groupObjList.push(this.get(rowList[i]));
        } // for jeder Datensatz

        // Letze Gruppe
        if (fu(groupObjList)) {
            newList.push(...groupList);
            newObjList.push(...groupObjList);
        }

        // neuen Index speichern
        if (typeof newIndexName == "string") {
            this.#index.set(newIndexName, newList);
        } else if (typeof index == "string") {
            this.#index.set(index, newList);
        }
        return newList;
    }



    /**
     * Führt die angegebene Funktion für jeden Datensatz, oder jeden Datensatz im angegebenen index, aus.  
     * Als Parameter wird die Datenzeile als Objekt übergeben. 
     * @param {Function} fu - Funktion die pro Datensatz ausgeführt wird
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
     * Führt für jese Spalte die angegebene Funktion aus.
     * @param {function} fu - Funktion die für jede Spalte ausgeführt wird
     * @param {Array<string>} [cols] - Optional Namen der Spalten 
     * @returns {void}
     */
    forCols(fu, cols) {
        if (typeof fu != "function") { return; }
        if (!Array.isArray(cols)) {
            cols = this.#cols;
        }

        // alle Spalten durchgehen
        for (let i = 0; i < cols.length; i++) {
            // Format lesen
            const colFormat = this.getColDataFormat(cols[i]) || {};
            colFormat.name = cols[i];
            colFormat.type = this.getColType(cols[i]);

            // Funktion ausführen
            if (fu(colFormat, i, cols)) { break; };
        }
    }


    /**
     * Führt die Angegebene Funktion, pro Gruppierung nach den Angegebenen Spalten, aus.
     * @param {function} fu - Funktion die für jede Gruppierung aufgerufen wird.
     * @param {Array<string|number>} colList - Liste der Spalten nach denen Gruppiert wird.
     * @param {string|Array<string|number>} [index] - Optionaler Index der für die Gruppierung verwendet wird.
     * @returns {void}
     */
    forGroup(fu, colList, index) {
        // Aggregatfunktionen
        // count()
        // sum()
        // avg()
        // min()
        // max()


        // todo: Gruppen zusammenfassen auch wenn nicht soeriert


        // Daten zum Filtern
        const rowList = this.getIndex(index);
        // const rowList = this.sortRows(colList, index);
        if (typeof fu != "function") { return; }

        //const groupCols = this.getColNumbers(colList);
        const groupValues = new Array(colList.length);

        const groupIndex = new Map();

        /** @type {Array<Array<string|number>>} */
        const groupList = [];
        /** @type {Array<Array<string|number>>} */
        const groupObjList = [];

        // alle durchgehen
        for (let i = 0; i < rowList.length; i++) {
            let istNewGroup = false;
            const obj = this.get(rowList[i]);

            // Gruppenwert lesen
            //const groupValue = this.getColValues(rowList[i], colList).join("_");
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


            // // auf neue Gruppe prüfen
            // // for (let j = 0; j < groupCols.length; j++) {
            // for (let j = 0; j < colList.length; j++) {
            //     //const value = this.getCellValue(rowList[i], groupCols[j]);
            //     const value = obj[colList[j]]; // this.getCellValue(rowList[i], groupCols[j]);
            //     if (value != groupValues[j]) {
            //         // nur nach ersten Datensatz auf Gruppen Änderung prüfen
            //         if (i > 0) { istNewGroup = true; }

            //         // GruppenSpalten Wert merken
            //         groupValues[j] = value;
            //     }
            // }

            // // wenn neue gruppe
            // if (istNewGroup) {
            //     // Funktion ausführen
            //     if (fu(groupObjList, groupList, rowList)) { break; };

            //     // Gruppe zurücksetzen
            //     groupList = [];
            //     groupObjList = [];
            //     istNewGroup = false;
            // }

            // Datensatz in Gruppe
            //groupList.push(rowList[i])
            //groupObjList.push(this.get(rowList[i]));
            //groupObjList.push(obj);
        } // for jeder Datensatz

        // alle Gruppierten Listen durchgehen
        for (let i = 0; i < groupList.length; i++) {
            // funktion ausführen
            fu(groupObjList[i], groupList[i], rowList);
        }

        // Letze Gruppe Funktion ausführen
        // fu(groupObjList, groupList, rowList);
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


    // get Alias List
    /**
     * Erzeugt eine neue Liste mit referenzierten Datenzeilen und einer neuen ID-Spalte.
     * @param {string} newName - neuer ListenName
     * @param {string|Array<string>} newIdCols - Neue ID-Spalte(n)
     * @returns {GridList}
     */
    getAliasList(newName, newIdCols) {
        const newList = new GridList(newName, this.#cols, newIdCols);
        newList.#types = this.#types;
        newList.#formats = this.#formats;

        // Daten nach neuem ID-Feld setzen
        const rowList = this.getIndex();
        for (let i = 0; i < rowList.length; i++) {
            const row = this.#data.get(rowList[i]) || [];
            const newID = newList.getID(row) || i;
            newList.#data.set(newID, row);
        }

        newList.#data = this.#data;
        return newList;
    }


    /**
    * Erstellt eine Instanz der GridList
    * @constructor
    * @param {string} name - Javascript Objekt oder JSON-String
    * @param {Array<string|object>} [colList] - Optionale Liste mit Spaltennamen, oder ein Array mit Objekten, die in die liste geschrieben werden.
    * @param {string|Array<string>} [idCol] - Name der ID Spalte oder mehreren Splalten die die ID ergeben. Muss angegeben werden wenn colList angegeben.
    */
    constructor(name, colList, idCol) {
        this.name = name;
        if (Array.isArray(colList)) {
            if (typeof colList[0] == "string") {
                // Liste mit Spaltennamen
                this.setCols(colList, idCol || colList[0]);
            } else if (typeof colList[0] == "object") {
                // Liste mit Objeken für die neue Gridlist
                this.setColsFromObject(colList[0], idCol || "GSID");

                // alle Objekte in die Liste schreiben
                for (let i = 0; i < colList.length; i++) {
                    this.setObject(colList[i]);
                }
            }
        } // wenn colList
    } // constructor
} // Class GridList


// =================================
//   Anzeige UI
// -------------

export class GridView {
    /** @type {Array<string>} */
    #cols = [];
    /** @type {Array<string>} */
    #labels = [];

    /** Datum Anzeige Format @type {string} */
    dateFormat = "yyyy-mm-dd HH:MM:SS";

    /** Angezeigtes Dezimal Trennzeichen @type {string} */
    decimalSeparator = ".";


    /**
     * Setzt die Spalten
     * @param {Array<string>} colList - Listen mit Spalten Namen und Labels.
     * @returns {void}
     */
    setCols(colList) {
        if (!Array.isArray(colList)) { return; }

        // Spalten und Labels neu setzen
        this.#cols = new Array(colList.length);
        this.#labels = new Array(colList.length);

        // Alle neuen Spalten durchgehen
        for (let i = 0; i < colList.length; i++) {
            const names = colList[i].trim();
            const pos1 = names.indexOf(" ");
            if (pos1 > 0) {
                this.#cols[i] = names.substring(0, pos1);
                this.#labels[i] = names.substring(pos1 + 1);
            } else {
                this.#cols[i] = names;
                this.#labels[i] = names;
            }
        }
    }


    /**
     * Gibt die Liste mit spalten zurück
     * @returns {Array<string>}
     */
    getCols() {
        return this.#cols;
    }

    /**
     * Gibt die Liste mit Überschriften der Spalten zurück
     * @returns {Array<string>}
     */
    getLabels() {
        return this.#labels;
    }


    /**
     * Liefert einen HTML-String ohne dem "thead"-Tag zurück.
     * @param {GridList} list - GridListe mit Einstellungen für die Spalten
     * @returns {string} HTML-String ohne "thead"-Tag 
     */
    getThead(list) {
        let html = "<tr>";

        // alle Spalten durchgehen
        for (let i = 0; i < this.#cols.length; i++) {
            const colName = this.#cols[i];
            if (list.getColType(colName) == "number") {
                html += "<th text-r>" + this.#labels[i] + "</th>";
            } else {
                html += "<th>" + this.#labels[i] + "</th>";
            }
        }
        return html + "</tr>";
    }


    /**
     * Lieftert einen HTML-String der Datenzeile zurück.
     * @param {GridList} gridList - Liste mit den Daten
     * @param {object} obj - Datensatz Objekt
     * @returns {string} HTML Sting der Datenzeile
     */
    getTr(gridList, obj) {
        const id = gridList.getID(obj);
        let html = `<tr data-id="${id}">`;

        // Alle Spalten durchgehen
        for (let j = 0; j < this.#cols.length; j++) {
            const colName = this.#cols[j];
            const colType = gridList.getColType(colName);
            const colFormat = gridList.getColDataFormat(colName) || {};

            // todo: Wertprüfung
            if (colType == "number") {
                // todo: format Number, basis "." oder ","???
                let numString = formatNumber(obj[colName], colFormat.decimals || 0, this.decimalSeparator, true);
                html += "<td text-r>" + numString + "</td>";
            } else {
                // auf Datum Prüfen
                if (colFormat && colFormat.date && this.dateFormat) {
                    html += "<td>" + formatDate(obj[colName], this.dateFormat) + "</td>";
                } else {
                    html += "<td>" + obj[colName] + "</td>";
                }
            }
        }
        return html + "</tr>";
    }


    /**
     * Lieferet einen Table Body HTML-String ohne "tbody"-Tag zurück.
     * @param {GridList} gridList - Gridliste
     * @param {string} [index] - Name vom Index
     * @returns {string} HTML-String ohne dem Tag "tbody"
     */
    getTbody(gridList, index) {
        let html = "";
        const idList = gridList.getIndex(index);

        // alle ID's durchgehen
        for (let i = 0; i < idList.length; i++) {
            const obj = gridList.get(idList[i]);
            html += this.getTr(gridList, obj);
        }

        return html;
    }


    /**
     * Liefert einen HTML-String von einem TableBody(ohne "tbody"-Tag) zurück, 
     * @param {GridList} gridList - GridListe mit den Daten
     * @param {Array<object>} objList - Liste mit Objekten die aus der Gridliste heraus generiert worden sind.
     * @returns {string} HTML-String ohne "tbody"-Tag
     */
    getTbodyFromObjList(gridList, objList) {
        let html = "";

        // alle ID's durchgehen
        for (let i = 0; i < objList.length; i++) {
            html += this.getTr(gridList, objList[i]);
        }

        return html;
    }


    getDatalistHTML(id, list) {
        let html = `<datalist id="${id}">`;

        // Wenn Array
        if (Array.isArray(list)) {
            for (let i = 0; i < list.length; i++) {
                html += `<option value="${list[i]}">`;
            }
        } else if (typeof list == "object") {
            const keys = Object.keys(list);
            for (let i = 0; i < keys.length; i++) {
                html += `<option value="${list[keys[i]]}">${keys[i]}</option>`;
            }
        }

        return html + "</datalist>";
    }

    /**
     * Liefert eine Formular Eingabe HTML String zurück.
     * @param {GridList} gridList - GridListe mit Daten
     * @param {string|number} [id] - Optionale Datensatz ID wenn Werte im Formular angezeigt werden sollen 
     * @returns {string} HTML-String
     */
    getFormBody(gridList, id) {
        let optionListHtml = "";
        let optionNames = new Map();
        let html = "";

        let obj = {};
        if (id != undefined) {
            obj = gridList.get(id);
        }

        // Alle Spalten durchgehen
        for (let i = 0; i < this.#cols.length; i++) {
            const colName = this.#cols[i];
            const colLabel = this.#labels[i];
            const colType = gridList.getColType(colName);
            const colFormat = gridList.getColDataFormat(colName) || {};


            let attr_required = "";
            let attr_min = "";
            let attr_max = "";
            let attr_minSize = "";
            let attr_maxSize = "";
            let attr_step = "";
            let attr_pattern = "";
            let attr_readonly = "";
            let attr_list = "";
            let attr_value = "";

            // wenn eine ID
            if (id !== undefined) {
                attr_value = ` value="${obj[colName]}"`;
            } else if (colName == "GSID") {
                attr_value = ` value="${GSID()}"`;
            }

            if (colFormat) {
                // Erforderlich
                if (colFormat.required) { attr_required = ' required'; }
                if (colFormat.inlist) {
                    // Wenn noch kein HTML für Optionen vorhanden
                    if (!optionNames.has(colFormat.inlist)) {
                        optionListHtml += this.getDatalistHTML(colFormat.inlist, ENUM[colFormat.inlist]);
                        optionNames.set(colFormat.inlist, "OK");
                    }
                    attr_list = ` list="${colFormat.inlist}"`;
                }
                if (colFormat.min != undefined) { attr_min = ` min="${colFormat.min}"`; }
                if (colFormat.max != undefined) { attr_max = ` max="${colFormat.max}"`; }
                if (colFormat.minSize != undefined) { attr_minSize = ` minlength="${colFormat.minSize}"`; };
                if (colFormat.maxSize != undefined) { attr_maxSize = ` maxlength="${colFormat.maxSize}"`; };
                if (colFormat.decimals != undefined) {
                    let decimals = formatNumber(0, colFormat.decimals, ".");
                    decimals = decimals.substring(0, decimals.length - 1) + "1";
                    attr_step = ` step="${decimals}"`;
                }
                if (colFormat.regex != undefined) { attr_pattern = ` pattern="${colFormat.regex}"`; }
                if (colFormat.readonly) { attr_readonly = " readonly"; }
            }

            // "required", "min", "max", "minlength", "maxlength", "step", "pattern"

            let labelHTML = "";

            // Jede eingabe in einen Absatz
            html += "<p>";

            // Label erstellen
            labelHTML = `<label for="${colName}">${colLabel}</label><br>`;

            //console.log("colType:", colName, colType);
            switch (colType) {
                case "number":
                    // wenn number
                    html += labelHTML;

                    // "required", "min", "max", "step", "pattern", "readonly"
                    html += `<input id="${colName}" name="${colName}" type="number"${attr_list}${attr_min}${attr_max}${attr_step}${attr_pattern}${attr_required}${attr_readonly}${attr_value}>`;
                    break;

                case "boolean":
                    // "required", "readonly"
                    html += `<input id="${colName}" name="${colName}" type="checkbox"${attr_required}${attr_readonly}${attr_value}>`;
                    html += labelHTML;
                    break;

                case "object":
                    // todo:
                    break;

                case "list":
                    // todo:
                    html += labelHTML;

                    // "required", "readonly"
                    html += `<input id="${colName}" name="${colName}" type="number"${attr_list}${attr_required}${attr_readonly}${attr_value}>`;
                    break;

                case "string":
                    if (colFormat?.charToBool) {
                        // "required", "readonly"
                        html += `<input id="${colName}" name="${colName}" type="checkbox"${attr_required}${attr_readonly}${attr_value}>`;
                        html += labelHTML;
                    } else {
                        html += labelHTML;

                        // "required", "minlength", "maxlength", "pattern"
                        if (colFormat?.date) {
                            switch (colFormat.date) {
                                case "date":
                                    html += `<input id="${colName}" name="${colName}" type="date"${attr_required}${attr_readonly}${attr_value}>`;
                                    break;
                                case "datetime":
                                    html += `<input id="${colName}" name="${colName}" type="date"${attr_required}${attr_readonly}${attr_value}>`;
                                    break;
                                case "period":
                                    // todo: ???
                                    //html += `<input id="${colName}" type="date">`;
                                    break;
                                case "time":
                                    html += `<input id="${colName}" name="${colName}" type="text" style="width: 10em;${attr_required}${attr_readonly}"${attr_value}>`;
                                    break;
                                default:
                                    break;
                            }
                        } else if (colFormat?.password) {
                            html += `<input id="${colName}" name="${colName}" type="password"${attr_minSize}${attr_maxSize}${attr_pattern}${attr_required}${attr_readonly}${attr_value}>`;
                        } else if (attr_list) {
                            // Auswahl Liste
                            html += `<input id="${colName}" name="${colName}" type="select"${attr_list}${attr_minSize}${attr_maxSize}${attr_pattern}${attr_required}${attr_readonly}${attr_value}>`;
                        } else {
                            // kein Datum
                            html += `<input id="${colName}" name="${colName}" type="text"${attr_list}${attr_minSize}${attr_maxSize}${attr_pattern}${attr_required}${attr_readonly}${attr_value}>`;
                        }
                    } // else Umwandlung in Boolean
                    break;
                default:
                    break;
            } // switch colType

            // Absatz schiessen
            html += "</p>";
        } // for Cols

        // HTML String zurückgeben
        return optionListHtml + html;
    } // getFormBody


    /**
     * Setzt die Werte in ein HTML Formular
     * @param {HTMLFormElement} formElm - HTML Form
     * @param {GridList} gridList - GridListe mit den Daten
     * @param {string|number} id - ID des Datensatzes
     * @returns {void}
     */
    setFormValues(formElm, gridList, id) {
        if (!(formElm instanceof HTMLFormElement)) { return; }
        // wenn eine ID
        if (id !== undefined) {
            let obj = gridList.get(id);
            let cols = this.getCols();
            // alle FormularFelder
            for (let i = 0; i < cols.length; i++) {
                const elm = formElm?.querySelector(`[name="${cols[i]}"`);
                if (elm instanceof HTMLInputElement) {
                    elm.value = obj[cols[i]];
                }
            }
        }
    }


    /**
     * @constructor
     * @param {Array<string>} [cols] - Spalten für Liste oder Tabellen Anzeige
     */
    constructor(cols) {
        if (cols) {
            this.setCols(cols);
        }
    }
} // InfoView


// =================================
//   Navigation
// -------------

export class GridNav {
    /** Navigation Name */
    name = "";

    #rowIndex = -1;
    get rowIndex() { return this.#rowIndex; }
    #colIndex = 0;
    get colIndex() { return this.#colIndex; }

    #minRow = 0;
    #minCol = 0;

    #maxRow = -1;
    #maxCol = -1;

    #isForm = false;
    #isTable = false;

    /** Wenn "Enter" gedrückt wird @type {function} */
    okFunction;

    /** Wenn "CTRL"+"Enter" gedrückt wird @type {function} */
    ctrlOkFunction;

    /** Wenn " " (Leerzeichen) gedrückt wird @type {function} */
    spaceFunction;

    /** Wenn "Insert" gedrückt wird @type {function} */
    addFunction;

    /** Wenn "Delete" gedrückt wird @type {function} */
    removeFunction;

    /** Wenn "ESC" gedrückt wird @type {function} */
    cancelFunction;

    /** Wenn diese Navigation AKTIV gesetzt wird @type {function} */
    onActiveFunction;

    /** @type {GridNav} */
    #lastNav
    get lastNav() {
        return this.#lastNav;
    }
    set lastNav(value) {
        if (value instanceof GridNav) {
            this.#lastNav = value;
        }
    }

    /** @type {string|number} */
    #activeID
    get id() { return this.#activeID; }

    /** @type {HTMLElement|null} */
    #activeElm

    /** @type {HTMLElement|null|undefined} */
    #elm
    set elm(newElm) {
        if (!newElm) { return; }
        this.#elm = newElm;
        this.#isForm = false;
        this.#isTable = false;
        if (newElm instanceof HTMLFormElement) {
            this.#isForm = true;
            this.#isTable = false;
            this.#maxRow = newElm.children.length - 1;
            this.#minRow = 0;
        } else if (newElm instanceof HTMLTableElement) {
            this.#isTable = true;
            this.#isForm = false;
            this.#maxRow = newElm.rows.length - 1;
            this.#minRow = 1;
            this.#maxCol = newElm.rows[0].cells.length - 1;
        } else {
            this.#maxRow = newElm.children.length - 1;
            this.#minRow = 0;
        }
    }
    get elm() {
        return this.#elm;
    }

    /** ob die View Aktiv ist */
    #isActive = false;
    set isActive(value) {
        if (value == true) {
            if (activeNav instanceof GridNav) {
                // nur setzen wenn noch keine letzte Navigation vorhanden
                if (!this.#lastNav) {
                    this.#lastNav = activeNav;
                }
                activeNav.isActive = false;
            }
            activeNav = this;

            // if (this.#isForm) {
            //     this.#rowIndex = -1;
            // }
            // Element neu setzen, da sich die Anzahl der Rows oder Kind-Elemente verändertr haben könnte.
            this.elm = this.elm;
            // console.log("#activeElm:", this.#activeElm);

            // Wen Index größer als max
            if (this.#rowIndex > this.#maxRow) {
                this.#rowIndex = this.#maxRow;
            }
            if (this.#colIndex > this.#maxCol) {
                this.#colIndex = this.#maxCol;
            }
            // Wen Index kleiner als max
            if (this.#rowIndex < this.#minRow) {
                this.#rowIndex = this.#minRow;
            }
            if (this.#colIndex < this.#minCol) {
                this.#colIndex = this.#minCol;
            }

            let aElm;
            if (this.#isTable && this.#elm instanceof HTMLTableElement) {
                aElm = this.#elm.rows[this.#rowIndex || 0];
                if (aElm instanceof HTMLTableRowElement) {
                    aElm = aElm.cells[this.#colIndex || 0];
                }
            } else {
                aElm = this.#elm?.children[this.#rowIndex];
            }
            if (aElm instanceof HTMLElement) {
                this.setActiveElm(aElm);
            }

            // Wenn Funktion gesetzt
            if (typeof this.onActiveFunction == "function") {
                this.onActiveFunction();
            }
        }

        this.#isActive = value;
    }
    get isActive() { return this.#isActive; }


    /**
     * Setzt diese Navigation als AKTIV
     * @param {number} [rowNumber] - Optional ZeilenNummer
     * @param {number} [colNumber] - Optional SpaltenNummer
     */
    setActive(rowNumber, colNumber) {
        if (rowNumber != undefined && rowNumber >= 0) {
            this.#rowIndex = rowNumber;
        }
        if (colNumber != undefined && colNumber >= 0) {
            this.#colIndex = colNumber;
        }
        this.isActive = true;
    }


    /**
     * Setzt ein HTMLElement als aktives Element
     * @param {HTMLElement|Element|null} elm - Element welches "active" gesetzt wird 
     */
    setActiveElm(elm) {
        // Wenn bereits ein Aktives Element
        if (this.#activeElm instanceof HTMLElement) {
            this.#activeElm.classList.remove("active");
        }

        if (elm instanceof HTMLElement) {
            elm.classList.add("active");
            this.#activeElm = elm;
            elm.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });

            // Wenn Formular, dann INPUT fokusieren
            if (this.#elm instanceof HTMLFormElement) {
                const input = elm.querySelector("input");
                if (input instanceof HTMLInputElement) {
                    input.focus();
                    input.select();
                    //input.setSelectionRange(0, input.value.length);
                }
            } // wenn Formular

        } else {
            this.#activeElm = null;
        }
    }


    /**
    * Wenn eine Taste gedrückt wird
    * @param {KeyboardEvent} e - Tastatur Event
    */
    onKeyDown(e) {
        //console.log("repeat:", e.repeat);
        //console.log("key:", e.key);
        // console.log("isActive:", this.isActive);

        // wenn nicht aktiv dann nicht darauf reagieren
        if (!this.isActive == true) { return; }

        // Wenn wiederholung(Taste wird lange gehalten) dann abbrechen
        if (e.repeat) {
            if ("ArrowDown,ArrowUp,ArrowRight,ArrowLeft,PageDown,PageUp".indexOf(e.key) < 0) {
                return;
            }
        }

        // toto: auf Liste, Zeile und Spalte prüfen oder auf Formular prüfen
        let rowIndex = this.#rowIndex;
        let colIndex = this.#colIndex;

        // wenn CTRL
        if (e.ctrlKey) {
            switch (e.key) {
                case "s":
                    // todo: Speichern
                    if (this.#isForm) {
                        e.preventDefault();
                        if (this.#elm instanceof HTMLFormElement) {
                            // Formdaten an OK Funktion schicken
                            const formData = new FormData(this.#elm);
                            if (typeof this.okFunction == "function") {
                                this.okFunction(formData);
                            }
                        }
                    }
                    return;
                    break;
                case "Enter":
                    // Zeile Bearbeiten

                    if (typeof this.ctrlOkFunction == "function") {
                        e.preventDefault();
                        // todo: parameter
                        this.ctrlOkFunction();
                    }
                    return;
                    break;
                case "Home":
                    // Ganz nach links
                    e.preventDefault();
                    colIndex = this.#minCol;
                    break;
                case "End":
                    // ans Ende der Zeile
                    e.preventDefault();
                    colIndex = this.#maxCol;
                    break;
                case "ArrowLeft":
                    // Ganz nach links
                    e.preventDefault();
                    colIndex = this.#minCol;
                    break;
                case "ArrowRight":
                    // ans Ende der Zeile
                    e.preventDefault();
                    colIndex = this.#maxCol;
                    break;

            } // switch
        } else {
            // hier keine CTRL Taste

            // Je nach taste
            switch (e.key) {
                case "Tab":
                    // index ändern
                    // todo: colIndex
                    e.preventDefault();
                    if (e.shiftKey) {
                        rowIndex -= 1;
                    } else {
                        rowIndex += 1;
                    }
                    break;
                case "Insert":
                    // neue zeile hinzufügen
                    if (typeof this.addFunction == "function") {
                        // todo Parameter
                        this.addFunction();
                    }
                    break;
                case "Delete":
                    // Zeile löschen
                    if (typeof this.removeFunction == "function") {
                        // todo: parameter
                        this.removeFunction();
                    }
                    break;
                case "Enter":
                    // Zeile Bearbeiten

                    // alles Stoppen
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    if (typeof this.okFunction == "function") {
                        // todo: parameter
                        this.okFunction();
                    }
                    break;
                case " ": // Spacebar (neu)
                    // Leertaste
                    if (typeof this.spaceFunction == "function") {
                        e.preventDefault();
                        // todo: parameter
                        this.spaceFunction();
                    }
                    break;
                case "Spacebar": // (alt)
                    // Leertaste
                    if (typeof this.spaceFunction == "function") {
                        e.preventDefault();
                        // todo: parameter
                        this.spaceFunction();
                    }
                    break
                case "ArrowDown":
                    // Nächte Zeile
                    e.preventDefault();
                    rowIndex += 1;
                    break;
                case "ArrowUp":
                    // vorige Zeile
                    e.preventDefault();
                    rowIndex -= 1;
                    break;
                case "Home":
                    // Ganz nach oben
                    if (!this.#isForm) {
                        e.preventDefault();
                        rowIndex = this.#minRow;
                    }
                    break;
                case "End":
                    // ans Ende
                    if (!this.#isForm) {
                        e.preventDefault();
                        rowIndex = this.#maxRow;
                    }
                    break;
                case "ArrowRight":
                    // todo: nach rechts
                    if (this.#isTable) {
                        e.preventDefault();
                        colIndex += 1;
                    }
                    break;
                case "ArrowLeft":
                    // todo: nach links
                    if (this.#isTable) {
                        e.preventDefault();
                        colIndex -= 1;
                    }
                    break;
                case "PageDown":
                    // 10 Zeilen nach unten
                    e.preventDefault();
                    rowIndex += 10;
                    break;
                case "PageUp":
                    // 10 Zeilen nach oben
                    e.preventDefault();
                    rowIndex -= 10;
                    break;
                case "Escape":
                    // Abbrechen
                    if (typeof this.cancelFunction == "function") {
                        // todo: Abbruch Funktion
                        this.cancelFunction();
                    }
                    break;
            } // switch
        } // else CTRL


        // Wenn sich der Index geäntert hat
        //console.log("rowindex:", rowIndex, this.#rowIndex);
        //console.log("maxRow:", this.#maxRow);
        if (rowIndex != this.#rowIndex) {
            if (rowIndex > this.#maxRow) {
                rowIndex = this.#maxRow;
            }
            if (rowIndex < this.#minRow) {
                rowIndex = this.#minRow;
            }
            this.#rowIndex = rowIndex;

            // todo: showAktiveElement
            if (this.#isTable && this.#elm instanceof HTMLTableElement) {
                const elm = this.#elm.rows[rowIndex || 0];
                if (elm) {
                    this.#activeID = elm.dataset.id || -1;
                    this.setActiveElm(elm.cells[this.#colIndex || 0]);
                }
                //this.setActiveElm(this.#elm.rows[rowIndex]);
            } else if (this.#elm instanceof HTMLElement) {
                // Kindelement suchen
                let elm = this.#elm?.children[this.#rowIndex];
                if (elm) {
                    // Aktives Element setzen
                    this.setActiveElm(elm);
                    if (elm instanceof HTMLElement) {
                        this.#activeID = elm.dataset.id || -1;
                    }

                    // // Wenn Formular, dann INPUT fokusieren
                    // if (this.#elm instanceof HTMLFormElement) {
                    //     const input = elm.querySelector("input");
                    //     if (input instanceof HTMLInputElement) {
                    //         input.focus();
                    //         input.select();
                    //         //input.setSelectionRange(0, input.value.length);
                    //     }
                    // } // wenn Formular
                } // wenn element
            } // if else Tabellenelement
        }
        if (colIndex != this.#colIndex) {
            if (colIndex > this.#maxCol) { colIndex = this.#maxCol; }
            if (colIndex < 0) { colIndex = 0; }

            if (this.#isTable && this.#elm instanceof HTMLTableElement) {
                const elm = this.#elm.rows[rowIndex || 0];
                this.#activeID = elm.dataset.id || -1;
                this.setActiveElm(elm.cells[colIndex]);
            }
            this.#colIndex = colIndex;
        }
    } // Taste prüfen


    /**
     * Wenn auf ein Element geklickt wird
     * @param {MouseEvent} e - Maus Event  
     */
    onClick(e) {
        if (this.isActive == false) { return; }
        // wenn Liste
        //if (this.#isTable) {
        let target = e.target;
        if (target instanceof HTMLElement) {
            let rowElm = target.closest("[data-id]");
            if (rowElm instanceof HTMLElement) {
                this.#activeID = rowElm.dataset.id || -1;
                this.setActiveElm(rowElm);

                // wenn OK Funktion
                if (typeof this.okFunction == "function") {
                    e.preventDefault();
                    // todo: parameter
                    this.okFunction();
                }
            }
        }
        //}
    } // onClick


    /**
     * Bindet eine Navigation an ein HTML Element
     * @param {string} name - Name der Navigation
     * @param {HTMLElement|null|undefined} [elm] - HTML Tabelle oder Formular
     */
    constructor(name, elm) {
        this.name = name;
        if (elm instanceof HTMLElement) {
            this.elm = elm;
        }
    }
} // GridNav
