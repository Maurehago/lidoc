// =========================
//  Schema und Typen 
// =========================
// @ts-check

// Basis Typen: string, number, boolean, object, enum
// Datum Typen: date, time, datetime, range

// DataType:
// name {string}: Name der Eigenschaft
// base {string}: BasisTyp der Eigenschaft
// info: Liste mit Beschreibungstexten
// - length: exakte Länge (für string, number(anzahl der zeichen ohne Vorzeichen), object?)
// - minLength: Minimale Anzahl Zeichen (für string)
// - maxLength: Maximale Anzahl Zeichen (für string)
// - pattern: Regular Expression (für string)
// - whitespace: wie wird mit Leerzeichen umgegangen (für string)
// - casing: camelCase, PascalCase, snake_case, lower snake_case, upper snake_case (für string)
// - enum: Werte die in einer Liste vorkommen (für string, number, date, time, datetime, range)
// - additionalEnum: Zusätzliche enum werte erlaubt (für string, number, date, time, datetime, range)
// - decimals: Anzahl der Dezimalstellen (für number)
// - minInclusive: Minimum Wert inclusive angegebenen Wert (für number, date, time, datetime, range)
// - minExclusive: Minimum Wert größer angegebenen Wert (für number, date, time, datetime, range)
// - maxExclusive: Maximalwert kleiner angegebenen Wert (für number, date, time, datetime, range)
// - maxInclusive: Maximalwert kleiner gleich angegebenen Wert (für number, date, time, datetime, range)

// DataProperty:
// name: Name der Eigenschaft
// type: BasisTyp der Eigenschaft
// info: Liste mit Beschreibungstexten
// - min: Minimales Vorkommen der Eigenschaft/attribute. 0: Optional
// - max: Maximales Vorkommen der Eigenschaft/Attribute. -1: Unendlich
// - fixed: Fixer Wert
// - default: Standard Wert

// "object" Ausprägung:
// - Name
// - type {string|DataType}:
// - info: Liste mit Beschreibungstexten
// - min {number}: Minimales Vorkommen vom Objekt. 0: Optional
// - max {number}: Maximales Vorkommen vom Objekt. -1: Unendlich
// - attribute {Array<DataProperty>}: Liste mit DataProperties
// - oneOfAttribute {Array<Array<DataProperty|number>>}: Entweder Oder Attribute, Liste mit DataProperties oder Liste mit indexes für weitere Auswahlmöglichkeiten.
// - properties {Array<DataProperty>}: Liste mit Eigenschaften
// - oneOfProperties {Array<Array<DataProperty|number>>}: Entweder Oder Eigenschaften, Liste mit DataProperties oder Liste mit indexes für weitere Auswahlmöglichkeiten.
// - additionalAttribute {boolean}: Zusätzliche Attribute erlaubt
// - additionalProperties {boolean}: Zusätzlich Properties erlaubt



/**
 * @typedef {object} DataTypeOptions
 * @property {string} [base] - Name des Basistype
 * @property {Array<string>} [info] - Beschreibungstexte zum Datentyp
 * @property {number} [length] - Exakte Länge eines Strings oder Anzahl Zeichen bei Nummern
 * @property {number} [minLength] - Minimale Länge eines Strings
 * @property {number} [maxLength] - Maximale Länge eines Strings
 * @property {string} [pattern] - Regular Expression
 * @property {string} [whitespace] - Wie wird mit Leerzeichen umgegangen
 * @property {"camelCase"|"PascalCase"|"snake_case"|"lower"|"upper"} [casing] - Schreibweise für String. Wenn nicht angegeben dann ist es egal.
 * @property {Array<EnumItem>} [enum] - Enums Auswahlmöglichkeit
 * @property {boolean} [additionalEnum] - Weitere EnumItems möglich
 * @property {number} [decimals] - Anzahl der Dezimalstellen
 * @property {string|number} [minInclusive] - Minimaler Wert inclusive
 * @property {string|number} [minExclusive] - Minimaler Wert größer als
 * @property {string|number} [maxExclusive] - Maximaler Wert kleiner als
 * @property {string|number} [maxInclusive] - Maximaler Wert inclusive
 */

/**
 * @typedef {object} DataPropertyOptions
 */


/**
 * @typedef {object} DataObjOptions
 * @property {string|DataType} [type] Objekt Typ oder TypName. default: "string"
 * @property {Array<string>} [info] Liste mit Beschreibungstexten
 * @property {number} [min] Minimales Vorkommen vom Objekt. optional: 0, default: 1
 * @property {number} [max] Maximales Vorkommen vom Objekt. unendlich: -1, default: 1
 * @property {Array<DataProperty>} [attribute] Liste mit DataProperties
 * @property {Array<DataProperty>} [properties] Liste mit Eigenschaften oder Objekten
 * @property {Array<Array<DataProperty|number>>} [oneOfAttribute] Entweder Oder Attribute, Liste mit DataProperties oder Liste mit indexes für weitere Auswahlmöglichkeiten.
 * @property {Array<Array<DataProperty|number>>} [oneOfProperties] Entweder Oder Eigenschaften, Liste mit DataProperties oder Liste mit indexes für weitere Auswahlmöglichkeiten.
 * @property {boolean} [additionalAttribute] Zusätzliche Attribute erlaubt
 * @property {boolean} [additionalProperties] Zusätzlich Properties erlaubt
 */


