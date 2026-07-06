// =========================
//  Schema und Typen 
// =========================
// @ts-check

// Basis Typen: string, number, boolean, object, enum
// Datum Typen: date, time, datetime, range

export * from "./infotable.js";
import { DataTable, DataRow, getGSID } from "./infotable.js";


/**
 * EnumType
 * @typedef {Object} EnumType
 * @property {string} name - Name des EnumTypes == SchemaType.name
 * @property {Set<any>} values - WertListe für den EnumTyp
 * @property {string|Array<string>|undefined} [moreEnums] - Name einer Property oder Liste mit Properties die den Typ weiterer Enum Einträge im Objekt erlaubt
*/
const EnumTypeFields = ["name", "values", "moreEnums"];
const EnumTypUnique = "name";


/**
 * Datentyp
 * @typedef {Object} DataType
 * @property {string} name - Name des Datentypes
 * @property {string} schemaPath - Pfad innerhalb des Schemas
 * @property {"string"|"number"|"bigint"|"boolean"} art - Default: "string" - BasisTyp
 * @property {string|Array<string>|undefined} [base_name] - BasisTyp(abgeleitet von) der Eigenschaft.
 * @property {number|undefined} [length] - exakte Länge (für string, number(anzahl der zeichen ohne Vorzeichen), object?)
 * @property {number|undefined} [minLength] - Minimale Anzahl Zeichen (für string)
 * @property {number|undefined} [maxLength] - Maximale Anzahl Zeichen (für string)
 * @property {string|undefined} [pattern] - Regular Expression (für string)
 * @property {string|undefined} [whitespace] - wie wird mit Leerzeichen umgegangen (für string)
 * @property {"camelCase"|"PascalCase"|"snake_case"|"lower"|"upper"|undefined} [casing] - (für string)
 * @property {number|undefined} [decimals] - Anzahl der Dezimalstellen (für number)
 * @property {number|string|undefined} [minInclusive] - Minimum Wert inclusive angegebenen Wert (für number, date, time, datetime, range)
 * @property {number|string|undefined} [minExclusive] - Minimum Wert größer angegebenen Wert (für number, date, time, datetime, range)
 * @property {number|string|undefined} [maxExclusive] - Maximalwert kleiner angegebenen Wert (für number, date, time, datetime, range)
 * @property {number|string|undefined} [maxInclusive] - Maximalwert kleiner gleich angegebenen Wert (für number, date, time, datetime, range)
 */
const DataTypeFields = [
    "name" // Name des Datentypes
    , "schemaPath" // Pfad innerhalb des Schemas
    , "art" // BasisTyp - default "string"
    , "base_name" // BasisTyp(abgeleitet von) der Eigenschaft.
    , "length" // exakte Länge (für string, number(anzahl der zeichen ohne Vorzeichen), object?)
    , "minLength" // Minimale Anzahl Zeichen (für string)
    , "maxLength" // Maximale Anzahl Zeichen (für string)
    , "pattern" // Regular Expression (für string)
    , "whitespace" // wie wird mit Leerzeichen umgegangen (für string)
    , "casing" // (für string)
    , "decimals" // Anzahl der Dezimalstellen (für number)
    , "minInclusive" //  Minimum Wert inclusive angegebenen Wert (für number, date, time, datetime, range)
    , "minExclusive" // Minimum Wert größer angegebenen Wert (für number, date, time, datetime, range)
    , "maxExclusive" // Maximalwert kleiner angegebenen Wert (für number, date, time, datetime, range)
    , "maxInclusive" // Maximalwert kleiner gleich angegebenen Wert (für number, date, time, datetime, range)
];
const DataTypeUnique = "name";


