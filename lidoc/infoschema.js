// =========================
//  Schema und Typen 
// =========================
// @ts-check


/**
 * @typedef {object} DataTypeOptions
 * @property {string} [basetype] - Name des Basistype
 * @property {Array<string>} [info] - Beschreibungstexte zum Datentyp
 * @property {any} [default] - Standard Wert 
 * @property {any} [fixed] - Fixer Wert 
 * @property {number} [length] - Exakte Länge eines Strings
 * @property {number} [minLength] - Minimale Länge eines Strings
 * @property {string} [pattern] - Regular Expression
 * @property {string} [whitespace] - Wie wird mit Leerzeichen umgegangen
 * @property {number} [digits] - Gesamtanzahl der Nummern
 * @property {number} [decimals] - Anzahl der Dezimalstellen
 * @property {string|number} [maxExclusive] - Maximaler Wert kleiner als
 * @property {string|number} [maxInclusive] - Maximaler Wert inclusive
 * @property {string|number} [minInclusive] - Minimaler Wert inclusive
 * @property {string|number} [minExclusive] - Minimaler Wert größer als
 * @property {boolean} [moreAttributes] - "true" wenn zusätzliche, nicht im Schema enthaltene Attribute dazu kommen können
 * @property {boolean} [moreProperties] - "true" wenn zusätzliche, nicht im Schema enthaltene Eigenschaften dazu kommen können
 */


// ==============================
//   Klassen
// -----------

/** @type {Map<string,DataType|DataEnum>} */
const TypList = new Map();


class EnumItem {
    name = "";
 
    /** @type {string|number} */
    value = "";

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


export class DataEnum {
    /** @type {string|undefined} */
    name;

    /** @type {Array<string>|undefined} */
    info = [];

    /** @type {Map<string,EnumItem>} */
    #items = new Map();

    /**
     * Fügt einen neuen Eitrag in die Enum Liste hinzu
     * @param {string} name - Name des Enums
     * @param {string|number} [value] - Wert des Enums
     * @param {string} [info] - Infotext
     */
    add (name, value, info) {
        // prüfen ob vorhanden
        let item = this.#items.get(name);
        if (item) {
            item.value = value == undefined ? name : value;
            item.info = info || "";
        } else {
            item = new EnumItem(name, value, info);
            this.#items.set(name, item);
        }
    }

    /**
     * Löscht einen Eintrag im Enum
     * @param {string} name - Name des Eintrages
     * @returns {boolean} "true" wenn der Eintrag in der Map gelöscht wurde
     */
    remove (name) {
        return this.#items.delete(name);
    }

    /**
     * Legt ein Enum Objekt an
     * @param {string} name - Name des Enums
     * @param {Array<string>} [infos] - Optional Beschreibungen zum Enum
     */
    constructor(name, infos) {
        this.name = name;
        this.info = infos || [];

        // registrieren
        TypList.set(name, this);
    }
}

export class DataProperty {
    name = "";
    type = "";
    min = 1;
    max = 1;
    /** @type {Array<string>} */
    info =[];

    /**
     * Erstellt eine Propery oder Attribute Eigenschaft
     * @param {string} name - Name der Eigenschaft
     * @param {string} [type] - Name des Datentypes. Default "string"
     * @param {number} [min] - Optional Minimales vorkommen. Default: 1
     * @param {number} [max] - Optional Maximales Vorkommen. Default: 1, -1 für Unendlich
     * @param {Array<string>} [infos] - Optional Liste mit Beschreibungen
     */
    constructor(name, type, min, max, infos) {
        this.name = name;
        this.type = type || "string";
        this.min = typeof min == "undefined" ? 1 : min;
        this.max = typeof max == "undefined" ? 1 : max;
        this.info = infos || [];
    }
}


export class DataType {
    /** @type {string|undefined} */
    name;

    /** @type {Array<string>|undefined} */
    info = [];

    /** Basis Typ @type {string|undefined} */
    basetype;

    /** @type {Map<string,EnumItem>} */
    enum = new Map();

    /** Standard Wert @type {any} */
    default;

    /** Standard Wert @type {any} */
    fixed;

    /** Exakte Länge eines Strings @type {number|undefined} */
    length;

    /** Minimale Länge eines Strings @type {number|undefined} */
    minLength;

    /** Regular Expression @type {string|undefined} */
    pattern;

