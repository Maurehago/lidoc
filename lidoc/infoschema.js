// =========================
//  Schema und Typen 
// =========================
// @ts-check

// Basis Typen: string, number, boolean, object, enum
// Datum Typen: date, time, datetime, range

export * from "./infodata.js";
import { DataMap, getGSID } from "./infodata.js";

/**
 * Optionen für DataType
 * @typedef {object} DataTypeOptions
 * @property {"string"|"number"|"boolean"|"object"|"enum"|"group"|"choice"|"multi"} [art] - BasisTyp - default "string"
 * @property {string|Array<string>} [base] - BasisTyp(abgeleitet von) der Eigenschaft.
 * @property {number} [length] - Exakte Länge eines Strings oder Anzahl Zeichen bei Nummern
 * @property {number} [minLength] - Minimale Länge eines Strings
 * @property {number} [maxLength] - Maximale Länge eines Strings
 * @property {string} [pattern] - Regular Expression
 * @property {string} [whitespace] - Wie wird mit Leerzeichen umgegangen
 * @property {"camelCase"|"PascalCase"|"snake_case"|"lower"|"upper"} [casing] - Schreibweise für String. Wenn nicht angegeben dann ist es egal.
 * @property {number} [decimals] - Anzahl der Dezimalstellen
 * @property {string|number} [minInclusive] - Minimaler Wert inclusive
 * @property {string|number} [minExclusive] - Minimaler Wert größer als
 * @property {string|number} [maxExclusive] - Maximaler Wert kleiner als
 * @property {string|number} [maxInclusive] - Maximaler Wert inclusive
 * @property {string|Array<string>} [id] - Name einer Property oder Liste mit Properties die die Eindeutige ID des Objektes/Datensatzes ergeben
 */

/** @type {DataTypeOptions} */
export const DataTypeOptions = {};


/**
 * Optionen für PropItem
 * @typedef {object} PropItemOptions
 * @property {string|Array<string>} [itemType] - TypName oder Liste von TypNamen - default "string"
 * @property {number} [min] - Minimales Vorkommen, 0: optional
 * @property {number} [max] - Maximales Vorkommen, 0: darf nicht vorkommen, -1: darf unendlich vorkommen
 * @property {any} [defaultValue] - Standard Wert
 * @property {any} [fix] - fixer Wert, es darf kein anderer Wert vorkommen
 * @property {string} [use] - Name der Gruppierung in der die Property vorkommt. Wenn nicht angegeben ist die Eigenschaft immer zu behandeln.
 */

/** @type {PropItemOptions} */
export const PropItemOptions = {};


/** @type {Map<string,Schema>} */
const SchemaList = new Map();



// ==============================
//   Klassen
// -----------

class InfoText {
    GSID = "";

    /** @type {string} Zuordnung Referenz */
    refID = "";

    /** @type {"schema"|"DataType"|"PropItem"|"EnumItem"|"UniqueItem"|"RefItem"} Zuordnung Referenz Typ */
    refType = "DataType";

    /** @type {string} Sprache */
    lang = "de";

    /** @type {string} Datum(ISO) */
    date = new Date().toISOString().substring(0, 10);

    /** @type {string} InfoText */
    text = "";

    constructor() {
        this.GSID = getGSID();
    }
}


class RefItem {
    GSID = "";

    /** @type {string} Name/GSID des DatenTypes */
    dataType_name = "";

    /** @type {string} */
    name = "";

    /** @type {Array<string>} Selector für Eigenschaften vom Aktuellen objekt */
    props = [];

    /** @type {string} Pfad des Fremd Objektes */
    refObj = "";

    /** @type {Array<string>} Selector für Eigenschaften vom Referenzierten objekt */
    refProps = [];

    /** @type {"NO"|"UPDATE"|"NULL"|"DEFAULT"} Regel für Update */
    onUpdate = "UPDATE";

    /** @type {"NO"|"DELETE"|"NULL"|"DEFAULT"} Regel für Löschen */
    onDelete = "DELETE";

    constructor() {
        this.GSID = getGSID();
    }
}



class UniqueItem {
    GSID = "";

    /** @type {string} Name/GSID des DatenTypes */
    dataType_name = "";

    /** @type {string} */
    name = "";

    /** @type {Array<string>} Feigenschaftsnamen(Properties) die zusammen eine Eindeutigkeit ergeben */
    props = [];