/**
 * RefType
 * @typedef {Object} RefType
 * @property {string} gsid - Eindeutige ID
 * @property {string} name - Name des Items
 * @property {string} object_name - Name des ObjectType
 * @property {Array<string>} object_props - Selector für Eigenschaften vom Aktuellen objekt
 * @property {string} ref_name - Name des Fremd Objektes
 * @property {Array<string>} ref_props - Selector für Eigenschaften vom Referenzierten objekt
 * @property {"NO"|"UPDATE"|"NULL"|"DEFAULT"} onUpdate - Regel für Update
 * @property {"NO"|"DELETE"|"NULL"|"DEFAULT"} onDelete - Regel für Löschen
 */
const RefTypeFields = ["gsid", "name", "object_name", "object_props", "ref_name", "ref_props", "onUpdate", "onDelete"];
const RefTypeUnique = "gsid";


/**
 * UniqueType
 * @typedef {Object} UniqueType
 * @property {string} gsid - Eindeutige ID des Uniques
 * @property {string} name - Name des Uniques
 * @property {string} object_name - Name des ObjectType
 * @property {Array<string>} props - Eigenschaftsnamen(Properties) die zusammen eine Eindeutigkeit ergeben
 */
const UniqueTypeFields = ["gsid", "name", "object_name", "props"];
const UniqueTypeUnique = "gsid";


/**
 * ItemType
 * @typedef {Object} ItemType
 * @property {string} gsid - Eindeutiger Datensatz
 * @property {string} object_name - Name des ObjektTypes zu dem diese Eigenschaft gehört
 * @property {string} name - Eindeutiger Spalten/Eigenschaftsname
 * @property {number} pos - Feld/Spalten Position im Objekt ????
 * @property {string} type_name - Name des Types der Eigenschaft
 * @property {number} min - Default: 1(erforderlich) - Minimales vorkommen der Spalte. 0: diese Spalte ist optional, -1: Spalte is Auswahlspalte 
 * @property {number} max - Default: 1(nur ein mal) -  größer 1: Ist eine Liste mit maximal n Eigenschaften, -1: ist eine unendliche Liste 
 * @property {any|undefined} [default] - Optional: Standardwert der Eigenschaft
 * @property {any|undefined} [fix] - Optional: Fixer Wert der Eigenschaft
*/ 
const ItemTypeFields = ["gsid", "object_name", "name", "pos", "type_name", "min", "max", "default", "fix"];
const ItemTypeUnique = "gsid";


/**
 * SchemaType
 * @typedef {Object} SchemaType 
 * @property {string} name - ID/Name des Types
 * @property {"string"|"number"|"bigint"|"boolean"|"enum"|"object"|"ref"|"unique"|"group"|"choice"|"multi"} art - Um welchen Art von Typ es sich handelt
 * @property {string|undefined} [base_name] - Optional: Erweitert diesen "base" ObjektTypen
 * @property {string|Array<string>|undefined} [id] - Name einer Property oder Liste mit Properties die die Eindeutige ID des Objektes/Datensatzes ergeben
 * @property {string|Array<string>|undefined} [moreAttributes] - Name einer Property oder Liste mit Properties die den Typ weiterer Attribute im Objekt erlaubt
 * @property {string|Array<string>|undefined} [moreProperties] - Name einer Property oder Liste mit Properties die den Typ weiterer Properties im Objekt erlaubt
 */
const SchemaTypeFields = ["name", "art", "base_name", "id", "moreAttributes", "moreProperties"];
const SchemaTypeUnique = "name";


/**
 * Texte Beschreibungen Information
 * @typedef {Object} InfoText
 * @property {string} gsid - Datenzeile ID
 * @property {string|undefined} [type_name] - Optional - Name des Schematypes zu der dieser Infotext gehört
 * @property {string|undefined} [item_gsid] - Optional - GSID der Eigenschaft eines Objekttypen zu der dieser Infotext gehört
 * @property {string} [lang] - Default: "de" - Sprache
 * @property {string} [date] - Datum(ISO)
 * @property {string} text - InfoText
*/
const InfoTextFields = ["gsid", "type_name", "item_gsid", "lang", "date", "text"];
const InfoTextUnique = "gsid";


/** @type {Map<string,Schema>} */
const SchemaList = new Map();


// ==============================
//   Klassen
// -----------


