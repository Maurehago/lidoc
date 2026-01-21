// =======================
//   XML Tools
// =======================
// @ts-check

import { Schema, DataProperty } from "./infoschema.js";


/** @typedef {import("./infoschema.js").DataTypeOptions} DataTypeOptions */

// ============================
//   Parameter
// --------------

// neues Schema anlegen
const XSD = new Schema("xsd");


// ============================
//   Funktionen
// --------------


/**
 * Sucht das Minimale und Maximale Vorkommen-Einstellung in einem Element
 * @param {Element} elm - Element zum prüfen
 * @param {DataProperty} prop - Daten Property in dem die Anzahl Vorkommen abgelegt werden
 */
function checkOccurAttribute(elm, prop) {
    let min = elm.getAttribute("minOccurs");
    let max = elm.getAttribute("maxOccurs");
    if (typeof min == "string") {prop.min = parseInt(min);}
    if (typeof max == "string") {prop.max = parseInt(max);}
}


/**
 * Prüft die Attribute vom XSD Element
 * @param {Element} elm - XML Element
 */
function checkAttribute(elm) {
    const attributes = [...elm.attributes];

    // alle Attribute durchgehen
    for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        
        // todo: je nach Element und Attribute -> Einstellungen vornehmen

    }
}


/**
 * Prüft das XSD Element
 * @param {Element} elm - XML Element
 * @param {DataTypeOptions} options - DateTyp Optionen
 * @param {DataProperty} [baseProp] - Basis Property Objekt
 */
