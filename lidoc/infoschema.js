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
 * @property {string|Array<string>|undefined} [more_enums] - Name einer Property oder Liste mit Properties die den Typ weiterer Enum Einträge im Objekt erlaubt
*/
const EnumTypeFields = ["name", "values", "more_enums"];
const EnumTypUnique = "name";


/**
 * SimpleType
 * @typedef {Object} SimpleType
 * @property {string} name - Name des Datentypes
 * @property {"string"|"number"|"bigint"|"boolean"} art - Default: "string" - BasisTyp
 * @property {number|undefined} [length] - exakte Länge (für string, number(anzahl der zeichen ohne Vorzeichen), object?)
 * @property {number|undefined} [min_length] - Minimale Anzahl Zeichen (für string)
 * @property {number|undefined} [max_length] - Maximale Anzahl Zeichen (für string)
 * @property {string|undefined} [pattern] - Regular Expression (für string)
 * @property {string|undefined} [whitespace] - wie wird mit Leerzeichen umgegangen (für string)
 * @property {"camelCase"|"PascalCase"|"snake_case"|"lower"|"upper"|undefined} [casing] - (für string)
 * @property {number|undefined} [decimals] - Anzahl der Dezimalstellen (für number)
 * @property {number|string|undefined} [min_inclusive] - Minimum Wert inclusive angegebenen Wert (für number, date, time, datetime, range)
 * @property {number|string|undefined} [min_exclusive] - Minimum Wert größer angegebenen Wert (für number, date, time, datetime, range)
 * @property {number|string|undefined} [max_exclusive] - Maximalwert kleiner angegebenen Wert (für number, date, time, datetime, range)
 * @property {number|string|undefined} [max_inclusive] - Maximalwert kleiner gleich angegebenen Wert (für number, date, time, datetime, range)
 */