    constructor() {
        this.GSID = getGSID();
    }
}


class EnumItem {
    GSID = "";
    
    /** @type {string} Datentyp Name/GSID */
    dataType_name = "";

    /** @type {string} */
    name = "";
    /** @type {string|number} */
    value = "";

    constructor() {
        this.GSID = getGSID();
    }
}



class PropItem {
    GSID = "";

    /** @type {string} Name/GSID des Datentyp-Objektes */
    dataType_name = "";

    /** @type {string} Name der Eigenschaft/Attribute bei Attribute ein "@" vor dem Namen */
    name = "";

    /** @type {string} TypName oder Liste von TypNamen - default "string" */
    itemType = "string";

    /** @type {number} Minimales Vorkommen der Spalte/Attribute / optional: 0 / default: 1 */
    min = 1;
    /** @type {number} Maximales Vorkommen der Spalte/Attribute / unendlich: -1 / default: 1 */
    max = 1;

    /** @type {any} Standard Wert */
    defaultValue;
    /** @type{any} - Fixer Wert */
    fix;

    /** @type {string|undefined} Bedingung, wann die Eigenschaft/Attribute vorkommt. Wenn nicht angegegeben dann immer verwenden. */
    use = "";

    constructor() {
        this.GSID = getGSID();
    }
}


// DataType:
class DataType {
    /** @type {string} Name des Datentypes */
    name = "";

    /** @type {string} Pfad innerhalb des Schemas */
    schemaPath = "";

    /** @type {"string"|"number"|"boolean"|"object"|"enum"|"group"|"choice"|"multi"} BasisTyp - default "string" */
    art = "string";

    /** @type {string|Array<string>} BasisTyp(abgeleitet von) der Eigenschaft. */
    base = "";

    // --- String Eigenschaften ---
    /** @type {number|undefined} exakte Länge (für string, number(anzahl der zeichen ohne Vorzeichen), object?) */
    length;
    /** @type {number|undefined} Minimale Anzahl Zeichen (für string) */
    minLength;
    /** @type {number|undefined} Maximale Anzahl Zeichen (für string) */
    maxLength;
    /** @type {string|undefined} Regular Expression (für string) */
    pattern;
    /** @type {string|undefined} wie wird mit Leerzeichen umgegangen (für string) */
    whitespace;
    /** @type {"camelCase"|"PascalCase"|"snake_case"|"lower"|"upper"|undefined} (für string) */
    casing;

    // --- Number Eigenschaften ---
    /** @type {number|undefined} Anzahl der Dezimalstellen (für number) */
    decimals;
    /** @type {number|string|undefined} Minimum Wert inclusive angegebenen Wert (für number, date, time, datetime, range) */
    minInclusive;
    /** @type {number|string|undefined} Minimum Wert größer angegebenen Wert (für number, date, time, datetime, range) */
    minExclusive;
    /** @type {number|string|undefined} Maximalwert kleiner angegebenen Wert (für number, date, time, datetime, range) */
    maxExclusive;
    /** @type {number|string|undefined} Maximalwert kleiner gleich angegebenen Wert (für number, date, time, datetime, range) */
    maxInclusive;

    // --- Enum Eigenschaft ---
    // Enum Items aus der Enum Item Liste mit Datentyp GSID

    // --- Objekt Eigenschaften ---
    // Properties aus der Property Liste mit GSID

    /** @type {string|Array<string>} Name einer Property oder Liste mit Properties die die Eindeutige ID des Objektes/Datensatzes ergeben */
    id = "GSID";

    //--- Referenzen aus der refID Liste mit GSID */

    //--- Unique aus der uniqueID Liste mit GSID */
}



// Schema Klasse
export class Schema {
    /** @type {string} Name des Schemas */
    #name = "";
    get name() {
        return this.#name;
    }

    /** @type {DataMap<InfoText>}  Informationen zum Schema*/
    #infoList = new DataMap(InfoText);

    /** @type {DataMap<InfoText>} APP Informationen zum Schema*/
    #appinfoList = new DataMap(InfoText);

    /** @type {Map<string,string>} Schema Attribute */
    attributes = new Map(); // Sind Daten und keine Typen!

    /** @type {DataMap<DataType>} Schema Globale DatenTypen */
    #dataTypeList = new DataMap(DataType, "name");

    /** @type {DataMap<PropItem>} Schema Globale Propertys */
    #propItemList = new DataMap(PropItem);