// base: BasisTyp der Eigenschaft
// Restriction
// - length: exakte Länge (für string, number(anzahl der zeichen ohne Vorzeichen), object?)
// - minLength: Minimale Anzahl Zeichen (für string)
// - maxLength: Maximale Anzahl Zeichen (für string)
// - pattern: Regular Expression (für string)
// - whitespace: wie wird mit Leerzeichen umgegangen (für string)
// - casing: camelCase, PascalCase, snake_case, lower snake_case, upper snake_case (für string)
// - enum: Werte die in einer Liste vorkommen (für string, number, date, time, datetime, range)
// - additionalEnum: Zusätzliche enum werte erlaubt (für string, number, date, time, datetime, range)
// - decimals: Anzahl der Dezimalstellen (für number)
// - minInclusive: Minimum Wert inclusive angegebenen Wert (für number, date, time, datetime, range)
// - minExclusive: Minimum Wert größer angegebenen Wert (für number, date, time, datetime, range)
// - maxExclusive: Maximalwert kleiner angegebenen Wert (für number, date, time, datetime, range)
// - maxInclusive: Maximalwert kleiner gleich angegebenen Wert (für number, date, time, datetime, range)


/**
 * Gibt eine neue GlobalShortId zurück
 * @returns {string}
 */
export function getGSID() {
    return new Date().getTime().toString(36) +
        crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}


// ==============================
//   Klassen
// -----------

class EnumItem {
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


// DataType:
export class DataType {
    /** @type {string|undefined} Name der Eigenschaft */
    name;
    /** @type {string|undefined} BasisTyp der Eigenschaft */
    base = "";
    /** @type {Array<string>} Liste mit Beschreibungstexten */
    info = [];
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
    /** @type {Map<string,EnumItem>|undefined} Enum Auswahl Items */
    #enum;
    /** @type {boolean|undefined} Zusätzliche enum werte erlaubt (für string, number, date, time, datetime, range) */
    additionalEnum;
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
     * @param {DataType} [options] - Optional Eigenschaften des Types
     */
    constructor(name, options) {
        Object.assign(this, options);
        this.name = name; // Name nach Obtions setzen falls in Ooptionen ein anderer Name drinnen ist
    }
}


// DataProperty:
export class DataProperty {
    /** @type {string|undefined} Name der Eigenschaft */
    name;
    /** @type{"type"|"object"|"group"} Typ, Objekt oder Gruppe. Gruppe ist ein Objekt mit Properties die zusätzlich zum DatenObjekt hinzugefügt werden. default: "type" */
    art = "type";
    /** @type{string|DataType|DataObject} BasisTyp der Eigenschaft. default: "string" */
    type = "string";
    /** @type {Array<string>|undefined} Liste mit Beschreibungstexten */
    info;
    /** @type {number} Minimales Vorkommen der Eigenschaft/attribute. optional: 0, default: 1 */
    min = 1;
    /** @type {number} Maximales Vorkommen der Eigenschaft/Attribute. unendlich: -1: default: 1 */
    max = 1;
    /** @type{any} - Fixer Wert */
    fixed;
    /** @type {any} Standard Wert */
    default;
    /** @type {boolean} "true" wenn Arrtibute. default: "false" */
    isAttribute = false;

    /**
     * 
     * @param {string} [name] - Name des Property
     * @param {DataProperty} [options] - Optional Optionen fpr das Property 
     */
    constructor(name, options) {
        Object.assign(this, options);
        this.name = name; // Name nach Options setzen falls in Optionen ein anderer Name drinnen ist
    }
}


// "object" Ausprägung:
export class DataObject {
    /** @type {Map<string,DataProperty>} Interne Auflistung von Properties */
    #prop = new Map();

    /** @type {string|undefined} Name des Daten Objektes  */
    name;
    /** @type {string|DataType} Objekt Typ oder TypName. default: "string" */
    type = "string";
    /** @type {Array<string>|undefined} Liste mit Beschreibungstexten */
    info;
    /** @type {number} Minimales Vorkommen vom Objekt. optional: 0, default: 1 */
    min = 1;
    /** @type {number} Maximales Vorkommen vom Objekt. unendlich: -1, default: 1 */
    max = 1;
    /** @type {Array<DataProperty>|undefined} Liste mit DataProperties */
    attribute;
    /** @type {Array<DataProperty>|undefined} Liste mit Eigenschaften oder Objekten */
    properties;
    /** @type {Array<Array<DataProperty|number>>|undefined} Entweder Oder Attribute, Liste mit DataProperties oder Liste mit indexes für weitere Auswahlmöglichkeiten. */
    oneOfAttribute;
    /** @type {Array<Array<DataProperty|number>>|undefined} Entweder Oder Eigenschaften, Liste mit DataProperties oder Liste mit indexes für weitere Auswahlmöglichkeiten. */
    oneOfPropperties;
    /** @type {boolean|undefined} Zusätzliche Attribute erlaubt */
    additionalAttribute;
    /** @type {boolean|undefined} Zusätzlich Properties erlaubt */
    additionalProperties;

