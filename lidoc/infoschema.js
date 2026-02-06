// =========================
//  Schema und Typen 
// =========================
// @ts-check

// Basis Typen: string, number, boolean, object, enum
// Datum Typen: date, time, datetime, range

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


class IdItem {
    /** @type {string} */
    name = "";
    /** @type {string} Pfad zum Untergeordneten Objekt oder "." wenn aktuelles Objekt */
    objPath = ".";
    /** @type {Array<string>} Selector für das/die ID Felder */
    field = [];
    /** @type {string} */
    info = "";
    /** @type {string} ID-Name für Referenz Objekt */
    refId = "";

    /**
     * ID Item Eintrag
     * @param {string} name - Name der ID
     * @param {string} objPath - Pfad zum Untergeordneten Objekt oder "." für aktuelles Objekt
     * @param {Array<string>} field - Selector für das/die ID-Felder
     * @param {string} [info] - Optional Beschreibung zur ID
     */
    constructor(name, objPath, field, info) {
        this.name = name;
        this.objPath = objPath;
        this.field = field;
        this.info = info || "";
    }
}



// DataType:
export class DataType {
    /** @type {"type"|"attribute"|"col"|"list"}  Art des Types */
    art = "type";
    /** @type {string} Name des Schemas */
    schemaName = "";
    /** @type {string} Name des Datentypes */
    name;
    /** @type {string|undefined} BasisTyp(abgeleitet von) der Eigenschaft */
    base;
    /** @type {string|Array<string>} Typ der Eigenschaft oder Liste von TypNamen - default "string" */
    type = "string";
    /** @type {string|undefined} Name der Liste wenn vom type="object" */
    list;
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

    //  --- Spalte eigenschaften ---
    /** @type {number} Minimales Vorkommen der Spalte/Attribute / optional: 0 / default: 1 */
    min = 1;
    /** @type {number} Maximales Vorkommen der Spalte/Attribute / unendlich: -1 / default: 1 */
    max = 1;
    /** @type{any} - Fixer Wert */
    fixed;
    /** @type {any} Standard Wert */
    default;

