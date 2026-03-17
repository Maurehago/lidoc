// =========================
//  Schema und Typen 
// =========================
// @ts-check

// Basis Typen: string, number, boolean, object, enum
// Datum Typen: date, time, datetime, range

/**
 * @typedef {object} DataTypeOptions
 * @property {string|Array<string>} [base] BasisTyp(abgeleitet von) der Eigenschaft. Defaults: "string"|"number"|"boolean"|"object"|"enum"|"GSID"|string
 * @property {Array<string>} [info] - Beschreibungstexte zum Datentyp
 * @property {number} [length] - Exakte Länge eines Strings oder Anzahl Zeichen bei Nummern
 * @property {number} [minLength] - Minimale Länge eines Strings
 * @property {number} [maxLength] - Maximale Länge eines Strings
 * @property {string} [pattern] - Regular Expression
 * @property {string} [whitespace] - Wie wird mit Leerzeichen umgegangen
 * @property {"camelCase"|"PascalCase"|"snake_case"|"lower"|"upper"} [casing] - Schreibweise für String. Wenn nicht angegeben dann ist es egal.
 * @property {string|undefined} [additionalEnum] TypName für zusätzliche enum werte erlaubt
 * @property {number} [decimals] - Anzahl der Dezimalstellen
 * @property {string|number} [minInclusive] - Minimaler Wert inclusive
 * @property {string|number} [minExclusive] - Minimaler Wert größer als
 * @property {string|number} [maxExclusive] - Maximaler Wert kleiner als
 * @property {string|number} [maxInclusive] - Maximaler Wert inclusive
 * @property {string|Array<string>} [id] - Name einer Property oder Liste mit Properties die die Eindeutige ID des Objektes/Datensatzes ergeben
 */


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


// ==============================
//   Klassen
// -----------

export class EnumItem {
    /** @type {string} */
    name = "";
    /** @type {string|number} */
    value;
    /** @type {string} */
    info = "";

    /**
     * Enum Eintrag
     * @param {string} name - Name des Enums
     * @param {string|number} [value] - Wert des Enums
     * @param {string} [info] - Infotext
     */
    constructor(name, value, info) {
        this.name = name;
        this.value = value == undefined ? name : value;
        this.info = info || "";
    }
}


export class RefItem {
    /** @type {string} */
    name = "";

    /** @type {Array<string>} Selector für Eigenschaften vom Aktuellen objekt */
    props = [];

    /** @type {string} Name des Fremd Objektes */
    refObj = "";

    /** @type {Array<string>} Selector für Eigenschaften vom Referenzierten objekt */
    refProps = [];

    /** @type {"NO"|"UPDATE"|"NULL"|"DEFAULT"} Regel für Update */
    onUpdate = "UPDATE";

    /** @type {"NO"|"DELETE"|"NULL"|"DEFAULT"} Regel für Löschen */
    onDelete = "DELETE";

    /** @type {string} */
    info = "";

    /**
     * ID Item Eintrag
     * @param {string} name - Name der ID
     * @param {Array<string>} props - Property Namen zum Verknüpfen vom aktuellen Objekt
     * @param {string} refObj - Name/Type des Fremd Opbjektes
     * @param {Array<string>} refProps - Property Namen zum Verknüpfen vom fremden Objekt
     * @param {"NO"|"UPDATE"|"NULL"|"DEFAULT"} [onUpdate] - Optional Beschreibung zur ID
     * @param {"NO"|"DELETE"|"NULL"|"DEFAULT"} [onDelete] - Optional Beschreibung zur ID
     * @param {string} [info] - Optional Beschreibung zur ID
     */
    constructor(name, props, refObj, refProps, onUpdate, onDelete, info) {
        this.name = name;
        this.props = props;
        this.refObj = refObj;
        this.refProps = refProps;
        this.onUpdate = onUpdate || "UPDATE";
        this.onDelete = onDelete || "DELETE";
        this.info = info || "";
    }
}


