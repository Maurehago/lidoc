// =========================
//  Schema und Typen 
// =========================
// @ts-check

// Basis Typen: string, number, boolean, object, enum
// Datum Typen: date, time, datetime, range

// export * from "./infotable.js";
import { DataTable, getGSID, isNumber } from "./infotable.js";

// ==========================================
//   Typen
// ---------

/**
 * @typedef {Object} ValidError
 * @property {boolean} valid - true wenn gültig
 * @property {string} [error] - Fehlermeldung wenn Ungültig
 * @property {string} [property] - Name der geprüften Property
 * @property {Array<ValidError>} [propValids] - Liste mit FehlerObjekten für jede Property 
 */

// =============== SCHEMA ================

/**
 * EnumType
 * @typedef {Object} EnumType
 * @property {string} name - Name des EnumTypes == SchemaType.name
 * @property {Array<any>} values - WertListe für den EnumTyp
 * @property {string|Array<string>|undefined} [more_enums] - Name einer Property oder Liste mit Properties die den Typ weiterer Enum Einträge im Objekt erlaubt
*/
export const EnumType_fields = ["name", "values", "more_enums"];
export const EnumTyp_unique = "name";


/**
 * SimpleType
 * @typedef {Object} SimpleType
 * @property {string} name - Name des Datentypes
 * @property {"string"|"number"|"bigint"|"boolean"} art - Default: "string" - BasisTyp
 * @property {number|undefined} [length] - exakte Länge (für string, number(anzahl der zeichen ohne Vorzeichen), object?)
 * @property {number|undefined} [min_length] - Minimale Anzahl Zeichen (für string)
 * @property {number|undefined} [max_length] - Maximale Anzahl Zeichen (für string)
 * @property {string|Array<string>|undefined} [pattern] - Regular Expression (für string)
 * @property {string|undefined} [whitespace] - wie wird mit Leerzeichen umgegangen (für string)
 * @property {"camelCase"|"PascalCase"|"snake_case"|"lower"|"upper"|undefined} [casing] - (für string)
 * @property {number|undefined} [decimals] - Anzahl der Dezimalstellen (für number)
 * @property {number|string|undefined} [min_inclusive] - Minimum Wert inclusive angegebenen Wert (für number, date, time, datetime, range)
 * @property {number|string|undefined} [min_exclusive] - Minimum Wert größer angegebenen Wert (für number, date, time, datetime, range)
 * @property {number|string|undefined} [max_exclusive] - Maximalwert kleiner angegebenen Wert (für number, date, time, datetime, range)
 * @property {number|string|undefined} [max_inclusive] - Maximalwert kleiner gleich angegebenen Wert (für number, date, time, datetime, range)
 */
export const SimpleType_fields = [
    "name" // Name des Datentypes
    , "art" // BasisTyp - default "string"
    , "length" // exakte Länge (für string, number(anzahl der zeichen ohne Vorzeichen), object?)
    , "min_length" // Minimale Anzahl Zeichen (für string)
    , "max_length" // Maximale Anzahl Zeichen (für string)
    , "pattern" // Regular Expression (für string)
    , "whitespace" // wie wird mit Leerzeichen umgegangen (für string)
    , "casing" // (für string)
    , "decimals" // Anzahl der Dezimalstellen (für number)
    , "min_inclusive" //  Minimum Wert inclusive angegebenen Wert (für number, date, time, datetime, range)
    , "min_exclusive" // Minimum Wert größer angegebenen Wert (für number, date, time, datetime, range)
    , "max_exclusive" // Maximalwert kleiner angegebenen Wert (für number, date, time, datetime, range)
    , "max_inclusive" // Maximalwert kleiner gleich angegebenen Wert (für number, date, time, datetime, range)
];
export const SimpleType_unique = "name";


/**
 * RefType
 * @typedef {Object} RefType
 * @property {string} gsid - Eindeutige ID
 * @property {string} name - Name des Items
 * @property {string} object_name - Name des ObjectType
 * @property {Array<string>} object_props - Selector für Eigenschaften vom Aktuellen objekt
 * @property {string} ref_name - Name des Fremd Objektes
 * @property {Array<string>} ref_props - Selector für Eigenschaften vom Referenzierten objekt
 * @property {"NO"|"UPDATE"|"NULL"|"DEFAULT"} on_update - Regel für Update
 * @property {"NO"|"DELETE"|"NULL"|"DEFAULT"} on_delete - Regel für Löschen
 */
export const RefType_fields = ["gsid", "name", "object_name", "object_props", "ref_name", "ref_props", "on_update", "on_delete"];
export const RefType_unique = "gsid";


/**
 * UniqueType
 * @typedef {Object} UniqueType
 * @property {string} gsid - Eindeutige ID des Uniques
 * @property {string} name - Name des Uniques
 * @property {string} object_name - Name des ObjectType
 * @property {Array<string>} object_props - Eigenschaftsnamen(Properties) die zusammen eine Eindeutigkeit ergeben
 */
export const UniqueType_fields = ["gsid", "name", "object_name", "object_props"];
export const UniqueType_unique = "gsid";