    /**
     * Registriert neue Properties und Attribute
     * @param {Array<DataProperty>|undefined} props - Liste Mit Properties
     * @param {boolean} isAttribute - "true" wenn "props" Attribute sind
     */
    #registerProps(props, isAttribute) {
        if (!props) { return; }
        for (let i = 0; i < props.length; i++) {
            const prop = props[i];
            prop.isAttribute = isAttribute;
            if (prop.name) {
                this.#prop.set(prop.name, prop);
            }
        }
    }

    /**
     * Löscht ein Property aus einer Liste
     * @param {string} name - Name der Property
     * @param {Array<DataProperty|number>} [list] - Optional Liste aus der gelöscht wird. Wenn Nicht angegeben wird aus allen listen gelöscht.
     */
    #removeProp(name, list) {
        // Wenn keine List übergeben -> alle Listen durchgehen
        if (!list) {
            if (this.attribute) {
                this.#removeProp(name, this.attribute)
            }
            if (this.properties) {
                this.#removeProp(name, this.properties)
            }
            if (this.oneOfAttribute) {
                for (let i = 0; i < this.oneOfAttribute.length; i++) {
                    this.#removeProp(name, this.oneOfAttribute[i]);
                }
            }
            if (this.oneOfPropperties) {
                for (let i = 0; i < this.oneOfPropperties.length; i++) {
                    this.#removeProp(name, this.oneOfPropperties[i]);
                }
            }
            return;
        }

        // ab hier gibt es eine Liste
        for (let i = 0; i < list.length; i++) {
            let prop = list[i];
            if (prop instanceof DataProperty) {
                if (prop.name == name) {
                    // Aus Liste löschen
                    list.splice(i, 1);
                }
            }
        }
    }

    /**
     * Fügt ein neues Property hinzu. Gibt es bereits ein Property mit dem Namen wird das bestehende Property überschrieben.
     * @param {string|DataProperty} name - Name oder Property Objekt
     * @param {DataProperty} [options] - Optional Optionen die dem Property hinzugefügt werden
     * @param {string} [listName] - Optional Name der Liste in die das Property hinzugefügt wird
     * @param {number} [index] - Optional Index von einer OneOf Liste in der das Property hinzugefügt wird
     * @returns {DataProperty} Daten Property Objekt
     */
    addProperty(name, options, listName, index) {
        let prop;
        if (typeof name == "string") {
            if (this.#prop.has(name)) {
                // aus Auflistung löschen
                this.#removeProp(name);
            }
            prop = new DataProperty(name, options);
        } else {
            prop = name;
        }

        if (!prop.name) { return prop; }

        switch (listName) {
            case "properties":
                if (!this.properties) { this.properties = []; }
                prop.isAttribute = false;
                this.properties.push(prop);
                this.#prop.set(prop.name, prop);
                break;
            case "attribute":
                if (!this.attribute) { this.attribute = []; }
                prop.isAttribute = true;
                this.attribute.push(prop);
                this.#prop.set(prop.name, prop);
                break;
            case "oneOfProperties":
                if (index != undefined && this.oneOfPropperties && this.oneOfPropperties[index] != undefined) {
                    this.oneOfPropperties[index].push(prop);
                }
                this.#prop.set(prop.name, prop);
                break;
            case "oneOfAttribute":
                if (index != undefined && this.oneOfAttribute && this.oneOfAttribute[index] != undefined) {
                    this.oneOfAttribute[index].push(prop);
                }
                this.#prop.set(prop.name, prop);
                break;

            default:
                if (!this.properties) { this.properties = []; }
                prop.isAttribute = false;
                this.properties.push(prop);
                this.#prop.set(prop.name, prop);
                break;
        }
        return prop;
    }

    /**
     * Fügt ein neues Attribute hinzu. Gibt es bereits ein Attribute mit dem Namen wird das bestehende Atribute überschrieben.
     * @param {string|DataProperty} name - Name oder Property Objekt
     * @param {DataProperty} [options] - Optional Optionen die dem Property hinzugefügt werden
     * @returns {DataProperty} Daten Attribute
     */
    addAttribute(name, options) {
        return this.addProperty(name, options, "attribute");
    }

    /**
     * Fügt ein neues Auswahl Property hinzu. Gibt es bereits ein Property mit dem Namen wird das bestehende Property überschrieben.
     * @param {string|DataProperty} name - Name oder Property Objekt
     * @param {number} index - Index von einer OneOf Liste in der das Property hinzugefügt wird
     * @param {DataProperty} [options] - Optional Optionen die dem Property hinzugefügt werden
     * @returns {DataProperty} Daten Property
     */
    addOneOfProperties(name, index, options) {
        if (!this.oneOfPropperties) { this.oneOfPropperties = []; }
        if (this.oneOfPropperties[index] == undefined) { this.oneOfPropperties[index] = []; }
        return this.addProperty(name, options, "oneOfProperties", index);
    }

    /**
     * Fügt ein neues Auswahl Attribute hinzu. Gibt es bereits ein Attribute mit dem Namen wird das bestehende Attribute überschrieben.
     * @param {string|DataProperty} name - Name oder Property Objekt
     * @param {number} index - Index von einer OneOf Liste in der das Attribute hinzugefügt wird
     * @param {DataProperty} [options] - Optional Optionen die dem Attribute hinzugefügt werden
     * @returns {DataProperty} DatenAtribute
     */
    addOneOfAtribute(name, index, options) {
        if (!this.oneOfAttribute) { this.oneOfAttribute = []; }
        if (this.oneOfAttribute[index] == undefined) { this.oneOfAttribute[index] = []; }
        return this.addProperty(name, options, "oneOfAttribute", index);
    }

    /**
     * Gibt ein Property oder Attribute Objekt zurück
     * @param {string} name - Name des Property Objektes
     * @returns {DataProperty|undefined} Daten Property Objekt
     */
    get(name) {
        return this.#prop.get(name);
    }

    /**
     * Erstellt einen DatenObjekt
     * @param {string} [name] - Optional - Name des Objektes
     * @param {DataObject} [options] - Optional Eigenschaften des Objektes
     */
    constructor(name, options) {
        Object.assign(this, options);
        this.name = name; // Name nach Obtions setzen falls in Ooptionen ein anderer Name drinnen ist
        if (options) {
            // Attribute registrieren
            this.#registerProps(options.attribute, true);

            // Properties registrieren
            this.#registerProps(options.properties, false);
        }
    }
}