export class PropItem {
    /** @type {string} Name der Eigenschaft/Attribute */
    name = "";

    /** @type {string|Array<string>} BasisTyp(abgeleitet von) der Eigenschaft. Defaults: "string"|"number"|"boolean"|"object"|"enum"|"GSID"|string */
    base = "string";

    /** @type {Array<string>} Liste mit Beschreibungstexten */
    info = [];

    
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

    /**
     * Erzeugt eine Property oder ein Atribute
     * @param {string} name - Name der Property(Spalte)
     * @param {string|Array<string>} base - Basistyp(en) der Property(Spalte)
     * @param {number} [min] - Optional Minimales Vorkommen. Default = 1.
     * @param {number} [max] - Optional Maximales Vorkommen. Default = 1. Unendlich = -1.
     * @param {any} [defaultValue] - Optional Default Wert
     * @param {any} [fix] - Optional Fixer Wert  
     * @param {string} [use] - Optional Bedingung wann diese Property verwendet wird
     */
    constructor(name, base, min, max, defaultValue, fix, use) {
        this.name = name;
        this.base = base || "string";
        this.min = min || 1;
        this.max = max || 1;
        this.defaultValue = defaultValue;
        this.fix = fix;
        this.use = use || "";
    }
}



// DataType:
export class DataType {
    ///** @type {"type"|"attribute"|"col"|"list"}  Art des Types */
    //art = "type";
    
    /** @type {string} Name des Schemas */
    schemaName = "";
    
    /** @type {string} Name des Datentypes */
    name;
    
    /** @type {string|Array<string>} BasisTyp(abgeleitet von) der Eigenschaft. Defaults: "string"|"number"|"boolean"|"object"|"enum"|"GSID"|string */
    base = "string";
    
    ///** @type {string|Array<string>} Typ der Eigenschaft oder Liste von TypNamen - default "string" */
    //type = "string";
    ///** @type {string|undefined} Name der Liste wenn vom type="object" */
    //list;
    
    /** @type {Array<string>} Liste mit Beschreibungstexten */
    info = [];

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

    // --- Enum Eigenschaft ---
    /** @type {Map<string,EnumItem>|undefined} Enum Auswahl Items */
    #enum;
    /** @type {string|undefined} TypName für zusätzliche enum werte erlaubt */
    additionalEnum;

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


    // --- Objekt Eigenschaften ---
    /** @type {Map<string,PropItem>} Liste mit Attribute*/
    attributes = new Map();
    /** @type {PropItem|undefined} weitere Attribute erlaubt */
    moreAttributes;
    /** @type {Map<string,PropItem>} Liste mit Property */
    props = new Map();
    /** @type {PropItem|undefined} Typ der bestimmt ob weitere Properties erlaubt sind */
    moreProps;
    /** @type {string|Array<string>} Name einer Property oder Liste mit Properties die die Eindeutige ID des Objektes/Datensatzes ergeben */
    id = "GSID";
    
    /** @type {Map<string,RefItem>} Liste mit Referenzen zu Indexes */
    ref = new Map();

    /** @type {Map<string,Array<string>>} Map mit Listen von PropertyNamen die zusammen eine Eindeutigkeit ergeben müssen  */
    unique = new Map();

    /**
     * Fügt einen neuen Enum Eintrag im DataTyp
     * @param {string} name - Name des Enum-Eintrag
     * @param {string|number} [value] - Wert des Enum-Eintrag
     * @param {string} [info] - Infotext für den Enum Eintrag
     */
    addEnum(name, value, info) {
        // prüfen ob vorhanden
        if (!this.#enum) {
            // neue Enum Map anlegen
            this.#enum = new Map();
        }

        let item = new EnumItem(name, value, info);
        this.#enum.set(name, item);
    }