    // --- Liste Eigenschaften ---
    /** @type {Array<string>} Liste mit Attribute-Namen*/
    attributes = [];
    /** @type {string|undefined} weitere Attribute erlaubt */
    moreAttributes;
    /** @type {Array<string>} Liste mit Property-Namen */
    cols = [];
    /** @type {string|undefined} Typ der bestimmt ob weitere Attribute erlaubt sind */
    moreCols;
    /** @type {Map<string,IdItem>} Liste mit Index ID's */
    id = new Map();
    /** @type {Map<string,IdItem>} Liste mit Referenzen zu Indexes */
    idref = new Map();
    /** @type {Map<string,IdItem>} Liste mit Unique's */
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
     * @param {Object<string,any>} [options] - Optional Eigenschaften des Types
     * @param {"type"|"attribute"|"col"|"list"} [art] - Optional - Art des Types
     */
    constructor(name, options, art) {
        Object.assign(this, options);
        this.name = name || getGSID(); // Name nach Options setzen falls in Optionen ein anderer Name drinnen ist
        this.art = art || "type";
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

    /**
     * Registriert einen neuen Typ im Schema.  
     * Wenn ein Typ mit dem Selben Namen existiert, so wird dieser überschrieben.  
     * Wird kein Typname angegeben wird ein Random Typname generiert.  
     * @param {string} [typeName] - TypName 
     * @param {Object<string,any>} [options] - Optionale Einstellungen für den Typ
     * @param {"type"|"attribute"|"col"|"list"} [typeArt] - Optional Art des Types "type"|"attribute"|"col"|"list"
     * @returns {DataType} neuen DatenTyp
     */
    addType(typeName, options, typeArt) {
        let type;
        if (typeName) {
            type = new DataType(typeName, options, typeArt);
        } else {
            type = new DataType(undefined, options, typeArt);
        }

        // Typ Registrieren
        this.#types.set(type.name, type);

        // Typ zurückgeben
        return type;
    }

    /**
     * Ändert einen bestehenden Typ, oder legt diesen an wenn dieser nicht existiert 
     * Wird kein Typname angegeben wird ein Random Typname generiert.  
     * @param {string} [typeName] - TypName 
     * @param {Object<string,any>} [options] - Optionale Einstellungen für den Typ
     * @param {"type"|"attribute"|"col"|"list"} [typeArt] - Optional Art des Types "type"|"attribute"|"col"|"list"
     * @returns {DataType} neuen DatenTyp
     */
    setType(typeName, options, typeArt) {
        if (typeName) {
            let type = this.#types.get(typeName);
            if (type) {
                Object.assign(type, options);
                type.name = typeName;
                type.art = typeArt || type.art;
                return type;
            } else {
                return this.addType(typeName, options, typeArt);
            }
        } else {
            return this.addType(getGSID(), options, typeArt);
        }
    }

    /**
     * Fügt zu einem Bestehenden Typ mehrere Typnamen hinzu
     * @param {string} baseType - Name vom Typ dem weitere Typnamen hinzugefügt werden
     * @param {string|Array<string>} newType - Typname oder Liste von TypNamen die hinzugefügt werden 
     * @param {boolean} [replace] - Optional "true" wenn bestehender Typ.typ beibehalten 
     */
    addTypeName(baseType, newType, replace) {
        let type = this.#types.get(baseType);
        if (!Array.isArray(newType)) {
            newType = [newType];
        }
        if (type) {
            if (!Array.isArray(type.type)) {
                type.type = [type.type];
            }

            if (replace) {
                type.type = newType;
            } else {
                for (let i = 0; i < newType.length; i++) {
                    // fügt nur hinzu wenn noch nicht vorhanden (doppelte vermeiden)
                    if (type.type.indexOf(newType[i]) < 0) {
                        type.type.push(newType[i]);
                    }
                }
            }
        } // wenn Typ
    }

    /**
     * Registriert einen neuen Typ als Liste im Schema.  
     * Wenn ein Typ mit dem Selben Namen existiert, so wird dieser überschrieben.  
     * Wird kein Typname angegeben wird ein Random Typname generiert.  
     * @param {string} [listName] - ListName oder DatenTyp 
     * @param {Object<string,any>} [options] - Optionale Einstellungen für den Typ
     * @returns {DataType} neuen DatenTyp
     */
    addList(listName, options) {
        return this.addType(listName, options, "list");
    }

    /**
     * Registriert einen neuen Typ als Spalte oder Attribute im Schema.  
     * Wenn ein Typ mit dem Selben Namen existiert, so wird dieser überschrieben.  
     * Wird kein Typname angegeben wird ein Random Typname generiert.  
     * @param {"col"|"attribute"} typeArt - "col"|"attribute"
     * @param {string} listName - Name der Liste in die die Spalte eingefügt wird. Bei "schema" oder "" wird nur der SpaltenTyp registriert.
     * @param {string} name - Name der Spalte/Attribute 
     * @param {Object<string,any>} [options] - Optionale Einstellungen für die Spalte
     * @returns {DataType} neuen DatenTyp
     */
    #addToList(typeArt, listName, name, options) {
        let typeName = name;
        if (listName && listName != "schema") {
            // Liste Lesen oder erzeugen
            let list = this.#types.get(listName) || this.addList(listName);
            list.art = "list";
            list.type = "object";

            // Liste Spalte hinzufügen
            if (typeArt == "col") {
                list.cols.push(name);
            } else if (typeArt == "attribute") {
                list.attributes.push(name);
            }

            // Liste in Spalte registrieren
            if (!options) {
                options = { list: listName };
            } else {
                options.list = listName;
            }

            // neuer Typ Name
            typeName = listName + "-" + name;
        }
        return this.setType(typeName, options, typeArt);
    }

    /**
     * Registriert einen neuen Typ als Spalte im Schema.  
     * Wenn ein Typ mit dem Selben Namen existiert, so wird dieser überschrieben.  
     * Wird kein Typname angegeben wird ein Random Typname generiert.  
     * @param {string} listName - Name der Liste in die die Spalte eingefügt wird. Bei "schema" oder "" wird nur der SpaltenTyp registriert.
     * @param {string} [colName] - Name der Spalte 
     * @param {Object<string,any>} [options] - Optionale Einstellungen für die Spalte
     * @returns {DataType} neuen DatenTyp
     */
    addCol(listName, colName, options) {
        return this.#addToList("col", listName, colName || getGSID(), options);
    }