class SchemaColumn {
    /** @type {string} Name des Schemas */
    schemaName = "";

    /** @type {string} Name der Tabelle */
    tableName = "";

    /** @type {string} Name der Spalte/Attribute */
    name = "";

    /** @type{string} BasisTyp der Spalte/Attribute / default: "" */
    baseType = "";

    /** @type{string} Typ der Spalte/Attribute / default: "string" */
    type = "string";
    
    /** @type {Array<string>} Liste mit Beschreibungstexten */
    info = [];
    
    /** @type {number} Minimales Vorkommen der Spalte/Attribute / optional: 0 / default: 1 */
    min = 1;
    /** @type {number} Maximales Vorkommen der Spalte/Attribute / unendlich: -1 / default: 1 */
    max = 1;
    /** @type{any} - Fixer Wert */
    fixed;
    /** @type {any} Standard Wert */
    default;
    /** @type {boolean} "true" wenn Arrtibute. default: "false" */
    isAttribute = false;

    /**
     * Erzeugt ein neues Schema Property
     * @param {string} schemaName - Name des Schemas
     * @param {string} tableName - Name der Tabelle
     * @param {string} colName - Name der Spalte/Attribute
     * @param {string} [typeName] - Optional Name des Datentypes
     * @param {boolean} [isAttribute] - Obtional "true" wenn die Spalte ein Attribute ist
     */
    constructor(schemaName, tableName, colName, typeName, isAttribute) {
        this.schemaName = schemaName;
        this.listName = tableName;
        this.name = colName;
        this.type = typeName || "string";
        this.isAttribute = isAttribute || false;
    }
}




class SchemaTable {
    /** @type {string} Name des Schemas */
    schemaName = "";

    /** @type {string} Name der Tabelle */
    name = "";

    /** @type {Array<string>}  Informationen zum Schema*/
    info = [];

    /** @type {Map<string,SchemaColumn>} */
    attributes = new Map();

    /** @type {SchemaColumn} weitere Attribute erlaubt */
    moreAttributes = new SchemaColumn("", "", "moreAttributes");

    /** @type {Array<string>} Liste mit Property-Namen */
    cols = [];

    /** @type {SchemaColumn} weitere Attribute erlaubt */
    moreCols = new SchemaColumn("", "", "moreCols");

    /** @type {Map<string,SchemaColumn>} Property Typen */
    colSchemas = new Map();