    /**
     * Erstellt einen DatenTyp
     * @param {string} [name] - Optional - Name des Types
     * @param {string|Array<string>} [base] - Optional - BasisTyp
     * @param {Object<string,any>} [options] - Optional Eigenschaften des Types
     */
    constructor(name, base, options) {
        Object.assign(this, options);
        this.name = name || getGSID(); // Name nach Options setzen falls in Optionen ein anderer Name drinnen ist
        this.base = base || "string";
    }
}


// Schema Klasse
export class Schema {
    /** @type {string} Name des Schemas */
    name = "";
    /** @type {Array<string>}  Informationen zum Schema*/
    info = [];

    /** @type {Array<string>}  APP Informationen zum Schema*/
    appinfo = [];

    /** @type {Map<string,string>} Schema Attribute */
    attributes = new Map(); // Sind Daten und keine Typen!

    /** @type {Map<string,DataType>} */
    types = new Map();

    /**
     * Registriert eine neue Propperty für einen Typ.  
     * Wenn ein Typ mit dem Selben Namen existiert, so wird dieser überschrieben.  
     * @param {string} typeName - Name der Liste in die die Spalte eingefügt wird. Bei "schema" oder "" wird nur der SpaltenTyp registriert.
     * @param {string} propertyName - Name der Spalte 
     * @param {PropItem} propItem - Optionale Einstellungen für die Spalte
     * @returns {DataType} Objekt DatenTyp
     */
    addProperty(typeName, propertyName, propItem) {
        let dataType = this.types.get(typeName);
        if (!dataType) {
            dataType = new DataType(typeName, "object");
            this.types.set(typeName, dataType);
        } else if (Array.isArray(dataType.base) || dataType.base == "string") {
            dataType.base = "object";
        }
        dataType.props.set(propertyName, propItem);
        return dataType;
    }


    /**
     * Registriert eine neue Attribute für einen Typ.  
     * Wenn ein Typ mit dem Selben Namen existiert, so wird dieser überschrieben.  
     * @param {string} typeName - Name der Liste in die die Spalte eingefügt wird. Bei "schema" oder "" wird nur der SpaltenTyp registriert.
     * @param {string} attributeName - Name der Spalte 
     * @param {PropItem} propItem - Optionale Einstellungen für die Spalte
     * @returns {DataType} Objekt DatenTyp
     */
    addAttribute(typeName, attributeName, propItem) {
        let dataType = this.types.get(typeName);
        if (!dataType) {
            dataType = new DataType(typeName, "object");
            this.types.set(typeName, dataType);
        } else if (Array.isArray(dataType.base) || dataType.base == "string") {
            dataType.base = "object";
        }
        dataType.attributes.set(attributeName, propItem);
        return dataType;
    }


    /**
     * Fügt ein neues Enum Item zu einem EnumTyp hinzu
     * @param {string} typeName - Name des ENUM-Types
     * @param {string} name - EnumItem Name
     * @param {string} [value] - Optional EnumItem Wert. Wenn nicht angegeben wird der Name auch zum Wert.
     * @param {string} [info] - Optional Beschreibung zum EnumItem
     */
    addEnum(typeName, name, value, info) {
        let dataType = this.types.get(typeName);
        if (!dataType) {
            dataType = new DataType(typeName, "enum");
            this.types.set(typeName, dataType);
        }
        // Enum Werte hinzufügen
        dataType.addEnum(name, value, info);
    }


    /**
     * Fügt einem Typ ein Unique Item hinzu
     * @param {string} typeName - Name des Types dem das Unique hinzugefügt wird
     * @param {string} uniqueName - Unique Bezeichner
     * @param {Array<string>} fieldList - Felder des Objektes das den Unique erzeugt
     */
    addUnique(typeName, uniqueName, fieldList) {
        let dataType = this.types.get(typeName);
        if (!dataType) {
            dataType = new DataType(typeName, "object");
            this.types.set(typeName, dataType);
        } else if (Array.isArray(dataType.base) || dataType.base == "string") {
            dataType.base = "object";
        }
        dataType.unique.set(uniqueName, fieldList);
    }