    /** @type {DataMap<EnumItem>} Schema Globale Enums */
    #enumItemList = new DataMap(EnumItem);

    /** @type {DataMap<RefItem>} Schema Globale Referenzen */
    #refItemList = new DataMap(RefItem);

    /** @type {DataMap<UniqueItem>} Unique Liste */
    #uniqueItemList = new DataMap(UniqueItem);


    /**
     * Fügt ein neues Datentyp Objekt hinzu
     * @param {string} typeName - Name des DatenTyps
     * @param {DataTypeOptions} [options] - Optional Optionen für den Datentyp
     * @returns {string} Name des Datentypes
     */
    addDataType(typeName, options) {
        const dataType = new DataType();
        Object.assign(dataType, options);
        dataType.name = typeName;
        this.#dataTypeList.set(typeName, dataType);
        return typeName;
    }


    /**
     * Fügt eine neue Eigenschaft/Atribute zu einem Datentyp hinzu
     * @param {string} typeName - Name des DatenTyps
     * @param {string} propertyName - Name der Eigenschaft
     * @param {PropItemOptions} [options] - Optional Optionen für die Eigenschaft
     * @returns {string} GSID der Eigenschaft
     */
    addProperty(typeName, propertyName, options) {
        let dataType = this.#dataTypeList.get(typeName);
        if (!dataType) {
            dataType = new DataType();
            dataType.name = typeName;
            this.#dataTypeList.set(typeName, dataType);
        }
        dataType.art = "object";

        const prop = new PropItem();
        Object.assign(prop, options);
        prop.name = propertyName;
        prop.dataType_name = typeName;
        this.#propItemList.set(prop.GSID, prop);
        return prop.GSID;
    }


    /**
     * Fügt einen BaseType zu einer Property hinzu. Wenn Base des DataType noch kein Array ist, wird der bestehende base durch ein Array mit dem neuen TypeNamen ersetzt.
     * @param {string} typeName - ID der Property
     * @param {string|Array<string>} baseName - Name des Types der hinzugefügt wird
     */
    addDataTypeBase(typeName, baseName) {
        let dataType = this.#dataTypeList.get(typeName);
        if (!dataType) {
            dataType = new DataType();
            dataType.name = typeName;
            this.#dataTypeList.set(typeName, dataType);
        }
        dataType.art = "multi";
        if (Array.isArray(dataType.base)) {
            if (Array.isArray(baseName)) {
                dataType.base.concat(baseName);
            } else {
                dataType.base.push(baseName);
            }
        } else {
            if (Array.isArray(baseName)) {
                dataType.base = baseName;
            } else {
                dataType.base = [baseName];
            }
        }
    }


    /**
     * Fügt eine neues EnumItem zu einem Datentyp hinzu
     * @param {string} typeName - Name des DatenTyps
     * @param {string} name - Name vom EnumItem
     * @param {string|number} [value] - Optional Wert vom Enum Item. Wenn nicht angegeben wird der Name als Wert genommen.
     */
    addEnumItem(typeName, name, value) {
        let dataType = this.#dataTypeList.get(typeName);
        if (!dataType) {
            dataType = new DataType();
            dataType.name = typeName;
            this.#dataTypeList.set(typeName, dataType);
        }
        dataType.art = "enum";

        const item = new EnumItem();
        item.dataType_name = typeName;
        item.name = name;
        item.value = value || name;
        this.#enumItemList.set(item.GSID, item);
    }

    /**
     * Fügt einem Typ ein Referenz Item hinzu
     * @param {string} typeName - Name des Types dem das Unique hinzugefügt wird
     * @param {string} refName - Referenz Bezeichner
     * @param {Array<string>} fieldList - Felder des Objektes das den Unique erzeugt
     * @param {string} refTypeName - Referenz Typ Name
     * @param {Array<string>} refFieldList - Felder des Referenz Types das mit den Feldern des Types verknüpft sind.
     * @param {"NO"|"UPDATE"|"NULL"|"DEFAULT"} [onUpdate] - Optional was bei einem Update weiter gegeben wird. Default: "UPDATE"
     * @param {"NO"|"NULL"|"DEFAULT"|"DELETE"} [onDelete] - Optional was beim Löschen weiter gegeben wird. Default: "DELETE"
     */
    addRefItem(typeName, refName, fieldList, refTypeName, refFieldList, onUpdate, onDelete) {
        let dataType = this.#dataTypeList.get(typeName);
        if (!dataType) {
            dataType = new DataType();
            dataType.name = typeName;
            this.#dataTypeList.set(typeName, dataType);
        }
        dataType.art = "object";
        const item = new RefItem();
        item.dataType_name = typeName;
        item.name = refName;
        item.props = fieldList;
        item.refObj = refTypeName;
        item.refProps = refFieldList;
        item.onUpdate = onUpdate || "UPDATE";
        item.onDelete = onDelete || "DELETE";
        this.#uniqueItemList.set(item.GSID, item);
    }