    /**
     * Erzeugt eine neue SchemaListe
     * @param {string} schemaName - Name des Schemas
     * @param {string} tableName - Name der Tabelle
     */
    constructor(schemaName, tableName) {
        this.schemaName = schemaName;
        this.name = tableName;

        // Propertie für weitere Attribute und Propperties ausbessern
        this.moreAttributes = new SchemaColumn(schemaName, tableName, "moreAttributes");
        this.moreAttributes.max = 0; // keine weiteren Attribute
        this.moreCols = new SchemaColumn(schemaName, tableName, "moreCols"); 
        this.moreCols.max = 0; // keine weiteren Properties
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
    #types = new Map();

    /** @type {Map<string,SchemaColumn>} Spalten die noch keiner Tabelle zugeordnet sind oder Übergreifend über Tabellen verwendet werden können */
    #colSchemas = new Map();

    /** @type {Map<string,SchemaTable>} */
    #tables = new Map();

    /**
     * registriert einen Typ im Schema
     * @param {string} typeName - Typname
     * @param {DataType} [type] - DatenTyp 
     * @returns {DataType} neuen DatenTyp
     */
    addType(typeName, type) {
        if (!type) {
            type = new DataType(typeName);
        }
        // Typ Registrieren
        this.#types.set(typeName, type);
        type.name = typeName;
        return type;
    }

    /**
     * Liefert einen Typ vom Schema zurück oder "undefined" wenn nicht vorhanden.
     * @param {string} typeName - Name des Typs
     * @returns {DataType|undefined} DatenTyp
     */
    getType(typeName) {
        return this.#types.get(typeName);
    }

    /**
     * Prüft einen Typ/Typnamen, registriert den Typ (wenn DataType), und gibt den TypNamen oder neuen eindeutigen Namen zurück
     * @param {string|DataType|undefined} type - Name oder TypObjekt
     */
    #checkTyp(type) {
        // Typ prüfen
        let typeName = "string";
        // typeof type == "string" ? type : type?.name || "string";
        if (typeof type == "string") {
            typeName = type;
        } else if (type instanceof DataType) {
            if (type.name) {
                typeName = type.name;
                this.addType(typeName, type);
            } else {
                // neuer Random Typname
                typeName = getGSID();
                type.name = typeName;
                this.addType(typeName, type);
            }
        } 
        return typeName;
    }

    /**
     * Registriert eine neue Schematabelle
     * @param {string} tableName - Name der Tabelle
     * @returns {SchemaTable} neue SchemaTabelle
     */
    addTable(tableName) {
        let table = new SchemaTable(this.name, tableName);
        this.#tables.set(tableName, table);
        return table;
    }

    /**
     * Gibt ein TabellenSchema Objekt zurück
     * @param {string} tableName - Name der Tabelle
     * @returns {SchemaTable|undefined} TabellenSchema
     */
    getTable(tableName) {
        return this.#tables.get(tableName);
    }


    /**
     * Registriert eine neue Globale DatenSpalte
     * @param {string} colName - Eindeutiger Name der Spalte
     * @param {string|DataType} [type] - Name oder DatenTyp der Spalte - Default: "string"
     * @returns {SchemaColumn} DatenSchema Spalte
     */
    addCol(colName, type) {
        let typeName = this.#checkTyp(type);
        let col = new SchemaColumn(this.name, "", colName, typeName);
        this.#colSchemas.set(colName, col);
        return col;
    }

    /**
     * Registriert eine DatenSpalte auf einer Tabelle.  
     * @param {string} tableName - Tabellen Name
     * @param {string} colName - Eindeutiger Name der Spalte
     * @param {string|DataType} [type] - Name oder DatenTyp der Spalte - Default: "string"
     * @returns {SchemaColumn} DatenSchema Spalte
     */
    addTableCol(tableName, colName, type) {
        let typeName = this.#checkTyp(type);
        
        // Objekte lesen oder erstellen
        let table = this.#tables.get(tableName) || this.addTable(tableName);
        let col = this.#colSchemas.get(colName) || new SchemaColumn(this.name, tableName, colName, typeName);

        // Spalte zuweisen
        table.cols.push(colName);
        table.colSchemas.set(colName, col);
        
        return col;
    }


    /**
     * Registriert ein Attribut auf einer Tabelle.  
     * @param {string} tableName - Tabellen Name
     * @param {string} attrName - Eindeutiger Name des Attributes
     * @param {string|DataType} [type] - Name oder DatenTyp des Attributes - Default: "string"
     * @returns {SchemaColumn} AttributSchema Attribut
     */
    addTableAttribute(tableName, attrName, type) {
        // Typ prüfen
        let typeName = this.#checkTyp(type);

        // Objekte lesen oder erstellen
        let table = this.#tables.get(tableName) || this.addTable(tableName);
        let attr = new SchemaColumn(this.name, tableName, attrName, typeName, true);

        // Spalte zuweisen
        table.attributes.set(attrName, attr);
        
        return attr;
    }

    /**
     * Fügt ein neues Enum Item zu einem EnumTyp hinzu
     * @param {string} typeName - Name des ENUM-Types
     * @param {string} name - EnumItem Name
     * @param {string} [value] - Optional EnumItem Wert. Wenn nicht angegeben wird der Name auch zum Wert.
     * @param {string} [info] - Optional Beschreibung zum EnumItem
     */
    addEnum(typeName, name, value, info) {
        let type = this.#types.get(typeName);
        if (!type) {
            // neuen Typ anlegen
            type = this.addType(typeName);
        }

        // Enum Werte hinzufügen
        type.addEnum(name, value, info);
    }


    // InfoTexte zu Typen / TypenEnumItem / Spalten / Tabellen / TabellenSpalten
    // todo: ab hier weiter ausbessern
    // addTypeInfo(typeName, info) {

    // };










    // /** @type {DataObject} Schema Objekt */
    // object = new DataObject();

    // /** @type {Map<string,DataType>} Interne Liste mit registrierten Typen*/
    // #typeList = new Map();

    // /** @type {Map<string,DataObject>} Interne Liste von registrierten Objekten*/
    // #objList = new Map();