function checkElement(elm, options, baseProp) {
    /** Neue Optionen für Untergeordnete Elemente und Typen
     * @type {DataTypeOptions} */
    let newOptions = {};

    // Wenn Kindelment geprüft werden sollen
    let checkChildren = false;
    let prop = new DataProperty("");

    switch (elm.localName) {
        case "all":
            // Alle Kindelemente können in beliebiger Reihenfolge vorkommen und können 0-mal oder 1-mal vorkommen. 
            // Attribute: id, maxOccurs, minOccours, ...any
            // Children: annotation(0,1), element(0,-1)
            // todo: Kind Elemente prüfen
            checkChildren = true;
            checkOccurAttribute(elm, prop);

            break;
        case "annotation":
            // Top Level Beschreibungen für das Schema
            // Attribute: id, ...any
            // Children: appinfo(0,-1), documentation(0,-1) 
            // todo: Kindelemente prüfen
            break;
        case "any":
            // Bestimmt das das Schema um zusätzliche Elemente erweitert werden darf
            // Attribute: id, maxOccurs, minOccurs, namespace, processContents, ...any
            // children: annotation(0,1)
            // todo: DataType.moreProperties setzen
            break;
        case "anyAttribute":
            // Bestimmt das das Eleternelement um zusätzliche Attribute erweitert werden darf
            // Attribute: id, namespace, processContents, ...any
            // children: annotation(0,1)
            // todo: DataType.moreAttributes setzen
            break;
        case "appinfo":
            // Information zu der Anwendung
            // parent: annotation
            // attribute: -
            // children: -
            // todo: Datatyp.info[] hinzufügen
            break;
        case "attribute":
            // definiert ein Attribute Typ
            // parent: attributeGroup, schema, complexType, restriction (both simpleContent and complexContent), extension (both simpleContent and complexContent)
            // attribute: default, fixed, form, id, name, ref, type, use, ...any (name und ref dürfen nicht gleichzeitig vorkommen)
            // children: annotation(0,1), simpleType(0,1)
            // todo: Datentyp für Attribute festlegen, bei "ref" DataType.attribute typ von "ref" setzen
            break;
        case "attributeGroup":
            // Definiert eine Gruppe von Attribute
            // parent: attributeGroup, complexType, schema, restriction (both simpleContent and complexContent), extension (both simpleContent and complexContent)
            // attribute: id, name, ref, ...any (name und ref dürfen nicht gleichzeitig vorkommen)
            // children: annotation(0,1), attribute|attributeGroup(0,-1), anyAttribute(0,1)
            // todo: DataTyp für Attributgruppe erstellen - Kind Attribute in DataType.attributes hinzufügen
            break;
        case "coice":
            // Bestimmt das nur eines der Kind-Elemente vorkommen darf (entweder/oder)
            // parent: group, choice, sequence, complexType, restriction (both simpleContent and complexContent), extension (both simpleContent and complexContent)
            // attribute: id, maxOccurs, minOccurs, ...any
            // children: annotation(0,1), element|group|choice|sequence|any(0,-1)
            // todo: Kind Elemente in DataTyp.oneOfProperties[] einfügen
            break;
        case "complexContent":
            // Bestimmt Erweiterung oder Einschränkung für einen Komplexen Typ
            // parent: complexType
            // attribute: id, mixed, ...any
            // children: annotation(0,1), restriction|extension(1,1)
            // todo: neuen DataTyp anlegen der als basetyp einen komplexen Typ erweitert
            break;
        case "complexType":
            // Definiert einen Kompexen Typ(object)
            // parent: element, redefine, schema
            // attribute: id, name, abstract, mixed, block, final, ...any
            // children: annotation(0,1), simpleContent|complexContent|group|all|choice|sequence(0,1), attribute|attributeGroup(0,-1), anyAttribute(0,1)
            // todo: KomplexTyp anlegen. Alle Kind-"elemente" werden properties im Typ
            break;
        case "documentation":
            // Beschreibung
            // parent: annotation
            // attribute: source, xml:lang
            // children: -
            // todo: Infotext von Schema übernehmen
            break;
        case "element":
            // Definiert ein Element(Property) bei Komplexen Typ
            // parent: schema, choice, all, sequence, group 
            // attribute: id, name, ref, type, substitutionGroup, default, fixed, form, maxOccurs, minOccurs, nillable, abstract, block, final, ...any
            // children: annotation(0,1), simpleType|complexType(0,1), unique|key|keyref(0,-1)
            // todo: in properties vom Übergeordneten Typ, und eventuell einen neuen eigenen Typ erstellen
            break;
        case "extension":
            break;
        case "field":
            break;
        case "group":
            break;
        case "import":
            // Fügt weitere Schema Namespaces hinzu
            // parent: schema
            // attribute: id, namespace, schemaLocation, ...any
            // children: annotation(0,1)
            // todo: zusätzliche Schema Namenspaces
            break;
        case "include":
            break;
        case "key":
            break;
        case "keyref":
            break;
        case "list":
            break;
        case "notation":
            break;
        case "redefine":
            break;
        case "restriction":
            break;
        case "schema":
            // Root Node für das Schema
            // parent: -
            // attribute: id, attributeFormDefault, elementFormDefault, blockDefault, finalDefault, targetNamespace, version, xmlns, ...any
            // children: include|import|redefine|annotation(0,-1), simpleType|complexType|group|attributeGroup(0,-1), element|attribute|notation(0,-1)
            // todo: Liste mit Schema Namenspaces (xmlns:...)
            break;
        case "selector":
            break;
        case "sequence":
            break;
        case "simpleContent":
            break;
        case "simpleType":
            break;
        case "union":
            break;
        case "unique":
            break;

        default:
            break;
    }
}



/**
 * Liest eine XSD Datei in Typen
 * @param {string} xsdString - eine XSD Datei als String
 */
export function parseXSD(xsdString) {
    // XML Parser erstellen
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xsdString, "text/xml");

    // test:
    console.log("xmlDoc: ", xmlDoc);
    
    // Schema Element lesen
    const schema = xmlDoc.querySelector("schema");
    if (!schema) {return;}

    // Schema Typ anlegen
    XSD.setType("schema", {basetype: "element"});

    // Schema Attribute
    checkAttribute(schema);

    // Alle Kindelemente von Schema durchgehen
    const schemaChild = [...schema.children];
    for (let i = 0; i < schemaChild.length; i++) {
        const elm = schemaChild[i];
        checkElement(elm, {});
    }
}