    /**
     * Fügt einem Typ ein Unique Item hinzu
     * @param {string} typeName - Name des Types dem das Unique hinzugefügt wird
     * @param {string} uniqueName - Unique Bezeichner
     * @param {Array<string>} fieldList - Felder des Objektes das den Unique erzeugt
     */
    addUniqueItem(typeName, uniqueName, fieldList) {
        let dataType = this.#dataTypeList.get(typeName);
        if (!dataType) {
            dataType = new DataType();
            dataType.name = typeName;
            this.#dataTypeList.set(typeName, dataType);
        }
        dataType.art = "object";
        const item = new UniqueItem();
        item.dataType_name = typeName;
        item.name = uniqueName;
        item.props = fieldList;
        this.#uniqueItemList.set(item.GSID, item);
    }


    /**
     * Setzt Optionen für einen Datentyp
     * @param {string} typeName - Name des DatenTyps
     * @param {DataTypeOptions} options - Optionen für den Datentyp
     */
    setDataTypeOptions(typeName, options) {
        let dataType = this.#dataTypeList.get(typeName);
        if (!dataType) {
            dataType = new DataType();
            dataType.name = typeName;
            this.#dataTypeList.set(typeName, dataType);
        }
        Object.assign(dataType, options);
        dataType.name = typeName;
    }


    /**
     * Setzt Eigenschaften für eine Property
     * @param {string} propID - Eindeutige ID(GSID) der Property
     * @param {PropItemOptions} options - Optionen für die Property
     */
    setPropOptions(propID, options) {
        let prop = this.#propItemList.get(propID);
        if (prop) {
            Object.assign(prop, options);
            prop.GSID = propID;
        }
    }

    /**
     * Setzt einen Infotext für "schema", "DataType","PropItem","EnumItem","RefItem","UniqueItem"
     * @param {"schema"|"DataType"|"PropItem"|"EnumItem"|"RefItem"|"UniqueItem"} refType - Name des Types. "schema" für Das Schema selbst.
     * @param {string} refID - ID des Objektes dem der Infotext zugeordnet wird
     * @param {string} infoText - Infotext für den Typ
     * @param {string} [lang] - Optional Sprache für den Text. Default: "de"
     * @param {string} [date] - Optional ISO Datum für den Text. Default: aktuelles Datum
     */
    addInfo(refType, refID, infoText, lang, date) {
        const info = new InfoText();
        info.refType = refType;
        info.refID = refID;
        info.text = infoText;
        info.lang = lang || "de";
        if (date) {
            info.date = date;
        }
        this.#infoList.set(info.GSID, info);
    }

    /**
     * Setzt einen APP Infotext für "schema", "DataType","PropItem","EnumItem","RefItem","UniqueItem"
     * @param {"schema"|"DataType"|"PropItem"|"EnumItem"|"RefItem"|"UniqueItem"} refType - Name des Types. "schema" für Das Schema selbst.
     * @param {string} refID - ID des Objektes dem der Infotext zugeordnet wird
     * @param {string} infoText - Infotext für den Typ
     * @param {string} [lang] - Optional Sprache für den Text. Default: "de"
     * @param {string} [date] - Optional ISO Datum für den Text. Default: aktuelles Datum
     */
    addAppInfo(refType, refID, infoText, lang, date) {
        const info = new InfoText();
        info.refType = refType;
        info.refID = refID;
        info.text = infoText;
        info.lang = lang || "de";
        if (date) {
            info.date = date;
        }
        this.#appinfoList.set(info.GSID, info);
    }


    /**
     * Liefert alle Appinfos zu der referenz
     * @param {string} refID - Referenz ID für die AppInfos
     * @returns {Array<InfoText>}
     */
    getAppInfos(refID) {
        return this.#appinfoList.findAll({ refID })
    }