/**
 * PropertyType
 * @typedef {Object} PropertyType
 * @property {string} gsid - Eindeutiger Datensatz
 * @property {string} object_name - Name des ObjektTypes zu dem diese Eigenschaft gehört
 * @property {string} name - Eindeutiger Spalten/Eigenschaftsname
 * @property {number} pos - Feld/Spalten Position im Objekt ????
 * @property {string} [prop_type] - Default: "string" - Name des Types der Eigenschaft
 * @property {number} [min] - Default: 1(erforderlich) - Minimales vorkommen der Spalte. 0: diese Spalte ist optional, -1: Spalte is Auswahlspalte 
 * @property {number} [max] - Default: 1(nur ein mal) -  größer 1: Ist eine Liste mit maximal n Eigenschaften, -1: ist eine unendliche Liste 
 * @property {any|undefined} [default] - Optional: Standardwert der Eigenschaft
 * @property {any|undefined} [fix] - Optional: Fixer Wert der Eigenschaft
*/
export const PropType_fields = ["gsid", "object_name", "name", "pos", "prop_type", "min", "max", "default", "fix"];
export const PropType_unique = "gsid";


/**
 * DataType
 * @typedef {Object} DataType
 * @property {string} name - ID/Name des Types
 * @property {"string"|"number"|"bigint"|"boolean"|"multi"|"enum"|"object"|"ref"|"unique"|"group"|"choice"} art - Um welchen Art von Typ es sich handelt
 * @property {string|undefined} [base_name] - Optional: Erweitert diesen "base" ObjektTypen
 * @property {Array<string>|undefined} [simple_types] - Optional: Liste von Simplen Typen (ein oder Mehrere einschränkungen)
 * @property {string|Array<string>|undefined} [id] - Name einer Property oder Liste mit Properties die die Eindeutige ID eines Objektes/Datensatzes(object) ergeben
 * @property {string|Array<string>|undefined} [more_attributes] - Name einer Property oder Liste mit Properties die den Typ weiterer Attribute im Objekt erlaubt
 * @property {string|Array<string>|undefined} [more_properties] - Name einer Property oder Liste mit Properties die den Typ weiterer Properties im Objekt erlaubt
 */
export const DataType_fields = ["name", "art", "base_name", "simple_types", "id", "more_attributes", "more_properties"];
export const DataType_unique = "name";


/**
 * Texte Beschreibungen Information
 * @typedef {Object} InfoText
 * @property {string} gsid - Datenzeile ID
 * @property {string|undefined} [type_name] - Optional - Name des Schematypes zu der dieser Infotext gehört
 * @property {string|undefined} [prop_gsid] - Optional - GSID der Eigenschaft eines Objekttypen zu der dieser Infotext gehört. Bei Enum ist das der Eintrag im Enum.
 * @property {string} [lang] - Default: "de" - Sprache
 * @property {string} [date] - Datum(ISO)
 * @property {string} text - InfoText
*/
export const InfoText_fields = ["gsid", "type_name", "prop_gsid", "lang", "date", "text"];
export const InfoText_unique = "gsid";

/**
 * @typedef {Object} InfoSchema_old
 * @property {"infoSchema"} infotype - FIX: "infoSchema"
 * @property {string} name - Name des Schemas
 * @property {string} version - Versionsnummer des Schemas
 * @property {Array<Array<any>>} datatypes - Liste Mit DatenTypen Daten. Erste Zeile enthält die Spalten Namen ["name","art","base_name","simple_types","id","more_attributes","more_properties"]
 * @property {Array<Array<any>>} simpletypes - Liste Mit SimpleTypen Daten. Erste Zeile enthält die Spalten Namen ["name","art","length","min_length","max_length","pattern","whitespace","casing","decimals","min_inclusive","min_exclusive","max_exclusive","max_inclusive"]
 * @property {Array<Array<any>>} properties - Liste Mit PropertyTypen Daten. Erste Zeile enthält die Spalten Namen ["gsid","object_name","name","pos","prop_type","min","max","default","fix"]
 * @property {Array<Array<any>>} uniques - Liste Mit UniqueTypen Daten. Erste Zeile enthält die Spalten Namen ["gsid", "name", "object_name", "object_props"]
 * @property {Array<Array<any>>} enums - Liste Mit EnumTypen Daten. Erste Zeile enthält die Spalten Namen ["name","values","more_enums"]
 * @property {Array<Array<any>>} refs - Liste Mit RefTypen Daten. Erste Zeile enthält die Spalten Namen ["gsid","name","object_name","object_props","ref_name","ref_props","on_update","on_delete"]
 * @property {Array<Array<any>>} infos - Liste Mit InfoTypen Daten. Erste Zeile enthält die Spalten Namen ["gsid","type_name","prop_gsid","lang","date","text"]
 */

