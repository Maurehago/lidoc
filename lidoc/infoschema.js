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
 * @property {string|Array<string>} [base] BasisTyp(abgeleitet von) der Eigenschaft. Defaults: "string"|"number"|"boolean"|"object"|"enum"|"GSID"|string
 * @property {Array<string>} [info] - Beschreibungstexte zum Datentyp
 * @property {Array<string>} [appInfo] - Beschreibungstexte zur Applikation
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


/**
 * Optionen für PropItem
 * @typedef {object} PropItemOptions
 * @property {number} [min] - Minimales Vorkommen, 0: optional
 * @property {number} [max] - Maximales Vorkommen, 0: darf nicht vorkommen, -1: darf unendlich vorkommen
 * @property {any} [defaultValue] - Standard Wert
 * @property {any} [fix] - fixer Wert, es darf kein anderer Wert vorkommen
 * @property {string} [use] - Name der Gruppierung in der die Property vorkommt. Wenn nicht angegeben ist die Eigenschaft immer zu behandeln.
 * @property {Array<string>} [info] - Liste mit Infotexten.
 */


/** @type {Map<string,Schema>} */
const SchemaList = new Map();



// ==============================
//   Klassen
// -----------

class InfoText {
    GSID = getGSID();
    
    /** @type {string} Zuordnung Referenz */
    refID = "";
    
    /** @type {"schema"|"DataType"|"PropItem"|"EnumItem"|"UniqueItem"|"RefItem"} Zuordnung Referenz Typ */
    refType = "DataType";

    /** @type {string} Sprache */
    lang = "de";
    
    /** @type {string} Datum(ISO) */
    date = new Date().toISOString().substring(0,10);
    
    /** @type {string} InfoText */
    text = "";
}


class RefItem {
    GSID = getGSID();

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
}



class UniqueItem {
    GSID = getGSID();

    /** @type {string} Name/GSID des DatenTypes */
    dataType_name = "";

    /** @type {string} */
    name = "";
    
    /** @type {Array<string>} Feigenschaftsnamen(Properties) die zusammen eine Eindeutigkeit ergeben */
    props = [];
}


class EnumItem {
    GSID = getGSID();
    /** @type {string} Datentyp Name/GSID */
    dataType_name = "";

    /** @type {string} */
    name = "";
    /** @type {string|number} */
    value = "";
}



class PropItem {
    GSID = getGSID();
    
    /** @type {string} Name/GSID des Datentyp-Objektes */
    dataType_name = "";
    
    /** @type {string} Name der Eigenschaft/Attribute bei Attribute ein "@" vor dem Namen */
    name = "";

    /** @type {string|Array<string>} TypName oder Liste von TypNamen - default "string" */
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
}


// DataType:
class DataType {
    /** @type {string} Name des Datentypes */
    name = "";

    /** @type {string} Pfad innerhalb des Schemas */
    schemaPath = "";
    
    /** @type {"string"|"number"|"boolean"|"object"|"enum"|"group"|"choice"} BasisTyp - default "string" */
    art = "string";

    /** @type {string|Array<string>} BasisTyp(abgeleitet von) der Eigenschaft. */
    base = "";
    
    /** @type {Array<string>} Liste mit Beschreibungstexten */
    info = [];

    /** @type {Array<string>} Liste mit APP Beschreibungstexten */
    appinfo = [];

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

    /** @type {Map<string,InfoText>}  Informationen zum Schema*/
    #infoList = new DataMap(InfoText);

    /** @type {Map<string,InfoText>} APP Informationen zum Schema*/
    #appinfoList = new DataMap(InfoText);

    /** @type {Map<string,string>} Schema Attribute */
    attributes = new Map(); // Sind Daten und keine Typen!

    /** @type {Map<string,DataType>} Schema Typen */
    types = new Map();

    /** @type {Map<string,DataType>} Schema Globale DatenTypen */
    #dataTypeList = new DataMap(DataType, "name");

    /** Schema Globale Propertys */
    #propItemList = new DataMap(PropItem);

    /** Schema Globale Enums */
    #enumItemList = new DataMap(EnumItem);

    /** Schema Globale Referenzen */
    #refItemList = new DataMap(RefItem);

    /** Unique Liste */
    #uniqueItemList = new DataMap(UniqueItem);


    /**
     * Fügt ein neues Datentyp Objekt hinzu
     * @param {string} typeName - Name des DatenTyps
     * @param {DataTypeOptions} [options] - Optional Optionen für den Datentyp
     * @returns {DataType} DatenTyp Objekt
     */
    addDataType(typeName, options) {
        const dataType = new DataType();
        Object.assign(dataType, options);
        dataType.name = typeName;
        this.#dataTypeList.set(typeName, dataType);
        return dataType;
    } 