    /**
     * Fügt einem Datentyp ein ReferenzObjekt hinzu
     * @param {string} typeName - Name des DatenTyps
     * @param {string} refName - Name der Referenz
     * @param {RefItem} refItem - ReferentItem Objekt
     */
    addRef(typeName, refName, refItem) {
        let dataType = this.types.get(typeName);
        if (!dataType) {
            dataType = new DataType(typeName, "object");
            this.types.set(typeName, dataType);
        } else if (Array.isArray(dataType.base) || dataType.base == "string") {
            dataType.base = "object";
        }
        dataType.ref.set(refName, refItem);
    }


    /**
     * Erzeugt ein neues Schema
     * @param {string} name - Name des Schemas
     */
    constructor(name) {
        this.name = name;
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
 * @param {DataType} type - Typ der Datenzeile
 * @returns {string} HTMLString
 */
function getNameTypeHTML(type) {
    let html = "";
    if (!(type instanceof DataType)) { return html; }

    let typeType = type.type;
    if (Array.isArray(type.type)) {
        typeType = "";
        for (let i = 0; i < type.type.length; i++) {
            if (i > 0) { typeType += ","; }
            typeType += type.type[i];
        }
    }

    // Zeile zusammenbauen
    //html = `<li>${type.name}&nbsp;(${type.min},${type.max})&nbsp;{${typeType}}&nbsp;${getInfoHTML(type.info)}</li>`;
    html = `${type.name}&nbsp;(${type.min},${type.max})&nbsp;{${typeType}}&nbsp;${getInfoHTML(type.info)}`;
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
    if (["string", "number", "boolean", "object"].indexOf(typeName) >= 0) {
        return "";
    }

    const type = schema.getType(typeName);
    if (!type) {
        html += `<p>Type ${typeName} not found</p>`;
        return "";
    }

    // Art lesen
    // "type"|"attribute"|"col"|"list"
    switch (type.art) {
        case "type":

            break;
        case "attribute":

            break;
        case "col":
            // base
            // art
            html1 = getNameTypeHTML(type);
            html2 = getTypeHTML(schema, type.type);
            if (html2) {
                html += `<details><summary><p icon-r>${html1}</p></summary>${html2}</details>`;
            } else {
                html += html1;
            }
            break;
        case "list":
            // base
            // art
            //html += getNameTypeHTML(type);
            // attribute
            if (type.attributes.length > 0) {
                html += "<li><b>Attributes</b>(" + type.attributes.length + ")";
                html += "<ul>";
                for (let i = 0; i < type.attributes.length; i++) {
                    let typeAttr = schema.getType(type.attributes[i]);
                    if (typeAttr) {
                        html += getNameTypeHTML(typeAttr);
                    } else {
                        html += `<li>${type.attributes[i]}</li>`;
                    }
                }
                html += "</ul></li>";
            }
            // moreattribute
            // cols
            if (type.cols.length > 0) {
                html += "<li icon-r><b>Cols</b>(" + type.cols.length + ")";
                html += "<ul>";
                for (let i = 0; i < type.cols.length; i++) {
                    let typeCol = schema.getType(type.cols[i]);
                    if (typeCol) {
                        html1 = getNameTypeHTML(typeCol);
                        html2 = getTypeHTML(schema, typeCol.type);
                        if (html2) {
                            html += `<details><summary><p icon-r>${html1}</p></summary>${html2}</details>`;
                        } else {
                            html += `<li>${html1}</li>`;
                        }
                    } else {
                        html += `<li>${type.cols[i]}</li>`;
                    }
                }
                html += "</ul></li>";
            }
            // morecols
            break;

        default:
            break;
    }

    // Typ.Typ prüfen
    //html += getTypeHTML(schema, type.type);

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