    // /**
    //  * Setz die Optionen für einen Datentyp. Wenn der Datentyp noch nicht vorhanden wird dieser angelegt.  
    //  * Gibt das DatenTyp Objekt zurück
    //  * @param {string} typeName - Name des Types
    //  * @param {DataType} [options] - Optional Optionen die für den Typ gesetz werden
    //  * @returns {DataType} DatenTyp Objekt
    //  */
    // setType(typeName, options) {
    //     let type = this.#typeList.get(typeName);
    //     if (type) {
    //         Object.assign(type, options);
    //     } else {
    //         type = new DataType(typeName, options);
    //         this.#typeList.set(typeName, type);
    //     }
    //     return type;
    // }

    // /**
    //  * Gibt ein DataTyp Objekt zurück, oder "undefined" wenn nicht gefunden.
    //  * @param {string} typeName - Name des Types
    //  * @returns {DataType|undefined} DatenTyp Objekt oder "undefined"
    //  */
    // getType(typeName) {
    //     return this.#typeList.get(typeName);
    // }

    // /**
    //  * Setz ein DatenObjekt. Ist das Objekt vorhanden werden die Optionen dem Objekt zugewiesen
    //  * @param {string} [objName] - Name des Objektes
    //  * @param {DataObject} [options] - Optional Einstellungen des Objektes
    //  * @returns {DataObject} DatenObjekt
    //  */
    // setObject(objName, options) {
    //     let obj;
    //     if (objName) {
    //         obj = this.#objList.get(objName);
    //     }
    //     if (obj) {
    //         Object.assign(obj, options);
    //     } else {
    //         obj = new DataObject(objName, options);
    //         if (objName) {
    //             // nur wenn Name Registrieren
    //             this.#objList.set(objName, obj);
    //         }
    //     }
    //     return obj;
    // }

    // /**
    //  * Lieftert ein registriertes DatenObjekt zurück
    //  * @param {string} objName - Name des Objektes
    //  * @returns {DataObject|undefined} DatenObjekt oder "undefined" wenn nicht vorhanden
    //  */
    // getObject(objName) {
    //     return this.#objList.get(objName);
    // }


    // /**
    //  * Fügt für ein Objekt Attribute hinzu
    //  * @param {string} objName - Name des Objektes
    //  * @param {string} attrName - Name des Attributes
    //  * @param {DataProperty} [options] - Optional Einstellungen für das Attribute
    //  * @returns {DataProperty} Daten Atribute Objekt
    //  */
    // addAttribute(objName, attrName, options) {
    //     let obj = this.#objList.get(objName);
    //     if (!obj) {
    //         obj = new DataObject(objName);
    //         this.#objList.set(objName, obj);
    //     }
    //     // Attribute hinzufügen
    //     let prop = obj.addAttribute(new DataProperty(attrName, options));
    //     return prop;
    // }


    // /**
    //  * Fügt für ein ObjektProperty Attribute hinzu
    //  * @param {string} objName - Name des Objektes
    //  * @param {string} propName - Name des Properties
    //  * @param {string|DataProperty} attrName - Name des Attributes oder Attribute Objekt
    //  * @param {DataProperty} [options] - Optional Einstellungen für das Attribute
    //  * @returns {DataProperty|undefined} Hinzugefügtes Attribute Objekt oder "undefined" wenn kein Attribute hinzugefügt wurde
    //  */
    // addPropAttribute(objName, propName, attrName, options) {
    //     // Objekt lesen
    //     let obj = this.#objList.get(objName);
    //     if (!obj) {
    //         obj = new DataObject(objName);
    //         this.#objList.set(objName, obj);
    //     }

    //     // Objekt Property lesen
    //     let prop = obj.get(propName);
    //     if (!prop) {
    //         prop = obj.addAttribute(propName);
    //     }

    //     // Property ObjektTyp lesen
    //     let propObj = typeof prop.type == "string" ? this.#objList.get(prop.type) : prop.type;

    //     // nur wenn Objekt dann können Attribute gesetz werden
    //     if (propObj instanceof DataObject) {
    //         return propObj.addAttribute(attrName, options);
    //     }
    // }


    // /**
    //  * Fügt für ein Objekt Property hinzu
    //  * @param {string} objName - Name des Objektes
    //  * @param {string} propName - Name des Property
    //  * @param {DataProperty} [options] - Optional Einstellungen für das Property
    //  * @returns {DataProperty} Daten Property
    //  */
    // addProperty(objName, propName, options) {
    //     let obj = this.#objList.get(objName);
    //     if (!obj) {
    //         obj = new DataObject(objName);
    //         this.#objList.set(objName, obj);
    //     }
    //     // Property hinzufügen
    //     return obj.addProperty(new DataProperty(propName, options));
    // }

    // /**
    //  * Fügt Optionen zu einem Property hinzu
    //  * @param {string} objName - Name des Objektes
    //  * @param {string} propName - Name des Property
    //  * @param {DataProperty} options - Einstellungen für das Property
    //  * @returns {DataProperty} Daten Property
    //  */
    // setPropOptions(objName, propName, options) {
    //     let obj = this.#objList.get(objName);
    //     if (!obj) {
    //         obj = new DataObject(objName);
    //         this.#objList.set(objName, obj);
    //     }
    //     let prop = obj.get(propName);
    //     if (!prop) {
    //         prop = obj.addProperty(propName, options);
    //     } else {
    //         Object.assign(prop, options);
    //         prop.name = propName;
    //     }
    //     return prop;
    // }