// =============== ENDE SCHEMA ================
export class InfoSchema {
    constructor() {
        this.datatypes = [[...DataType_fields]];
        this.simpletypes = [[...SimpleType_fields]];
        this.properties = [[...PropType_fields]];
        this.uniques = [[...UniqueType_fields]];
        this.enums = [[...EnumType_fields]];
        this.refs = [[...RefType_fields]];
        this.infos = [[...InfoText_fields]];
    }
    /** @type {"infoSchema"} */
    infotype = "infoSchema";
    /** @type {string} */
    name = "";
    /** @type {string} */
    version = "";
    /** @type {Array<Array<any>>} */
    datatypes = [];
    /** @type {Array<Array<any>>} */
    simpletypes = [];
    /** @type {Array<Array<any>>} */
    properties = [];
    /** @type {Array<Array<any>>} */
    uniques = [];
    /** @type {Array<Array<any>>} */
    enums = [];
    /** @type {Array<Array<any>>} */
    refs = [];
    /** @type {Array<Array<any>>} */
    infos = [];
};


/** @type {Map<string,Schema>} */
const SchemaList = new Map();




// ==============================
//   Klassen
// -----------

// DataType.simple_types <--1:n-- DataTyp <--1:1--> SimpleType(ist zusätzlich auch als Datentyp angelegt)
//         . <--1:n-- PropertyType.obect_type (Spalten bei einem DataType.art = "object"|"group") 
//                                .prop_type <--1:1--> DataType (Typ der Spalte)


// Schema Klasse
export class Schema {
    /** @type {string} Name des Schemas */
    #name = "";
    get name() {
        return this.#name;
    }

    /** @type {string} */
    version = ""

    /** @type {DataTable<RefType>} Liste mit Referenzen Typen */
    #refList = new DataTable("refs", [RefType_fields], RefType_unique);

    /** @type {DataTable<UniqueType>} Liste mit Unique Typen */
    #uniqueList = new DataTable("uniques", [UniqueType_fields], UniqueType_unique);

    /** @type {DataTable<EnumType>} Liste mit Enum Objekten */
    #enumList = new DataTable("enums", [EnumType_fields], EnumTyp_unique);

    /**  @type {DataTable<SimpleType>} Liste mit DatenTypen */
    #simpleTypeList = new DataTable("simpletypes", [SimpleType_fields], SimpleType_unique);


    /** @type {DataTable<PropertyType>} Liste mit Objekt PropTypen */
    #propList = new DataTable("properties", [PropType_fields], PropType_unique);

    /** @type {DataTable<DataType>}  Liste aller Typen */
    #dataTypeList = new DataTable("datatypes", [DataType_fields], DataType_unique);

    /** @type {DataTable<InfoText>} Liste mit InformationsTexten */
    #infoList = new DataTable("infos", [InfoText_fields], InfoText_unique);