    /** Wie wird mit Leerzeichen umgegangen @type {string|undefined} */
    whitespace;

    /** Gesamtanzahl der Nummern @type {number|undefined} */
    digits;

    /** Anzahl der Dezimalstellen @type {number|undefined} */
    decimals;

    /** Maximaler Wert kleiner als @type {string|number|undefined} */
    maxExclusive;

    /** Maximaler Wert inclusive @type {string|number|undefined} */
    maxInclusive;

    /** Minimaler Wert inclusive @type {string|number|undefined} */
    minInclusive;

    /** Minimaler Wert größer als @type {string|number|undefined} */
    minExclusive;

    /** @type {Array<DataProperty>} Liste mit Attributen */
    attributes = [];

    /** @type {boolean|undefined} "true" wenn zusätzliche, nicht im Schema enthaltene Attribute dazu kommen können */
    moreAttributes;

    /** @type {Array<Array<DataProperty>>}  Auswahl von Attribute (entweder/oder)*/
    oneOfAttributes = [];

    /** @type {Array<DataProperty>} Liste mit Eigenschaften */
    properties = [];

    /** @type {boolean|undefined} "true" wenn zusätzliche, nicht im Schema enthaltene Eigenschaften dazu kommen können */
    moreProperties;

    /** @type {Array<Array<DataProperty>>}  Auswahl von Eigenschaften (entweder/oder)*/
    oneOfProperties = [];


    /**
     * Fügt einen neuen Eitrag in die Enum Liste hinzu
     * @param {string} name - Name des Enums
     * @param {string|number} [value] - Wert des Enums
     * @param {string} [info] - Infotext
     */
    addEnum (name, value, info) {
        // prüfen ob vorhanden
        let item = this.enum.get(name);
        if (item) {
            item.value = value == undefined ? name : value;
            item.info = info || "";
        } else {
            item = new EnumItem(name, value, info);
            this.enum.set(name, item);
        }
    }


    /**
     * Fügt ein Attribute hinzu
     * @param {string} name - Name der Eigenschaft
     * @param {string} [type] - Name des Datentypes. Default "string"
     * @param {number} [min] - Optional Minimales vorkommen. Default: 1
     * @param {number} [max] - Optional Maximales Vorkommen. Default: 1, -1 für Unendlich
     * @param {Array<string>} [infos] - Optional Liste mit Beschreibungen
     */
    addAttribute(name, type, min, max, infos) {
        this.attributes.push(new DataProperty(name, type, min, max, infos));
        if (this.basetype == "string") {
            this.basetype = "object";
        }
    }

    /**
     * Fügt ein OneOf Attribute hinzu
     * @param {number} index - Index der OptionenListe
     * @param {string} name - Name der Eigenschaft
     * @param {string} [type] - Name des Datentypes. Default "string"
     * @param {number} [min] - Optional Minimales vorkommen. Default: 1
     * @param {number} [max] - Optional Maximales Vorkommen. Default: 1, -1 für Unendlich
     * @param {Array<string>} [infos] - Optional Liste mit Beschreibungen
     */
    addOneOfAttribute(index, name, type, min, max, infos) {
        let list = this.oneOfAttributes[index];
        if (typeof list == "undefined") {
            list = [];
            this.oneOfAttributes[index] = list;
        }
        list.push(new DataProperty(name, type, min, max, infos));
        if (this.basetype == "string") {
            this.basetype = "object";
        }
    }


    /**
     * Fügt ein Property hinzu
     * @param {string} name - Name der Eigenschaft
     * @param {string} [type] - Name des Datentypes. Default "string"
     * @param {number} [min] - Optional Minimales vorkommen. Default: 1
     * @param {number} [max] - Optional Maximales Vorkommen. Default: 1, -1 für Unendlich
     * @param {Array<string>} [infos] - Optional Liste mit Beschreibungen
     */
    addProperty(name, type, min, max, infos) {
        this.properties.push(new DataProperty(name, type, min, max, infos));
        if (this.basetype == "string") {
            this.basetype = "object";
        }
    }