    /**
     * Liefert alle InfoTexte zu der referenz
     * @param {string} refID - Referenz ID für die Infos
     * @returns {Array<InfoText>}
     */
    getInfos(refID) {
        return this.#infoList.findAll({ refID })
    }


    /**
     * Liefert einel Liste mit PropertyItems zurück
     * @param {string} typeName - Referenz ID für die Items
     * @param {"a"|"p"|undefined} [propAttr] - Optional - "a": nur Attribute, "p": nur Properties
     * @returns {Array<PropItem>}
     */
    getPropItems(typeName, propAttr) {
        const propItemList = this.#propItemList.findAll({ dataType_name: typeName });
        if (propAttr) {
            const attrList = [];
            const propList = [];
            for (let i = 0; i < propItemList.length; i++) {
                if (propItemList[i].name.startsWith("@")) {
                    // nur Attribute
                    attrList.push(propItemList[i]);
                } else {
                    propList.push(propItemList[i]);
                }
            }

            if (propAttr == "a") {
                return attrList;
            } else {
                return propList;
            }
        }
        return propItemList;
    }

    /**
     * Gibt eine Liste von EnumItems vom angegebenen Typ zurück
     * @param {string} typeName - Name des Types
     * @returns {Array<EnumItem>} Liste mit EnumItems
     */
    getEnumItems(typeName) {
        return this.#enumItemList.findAll({ dataType_name: typeName });
    }

    /**
     * Gibt einen Datentyp zurück
     * @param {string} typeName - Name des Types
     * @returns {DataType|undefined} Datentyp oder undefined wenn nicht gefunden  
     */
    getType(typeName) {
        return this.#dataTypeList.get(typeName);
    }