    // /**
    //  * Fügt Optionen zu einem Property hinzu
    //  * @param {string} objName - Name des Objektes
    //  * @param {string} attrName - Name des Property
    //  * @param {DataProperty} options - Einstellungen für das Property
    //  * @returns {DataProperty} Daten Attribute Objekt
    //  */
    // setAttrOptions(objName, attrName, options) {
    //     let obj = this.#objList.get(objName);
    //     if (!obj) {
    //         obj = new DataObject(objName);
    //         this.#objList.set(objName, obj);
    //     }
    //     let prop = obj.get(attrName);
    //     if (!prop) {
    //         prop = obj.addAttribute(attrName, options);
    //     } else {
    //         Object.assign(prop, options);
    //         prop.name = attrName;
    //     }
    //     return prop;
    // }

    // /**
    //  * Fügt Optionen zu einem Property hinzu
    //  * @param {string} objName - Name des Objektes
    //  * @param {string} propName - Name des Property
    //  * @param {number} index - Index der Auswahlliste
    //  * @param {DataProperty} options - Einstellungen für das Property
    //  * @returns {DataProperty} Daten Property Objekt
    //  */
    // setOneOfPropOptions(objName, propName, index, options) {
    //     let obj = this.#objList.get(objName);
    //     if (!obj) {
    //         obj = new DataObject(objName);
    //         this.#objList.set(objName, obj);
    //     }
    //     let prop = obj.get(propName);
    //     if (!prop) {
    //         prop = obj.addOneOfProperties(propName, index, options);
    //     } else {
    //         Object.assign(prop, options);
    //         prop.name = propName;
    //     }
    //     return prop;
    // }

    // /**
    //  * Fügt Optionen zu einem Property hinzu
    //  * @param {string} objName - Name des Objektes
    //  * @param {string} attrName - Name des Property
    //  * @param {number} index - Index der Auswahlliste
    //  * @param {DataProperty} options - Einstellungen für das Property
    //  */
    // setOneAttrOptions(objName, attrName, index, options) {
    //     let obj = this.#objList.get(objName);
    //     if (!obj) {
    //         obj = new DataObject(objName);
    //         this.#objList.set(objName, obj);
    //     }
    //     let prop = obj.get(attrName);
    //     if (!prop) {
    //         prop = new DataProperty(attrName, options);
    //         obj.addOneOfAtribute(prop, index);
    //     } else {
    //         Object.assign(prop, options);
    //         prop.name = attrName;
    //     }
    // }


    // /**
    //  * Fügt für ein Objekt Attribute hinzu
    //  * @param {string} objName - Name des Objektes
    //  * @param {string} attrName - Name des Attributes
    //  * @param {number} index - Index der Auswahlliste
    //  * @param {DataProperty} [options] - Optional Einstellungen für das Attribute
    //  */
    // addOneOfAttribute(objName, attrName, index, options) {
    //     let obj = this.#objList.get(objName);
    //     if (!obj) {
    //         obj = new DataObject(objName);
    //         this.#objList.set(objName, obj);
    //     }
    //     // Attribute hinzufügen
    //     obj.addOneOfAtribute(new DataProperty(attrName, options), index);
    //     return obj;
    // }


    // /**
    //  * Fügt für ein Objekt Auswahl-Property hinzu
    //  * @param {string} objName - Name des Objektes
    //  * @param {string} propName - Name des Property
    //  * @param {number} index - Index der Auswahlliste
    //  * @param {DataProperty} [options] - Optional Einstellungen für das Property
    //  */
    // addOneOfProperty(objName, propName, index, options) {
    //     let obj = this.#objList.get(objName);
    //     if (!obj) {
    //         obj = new DataObject(objName);
    //         this.#objList.set(objName, obj);
    //     }
    //     // Property hinzufügen
    //     obj.addOneOfProperties(new DataProperty(propName, options), index);
    //     return obj;
    // }


    // /**
    //  * Liefert ein Property/Atribute Objekt des angegebenen Objektes zurück
    //  * @param {string} objName - Name des DatenObjekt
    //  * @param {string} propName - Name der Property
    //  * @returns {DataProperty|undefined} DataProperty oder "undefined" wenn nicht vorhanden
    //  */
    // getProp(objName, propName) {
    //     let obj = this.#objList.get(objName);
    //     if (obj) {
    //         return obj.get(propName);
    //     }
    //     return;
    // }
    // getAttr = this.getProp;

    // /**
    //  * Liefert ein Property/Atribute Typ-Objekt des angegebenen Properties zurück
    //  * @param {string} objName - Name des DatenObjekt
    //  * @param {string} propName - Name der Property
    //  * @returns {DataType|undefined} DataTyp oder "undefined" wenn nicht vorhanden
    //  */
    // getPropType(objName, propName) {
    //     let obj = this.#objList.get(objName);
    //     if (obj) {
    //         let prop = obj.get(propName);