    /**
     * Fügt ein OneOf Property hinzu
     * @param {number} index - Index der OptionenListe
     * @param {string} name - Name der Eigenschaft
     * @param {string} [type] - Name des Datentypes. Default "string"
     * @param {number} [min] - Optional Minimales vorkommen. Default: 1
     * @param {number} [max] - Optional Maximales Vorkommen. Default: 1, -1 für Unendlich
     * @param {Array<string>} [infos] - Optional Liste mit Beschreibungen
     */
    addOneOfProperty(index, name, type, min, max, infos) {
        let list = this.oneOfProperties[index];
        if (typeof list == "undefined") {
            list = [];
            this.oneOfProperties[index] = list;
        }
        list.push(new DataProperty(name, type, min, max, infos));
        if (this.basetype == "string") {
            this.basetype = "object";
        }
    }

    /**
     * Erstellt einen Datentyp
     * @param {string} name - Name des Types
     * @param {DataTypeOptions} [options] - Optional Eigenschaften vom Datentyp
     */
    constructor(name, options) {
        //DataTypeList.set(name, this);
        this.name = name;
        if (typeof options == "object") {
            Object.assign(this, options);
        }

        // registrieren
        TypList.set(name, this);
    }
}

export class Schema {
    name = "";

    /** @type {Map<string,DataType>} */
    #typeList = new Map();

    /** @type {Map<string,DataEnum>} */
    #enumList = new Map();

    /**
     * Setz die Optionen für einen Datentyp. Wenn der Datentyp noch nicht vorhanden wird dieser angelegt.  
     * Gibt das DatenTyp Objekt zurück
     * @param {string} typeName - Name des Types
     * @param {DataTypeOptions} options - Optionen die für den Typ gesetz werden
     * @returns {DataType} DatenTyp Objekt
     */
    setType(typeName, options) {
        let type = this.#typeList.get(typeName);
        if (type) {
            Object.assign(type, options);
        } else {
            type = new DataType(typeName, options);
            this.#typeList.set(typeName, type);
        }
        return type;
    }

    /**
     * Gibt ein DataTyp Objekt zurück, oder "undefined" wenn nicht gefunden.
     * @param {string} typeName - Name des Types
     * @returns {DataType|undefined} DatenTyp Objekt oder "undefined"
     */
    getType(typeName) {
        return this.#typeList.get(typeName);
    }

    /**
     * Setz eine Enum Liste. Wenn Enum Liste noch nicht vorhanden wird diese angelegt.  
     * Gibt das DatenEnum Objekt zurück
     * @param {string} enumName - Name der Enum Liste
     * @param {Array<string>} infos - Optional Beschreibungen für die Enum Liste
     * @returns {DataEnum} DataEnum Objekt
     */
    setEnum(enumName, infos) {
        let enu = this.#enumList.get(enumName);
        if (!enu) {
            enu = new DataEnum(enumName, infos);
            this.#enumList.set(enumName, enu);
        }
        return enu;
    }

    /**
     * Gibt ein DataEnum zurück
     * @param {string} enumName - Name der Enum Liste
     * @returns {DataEnum|undefined} DataEnum oder "undefined" wenn nicht gefunden
     */
    getEnum(enumName) {
        return this.#enumList.get(enumName);
    }


    /**
     * Fügt für einen Typ ein Attribute hinzu
     * @param {string} typeName - Name des Types
     * @param {string} attrName - Name des Attributes
     * @param {string} [attrType] - Optional Name des Attribut Types. Default = "string"
     * @param {number} [minOccurs] - Optional mininames Vorkommen vom Attribut. Default = 1
     * @param {number} [maxOccours] - Optional maximales Vorkommen vom Attribut. Default = 1
     * @param {Array<string>} [infos] - Optional zusätzliche Texte/Berschreibungen für das Attribut
     * @returns {DataType} DatenTyp Objekt
     */
    addTypAttr(typeName, attrName, attrType, minOccurs, maxOccours, infos) {
        let type = this.#typeList.get(typeName);
        if (!type) {
            type = new DataType(typeName);
            this.#typeList.set(typeName, type);
        }
        // Attribute hinzufügen
        type.addAttribute(attrName, attrType, minOccurs, maxOccours, infos);
        return type;
    }