    /**
     * Registriert einen neuen Typ als Spalte im Schema.  
     * Wenn ein Typ mit dem Selben Namen existiert, so wird dieser überschrieben.  
     * Wird kein Typname angegeben wird ein Random Typname generiert.  
     * @param {string} listName - Name der Liste in die die Spalte eingefügt wird. Bei "schema" oder "" wird nur der SpaltenTyp registriert.
     * @param {string} attrName - Name des Attributes 
     * @param {Object<string,any>} [options] - Optionale Einstellungen für die Spalte
     * @returns {DataType} neuen DatenTyp
     */
    addAttribute(listName, attrName, options) {
        return this.#addToList("attribute", listName, attrName, options);
    }

    /**
     * Liefert ein Datentyp-Objekt vom Schema zurück oder "undefined" wenn nicht vorhanden.
     * @param {string} typeName - Name des Typs
     * @returns {DataType|undefined} DatenTyp
     */
    getType(typeName) {
        return this.#types.get(typeName);
    }


    /**
     * Setzt einen Any-Typ für eine Liste
     * @param {"col"|"attribute"} typeArt - "col"|"attribute"
     * @param {string} listName - Name der Liste
     * @param {number} min - Minimale Anzahl der Spalten. Default: 0
     * @param {number} max - Maximale Anzahl der Spalten/attribute. Default: -1
     * @returns {DataType} Any-DatenTyp für die Liste
     */
    #addAny(typeArt, listName, min, max) {
        let list = this.#types.get(listName) || this.addList(listName);
        list.type = "object";
        list.art = "list";
        let type = this.addType("", { min: min, max: max }, typeArt);
        if (typeArt == "col") {
            list.moreCols = type.name;
        } else if (typeArt == "attribute") {
            list.moreAttributes = type.name;
        }
        return type;
    }

    /**
     * Fügt der Liste Information für zusätzliche Spalten hinzu.  
     * @param {string} listName - Name vom Listen Schema
     * @param {number} [min] - Minimales Vorkommen neuer Spalten. Default: 0
     * @param {number} [max] - Maximales Vorkommen neuer Spalten. Default: -1
     * @returns {DataType} DatenTyp für Any Spalte
     */
    addAnyCol(listName, min, max) {
        return this.#addAny("col", listName, min || 0, max || -1);
    }

    /**
     * Fügt der Liste Information für zusätzliche Attribute hinzu.  
     * @param {string} listName - Name vom Listen Schema
     * @param {number} [min] - Minimales Vorkommen neuer Attribute. Default: 0
     * @param {number} [max] - Maximales Vorkommen neuer Attribute. Default: -1
     * @returns {DataType} DatenTyp für Any Attribute
     */
    addAnyAttribute(listName, min, max) {
        return this.#addAny("attribute", listName, min || 0, max || -1);
    }

    /**
     * Liefert ein Spaltenschema Objekt zurück, oder "undefined" wenn nicht gefunden.
     * @param {string} listName - Name der Liste
     * @param {string} colName - Name der Spalte
     * @returns {DataType|undefined} DatenTyp der Spalte wenn vorhanden
     */
    getColType(listName, colName) {
        if (listName && listName != "schema") {
            return this.#types.get(listName + "-" + colName);
        } else {
            return this.#types.get(colName);
        }
    }

    /**
     * Liefert ein Spaltenschema Objekt zurück, oder "undefined" wenn nicht gefunden.
     * @param {string} listName - Name der Liste
     * @param {string} attrName - Name des Atributes
     * @returns {DataType|undefined} Datentyp für Attribute wenn vorhanden
     */
    getAttrType(listName, attrName) {
        return this.getColType(listName, attrName);
    }

    /**
     * Fügt ein neues Enum Item zu einem EnumTyp hinzu
     * @param {string} typeName - Name des ENUM-Types
     * @param {string} name - EnumItem Name
     * @param {string} [value] - Optional EnumItem Wert. Wenn nicht angegeben wird der Name auch zum Wert.
     * @param {string} [info] - Optional Beschreibung zum EnumItem
     */
    addEnum(typeName, name, value, info) {
        let type = this.#types.get(typeName) || this.addType(typeName);

        // Enum Werte hinzufügen
        type.addEnum(name, value, info);
    }

    /**
     * Fügt einem Typ ein Unique Item hinzu
     * @param {"id"|"unique"|"idref"} idArt - Art der ID
     * @param {string} typeName - Name des Types dem das Unique hinzugefügt wird
     * @param {string} name - Unique Bezeichner
     * @param {string} objPath - XPath zum Objekt, "." wenn das Type Objekt gemeint ist
     * @param {Array<string>} field - XPath zum Feld/Felder des Objektes das den Unique erzeugt
     * @param {string} [info] - Optional Beschreibung des Unique's
     * @returns {IdItem|undefined} IdItem
     */
    #addId(idArt, typeName, name, objPath, field, info) {
        let type = this.#types.get(typeName);
        let id = new IdItem(name, objPath, field, info);
        if (type) {
            switch (idArt) {
                case "id":
                    type.id.set(name, id);
                    break;
                case "idref":
                    type.idref.set(name, id);
                    break;
                case "unique":
                    type.unique.set(name, id);
                    break;
                default:
                    break;
            }
        }
        return id;
    }

    /**
     * Fügt einem Typ ein Unique Item hinzu
     * @param {string} typeName - Name des Types dem das Unique hinzugefügt wird
     * @param {string} uniqueName - Unique Bezeichner
     * @param {string} objPath - XPath zum Objekt, "." wenn das Type Objekt gemeint ist
     * @param {Array<string>} field - XPath zum Feld/Felder des Objektes das den Unique erzeugt
     * @param {string} [info] - Optional Beschreibung des Unique's
     */
    addUnique(typeName, uniqueName, objPath, field, info) {
        let id = this.#addId("unique", typeName, uniqueName, objPath, field, info);
    }

    /**
     * Fügt einem Typ eine ID(index) hinzu
     * @param {string} typeName - Name des Types dem das Unique hinzugefügt wird
     * @param {string} idName - ID Bezeichner
     * @param {string} objPath - XPath zum Objekt, "." wenn das Type Objekt gemeint ist
     * @param {Array<string>} field - XPath zum Feld/Felder des Objektes
     * @param {string} [info] - Optional Beschreibung des Unique's
     */
    addId(typeName, idName, objPath, field, info) {
        let id = this.#addId("id", typeName, idName, objPath, field, info);
    }

    /**
     * Fügt einem Typ eine ID(index) hinzu
     * @param {string} typeName - Name des Types dem das Unique hinzugefügt wird
     * @param {string} idName - ID Bezeichner
     * @param {string} objPath - XPath zum Objekt, "." wenn das Type Objekt gemeint ist
     * @param {Array<string>} field - XPath zum Feld/Felder des Objektes
     * @param {string} refer - Name der ID beim Zielobjekt
     * @param {string} [info] - Optional Beschreibung des Unique's
     */
    addRefId(typeName, idName, objPath, field, refer, info) {
        let id = this.#addId("id", typeName, idName, objPath, field, info);
        if (id) {
            id.refId = refer;
        }
    }

    /**
     * Fügt einem Typ/Spalte/Attribute einen Infotext hinzu
     * @param {string} typeName - Name des Types
     * @param {string} info - Infotext
     */
    addTypeInfo(typeName, info) {
        // if (listName && listName != "schema") {
        //     typeName = listName + "-" + typeName;
        // }
        if (typeName == "" || typeName == "schema") {
            this.info.push(info);
        } else {
            let type = this.#types.get(typeName);
            if (type) {
                type.info.push(info);
            }
        }
    };

    /**
     * Fügt einem Typ/Spalte/Attribute einen APP-Infotext hinzu
     * @param {string} typeName - Name des Types
     * @param {string} info - Infotext
     */
    addTypeAppinfo(typeName, info) {
        // if (listName && listName != "schema") {
        //     typeName = listName + "-" + typeName;
        // }
        if (typeName == "" || typeName == "schema") {
            this.appinfo.push(info);
        } else {
            let type = this.#types.get(typeName);
            if (type) {
                type.info.push("appinfo: " + info);
            }
        }
    };



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
                html += `<details><summary>${html1}</summary>${html2}</details>`;
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
                html += "<li><b>Cols</b>(" + type.cols.length + ")";
                html += "<ul>";
                for (let i = 0; i < type.cols.length; i++) {
                    let typeCol = schema.getType(type.cols[i]);
                    if (typeCol) {
                        html1 = getNameTypeHTML(typeCol);
                        html2 = getTypeHTML(schema, typeCol.type);
                        if (html2) {
                            html += `<details><summary>${html1}</summary>${html2}</details>`;
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