    //         // Wenn Name vom Typ
    //         if (typeof prop?.type == "string") {
    //             return this.#typeList.get(prop.type);
    //         } else if (prop?.type instanceof DataType) {
    //             return prop?.type;
    //         } else if (prop?.type instanceof DataObject) {
    //             return typeof prop.type.type == "string" ? this.#typeList.get(prop.type.type) : prop.type.type;
    //         }
    //     }
    //     return;
    // }
    // getAttrType = this.getPropType;


    // /**
    //  * Fügt einen neuen Enum Eintrag in einem DataTyp hinzu
    //  * @param {string} typeName - Name des Datentypes/Enum
    //  * @param {string} name - Name des Enum-Eintrag
    //  * @param {string|number} [value] - Wert des Enum-Eintrag
    //  * @param {string} [info] - Infotext für den Enum Eintrag
    //  */
    // addEnumItem(typeName, name, value, info) {
    //     // Lese Typ oder lege neuen Typ an
    //     let type = this.#typeList.get(typeName);
    //     if (!type) {
    //         type = new DataType(typeName);
    //         this.#typeList.set(typeName, type);
    //     }

    //     // prüfen ob vorhanden
    //     /** @type {string|Map<string,EnumItem>|undefined} */
    //     let enu = type.enum;
    //     if (!enu) {
    //         // neue Enum Map anlegen
    //         enu = new Map();
    //         type.enum = enu;
    //     } else if (typeof enu == "string") {
    //         // enu ist Name von einem Enum Type
    //         let enuType = this.#typeList.get(enu);

    //         // wenn kein Enum Typ
    //         if (!enuType) {
    //             // neuen Enum Typ anlegen
    //             enuType = new DataType(enu);
    //             this.#typeList.set(enu, enuType);
    //         }

    //         // Neuen EnumTyp Enum prüfen
    //         if (enuType.enum instanceof (Map)) {
    //             enu = type.enum;
    //         } else {
    //             enu = new Map();
    //             enuType.enum = enu;
    //         }
    //     }

    //     // Wenn Enum Map
    //     if (enu instanceof (Map)) {
    //         let item = enu.get(name);
    //         if (item) {
    //             // Item ersetzen
    //             item.value = value == undefined ? name : value;
    //             item.info = info || "";
    //         } else {
    //             item = new EnumItem(name, value, info);
    //             enu.set(name, item);
    //         }
    //     }
    // }


    // /**
    //  * Fügt einen InfoText zu einer Property/Attribute hinzu
    //  * @param {string} objName - Name des Objektes
    //  * @param {string} propName - Name des Property
    //  * @param {string} info - Infotext 
    //  * @returns {DataProperty} Daten Property
    //  */
    // addPropInfo(objName, propName, info) {
    //     let obj = this.#objList.get(objName);
    //     if (!obj) {
    //         obj = new DataObject(objName);
    //         this.#objList.set(objName, obj);
    //     }
    //     let prop = obj.get(propName);
    //     if (!prop) {
    //         prop = new DataProperty(propName);
    //         obj.addProperty(propName, prop);
    //     }
    //     if (!prop.info) { prop.info = []; }
    //     prop.info.push(info);
    //     return prop;
    // }
    // addAttrInfo = this.addPropInfo;


    // /**
    //  * Setzt Optionen zu einem Typ
    //  * @param {string} typeName - Name des Typs
    //  * @param {DataType} options - Optionen für den Typ
    //  */
    // setTypeOptions(typeName, options) {
    //     let type = this.#typeList.get(typeName);
    //     if (!type) {
    //         type = new DataType(typeName, options);
    //         this.#typeList.set(typeName, type);
    //     } else {
    //         Object.assign(type, options);
    //     }
    // }

    // /**
    //  * Fügt einen InfoText zu einem Typ hinzu
    //  * @param {string} typeName - Name des Typs
    //  * @param {string} info - Infotext 
    //  */
    // addTypeInfo(typeName, info) {
    //     let type = this.#typeList.get(typeName);
    //     if (!type) {
    //         type = new DataType(typeName);
    //         this.#typeList.set(typeName, type);
    //     }
    //     if (!type.info) { type.info = []; }
    //     type.info.push(info);
    // }


    // /**
    //  * Fügt einen InfoText zu einem Objekt hinzu
    //  * @param {string} objName - Name des Objektes
    //  * @param {string} info - Infotext 
    //  */
    // addObjInfo(objName, info) {
    //     let obj = this.#objList.get(objName);
    //     if (!obj) {
    //         obj = new DataObject(objName);
    //         this.#objList.set(objName, obj);
    //     }
    //     if (!obj.info) { obj.info = []; }
    //     obj.info.push(info);
    // }

    /**
     * Erzeugt ein neues Schema
     * @param {string} name - Name des Schemas
     */
    constructor(name) {
        this.name = name;
        //this.object = new DataObject(name);
        //this.#objList.set(name, this.object);
    }
}