    // Tabellen (ReadOnly) für Listen Funktionen
    get dataTypes() { return this.#dataTypeList.readOnly(); }
    get simpleTypes() { return this.#simpleTypeList.readOnly(); }
    get properties() { return this.#propList.readOnly(); }
    get uniques() { return this.#uniqueList.readOnly(); }
    get enums() { return this.#enumList.readOnly(); }
    get refs() { return this.#refList.readOnly(); }
    get infos() { return this.#infoList.readOnly(); }


    /**
     * Neues Leeres TypeObjekt
     * @param {string} [id] - Optional neue ID
     * @returns {Partial<DataType>}
     */
    newDataType(id) {
        return this.#dataTypeList.newObject(id);
    }


    /**
     * Registriert einen Typ im Schema
     * @param {Partial<DataType>} options - Setzt einen SchemaTyp
     * @param {string} [info] - InfoText
     * @returns {string} ID wenn erfolgreich
     */
    setDataType(options, info) {
        if (!options.name) { options.name = getGSID(); }
        if (info) {
            this.setInfo({type_name: options.name, text: info});
        }
        return this.#dataTypeList.setObject(options) || options.name;
    }


    /**
     * Gibt einen registrierten Typ zurück
     * @param {string} type_name - Name des Types
     * @returns {DataType|undefined} Type oder Undefined wenn nicht gefunden
     */
    getDataType(type_name) {
        return this.#dataTypeList.getObject(type_name);
    }


    /**
     * Fügt einen zusätzlichen SimpleTyp im Schema hinzu. (Existiert der SimpleType schon wird kein Neuer hinzugefügt)
     * @param {string} type_name - Name(id) des Types
     * @param {string|Array<string>} simple_type_name - Name(id) des hinzufügenden simplen Datentypes
     * @returns {string|number|undefined} ID oder Datensatz Position wenn erfolgreich 
     */
    linkSimpleType(type_name, simple_type_name) {
        return this.#dataTypeList.addCellArrayValue(type_name, "simple_types", simple_type_name);
    }


    /**
     * Fügt einen neuen "weitere" Eigenschaften zulassen hinzu
     * @param {string} type_name - Name des Types
     * @param {string} property_id - ID(GSID) des ObjektItem "any"
     * @returns {string|number|undefined} ID oder Datensatzposition wenn erfolgreich
     */
    addMoreProperties(type_name, property_id) {
        return this.#dataTypeList.addCellArrayValue(type_name, "moreProperties", property_id);
    }


    /**
     * Fügt einen neuen "weitere" Attribute zulassen hinzu
     * @param {string} type_name - Name des Types
     * @param {string} attribute_id - ID(GSID) des ObjektItem "any"
     * @returns {string|number|undefined} ID wenn erfolgreich
     */
    addMoreAttributes(type_name, attribute_id) {
        return this.#dataTypeList.addCellArrayValue(type_name, "moreAttributes", attribute_id);
    }


    /**
     * Neues Leeres SimpleTypeObjekt
     * @param {string} [id] - Optional neue ID
     * @returns {Partial<SimpleType>}
     */
    newSimpleType(id) {
        return this.#simpleTypeList.newObject(id);
    }


    /**
     * Registriert einen simplen DatenTyp im Schema
     * @param {Partial<SimpleType>} options - Setzt einen SchemaTyp
     * @param {string} [info] - Optional Infotext
     * @returns {string} ID wenn erfolgreich
     */
    setSimpleType(options, info) {
        if (!options.name) { options.name = getGSID(); }

        // SchemaTyp ausbessern/anlegen
        this.#dataTypeList.setObject({ name: options.name, art: options.art || "string" });

        if (info) {
            this.setInfo({type_name: options.name, text: info});
        }

        // DatenTyp setzen
        return this.#simpleTypeList.setObject(options) || "";
    }


    /**
     * Fügt einen Pattern einem Simplen Typ hinzu
     * @param {string} type_name - Name des simplen Types
     * @param {string} pattern - Pattern welches gesetzt werden soll
     */
    setSimpleTypePattern(type_name, pattern) {
        return this.#simpleTypeList.addCellArrayValue(type_name, "pattern", pattern);
    }


    /**
     * Gibt einen registrierten SimpleTyp zurück
     * @param {string} type_name - Name des Types
     * @returns {SimpleType|undefined} Type oder Undefined wenn nicht gefunden
     */
    getSimpleType(type_name) {
        return this.#simpleTypeList.getObject(type_name);
    }


    /**
     * Neues Leeres InfoObjekt
     * @param {string} [id] - Optional neue ID
     * @returns {Partial<InfoText>}
     */
    newInfo(id) {
        return this.#infoList.newObject(id);
    }


    /**
     * Registriert einen InfoText zu einem Typ
     * @param {Partial<InfoText>} options - Setzt einen Infotext zu einem Typ oder TypeItem
     * @returns {string|undefined} ID wenn erfolgreich
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
     * Neues Leeres PropertyObjekt
     * @param {string} [id] - Optional neue ID
     * @returns {Partial<PropertyType>}
     */
    newProperty(id) {
        return this.#propList.newObject(id);
    }


    /**
     * Fügt eine neue Eigenschaft zu einem ObjektTyp hinzu
     * @param {string} object_name - Name des Objekt Datentypes
     * @param {string} prop_name - name der Eigenschaft
     * @param {Partial<PropertyType>} [options] - Eigenschaften vom Neuen ItemTyp
     * @param {string} [info] - Optional Beschreibung für die Eigenschaft
     * @returns {string} ID des NEUEN Property
     */
    addProperty(object_name, prop_name, options, info) {
        if (!object_name || !prop_name) { return ""; }

        if (!options) { options = this.#propList.newObject(); }

        // ObjektName(DatenTyp.name) muss angegeben werden
        options.object_name = object_name;
        options.name = prop_name;

        // Objekttyp anlegen/setzen
        this.#dataTypeList.setObject({ name: object_name, art: "object" });

        // Position der Property
        if (prop_name.startsWith("@")) {
            options.pos = 0;
        } else {
            let pos = 1;
            let props = this.#propList.findAll({object_name});
            for (let i = 0; i < props.length; i++) {
                if (props[i].pos > pos) {
                    pos = props[i].pos;
                }
            }
            options.pos = pos;
        }

        // neue GSID - Erforderlich beim hinzufügen
        if (!options.gsid) { options.gsid = getGSID() };

        // Default werte prüfen
        if (options.prop_type == undefined) { options.prop_type = "string"; }
        if (options.min == undefined) { options.min = 1; }
        if (options.max == undefined) { options.max = 1; }

        // info anlegen
        if (info) {
            this.setInfo({prop_gsid: options.gsid, text: info});
        }

        // Eigenschaft anlegen
        return this.#propList.setObject(options) || options.gsid;
    }


    /**
     * Ändert eine Bestehende Property. GSID muss in den optionen angegeben werden.  
     * Es wird kein Objekttyp angelegt.
     * @param {Partial<PropertyType>} options - Setzt einen Infotext zu einem Typ oder TypeItem
     * @returns {string} ID wenn erfolgreich
     */
    setProperty(options) {
        return this.#propList.setObject(options, false) || "";
    }


    /**
     * Gibt eine Eigenschaft für ein Objekt zurück
     * @param {Partial<PropertyType>} quest - Abfrage für Properties eines Objektes
     * @returns {PropertyType|undefined} erste gefundene Eigenschaft
     */
    getProperty(quest) {
        return this.#propList.find(quest);
    }


    /**
     * Gibt eine Liste von Eigenschaften für ein Object zurück
     * @param {string} object_name - Name das Objektes
     * @returns {Array<PropertyType>} Gefundene Eigenschaften 
     */
    getObjProperties(object_name) {
        return this.#propList.findAll({ object_name });
    }


    /**
     * Neues Leeres EnumObjekt
     * @param {string} [id] - Optional neue ID
     * @returns {Partial<EnumType>}
     */
    newEnum(id) {
        return this.#enumList.newObject(id);
    }


    /**
     * Registriert einen EnumTyp im Schema
     * @param {Partial<EnumType>} options - Setzt einen SchemaTyp
     * @param {string} [info] - Optional Infotext 
     * @returns {string|undefined} Enum-Name wenn erfolgreich
     */
    setEnum(options, info) {
        if (!options.name) { options.name = getGSID(); }

        // SchemaTyp ausbessern/anlegen
        this.#dataTypeList.setObject({ name: options.name, art: "enum" });

        if (info) {
            this.setInfo({type_name: options.name, text: info});
        }

        // EnumTyp setzen
        return this.#enumList.setObject(options);
    }


    /**
     * Setzt einen Enum Eintrag für einen Typ
     * @param {string} enum_name - Enum Name
     * @param {any|Array<any>} value - Enum Wert oder Liste von Werten
     * @returns {string|undefined} Enum Name wenn erfolgreich
     */
    setEnumItem(enum_name, value) {
        if (!enum_name) { return; }

        // Enum lesen
        let obj = this.#enumList.getObject(enum_name);

        // Wen kein Enum Objekt
        if (!obj) {
            obj = { name: enum_name, values: [] };
        }

        if (Array.isArray(value)) {
            obj.values.concat(value);
        } else {
            obj.values.push(value);
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
     * Neues Leeres ReferenzObjekt
     * @param {string} [id] - Optional neue ID
     * @returns {Partial<RefType>}
     */
    newRef(id) {
        return this.#refList.newObject(id);
    }


    /**
     * Registriert einen Referenztyp in der Liste
     * @param {Partial<RefType>} options - Eigenschaften von einem Referenztyp
     * @returns {string|undefined} ID wenn erfolgreich
     */
    setRef(options) {
        if (!options.gsid) { options.gsid = getGSID(); }

        // DatenTyp ausbessern
        this.#dataTypeList.setObject({ name: options.gsid, art: "ref" });

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
     * Neues Leeres UniqueObjekt
     * @param {string} [id] - Optional neue ID
     * @returns {Partial<UniqueType>}
     */
    newUnique(id) {
        return this.#uniqueList.newObject(id);
    }


    /**
     * Registriert einen UniqueTyp in der Liste
     * @param {Partial<UniqueType>} options - Eigenschaften von einem UniqueType
     * @returns {string|undefined} true wenn erfolgreich
     */
    setUnique(options) {
        if (!options.gsid) { options.gsid = getGSID(); }

        // DatenTyp ausbessern
        this.#dataTypeList.setObject({ name: options.gsid, art: "unique" });

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
        return [...this.#dataTypeList.rowMap.keys()];
    }


    /**
     * Prüft einen Wert gegen einen Simplen Typ
     * @param {string} typeName - Name des Simplen Types
     * @param {any} value - zu prüfender Wert
     * @returns {ValidError} - Valid Objekt, bei Fehler mit Fehlermeldung
     */
    validateSimple(typeName, value) {
        const simpleType = this.simpleTypes.getObject(typeName);
        if (!simpleType) return { valid: true }; // Basis-Fall

        // 1. Validierung gegen String-Restriktionen
        if (simpleType.art === "string" && typeof value === "string") {
            if (simpleType.min_length && value.length < simpleType.min_length)
                return { valid: false, error: `Mindestens ${simpleType.min_length} Zeichen benötigt.` };
            if (simpleType.max_length && value.length > simpleType.max_length)
                return { valid: false, error: `Maximal ${simpleType.max_length} Zeichen erlaubt.` };
            if (simpleType.pattern) {
                let answer = false;
                if (Array.isArray(simpleType.pattern)) {
                    for (let i = 0; i < simpleType.pattern.length; i++) {
                        if (new RegExp(simpleType.pattern[i]).test(value)) {
                            answer = true;
                            break;
                        }
                    }
                } else {
                    answer = new RegExp(simpleType.pattern).test(value);
                }
                if (answer == false) 
                    return { valid: false, error: `Format entspricht nicht dem Muster.` };
            }
            // if (typeof dataType.min_inclusive === "string" && value < dataType.min_inclusive)
            //     return { valid: false, error: `Wert muss größer oder gleich ${dataType.min_inclusive} sein.` };
            // if (typeof dataType.max_inclusive === "string" && value > dataType.max_inclusive)
            //     return { valid: false, error: `Wert muss kleiner oder gleich ${dataType.max_inclusive} sein.` };
            // if (typeof dataType.min_exclusive === "string" && value <= dataType.min_exclusive)
            //     return { valid: false, error: `Wert muss größer oder gleich ${dataType.min_exclusive} sein.` };
            // if (typeof dataType.max_exclusive === "string" && value >= dataType.max_exclusive)
            //     return { valid: false, error: `Wert muss kleiner oder gleich ${dataType.max_exclusive} sein.` };
        }

        // 2. Validierung gegen Number-Restriktionen
        if (simpleType.art === "number" && typeof value === "number") {
            if (typeof simpleType.min_inclusive === "number" && value < simpleType.min_inclusive)
                return { valid: false, error: `Wert muss größer oder gleich ${simpleType.min_inclusive} sein.` };
            if (typeof simpleType.max_inclusive === "number" && value > simpleType.max_inclusive)
                return { valid: false, error: `Wert muss kleiner oder gleich ${simpleType.max_inclusive} sein.` };
            if (typeof simpleType.min_exclusive === "number" && value <= simpleType.min_exclusive)
                return { valid: false, error: `Wert muss größer oder gleich ${simpleType.min_exclusive} sein.` };
            if (typeof simpleType.max_exclusive === "number" && value >= simpleType.max_exclusive)
                return { valid: false, error: `Wert muss kleiner oder gleich ${simpleType.max_exclusive} sein.` };

            // Längen prüfen
            const parts = value.toString().split(".");
            const before = parts[0].replace("+", "").replace("-", "").length;
            const after = parts[1] ? parts[1].length : 0;
            const valueLength = before + after;

            if (simpleType.decimals && after > simpleType.decimals)
                return { valid: false, error: `Maximal ${simpleType.decimals} Kommastellen erlaubt.` };
            // if (dataType.length && dataType.length != valueLength)
            //     return { valid: false, error: `Wert muss gleich ${dataType.length} sein.` };
            // if (dataType.min_length && valueLength < dataType.min_length)
            //     return { valid: false, error: `Mindestens ${dataType.min_length} Zahlen benötigt.` };
            // if (dataType.max_length && valueLength > dataType.max_length)
            //     return { valid: false, error: `Maximal ${dataType.max_length} Zahlen erlaubt.` };
        }
        return { valid: true };
    }



    /**
     * Prüft ob ein Wert gültig ist
     * @param {string} typeID - ID des Datentypes
     * @param {any} value - Wert der Spalte
     * @returns {ValidError} {valid: true} oder {valid: false, error: "Fehler ...."}
     */
    validateDataType(typeID, value) {
        const dataType = this.#dataTypeList.getObject(typeID);
        if (!dataType) return { valid: true }; // Basis-Fall

        /** @type {ValidError} */
        let validObj = {valid: true};

        // auf "string", "number", "bigint", "boolean" prüfen
        if (["string","number","bigint","boolean"].indexOf(dataType.art) >= 0) {
            // string
            if (typeof value == "string" && dataType.art != "string") {
                 return { valid: false, error: `Wert muss string sein.` };
            }

            // number
            if (typeof value == "number" && dataType.art != "number") {
                 return { valid: false, error: `Wert muss number sein.` };
            }

            // bigint
            if (typeof value == "bigint" && dataType.art != "bigint") {
                 return { valid: false, error: `Wert muss bigint sein.` };
            }

            // boolean
            if (typeof value == "boolean" && dataType.art != "boolean") {
                 return { valid: false, error: `Wert muss boolean sein.` };
            }

            // Details vom Simpletyp prüfen
            validObj = this.validateSimple(typeID, value);
            if (validObj.valid == false) {return validObj;}      
        }

        if (dataType.art == "multi") {
            const simpleTypes = [...dataType?.simple_types || ["string"]];

            for (let i = 0; i < simpleTypes.length; i++) {
                validObj = this.validateSimple(simpleTypes[i], value);
                if (validObj.valid == true) {return validObj;} // todo: es mus ja nur ein Wert richtig sein?
            }
            return {valid: false, error: `kein gültiger Wert. ${simpleTypes}`};
        }

        // 3. Validierung gegen Enums
        if (dataType.art == "enum") {
            // Enum lesen
            let obj = this.#enumList.getObject(typeID);
            
            const validEnum = obj?.values.includes(value);
            if (!validEnum) {
                // Auf mor_enums prüfen
                if (obj?.more_enums) {
                    if (Array.isArray(obj.more_enums)) {
                        // zusätzliche Liste durchgehen
                        for (let i = 0; i < obj.more_enums.length; i++) {
                            // es braucht nur einer gültig sein
                            if (this.validateDataType(obj.more_enums[i], value).valid == true) {
                                return { valid: true };
                            }
                        }
                    } else {
                        // wenn zusätzlicher gültig
                        if (this.validateDataType(obj.more_enums, value).valid == true) {
                            return { valid: true };
                        }
                    }
                }
                return { valid: false, error: `Ungültiger Auswahlwert.` }; 
            }; // wenn nicht in der Liste

            // Details vom Simpletyp prüfen
            validObj = this.validateSimple(typeID, value);
            if (validObj.valid == false) {return validObj;}      
        }

         if (["object","multi","ref","group","choice"].indexOf(dataType.art) >= 0) {
            return this.validateObject(typeID, value);
         }
         
        return { valid: true };
    }


    /**
     * Prüft eine Eigenschaft von einem Objekt
     * @param {string} typeName - Name des ObjektTypes
     * @param {string} propertyName - Name der Spalte
     * @param {any} value - zu prüfender Wert
     * @returns {ValidError}
     */
    validateProperty(typeName, propertyName, value) {
        const dataType = this.#dataTypeList.getObject(typeName);
        if (!dataType) return { valid: true }; // Basis-Fall

        // Muss Objekt sein
        if (["object","multi","ref","group","choice"].indexOf(dataType.art) < 0) {
            return {valid: false, error: `${typeName} ist kein Objekt!`};
        }

        // Eigenschaften lesen
        var prop = this.getProperty({object_name: typeName, name: propertyName});
        if (!prop) {
            return {valid: false, error: `${typeName}.${propertyName} nicht gefunden!`};
        }

        // Eigenschaft prüfen
        return this.validateDataType(prop.gsid, value);
    }


    /**
     * Prüft ob ein Wert gültig ist
     * @param {string} typeName - Name des Datentypes
     * @param {Object<string,any>} obj - DatenObjekt
     * @returns {ValidError} {valid: true} oder {valid: false, error: "Fehler ...."}
     */
    validateObject(typeName, obj) {
        const dataType = this.#dataTypeList.getObject(typeName);
        if (!dataType) return { valid: true }; // Basis-Fall

        // Muss Objekt sein
        if (["object","multi","ref","group","choice"].indexOf(dataType.art) < 0) {
            return {valid: false, error: `${typeName} ist kein Objekt!`};
        }

        // Alle propertys lesen
        var props = [...Object.keys(obj)];
        if (props.length <= 0) {
            return {valid: true };
        }

        var isOk = true;
        var valids = []; // Liste mit Property Prüfuntgen

        // alle Propertys prüfen
        for (let i = 0; i < props.length; i++) {
            const valid = this.validateProperty(typeName, props[i], obj[props[i]]);
            valid.property = props[i];
            if (valid.valid == false) {isOk = false;}
            valids.push(valid);
        }

        return {valid: isOk, propValids: valids};
    }


    /**
     * 
     * @returns {InfoSchema}
     */
    toSchemaObj() {
        /** @type {InfoSchema} */
        const obj = {
            infotype: "infoSchema"
            , name: this.#name
            , version: this.version
            , datatypes: this.#dataTypeList.rows
            , simpletypes: this.#simpleTypeList.rows
            , properties: this.#propList.rows
            , uniques: this.#uniqueList.rows
            , enums: this.#enumList.rows
            , refs: this.#refList.rows
            , infos: this.#infoList.rows
        };
        return obj;
    }

    /**
     * Liefert das Schema als JsonString zurück
     * @returns {string} schema als JSON-String 
     */
    toString() {
        /** @type {InfoSchema} */
        const obj = {
            infotype: "infoSchema"
            , name: this.#name
            , version: this.version
            , datatypes: this.#dataTypeList.rows
            , simpletypes: this.#simpleTypeList.rows
            , properties: this.#propList.rows
            , uniques: this.#uniqueList.rows
            , enums: this.#enumList.rows
            , refs: this.#refList.rows
            , infos: this.#infoList.rows
        };

        let schemaString = JSON.stringify(obj);
        return schemaString;
    }


    /**
     * Erzeugt das Schema von einem Objekt
     * @param {Partial<InfoSchema>} obj - Schema Daten als Objekt
     * @returns {boolean|undefined} true wenn angelegt
     */
    setFromObject(obj) {
        if (!obj || typeof obj != "object") { return; }
        if (obj.infotype != "infoSchema") { return; }
        
        this.#name = obj.name || "";
        this.version = obj.version || "";

        this.#dataTypeList = new DataTable("datatypes", obj.datatypes || [DataType_fields], DataType_unique);
        this.#simpleTypeList = new DataTable("simpletypes", obj.simpletypes || [SimpleType_fields], SimpleType_unique);
        this.#propList = new DataTable("properties", obj.properties || [PropType_fields], PropType_unique);
        this.#uniqueList = new DataTable("uniques", obj.uniques || [UniqueType_fields], UniqueType_unique);
        this.#enumList = new DataTable("enums", obj.enums || [EnumType_fields], EnumTyp_unique);
        this.#refList = new DataTable("refs", obj.refs || [RefType_fields], RefType_unique);
        this.#infoList = new DataTable("infos", obj.infos || [InfoText_fields], InfoText_unique);

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



// ===========================
//   InfoSchema
// --------------

export const infoSchema = new Schema("infoSchema");

// Enums
infoSchema.setEnum({
    name: "enu_types", values: [
        "string"
        , "number"
        , "bigint"
        , "boolean"
        , "multi"
        , "enum"
        , "object"
        , "ref"
        , "unique"
        , "group"
        , "choice"
    ]
});

infoSchema.setEnum({ name: "enu_art", values: ["string", "number", "bigint", "boolean"] });

infoSchema.setEnum({
    name: "enu_casing", values: [
        "camelCase"
        , "PascalCase"
        , "snake_case"
        , "lower"
        , "upper"
    ]
});

infoSchema.setEnum({ name: "enu_onupdate", values: ["NO", "UPDATE", "NULL", "DEFAULT"] });

infoSchema.setEnum({ name: "enu_ondelete", values: ["NO", "DELETE", "NULL", "DEFAULT"] });

// String_number Typ
infoSchema.setDataType({ name: "string_number", art: "multi", simple_types: ["string", "number"] });

// EnumType
infoSchema.setDataType({ name: "EnumType", art: "object", id: "name" });
infoSchema.addProperty("EnumType", "name");
infoSchema.addProperty("EnumType", "values", { prop_type: "set" });
infoSchema.addProperty("EnumType", "moreEnums", { min: 0, max: -1 });


// SimpleType
infoSchema.setDataType({ name: "SimpleType", art: "object", id: "name" });
infoSchema.addProperty("SimpleType", "name");
infoSchema.addProperty("SimpleType", "art", { prop_type: "enu_art", default: "string" });
infoSchema.addProperty("SimpleType", "length", { prop_type: "int", min: 0 });
infoSchema.addProperty("SimpleType", "min_length", { prop_type: "int", min: 0 });
infoSchema.addProperty("SimpleType", "max_length", { prop_type: "int", min: 0 });
infoSchema.addProperty("SimpleType", "pattern", { min: 0 });
infoSchema.addProperty("SimpleType", "whitespace", { min: 0 });
infoSchema.addProperty("SimpleType", "casing", { prop_type: "enu_casing", min: 0 });
infoSchema.addProperty("SimpleType", "decimals", { prop_type: "int", min: 0 });
infoSchema.addProperty("SimpleType", "min_inclusive", { prop_type: "string_number", min: 0 });
infoSchema.addProperty("SimpleType", "min_exclusive", { prop_type: "string_number", min: 0 });
infoSchema.addProperty("SimpleType", "max_exclusive", { prop_type: "string_number", min: 0 });
infoSchema.addProperty("SimpleType", "max_inclusive", { prop_type: "string_number", min: 0 });


// RefType
infoSchema.setDataType({ name: "RefType", art: "object", id: "gsid" });
infoSchema.addProperty("RefType", "gsid");
infoSchema.addProperty("RefType", "name");
infoSchema.addProperty("RefType", "object_name");
infoSchema.addProperty("RefType", "object_props", { max: -1 });
infoSchema.addProperty("RefType", "ref_name");
infoSchema.addProperty("RefType", "ref_props", { max: -1 });
infoSchema.addProperty("RefType", "on_update", { prop_type: "onupdate" });
infoSchema.addProperty("RefType", "on_delete", { prop_type: "ondelete" });


// UniqueType
infoSchema.setDataType({ name: "UniqueType", art: "object", id: "gsid" });
infoSchema.addProperty("UniqueType", "gsid");
infoSchema.addProperty("UniqueType", "name");
infoSchema.addProperty("UniqueType", "object_name");
infoSchema.addProperty("UniqueType", "props", { max: -1 });


// PropertyType
infoSchema.setDataType({ name: "PropertyType", art: "object", id: "gsid" });
infoSchema.addProperty("PropertyType", "gsid");
infoSchema.addProperty("PropertyType", "object_name");
infoSchema.addProperty("PropertyType", "name");
infoSchema.addProperty("PropertyType", "pos", { prop_type: "number", min: 0 });
infoSchema.addProperty("PropertyType", "prop_type", { default: "string", min: 0 });
infoSchema.addProperty("PropertyType", "min", { prop_type: "int", default: 1, min: 0 });
infoSchema.addProperty("PropertyType", "max", { prop_type: "int", default: 1, min: 0 });
infoSchema.addProperty("PropertyType", "default", { prop_type: "any", min: 0 });
infoSchema.addProperty("PropertyType", "fix", { prop_type: "any", min: 0 });


// DataTyp
infoSchema.setDataType({ name: "DataType", art: "object", id: "name" });
infoSchema.addProperty("DataType", "name");
infoSchema.addProperty("DataType", "art", { prop_type: "enu_types" });
infoSchema.addProperty("DataType", "base_name", { min: 0 });
infoSchema.addProperty("DataType", "id", { min: 0, max: -1 });
infoSchema.addProperty("DataType", "more_attributes", { min: 0, max: -1 });
infoSchema.addProperty("DataType", "more_properties", { min: 0, max: -1 });


// InfoText
infoSchema.setDataType({ name: "InfoText", art: "object", id: "gsid" });
infoSchema.addProperty("InfoText", "gsid");
infoSchema.addProperty("InfoText", "type_name", { min: 0 });
infoSchema.addProperty("InfoText", "prop_gsid", { min: 0 });
infoSchema.addProperty("InfoText", "lang", { default: "de", min: 0 });
infoSchema.addProperty("InfoText", "date", { min: 0 });
infoSchema.addProperty("InfoText", "text");