// Schema Klasse
export class Schema {
    /** @type {string} Name des Schemas */
    #name = "";
    get name() {
        return this.#name;
    }

    /** @type {DataTable<RefType>} Liste mit Referenzen Typen */
    #refList = new DataTable("refs", [RefTypeFields], RefTypeUnique);

    /** @type {DataTable<UniqueType>} Liste mit Unique Typen */
    #uniqueList = new DataTable("uniques", [UniqueTypeFields], UniqueTypeUnique);

    /** @type {DataTable<EnumType>} Liste mit Enum Objekten */
    #enumList = new DataTable("enums", [EnumTypeFields], EnumTypUnique);

    /**  @type {DataTable<DataType>} Liste mit DatenTypen */
    #dataTypeList = new DataTable("datatypes", [DataTypeFields], DataTypeUnique);
    
    /** @type {DataTable<ItemType>} Liste mit Objekt ItemTypen */
    #itemList = new DataTable("items", [ItemTypeFields], ItemTypeUnique);
    
    /** @type {DataTable<SchemaType>}  Liste aller Typen */
    #typeList = new DataTable("types", [SchemaTypeFields], SchemaTypeUnique);
    
    /** @type {DataTable<InfoText>} Liste mit InformationsTexten */
    #infoList = new DataTable("infos", [InfoTextFields], InfoTextUnique);


    /**
     * Registriert einen Typ im Schema
     * @param {Partial<SchemaType>} options - Setzt einen SchemaTyp
     * @returns {boolean|undefined} true wenn erfolgreich
     */
    setType(options) {
        if (!options.name) {options.name = getGSID();}
        return this.#typeList.setObject(options);
    }


    /**
     * Gibt einen registrierten Typ zurück
     * @param {string} type_name - Name des Types
     * @returns {SchemaType|undefined} Type oder Undefined wenn nicht gefunden
     */
    getType(type_name) {
        return this.#typeList.getObject(type_name);
    }


    /**
     * Registriert einen DatenTyp im Schema
     * @param {Partial<DataType>} options - Setzt einen SchemaTyp
     * @returns {boolean|undefined} true wenn erfolgreich
     */
    setDataType(options) {
        if (!options.name) {options.name = getGSID();}

        // SchemaTyp ausbessern/anlegen
        this.#typeList.setObject({name: options.name, art: options.art});

        // DatenTyp setzen
        return this.#dataTypeList.setObject(options);
    }


    /**
     * Gibt einen registrierten DatenTyp zurück
     * @param {string} type_name - Name des Types
     * @returns {DataType|undefined} Type oder Undefined wenn nicht gefunden
     */
    getDataType(type_name) {
        return this.#dataTypeList.getObject(type_name);
    }


    /**
     * Registriert einen InfoText zu einem Typ
     * @param {Partial<InfoText>} options - Setzt einen Infotext zu einem Typ oder TypeItem
     * @returns {boolean|undefined} true wenn erfolgreich
     */
    setInfo(options) {
        return this.#infoList.setObject(options);
    }


    /**
     * Gibt einen registrierten InfoText zurück
     * @param {Partial<InfoText>} quest - Name des Types
     * @returns {Array<InfoText>} Liste mit InfoTexten
     */
    getInfos(quest) {
        return this.#infoList.findAll(quest);
    }


    /**
     * Fügt eine neue Eigenschaft zu einem ObjektTyp hinzu
     * @param {Partial<ItemType>} options - Eigenschaften vom Neuen ItemTyp
     */
    addProperty(options) {
        if (!options.object_name || !options.name) {return;}
        const base_type = this.#typeList.getCellValue(options.object_name, "base_type");
        
        // Wenn kein ObjektTyp
        if (["object","group","choice","multi"].indexOf(base_type) < 0) {
            this.#typeList.setObject({name: options.object_name, base_type: "object"});
        }

        // neue GSID - Erforderlich beim hinzufügen
        options.gsid = getGSID();

        // Eigenschaft anlegen
        return this.#itemList.setObject(options);
    }


