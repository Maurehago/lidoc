// =========================
//  Schema und Typen 
// =========================
// @ts-check

// Basis Typen: string, number, boolean, object, enum
// Datum Typen: date, time, datetime, range

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
    #schemaName = "";
    /** @type {string} Name des Schemas */
    get schemaName() {
        return this.#schemaName;
    }
    #parentType = "";
    /** @type {string} Name des Eltern-Objekt-Type */
    get parentType() {
        return this.#parentType;
    }

    /** @type {string} Name der Eigenschaft/Attribute */
    #name = "";
    get name() {
        return this.#name;
    }

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
    
    /** @type {Array<string>} Liste mit Beschreibungstexten */
    info = [];

    /**
     * Erzeugt eine Property oder ein Atribute
     * @param {string} schemaName - Name des Schemas
     * @param {string} parentType - Name des Objekt-Types zu dem diese property gehört 
     * @param {string} name - Name der Property(Spalte)
     * @param {string|Array<string>} [itemType] - Name vom Typ oder Liste von Typnamen. Default: "string"
     * @param {PropItemOptions} [options] - Optional Optionen für das PropItem.
     */
    constructor(schemaName, parentType, name, itemType, options) {
        Object.assign(this, options);
        this.#schemaName = schemaName;
        this.#parentType = parentType;
        this.#name = name;
        this.itemType = itemType || "string";
    }
}



// DataType:
export class DataType {
    
    /** @type {string} Name des Schemas */
    #schemaName = "";
    get schemaName() {
        return this.#schemaName;
    }
    
    /** @type {string} Name des Datentypes */
    #name;
    get name() {
        return this.#name;
    }
    
    /** @type {"string"|"number"|"boolean"|"object"|"enum"|"group"|"choice"} BasisTyp - default "string" */
    #art = "string";
    get art() {
        return this.#art;
    }

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
    /** @type {Map<string,EnumItem>|undefined} Enum Auswahl Items */
    #enum;
    /** @type {PropItem|undefined} TypName oder Liste von Typnamen für zusätzliche erlaubte enum werte */
    #moreEnum;


    // --- Objekt Eigenschaften ---
    /** @type {Map<string,PropItem>} Liste mit Attribute*/
    #attributes = new Map();
    /** @type {PropItem|undefined} weitere Attribute erlaubt */
    #moreAttributes;

    /** @type {Map<string,PropItem>} Liste mit Property */
    #props = new Map();
    /** @type {PropItem|undefined} Typ der bestimmt ob weitere Properties erlaubt sind */
    #moreProps;

    /** @type {string|Array<string>} Name einer Property oder Liste mit Properties die die Eindeutige ID des Objektes/Datensatzes ergeben */
    id = "GSID";
    
    /** @type {Map<string,RefItem>} Liste mit Referenzen zu Indexes */
    #ref = new Map();