    /**
     * Fügt für einen Typ ein Auswahl-Attribute hinzu
     * @param {string} typeName - Name des Types
     * @param {number} choiceIndex - Index der Wahlmöglichkeit
     * @param {string} attrName - Name des Attributes
     * @param {string} [attrType] - Optional Name des Attribut Types. Default = "string"
     * @param {number} [minOccurs] - Optional mininames Vorkommen vom Attribut. Default = 1
     * @param {number} [maxOccours] - Optional maximales Vorkommen vom Attribut. Default = 1
     * @param {Array<string>} [infos] - Optional zusätzliche Texte/Berschreibungen für das Attribut
     * @returns {DataType} DatenTyp Objekt
     */
    addTypOneOfAttr(typeName, choiceIndex, attrName, attrType, minOccurs, maxOccours, infos) {
        let type = this.#typeList.get(typeName);
        if (!type) {
            type = new DataType(typeName);
            this.#typeList.set(typeName, type);
        }
        // Attribute hinzufügen
        type.addOneOfAttribute(choiceIndex, attrName, attrType, minOccurs, maxOccours, infos);
        return type;
    }

    /**
     * Fügt für einen Typ ein Property hinzu
     * @param {string} typeName - Name des Types
     * @param {string} propName - Name des Properties
     * @param {string} [propType] - Optional Name des Property Types. Default = "string"
     * @param {number} [minOccurs] - Optional mininames Vorkommen vom Property. Default = 1
     * @param {number} [maxOccours] - Optional maximales Vorkommen vom Property. Default = 1
     * @param {Array<string>} [infos] - Optional zusätzliche Texte/Berschreibungen für das Property
     * @returns {DataType} DatenTyp Objekt
     */
    addTypProp(typeName, propName, propType, minOccurs, maxOccours, infos) {
        let type = this.#typeList.get(typeName);
        if (!type) {
            type = new DataType(typeName);
            this.#typeList.set(typeName, type);
        }
        // Attribute hinzufügen
        type.addProperty(propName, propType, minOccurs, maxOccours, infos);
        return type;
    }

    /**
     * Fügt für einen Typ ein Auswahl-Property hinzu
     * @param {string} typeName - Name des Types
     * @param {number} choiceIndex - Index der Wahlmöglichkeit
     * @param {string} propName - Name des Properties
     * @param {string} [propType] - Optional Name des Property Types. Default = "string"
     * @param {number} [minOccurs] - Optional mininames Vorkommen vom Property. Default = 1
     * @param {number} [maxOccours] - Optional maximales Vorkommen vom Property. Default = 1
     * @param {Array<string>} [infos] - Optional zusätzliche Texte/Berschreibungen für das Property
     * @returns {DataType} DatenTyp Objekt
     */
    addTypOneOfProp(typeName, choiceIndex, propName, propType, minOccurs, maxOccours, infos) {
        let type = this.#typeList.get(typeName);
        if (!type) {
            type = new DataType(typeName);
            this.#typeList.set(typeName, type);
        }
        // Attribute hinzufügen
        type.addOneOfProperty(choiceIndex, propName, propType, minOccurs, maxOccours, infos);
        return type;
    }

    /**
     * Fügt einen neuen Enum Eintrag in einem DataTyp hinzu
     * @param {string} typeName - Name des Datentypes
     * @param {string} name - Name des Enum-Eintrag
     * @param {string|number} [value] - Wert des Enum-Eintrag
     * @param {string} [info] - Infotext für den Enum Eintrag
     */
    addTypeEnumItem (typeName, name, value, info) {
        let type = this.#typeList.get(typeName);
        if (!type) {
            type = new DataType(typeName);
            this.#typeList.set(typeName, type);
        }


        // prüfen ob vorhanden
        let item = type.enum.get(name);
        if (item) {
            item.value = value == undefined ? name : value;
            item.info = info || "";
        } else {
            item = new EnumItem(name, value, info);
            type.enum.set(name, item);
        }
    }

    /**
     * Fügt einen neuen Enum Eintrag in einer Enum Liste hinzu.  
     * Wenn die Enum Liste noch nicht existiert, wird diese angelegt.
     * @param {string} enumName - Name der EnumListe
     * @param {string} name - Name des Enum-Eintrag
     * @param {string|number} [value] - Wert des Enum-Eintrag
     * @param {string} [info] - Infotext für den Enum Eintrag
     * @returns {DataEnum} DataEnum Objekt
     */
    addEnumItem(enumName, name, value, info) {
        let enu = this.#enumList.get(enumName);
        if (!enu) {
            enu = new DataEnum(enumName);
            this.#enumList.set(enumName, enu);
        }
        enu.add(name, value, info);
        return enu;
    }


    /**
     * Erzeugt ein neues Schema
     * @param {string} name - Name des Schemas
     */
    constructor(name) {
        this.name = name;
    }
}