const SimpleTypeFields = [
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
const SimpleTypeUnique = "name";


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
const RefTypeFields = ["gsid", "name", "object_name", "object_props", "ref_name", "ref_props", "on_update", "on_delete"];
const RefTypeUnique = "gsid";


/**
 * UniqueType
 * @typedef {Object} UniqueType
 * @property {string} gsid - Eindeutige ID des Uniques
 * @property {string} name - Name des Uniques
 * @property {string} object_name - Name des ObjectType
 * @property {Array<string>} object_props - Eigenschaftsnamen(Properties) die zusammen eine Eindeutigkeit ergeben
 */
const UniqueTypeFields = ["gsid", "name", "object_name", "object_props"];
const UniqueTypeUnique = "gsid";


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
const PropTypeFields = ["gsid", "object_name", "name", "pos", "prop_type", "min", "max", "default", "fix"];
const PropTypeUnique = "gsid";


/**
 * DataType
 * @typedef {Object} DataType
 * @property {string} name - ID/Name des Types
 * @property {"string"|"number"|"bigint"|"boolean"|"multi"|"enum"|"object"|"ref"|"unique"|"group"|"choice"} art - Um welchen Art von Typ es sich handelt
 * @property {string|undefined} [base_name] - Optional: Erweitert diesen "base" ObjektTypen
 * @property {Set<string>|undefined} [simple_types] - Optional: Liste von Simplen Typen (ein oder Mehrere einschränkungen)
 * @property {string|Array<string>|undefined} [id] - Name einer Property oder Liste mit Properties die die Eindeutige ID eines Objektes/Datensatzes(object) ergeben
 * @property {string|Array<string>|undefined} [more_attributes] - Name einer Property oder Liste mit Properties die den Typ weiterer Attribute im Objekt erlaubt
 * @property {string|Array<string>|undefined} [more_properties] - Name einer Property oder Liste mit Properties die den Typ weiterer Properties im Objekt erlaubt
 */
const DataTypeFields = ["name", "art", "base_name", "simple_types", "id", "more_attributes", "more_properties"];
const DataTypeUnique = "name";


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
const InfoTextFields = ["gsid", "type_name", "prop_gsid", "lang", "date", "text"];
const InfoTextUnique = "gsid";


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

    /** @type {DataTable<RefType>} Liste mit Referenzen Typen */
    #refList = new DataTable("refs", [RefTypeFields], RefTypeUnique);

    /** @type {DataTable<UniqueType>} Liste mit Unique Typen */
    #uniqueList = new DataTable("uniques", [UniqueTypeFields], UniqueTypeUnique);

    /** @type {DataTable<EnumType>} Liste mit Enum Objekten */
    #enumList = new DataTable("enums", [EnumTypeFields], EnumTypUnique);

    /**  @type {DataTable<SimpleType>} Liste mit DatenTypen */
    #simpleTypeList = new DataTable("simpletypes", [SimpleTypeFields], SimpleTypeUnique);


    /** @type {DataTable<PropertyType>} Liste mit Objekt PropTypen */
    #propList = new DataTable("properties", [PropTypeFields], PropTypeUnique);

    /** @type {DataTable<DataType>}  Liste aller Typen */
    #dataTypeList = new DataTable("datatypes", [DataTypeFields], DataTypeUnique);

    /** @type {DataTable<InfoText>} Liste mit InformationsTexten */
    #infoList = new DataTable("infos", [InfoTextFields], InfoTextUnique);


    // Tabellen (ReadOnly) für Listen Funktionen
    get dataTypes() { return this.#dataTypeList.readOnly(); }
    get properties() { return this.#propList.readOnly(); }
    get enums() { return this.#enumList.readOnly(); }
    get simpleTypes() { return this.#simpleTypeList.readOnly(); }
    get uniques() { return this.#uniqueList.readOnly(); }
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
     * @returns {string} ID wenn erfolgreich
     */
    setDataType(options) {
        if (!options.name) { options.name = getGSID(); }
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
        return this.#dataTypeList.addCellSetValue(type_name, "simple_types", simple_type_name);
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
     * @returns {string} ID wenn erfolgreich
     */
    setSimpleType(options) {
        if (!options.name) { options.name = getGSID(); }

        // SchemaTyp ausbessern/anlegen
        this.#dataTypeList.setObject({ name: options.name, art: options.art || "string" });

        // DatenTyp setzen
        return this.#simpleTypeList.setObject(options) || "";
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
     * @returns {string} ID des NEUEN Property
     */
    addProperty(object_name, prop_name, options) {
        if (!object_name || !prop_name) { return ""; }

        if (!options) { options = this.#propList.newObject(prop_name); }

        options.object_name = object_name;
        options.name = prop_name;

        // Objekttyp anlegen/setzen
        this.#dataTypeList.setObject({ name: object_name, art: "object" });

        // neue GSID - Erforderlich beim hinzufügen
        if (!options.gsid) { options.gsid = getGSID() };

        // Default werte prüfen
        if (options.prop_type == undefined) { options.prop_type = "string"; }
        if (options.min == undefined) { options.min = 1; }
        if (options.max == undefined) { options.max = 1; }

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
        return this.#propList.setObject(options) || "";
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
     * @returns {string|undefined} Enum-Name wenn erfolgreich
     */
    setEnum(options) {
        if (!options.name) { options.name = getGSID(); }

        // SchemaTyp ausbessern/anlegen
        this.#dataTypeList.setObject({ name: options.name, art: "enum" });

        // DatenTyp setzen
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
            obj = { name: enum_name, values: new Set() };
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
     * Prüft ob ein Wert gültig ist
     * @param {string} typeName - Name des Datentypes
     * @param {string} columnName - Spalten Name
     * @param {any} value - Wert der Spalte
     * @returns {object} {valid: true} oder {valid: false, error: "Fehler ...."}
     */
    validateData(typeName, columnName, value) {
        const dataType = this.#dataTypeList.getObject(typeName);
        if (!dataType) return { valid: true }; // Basis-Fall
        
        if (dataType.art == "multi") {
            const simpleTypes = [...dataType?.simple_types || ["string"]];

            for (let i = 0; i < simpleTypes.length; i++) {
                const simpleType = this.simpleTypes.getObject(simpleTypes[i]);
                if (!simpleType) return { valid: true }; // Basis-Fall

                // 1. Validierung gegen String-Restriktionen
                if (simpleType.art === "string" && typeof value === "string") {
                    if (simpleType.min_length && value.length < simpleType.min_length)
                        return { valid: false, error: `Mindestens ${simpleType.min_length} Zeichen benötigt.` };
                    if (simpleType.max_length && value.length > simpleType.max_length)
                        return { valid: false, error: `Maximal ${simpleType.max_length} Zeichen erlaubt.` };
                    if (simpleType.pattern && !new RegExp(simpleType.pattern).test(value))
                        return { valid: false, error: `Format entspricht nicht dem Muster.` };
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

            }
        }

        // 3. Validierung gegen Enums
        if (dataType.art == "enum") {
            // todo: hier weiter
            const validEnum = dataType.enums.some(e => e.value === value);
            if (!validEnum) return { valid: false, error: `Ungültiger Auswahlwert.` };
        }

        return { valid: true };
    }


    /**
     * 
     * @returns {Object<string,string|DataTable<any>>}
     */
    toSchemaObj() {
        const obj = {
            infotype: "infoSchema"
            , name: this.#name
            , refs: this.#refList
            , uniques: this.#uniqueList
            , enums: this.#enumList
            , simpletypes: this.#simpleTypeList
            , properties: this.#propList
            , datatypes: this.#dataTypeList
            , infos: this.#infoList
        };
        return obj;
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
            , uniques: this.#uniqueList.rows
            , enums: this.#enumList.rows
            , simpletypes: this.#simpleTypeList.rows
            , properties: this.#propList.rows
            , datatypes: this.#dataTypeList.rows
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
        if (obj.infotype != "infoSchema") { return; }

        this.#refList = new DataTable("refs", obj.refs || [RefTypeFields], RefTypeUnique);
        this.#uniqueList = new DataTable("uniques", obj.uniques || [UniqueTypeFields], UniqueTypeUnique);
        this.#enumList = new DataTable("enums", obj.enums || [EnumTypeFields], EnumTypUnique);
        this.#simpleTypeList = new DataTable("simpletypes", obj.simpletypes || [SimpleTypeFields], SimpleTypeUnique);
        this.#propList = new DataTable("properties", obj.items || [PropTypeFields], PropTypeUnique);
        this.#dataTypeList = new DataTable("datatypes", obj.datatypes || [DataTypeFields], DataTypeUnique);
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



// ===========================
//   InfoSchema
// --------------

export const infoSchema = new Schema("infoSchema");

// Enums
infoSchema.setEnum({
    name: "enu_types", values: new Set([
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
    ])
});

infoSchema.setEnum({ name: "enu_art", values: new Set(["string", "number", "bigint", "boolean"]) });

infoSchema.setEnum({
    name: "enu_casing", values: new Set([
        "camelCase"
        , "PascalCase"
        , "snake_case"
        , "lower"
        , "upper"
    ])
});

infoSchema.setEnum({ name: "enu_onupdate", values: new Set(["NO", "UPDATE", "NULL", "DEFAULT"]) });

infoSchema.setEnum({ name: "enu_ondelete", values: new Set(["NO", "DELETE", "NULL", "DEFAULT"]) });

// String_number Typ
infoSchema.setDataType({ name: "string_number", art: "multi", simple_types: new Set(["string", "number"]) });

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


// ==========================
//   Schema anzeigen
// --------------------

/**
 * Liefert einen HTML-String für ein Schema zurück (JSDoc-Style)
 * @param {Schema} schema - Info Schema Instanz
 * @returns {string} Vollständiger HTML-String für die Dokumentation
 */
export function getSchemaHTML(schema) {

    // --- HAUPTFUNKTION FÜR DIE ANZEIGE ---
    function renderDocumentation() {
        let html = "";

        // 1. HAUPT-OBJEKTE RENDERN (Alle Datentypen, die die Art "object" haben)
        // Hier nutzen wir Ihr praktisches Such-Objekt!
        const hauptObjekte = schema.dataTypes.findAll({ art: "object" });

        hauptObjekte.forEach(typ => {
            html += createObjectCardHTML(typ);
        });

        // 2. GLOBALE HILFSTYPEN & ENUMS RENDERN
        // Wir suchen alle Typen, deren Art NICHT "object" ist (über eine Spalten-Funktion im Such-Objekt)
        const hilfsTypen = schema.dataTypes.findAll({
            art: (/** @type {string} */value) => value !== "object"
        });

        if (hilfsTypen.length > 0) {
            html += `<div class="footer-section">`;
            html += `<h2>Globale Hilfstypen & Enums</h2>`;
            hilfsTypen.forEach(typ => {
                html += createObjectCardHTML(typ);
            });
            html += `</div>`;
        }

        return html;
    }

    // --- HILFSFUNKTION: Erstellt eine einzelne JSDoc-Karte ---
    /**
     * @param {DataType} typ 
     * @returns {string} HTML-String der Karte
     */
    function createObjectCardHTML(typ) {
        // Findet alle Eigenschaften, die zu diesem Objektnamen gehören
        const allProps = schema.properties.findAll({ object_name: typ.name });

        // Trennung in XML-Attribute (@) und normale Properties
        const attribute = allProps.filter(p => p.name.startsWith("@"));
        const propertys = allProps.filter(p => !p.name.startsWith("@"));

        let cardHtml = `<div class="object-card" id="type-${typ.name}">`;
        cardHtml += `<h2>${typ.name} <span class="badge">${typ.art}</span></h2>`;

        // XML-Attribute anzeigen
        if (attribute.length > 0) {
            cardHtml += `<div class="section-title">Attributes</div>`;
            cardHtml += buildJSDocTable(attribute);
        }

        // Normale Kind-Elemente / Properties anzeigen
        if (propertys.length > 0) {
            cardHtml += `<div class="section-title">Properties</div>`;
            cardHtml += buildJSDocTable(propertys);
        }
        // ENUM-WERTE ANZEIGEN: Wenn der Typ ein Enum ist, holen wir die Werte aus schema.enums
        else if (typ.art === "enum") {
            cardHtml += `<div class="section-title">Erlaubte Werte (Enum)</div>`;

            // Wir suchen in der Enum-Tabelle nach dem Eintrag für diesen Typen
            const enumEintrag = schema.enums.find({ name: typ.name });

            if (enumEintrag && enumEintrag.values && enumEintrag.values.size > 0) {
                cardHtml += `<table class="jsdoc-table enum-table">
                    <thead><tr><th>Erlaubter Wert</th></tr></thead>
                    <tbody>`;

                // Da enumEintrag.values ein Set<any> ist, wandeln wir es in ein Array um
                const werteArray = Array.from(enumEintrag.values);
                werteArray.forEach(wert => {
                    cardHtml += `<tr><td class="enum-value">${wert}</td></tr>`;
                });

                cardHtml += `</tbody></table>`;
            } else {
                cardHtml += `<p style="color: #888; font-style: italic; margin-left: 12px;">Keine Enum-Werte hinterlegt.</p>`;
            }
        }
        // Wenn es ein reiner SimpleType ohne Properties ist (z.B. ein custom String-Typ)
        else if (attribute.length === 0) {
            cardHtml += `<p style="color: #888; font-style: italic; margin-left: 12px;">Keine Eigenschaften definiert (SimpleType / Primitiv).</p>`;
        }

        cardHtml += `</div>`;
        return cardHtml;
    }

    // --- HILFSFUNKTION: Baut die JSDoc Tabelle für Attribute/Properties ---
    /**
     * @param {Array<PropertyType>} propListe 
     * @returns {string} HTML-String der Tabelle
     */
    function buildJSDocTable(propListe) {
        let table = `<table class="jsdoc-table">
        <thead>
            <tr><th>Name</th><th>Typ</th><th>Kardinalität</th><th>Details / Fixwert</th></tr>
        </thead>
        <tbody>`;

        propListe.forEach(p => {
            // Prüfen, ob der Typ im Schema existiert -> Dann machen wir einen Klick-Link daraus
            const typExistiert = schema.dataTypes.has(p.prop_type || "");
            const typLink = typExistiert
                ? `<a class="prop-type" href="#type-${p.prop_type}">${p.prop_type}</a>`
                : `<span style="color: #666;">${p.prop_type}</span>`;

            // Kardinalität leserlich übersetzen
            let kardinalitaet = `${p.min}..${p.max === -1 ? '*' : p.max}`;
            if (p.min === 0 && p.max === 1) kardinalitaet += " (Optional)";
            if (p.min === 1 && p.max === 1) kardinalitaet += " (Erforderlich)";

            table += `<tr>
                <td class="prop-name">${p.name}</td>
                <td>${typLink}</td>
                <td style="color: #666; font-size: 0.9em;">${kardinalitaet}</td>
                <td style="font-style: italic; color: #555;">${p.fix ? `Fixwert: "${p.fix}"` : (p.default ? `Default: "${p.default}"` : '-')}</td>
            </tr>`;
        });

        table += `</tbody></table>`;
        return table;
    }

    // Startet den geschützten Ausleseprozess und gibt den HTML-String zurück
    return renderDocumentation();
}

// ==============================