    /**
     * Liefert eine Liste mit allen Datentyp-Namen zurück
     * @returns {Array<string|number>} Liste mit DatenTyp Namen
     */
    getAllTypeNames() {
        return [...this.#dataTypeList.keys()];
    }


    /**
     * Liefert das Schema als JsonString zurück
     * @returns {string} schema als JSON-String 
     */
    toString() {
        let schemaString = `{
    "${this.#name}": {
        "infos": ${this.#infoList.getAsJSON()}
        , "appinfos": ${this.#appinfoList.getAsJSON()}
        , "datatypes": ${this.#dataTypeList.getAsJSON()}
        , "properties": ${this.#propItemList.getAsJSON()}
        , "enums": ${this.#enumItemList.getAsJSON()}
        , "refs": ${this.#refItemList.getAsJSON()}
        , "uniques": ${this.#uniqueItemList.getAsJSON()}
    } 
}`;

        return schemaString;
    }


    /**
     * Erzeugt das Schema von einem JSON-String
     * @param {string} jsonString - JSON-String von dem das Schema erzeugt wird
     */
    setFromJSON(jsonString) {
        if (!jsonString || typeof jsonString != "string") {return;}

        const obj = JSON.parse(jsonString);
        if (typeof obj == "object") {
            if (Array.isArray(obj.infos)) {
                this.#infoList.setValueArray(obj.infos, true);
            }
            if (Array.isArray(obj.appinfos)) {
                this.#appinfoList.setValueArray(obj.appinfos, true);
            }
            if (Array.isArray(obj.datatypes)) {
                this.#dataTypeList.setValueArray(obj.datatypes, true);
            }
            if (Array.isArray(obj.properties)) {
                this.#propItemList.setValueArray(obj.properties, true);
            }
            if (Array.isArray(obj.enums)) {
                this.#enumItemList.setValueArray(obj.enums, true);
            }
            if (Array.isArray(obj.refs)) {
                this.#refItemList.setValueArray(obj.refs, true);
            }
            if (Array.isArray(obj.uniques)) {
                this.#uniqueItemList.setValueArray(obj.uniques, true);
            }
        }
    }

    toText() {
        let schemaString = "name: " + this.name + "▲"; // ASCII 30 Zeilentrenner

        schemaString += "↔infos:▲"; // Gruppentrenner ASCII 29, und Zeilentrenner ASCII 30
        schemaString +=  this.#infoList.getAsText();

        schemaString += "↔appinfos:▲";
        this.#appinfoList.getAsText();

        schemaString += "↔types:▲";
        schemaString += this.#dataTypeList.getAsText();
        
        schemaString += "↔properties:▲";
        schemaString += this.#propItemList.getAsText();
        
        schemaString += "↔enums:▲";
        schemaString += this.#enumItemList.getAsText();

        schemaString += "↔refs:▲";
        schemaString += this.#refItemList.getAsText();

        schemaString += "↔uniques:▲";
        schemaString += this.#uniqueItemList.getAsText();

        return schemaString;
    }

    /**
     * Erzeugt ein neues Schema
     * @param {string} name - Name des Schemas
     */
    constructor(name) {
        this.#name = name;
        SchemaList.set(name, this);
    }
}


// ==========================
//   Schema anzeigen
// --------------------

/**
 * Liefert die Infotexte aufbereitet zurück
 * @param {Array<InfoText>} infos - Liste mit Infotexten
 */
function getInfoHTML(infos) {
    let html = "";
    for (let i = 0; i < infos.length; i++) {
        let info = infos[i].text.replaceAll("\n", "<br>");
        html += info;
    }
    return html;
}



/**
 * Lieftert einen HTML-String als Name, (min,max), type, info
 * @param {PropItem} item - Typ der Datenzeile
 * @returns {string} HTMLString
 */
function getNameTypeHTML(item) {
    let html = "";
    if (!(item instanceof PropItem)) { return html; }

    let typeType = item.itemType;
    if (Array.isArray(item.itemType)) {
        typeType = "";
        for (let i = 0; i < item.itemType.length; i++) {
            if (i > 0) { typeType += ","; }
            typeType += item.itemType[i];
        }
    }

    // Zeile zusammenbauen
    //html = `<li>${type.name}&nbsp;(${type.min},${type.max})&nbsp;{${typeType}}&nbsp;${getInfoHTML(type.info)}</li>`;
    html = `${item.name}&nbsp;(${item.min},${item.max})&nbsp;{${typeType}}`;
    return html;
}


/**
 * Lieftert einen HTML-String je TypeArt zurück
 * @param {Schema} schema - Schema das als basis genommen wird
 * @param {string|Array<string>} typeName - Typ der Datenzeile
 * @returns {string} HTMLString
 */
function getTypeHTML(schema, typeName) {
    if (!typeName) { return ""; }
    let html = "<ul>";
    let html1 = "";
    let html2 = "";

    if (Array.isArray(typeName)) {
        for (let i = 0; i < typeName.length; i++) {
            // typ prüfen
            html += getTypeHTML(schema, typeName[i]);
        }
        return html;
    }

    // Typnamen prüfen
    if (["string", "number", "boolean", "object", "enum", "GSID"].indexOf(typeName) >= 0) {
        return typeName;
    }

    const type = schema.getType(typeName);
    if (!type) {
        return `<p>Base: ${typeName}</p>`;
    }

    switch (type.art) {
        case "object":
            // Attribute
            const attrList = schema.getPropItems(typeName, "a");

            if (attrList.length > 0) {
                //html += "<li><b>Attributes</b>(" + attrList.length + ")";
                for (let i = 0; i < attrList.length; i++) {
                    let name = attrList[i].name;
                    if (attrList[i].min > 0) {
                        name = "<b>" + name + "</b>";
                    }
                    if (attrList[i].use) {
                        name = "[&nbsp;]&nbsp;" + name;
                    }
                    let defaultValue = typeof attrList[i].defaultValue == "undefined" ? "" : "&nbsp;default:" + attrList[i].defaultValue;
                    let fix = typeof attrList[i].fix == "undefined" ? "" : "&nbsp;fix:" + attrList[i].fix;                    
                    html += `<li><details><summary>${name}&nbsp;(${attrList[i].min},${attrList[i].max})&nbsp;${attrList[i].itemType}${defaultValue}${fix}</summary>`;
                    html += getTypeHTML(schema, attrList[i].itemType) + "</details></li>";
                }
            }

            // Properties
            const propList = schema.getPropItems(typeName, "p");

            if (propList.length > 0) {
                // html += "<li><b>Properies</b>(" + propList.length + ")";
                for (let i = 0; i < propList.length; i++) {
                    let name = propList[i].name;
                    if (propList[i].min > 0) {
                        name = "<b>" + name + "</b>";
                    }
                    if (propList[i].use) {
                        name = "[&nbsp;]&nbsp;" + name;
                    }
                    let defaultValue = typeof propList[i].defaultValue == "undefined" ? "" : "&nbsp;default:" + propList[i].defaultValue;
                    let fix = typeof propList[i].fix == "undefined" ? "" : "&nbsp;fix:" + propList[i].fix;
                    html += `<li><details><summary>${name}&nbsp;(${propList[i].min},${propList[i].max})&nbsp;${propList[i].itemType}${defaultValue}${fix}</summary>`;
                    html += getTypeHTML(schema, propList[i].itemType) + "</details></li>";
                }
            }
            break;

        case "enum":
            const enumList = schema.getEnumItems(typeName);
            if (enumList.length > 0) {
                html += `<li><details><summary>ENUM:</summary><ul>`;
                for (let i = 0; i < enumList.length; i++) {
                    html += `<li>${enumList[i].name}:&nbsp;${enumList[i].value}</li>`;
                }
                html += `</ul></details></li>`;
            }
            break;
        default:
            break;
    }

    // Typ.Typ prüfen
    html += getTypeHTML(schema, type.base);

    return html + "</ul>";
}


// Schema ab einem Einstiegspunkt anzeigen

/**
 * Liefert einen HTML-String vom angegebenen Schema und  SchemaTyp als Startpunkt zurück.
 * @param {Schema} schema - Schema das als basis genommen wird
 * @param {string} typeName - Name des Types/ Startpunkt
 * @returns {string|undefined} HTML-String oder "undefined" wenn Typ im Schema nicht gefunden wird
 */
export function getSchemaTypeHTML(schema, typeName) {
    if (!(schema instanceof Schema)) { return; }
    let html = "";

    // Schema Name
    html += `<h1>${schema.name}</h1>`;

    // Schema APPInfo
    const appInfoList = schema.getAppInfos("schema");
    if (appInfoList.length > 0) {
        html += "<h2>APP-Info></h2>" + getInfoHTML(appInfoList);
    }

    // Schema Info
    const infoList = schema.getInfos("schema");
    if (infoList.length > 0) {
        html += "<h2>Info</h2>" + getInfoHTML(infoList);
    }

    // Type auflösen
    // wenn kein Typ angegeben alle durchgehen
    if (!typeName) {
        const typeNameList = schema.getAllTypeNames();
        for (let i = 0; i < typeNameList.length; i++) {
            // todo: TypName 
            html += `<details><summary>${typeNameList[i]}</summary>`;
            html += getTypeHTML(schema, typeNameList[i] + "");
            html += `</details>`;
        }
    } else {
        html += getTypeHTML(schema, typeName);
    }
    return html;
}

const infoSchema = new Schema("infoSchema");

infoSchema.addProperty("InfoText", "GSID");
infoSchema.addProperty("InfoText", "refID");
infoSchema.addProperty("InfoText", "refType", {itemType: "refType", defaultValue: "DataType"});
infoSchema.addProperty("InfoText", "lang", {defaultValue: "de"});
infoSchema.addProperty("InfoText", "date");
infoSchema.addProperty("InfoText", "text");

infoSchema.addEnumItem("refType", "schema");
infoSchema.addEnumItem("refType", "DataType");
infoSchema.addEnumItem("refType", "PropItem");
infoSchema.addEnumItem("refType", "EnumItem");
infoSchema.addEnumItem("refType", "UniqueItem");
infoSchema.addEnumItem("refType", "RefItem");


infoSchema.addProperty("RefItem", "GSID");
infoSchema.addProperty("RefItem", "dataType_name");
infoSchema.addProperty("RefItem", "name");
infoSchema.addProperty("RefItem", "props", {max: -1});
infoSchema.addProperty("RefItem", "refObj");
infoSchema.addProperty("RefItem", "refProps", {max: -1});
infoSchema.addProperty("RefItem", "onUpdate", {itemType: "onUpdate", defaultValue: "UPDATE"});
infoSchema.addProperty("RefItem", "onDelete", {itemType: "onDelete", defaultValue: "DELETE"});

infoSchema.addEnumItem("onUpdate", "NO");
infoSchema.addEnumItem("onUpdate", "UPDATE");
infoSchema.addEnumItem("onUpdate", "NULL");
infoSchema.addEnumItem("onUpdate", "DEFAULT");

infoSchema.addEnumItem("onDelete", "NO");
infoSchema.addEnumItem("onDelete", "DELETE");
infoSchema.addEnumItem("onDelete", "NULL");
infoSchema.addEnumItem("onDelete", "DEFAULT");