    /**
     * Fügt eine neue Eigenschaft/Atribute zu einem Datentyp hinzu
     * @param {string} typeName - Name des DatenTyps
     * @param {string} propertyName - Name der Eigenschaft
     * @param {PropItemOptions} [options] - Optional Optionen für die Eigenschaft
     * @returns {PropItem} Eigenschaft Objekt
     */
    addProperty(typeName, propertyName, options) {
        let dataType = this.#dataTypeList.get(typeName);
        if (!dataType) {
            dataType = this.addDataType(typeName);
        }
        dataType.art = "object";

        const prop = new PropItem();
        Object.assign(prop, options);
        prop.name = propertyName;
        prop.dataType_name = typeName;
        this.#propItemList.set(propertyName, prop);
        return prop;
    } 


    /**
     * Fügt eine neues EnumItem zu einem Datentyp hinzu
     * @param {string} typeName - Name des DatenTyps
     * @param {string} name - Name vom EnumItem
     * @param {string|number} [value] - Optional Wert vom Enum Item. Wenn nicht angegeben wird der Name als Wert genommen.
     * @returns {DataType} DatenTyp Objekt
     */
    addEnumItem(typeName, name, value) {
        let dataType = this.#dataTypeList.get(typeName);
        if (!dataType) {
            dataType = this.addDataType(typeName);
        }
        dataType.art = "enum";

        const item = new EnumItem();
        item.dataType_name = typeName;
        item.name = name;
        item.value = value || name;
        this.#enumItemList.set(item.GSID, item);
        return dataType;
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
            dataType = this.addDataType(typeName);
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
            dataType = this.addDataType(typeName);
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
     * @returns {DataType} DatenTyp Objekt
     */
    setDataTypeOptions(typeName, options) {
        let dataType = this.#dataTypeList.get(typeName);
        if (!dataType) {
            dataType = this.addDataType(typeName);
        }
        Object.assign(dataType, options);
        dataType.name = typeName;
        return dataType;
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
 * @param {Array<string>} infos - Liste mit Infotexten
 */
function getInfoHTML(infos) {
    let html = "";
    for (let i = 0; i < infos.length; i++) {
        let info = infos[i].replaceAll("\n", "<br>");
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

    let typeType = item.base;
    if (Array.isArray(item.base)) {
        typeType = "";
        for (let i = 0; i < item.base.length; i++) {
            if (i > 0) { typeType += ","; }
            typeType += item.base[i];
        }
    }

    // Zeile zusammenbauen
    //html = `<li>${type.name}&nbsp;(${type.min},${type.max})&nbsp;{${typeType}}&nbsp;${getInfoHTML(type.info)}</li>`;
    html = `${item.name}&nbsp;(${item.min},${item.max})&nbsp;{${typeType}}&nbsp;${getInfoHTML(item.info)}`;
    return html;
}


/**
 * Lieftert einen HTML-String je TypeArt zurück
 * @param {Schema} schema - Schema das als basis genommen wird
 * @param {string|Array<string>} typeName - Typ der Datenzeile
 * @returns {string} HTMLString
 */
function getTypeHTML(schema, typeName) {
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
        return "";
    }

    const type = schema.types.get(typeName);
    if (!type) {
        html += `<p>Type ${typeName} not found</p>`;
        return "";
    }

    // Attribute
    if (type.attributes.size > 0) {
        const attrNames = [...type.attributes.keys()];
        html += "<li><b>Attributes</b>(" + attrNames.length + ")";
        html += "<ul>";
        for (let i = 0; i < attrNames.length; i++) {
            let typeAttr = type.attributes.get(attrNames[i]);
            if (typeAttr) {
                if (attrNames[i] != typeAttr.name) {
                    html += attrNames[i] + "&nbsp;";
                }
                html += getNameTypeHTML(typeAttr);
            } else {
                html += `<li>${attrNames[i]}</li>`;
            }
        }

        if (type.moreAttributes) {
            html += `<li>...any&nbsp;${getNameTypeHTML(type.moreAttributes)}</li>`;
        }
        html += "</ul></li>";
    }

    // Properties
    if (type.props.size > 0) {
        const propNames = [...type.props.keys()];
        html += "<li icon-r><b>Properties</b>(" + propNames.length + ")";
        html += "<ul>";
        for (let i = 0; i < propNames.length; i++) {
            let typeProp = type.attributes.get(propNames[i]);
            if (typeProp) {
                if (propNames[i] != typeProp.name) {
                    html += propNames[i] + "&nbsp;";
                }
                html += getNameTypeHTML(typeProp);
            } else {
                html += `<li>${propNames[i]}</li>`;
            }
        }

        if (type.moreProps) {
            html += `<li>...any&nbsp;${getNameTypeHTML(type.moreProps)}</li>`;
        }
        html += "</ul></li>";
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
    if (schema.appinfo.length > 0) {
        html += "<h2>APP-Info></h2>" + getInfoHTML(schema.appinfo);
    }

    // Schema Info
    if (schema.info.length > 0) {
        html += "<h2>Info</h2>" + getInfoHTML(schema.info);
    }

    // Type auflösen
    html += getTypeHTML(schema, typeName);
    return html;
}