    /**
     * Setzt Werte für eine Eigenschaft 
     * @param {Partial<ItemType>} options - Setzt einen Infotext zu einem Typ oder TypeItem
     * @returns {boolean|undefined} true wenn erfolgreich
     */
    setProperty(options) {
        return this.#itemList.setObject(options);
    }


    /**
     * Gibt eine Liste von Eigenschaften für ein Objet zurück
     * @param {Partial<ItemType>} quest - Abfrage für Properties eines Objektes
     * @returns {Array<ItemType>} Gefundene Eigenschaften 
     */
    getProperties(quest) {
        return this.#itemList.findAll(quest);
    }


    /**
     * Gibt eine Eigenschaft für ein Objekt zurück
     * @param {Partial<ItemType>} quest - Abfrage für Properties eines Objektes
     * @returns {ItemType|undefined} erste gefundene Eigenschaft
     */
    getProperty(quest) {
        return this.#itemList.find(quest);
    }


    /**
     * Setzt einen Enum Eintrag für einen Typ
     * @param {string} enum_name - Enum Name
     * @param {any|Array<any>} value - Enum Wert oder Liste von Werten
     * @returns {boolean|undefined} true wenn erfolgreich
     */
    setEnumItem(enum_name, value) {
        if (!enum_name) {return;}

        // Schematyp ausbessern
        this.#typeList.setObject({name: enum_name, art: "enum"});

        // Enum lesen
        let obj = this.#enumList.getObject(enum_name);

        // Wen kein Enum Objekt
        if (!obj) {
            obj = {name: enum_name, values: new Set()};
        } 

        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                obj.values.add(value[i]);
            }
        } else {
            obj.values.add(value);
        }

        // Objekt in der Liste ablegen
        return this.#enumList.setObject(obj);
    }


    /**
     * Gibt ein Enum Objekt zurück
     * @param {string} name - Abfrage für Properties eines Objektes
     * @returns {EnumType|undefined} Enum Objekt
     */
    getEnum(name) {
        return this.#enumList.getObject(name);
    }


    /**
     * Registriert einen Referenztyp in der Liste
     * @param {Partial<RefType>} options - Eigenschaften von einem Referenztyp
     * @returns {boolean|undefined} true wenn erfolgreich
     */
    setRef(options) {
        if (!options.object_name) {return;}
        
        // SchemaTyp ausbessern
        this.#typeList.setObject({name: options.object_name, art: "ref"});

        return this.#refList.setObject(options);
    }


    /**
     * Gibt ein Referenz Objekt zurück
     * @param {Partial<RefType>} quest - Abfrage für Properties eines Objektes
     * @returns {RefType|undefined} Enum Objekt
     */
    getRef(quest) {
        return this.#refList.find(quest);
    }


    /**
     * Registriert einen UniqueTyp in der Liste
     * @param {Partial<UniqueType>} options - Eigenschaften von einem UniqueType
     * @returns {boolean|undefined} true wenn erfolgreich
     */
    setUnique(options) {
        if (!options.object_name) {return;}
        
        // SchemaTyp ausbessern
        this.#typeList.setObject({name: options.object_name, art: "unique"});

        return this.#uniqueList.setObject(options);
    }


    /**
     * Gibt ein Unique Objekt zurück
     * @param {Partial<UniqueType>} quest - Abfrage für Properties eines Objektes
     * @returns {UniqueType|undefined} Enum Objekt
     */
    getUnique(quest) {
        return this.#uniqueList.find(quest);
    }


    /**
     * Liefert eine Liste mit allen Datentyp-Namen zurück
     * @returns {Array<string|number>} Liste mit DatenTyp Namen
     */
    getAllTypeNames() {
        return [...this.#typeList.rowMap.keys()];
    }


    /**
     * Liefert das Schema als JsonString zurück
     * @returns {string} schema als JSON-String 
     */
    toString() {
        const obj = {
            infotype: "infoSchema"
            , name: this.#name
            , refs: this.#refList.rows
            , uniqueitems: this.#uniqueList.rows
            , enums: this.#enumList.rows
            , datatypes: this.#dataTypeList.rows
            , items: this.#itemList.rows
            , types: this.#typeList.rows
            , infos: this.#infoList.rows
        };

        let schemaString = JSON.stringify(obj);
        return schemaString;
    }


    /**
     * Erzeugt das Schema von einem Objekt
     * @param {Object<string,any>} obj - Schema Daten als Objekt
     * @returns {boolean|undefined} true wenn angelegt
     */
    setFromObject(obj) {
        if (!obj || typeof obj != "object") { return; }
        if (obj.infotype != "infoSchema") {return;}

        this.#refList = new DataTable("refs", obj.refs || [RefTypeFields], RefTypeUnique);
        this.#uniqueList = new DataTable("uniques", obj.uniques || [UniqueTypeFields], UniqueTypeUnique);
        this.#enumList = new DataTable("enums", obj.enums || [EnumTypeFields], EnumTypUnique);
        this.#dataTypeList = new DataTable("datatypes", obj.datatypes || [DataTypeFields], DataTypeUnique);
        this.#itemList = new DataTable("items", obj.items || [ItemTypeFields], ItemTypeUnique);
        this.#typeList = new DataTable("types", obj.types || [SchemaTypeFields], SchemaTypeUnique);
        this.#infoList = new DataTable("infos", obj.infos || [InfoTextFields], InfoTextUnique);

        return true;
    }


    /**
     * Erzeugt das Schema von einem JSON-String
     * @param {string} jsonString - JSON-String von dem das Schema erzeugt wird
     * @returns {boolean|undefined} true wenn angelegt
     */
    setFromJSON(jsonString) {
        if (!jsonString || typeof jsonString != "string") { return; }

        const obj = JSON.parse(jsonString);
        return this.setFromObject(obj);
    }


    /**
     * Erzeugt ein neues Schema
     * @param {string} name - Name des Schemas
     * @param {string|Object|undefined} [data] - JSON-String oder Objekt mit SchemaDaten
     */
    constructor(name, data) {
        this.#name = name;
        SchemaList.set(name, this);

        // Wenn Daten
        if (typeof data == "string") {
            this.setFromJSON(data);
        } else if (typeof data == "object") {
            this.setFromObject(data);
        }
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

// ===========================
//   InfoSchema
// --------------

export const infoSchema = new Schema("infoSchema");

infoSchema.addProperty("InfoText", "GSID");
infoSchema.addProperty("InfoText", "refID");
infoSchema.addProperty("InfoText", "refType", { itemType: "refTypeEnum", defaultValue: "DataType" });
infoSchema.addProperty("InfoText", "lang", { defaultValue: "de" });
infoSchema.addProperty("InfoText", "date");
infoSchema.addProperty("InfoText", "text");

infoSchema.addEnumItem("refTypeEnum", "schema");
infoSchema.addEnumItem("refTypeEnum", "DataType");
infoSchema.addEnumItem("refTypeEnum", "PropItem");
infoSchema.addEnumItem("refTypeEnum", "EnumItem");
infoSchema.addEnumItem("refTypeEnum", "UniqueItem");
infoSchema.addEnumItem("refTypeEnum", "RefItem");

infoSchema.addProperty("RefItem", "GSID");
infoSchema.addProperty("RefItem", "dataType_name");
infoSchema.addProperty("RefItem", "name");
infoSchema.addProperty("RefItem", "props", { max: -1 });
infoSchema.addProperty("RefItem", "refObj");
infoSchema.addProperty("RefItem", "refProps", { max: -1 });
infoSchema.addProperty("RefItem", "onUpdate", { itemType: "onUpdateEnum", defaultValue: "UPDATE" });
infoSchema.addProperty("RefItem", "onDelete", { itemType: "onDeleteEnum", defaultValue: "DELETE" });

infoSchema.addEnumItem("onUpdateEnum", "NO");
infoSchema.addEnumItem("onUpdateEnum", "UPDATE");
infoSchema.addEnumItem("onUpdateEnum", "NULL");
infoSchema.addEnumItem("onUpdateEnum", "DEFAULT");

infoSchema.addEnumItem("onDeleteEnum", "NO");
infoSchema.addEnumItem("onDeleteEnum", "DELETE");
infoSchema.addEnumItem("onDeleteEnum", "NULL");
infoSchema.addEnumItem("onDeleteEnum", "DEFAULT");

infoSchema.addProperty("UniqueItem", "GSID");
infoSchema.addProperty("UniqueItem", "dataType_name");
infoSchema.addProperty("UniqueItem", "name");
infoSchema.addProperty("UniqueItem", "props", { max: -1 });

infoSchema.addProperty("EnumItem", "GSID");
infoSchema.addProperty("EnumItem", "dataType_name");
infoSchema.addProperty("EnumItem", "name");
infoSchema.addProperty("EnumItem", "value", { itemType: "stringnumber" });

infoSchema.addDataType("stringnumber", { art: "multi", base: ["string", "number"] });

infoSchema.addProperty("PropItem", "GSID");
infoSchema.addProperty("PropItem", "dataType_name");
infoSchema.addProperty("PropItem", "name");
infoSchema.addProperty("PropItem", "itemType", { defaultValue: "string" });
infoSchema.addProperty("PropItem", "min", { itemType: "number", defaultValue: 1 });
infoSchema.addProperty("PropItem", "max", { itemType: "number", defaultValue: 1 });
infoSchema.addProperty("PropItem", "defaultValue", { itemType: "any", min: 0 });
infoSchema.addProperty("PropItem", "fix", { itemType: "any", min: 0 });
infoSchema.addProperty("PropItem", "use", { itemType: "any", min: 0 });

infoSchema.addDataType("DataType", { id: "name" });
infoSchema.addProperty("DataType", "name");
infoSchema.addProperty("DataType", "schemaPath");
infoSchema.addProperty("DataType", "art", { itemType: "artEnum" });
infoSchema.addProperty("DataType", "base");
infoSchema.addProperty("DataType", "length", { itemType: "number", min: 0 });
infoSchema.addProperty("DataType", "minLength", { itemType: "number", min: 0 });
infoSchema.addProperty("DataType", "maxLength", { itemType: "number", min: 0 });
infoSchema.addProperty("DataType", "pattern", { min: 0 });
infoSchema.addProperty("DataType", "whitespace", { min: 0 });
infoSchema.addProperty("DataType", "casing", { itemType: "casingEnum", min: 0 });
infoSchema.addProperty("DataType", "decimals", { itemType: "number", min: 0 });
infoSchema.addProperty("DataType", "minInclusive", { itemType: "stringnumber", min: 0 });
infoSchema.addProperty("DataType", "minExclusive", { itemType: "stringnumber", min: 0 });
infoSchema.addProperty("DataType", "maxExclusive", { itemType: "stringnumber", min: 0 });
infoSchema.addProperty("DataType", "maxInclusive", { itemType: "stringnumber", min: 0 });
infoSchema.addProperty("DataType", "id", { max: -1, defaultValue: "GSID" });

infoSchema.addEnumItem("artEnum", "string");
infoSchema.addEnumItem("artEnum", "number");
infoSchema.addEnumItem("artEnum", "boolean");
infoSchema.addEnumItem("artEnum", "object");
infoSchema.addEnumItem("artEnum", "enum");
infoSchema.addEnumItem("artEnum", "group");
infoSchema.addEnumItem("artEnum", "choice");
infoSchema.addEnumItem("artEnum", "multi");

infoSchema.addEnumItem("casingEnum", "camelCase");
infoSchema.addEnumItem("casingEnum", "PascalCase");
infoSchema.addEnumItem("casingEnum", "snake_case");
infoSchema.addEnumItem("casingEnum", "lower");
infoSchema.addEnumItem("casingEnum", "upper");

// ==============================