    /** @type {Map<string,Array<string>>} Map mit Listen von PropertyNamen die zusammen eine Eindeutigkeit ergeben müssen  */
    #unique = new Map();

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
        this.#art = "enum";
    }

    /**
     * Fügt eine Eigenschaft für zusätzliche Enums hinzu. Dieser DatenTyp wird somit zu "enum"
     * @param {string} name - Name der Eigenschaft
     * @param {string} dataTypeName - Name des Datentypes der Eigenschaft
     * @param {PropItemOptions} options - Optional Optionen für die Eigenschaft
     * @returns {PropItem} Angelegte Eigenschaft
     */
    setMoreEnum(name, dataTypeName, options) {
        const prop = new PropItem(this.#schemaName, this.#name, name, dataTypeName, options);
        this.#moreEnum = prop;
        this.#art = "enum";
        return prop;
    }


    // todo: getEnum (as Object?)

    /**
     * Fügt eine neue Eigenschaft zu dem Datentyp hinzu. Dieser DatenTyp wird somit zu "object"
     * @param {string} name - Name der Eigenschaft
     * @param {string} dataTypeName - Name des Datentypes der Eigenschaft
     * @param {PropItemOptions} options - Optional Optionen für die Eigenschaft
     * @returns {PropItem} Angelegte Eigenschaft
     */
    addProperty(name, dataTypeName, options) {
        const prop = new PropItem(this.#schemaName, this.#name, name, dataTypeName, options);
        this.#props.set(name, prop);
        this.#art = "object";
        return prop;
    }

    /**
     * Fügt eine Eigenschaft für zusätzliche Eigenschaften hinzu. Dieser DatenTyp wird somit zu "object"
     * @param {string} name - Name der Eigenschaft
     * @param {string} dataTypeName - Name des Datentypes der Eigenschaft
     * @param {PropItemOptions} options - Optional Optionen für die Eigenschaft
     * @returns {PropItem} Angelegte Eigenschaft
     */
    addMoreProperty(name, dataTypeName, options) {
        const prop = new PropItem(this.#schemaName, this.#name, name, dataTypeName, options);
        this.#moreProps = prop;
        this.#art = "object";
        return prop;
    }

    /**
     * Fügt eine neue Auswahl-Eigenschaft zu dem Datentyp hinzu. Dieser DatenTyp wird somit zu "choice"
     * @param {string} name - Name der Eigenschaft
     * @param {string} dataTypeName - Name des Datentypes der Eigenschaft
     * @param {PropItemOptions} options - Optional Optionen für die Eigenschaft
     * @returns {PropItem} Angelegte Eigenschaft
     */
    addChoice(name, dataTypeName, options) {
        const prop = new PropItem(this.#schemaName, this.#name, name, dataTypeName, options);
        this.#props.set(name, prop);
        this.#art = "choice";
        return prop;
    }

    /**
     * Fügt eine neue Gruppen-Eigenschaft zu dem Datentyp hinzu. Dieser DatenTyp wird somit zu "group"
     * @param {string} name - Name der Eigenschaft
     * @param {string} dataTypeName - Name des Datentypes der Eigenschaft
     * @param {PropItemOptions} options - Optional Optionen für die Eigenschaft
     * @returns {PropItem} Angelegte Eigenschaft
     */
    addGroupItem(name, dataTypeName, options) {
        const prop = new PropItem(this.#schemaName, this.#name, name, dataTypeName, options);
        this.#props.set(name, prop);
        this.#art = "group";
        return prop;
    }

    /**
     * Fügt eine neues Attribute zu dem Datentyp hinzu. Dieser DatenTyp wird somit zu "object"
     * @param {string} name - Name der Eigenschaft
     * @param {string} dataTypeName - Name des Datentypes der Eigenschaft
     * @param {PropItemOptions} options - Optional Optionen für die Eigenschaft
     * @returns {PropItem} Angelegtes Attribute
     */
    addAttribute(name, dataTypeName, options) {
        const attr = new PropItem(this.#schemaName, this.#name, name, dataTypeName, options);
        this.#attributes.set(name, attr);
        this.#art = "object";
        return attr;
    }

    /**
     * Fügt eine Eigenschaft für zusätzliche Attribute hinzu. Dieser DatenTyp wird somit zu "object"
     * @param {string} name - Name der Eigenschaft
     * @param {string} dataTypeName - Name des Datentypes der Eigenschaft
     * @param {PropItemOptions} options - Optional Optionen für die Eigenschaft
     * @returns {PropItem} Angelegte Eigenschaft
     */
    addMoreAttribute(name, dataTypeName, options) {
        const prop = new PropItem(this.#schemaName, this.#name, name, dataTypeName, options);
        this.#moreAttributes = prop;
        this.#art = "object";
        return prop;
    }

    // todo: Referenzen (set/get)

    // todo: Uniques (set/get)

    /**
     * Erstellt einen DatenTyp
     * @param {string} schemaName - Name des Schemas zu dem der Typ gehört
     * @param {string} name - Name des Types
     * @param {"string"|"number"|"boolean"|"object"|"enum"|"group"} [art] - Optional - Art des Types - default: "string"
     * @param {Object<string,any>} [options] - Optional Eigenschaften des Types
     */
    constructor(schemaName, name, art, options) {
        Object.assign(this, options);
        this.#schemaName = schemaName;
        this.#name = name; // Name nach Options setzen falls in Optionen ein anderer Name drinnen ist
        this.#art = art || "string";

        // am Schema registrieren
        const schema = SchemaList.get(schemaName) || new Schema(schemaName);
        schema.types.set(name, this);
    }
}


// Schema Klasse
export class Schema {
    /** @type {string} Name des Schemas */
    #name = "";
    get name() {
        return this.#name;
    }

    /** @type {Array<string>}  Informationen zum Schema*/
    info = [];

    /** @type {Array<string>}  APP Informationen zum Schema*/
    appinfo = [];

    /** @type {Map<string,string>} Schema Attribute */
    attributes = new Map(); // Sind Daten und keine Typen!

    /** @type {Map<string,DataType>} Schema Typen */
    types = new Map();

    /** @type {Map<string,PropItem>} Schema PropItems (Schema globale Properties)*/
    propItems = new Map();

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
        }
        dataType.type = "object";
        dataType.props.set(propertyName, propItem);
        return dataType;
    }


    /**
     * Registriert Einstellungen für weitere Properties.  
     * Wenn ein Typ mit dem Selben Namen existiert, so wird dieser überschrieben.  
     * @param {string} typeName - Name der Liste in die die Spalte eingefügt wird. Bei "schema" oder "" wird nur der SpaltenTyp registriert.
     * @param {PropItem} propItem - Optionale Einstellungen für die Spalte
     * @returns {DataType} Objekt DatenTyp
     */
    setMoreProperty(typeName, propItem) {
        let dataType = this.types.get(typeName);
        if (!dataType) {
            dataType = new DataType(typeName, "object");
            this.types.set(typeName, dataType);
        } 
        dataType.type = "object";
        dataType.moreProps = propItem;
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
        } 
        dataType.type = "object";
        dataType.attributes.set(attributeName, propItem);
        return dataType;
    }


    /**
     * Registriert eine neue Attribute für einen Typ.  
     * Wenn ein Typ mit dem Selben Namen existiert, so wird dieser überschrieben.  
     * @param {string} typeName - Name der Liste in die die Spalte eingefügt wird. Bei "schema" oder "" wird nur der SpaltenTyp registriert.
     * @param {PropItem} propItem - Optionale Einstellungen für die Spalte
     * @returns {DataType} Objekt DatenTyp
     */
    setMoreAttribute(typeName, propItem) {
        let dataType = this.types.get(typeName);
        if (!dataType) {
            dataType = new DataType(typeName, "object");
            this.types.set(typeName, dataType);
        } 
        dataType.type = "object";
        dataType.moreAttributes = propItem;
        return dataType;
    }


    /**
     * Setzt einen neuen BasisTyp bei einem Bestehenden Typ
     * @param {string} typeName - Name des Types
     * @param {string} baseTypeName - Neuer BasisTyp Name
     * @returns {DataType} Veränderten DatenTyp
     */
    setBaseType(typeName, baseTypeName) {
        let dataType = this.types.get(typeName);
        if (!dataType) {
            dataType = new DataType(typeName);
            this.types.set(typeName, dataType);
        } 
        dataType.base = baseTypeName;
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
        } 
        dataType.ref.set(refName, refItem);
    }


    /**
     * Setzt einen Infotext für einen Typ oder das "schema"
     * @param {string} typeName - Name des Types. "schema" für Das Schema selbst.
     * @param {string} infoText - Infotext für den Typ
     */
    addInfo(typeName, infoText) {
        if (typeName == "schema") {
            this.info.push(infoText);
        } else {
            let dataType = this.types.get(typeName);
            if (!dataType) {
                dataType = new DataType(typeName);
                this.types.set(typeName, dataType);
            }
            dataType.info.push(infoText);
        }
    }


    /**
     * Setzt einen InfoText für eine Property
     * @param {string} typeName - Name des Types
     * @param {string} propName - name der Property
     * @param {string} infoText - Infotext für die Property
     */
    addPropInfo(typeName, propName, infoText) {
        let dataType = this.types.get(typeName);
        if (!dataType) {
            dataType = new DataType(typeName);
            this.types.set(typeName, dataType);
        }
        let propItem = dataType.props.get(propName);
        if (!propItem) {
            propItem = new PropItem(propName);
            dataType.props.set(propName, propItem);
        }
        propItem.info.push(infoText);
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
