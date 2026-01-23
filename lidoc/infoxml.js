// =======================
//   XML Tools
// =======================
// @ts-check

import { Children } from "react";
import { Schema, DataProperty, DataType } from "./infoschema.js";

// ============================
//   Typen
// --------------

/** @typedef {import("./infoschema.js").DataTypeOptions} DataTypeOptions */

/**
 * @typedef {object} DataPropOptions
 * @property {number} [min] - Minimale Anzahl wie oft das Element(Property) vorkommen darf
 * @property {number} [max] - Maximale Anzahl wie oft das Element(Property) vorkommen darf
 */


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
 * @param {DataPropOptions} prop - Daten Property in dem die Anzahl Vorkommen abgelegt werden
 */
function checkOccurAttribute(elm, prop) {
    let min = elm.getAttribute("minOccurs");
    let max = elm.getAttribute("maxOccurs");
    let use = elm.getAttribute("use");
    if (use && use == "required") {
        prop.min = 1;
    } else if (typeof min == "string") {
        prop.min = parseInt(min);
    }
    if (typeof max == "string") {
        if (max = "unbounded") {
            prop.max = -1;
        } else {
            prop.max = parseInt(max);
        }
    }
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
 * @param {string} baseTypeName - Eltern DatenTyp
 * @param {string} basePropName - Basis Property
 * @param {string} baseAttrName - Basis Attribute
 * @param {number} [anyOfIndex] - Index bei Auswahl(choice)
 */
function checkElement(elm, baseTypeName, basePropName, baseAttrName, anyOfIndex) {
    /** Neue Optionen für Untergeordnete Elemente und Typen
     * @type {DataPropOptions} */
    let newPropOptions = {};
    let newTypeName = baseTypeName;
    let newPropName = basePropName;
    let newAttrName = "";
    let newAnyOfIndex;

    // Wenn Kindelment geprüft werden sollen
    let checkChildren = false;


    // Name, Rferenz und Typ Lesen
    const elmName = elm.getAttribute("name");
    const elmRef = elm.getAttribute("ref");
    const elmType = elm.getAttribute("type");
    const elmBase = elm.getAttribute("base");
    const elmValue = elm.getAttribute("value");

    switch (elm.localName) {
        case "all":
            // Alle Kindelemente können in beliebiger Reihenfolge vorkommen und können 0-mal oder 1-mal vorkommen. 
            // Attribute: id, maxOccurs, minOccours, ...any
            // Children: annotation(0,1), element(0,-1)
            // todo: Kind Elemente prüfen
            checkChildren = true;
            //checkOccurAttribute(elm, prop);

            break;
        case "annotation":
            // Top Level Beschreibungen für das Schema
            // Attribute: id, ...any
            // Children: appinfo(0,-1), documentation(0,-1) 
            // todo: Kindelemente prüfen
            newAttrName = baseAttrName;
            checkChildren = true;
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
            newAttrName = elmName || elmRef || "";
            let attrType = elmType || elmRef || "string";
            checkOccurAttribute(elm, newPropOptions);
            if (basePropName) {
                XSD.addPropAttr(baseTypeName, basePropName, newAttrName, attrType, newPropOptions.min, newPropOptions.max);
            } else {
                XSD.addTypAttr(baseTypeName, newAttrName, attrType, newPropOptions.min, newPropOptions.max);
            }
            checkChildren = true;
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

            // Alle Kindelemente durchgehen
            if (typeof anyOfIndex == "undefined") {
                let coiceChildren = [...elm.children];
                for (let i = 0; i < coiceChildren.length; i++) {
                    // KindElemente mit AuswahlIndex prüfen
                    checkElement(coiceChildren[i], baseTypeName, basePropName, baseAttrName, i);
                }
                checkChildren = false;
            } else {
                // todo: wenn bereits ein Coice -> dann momentan keine Ahnung wie zu Handhaben
            }

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

            // aus Property wird Typ
            if (basePropName) {
                // Namen Anpassen
                newTypeName = basePropName;
                newPropName = "";
                newAttrName = "";

                // BasisTyp von Property übernehmen
                XSD.setType(newTypeName, {basetype: XSD.getTypeProp(baseTypeName, basePropName)?.type || ""});
            }
            checkChildren = true;
            break;
        case "documentation":
            // Beschreibung
            // parent: annotation
            // attribute: source, xml:lang
            // children: -
            // todo: Infotext von Schema übernehmen
            if (baseAttrName) {
                if (basePropName) {
                    XSD.addPropAttrInfo(baseTypeName, basePropName, baseAttrName, elm.innerHTML);
                } else {
                    XSD.addTypeAttrInfo(baseTypeName, baseAttrName, elm.innerHTML);
                }
            } else if (basePropName) {
                XSD.addPropInfo(baseTypeName, basePropName, elm.innerHTML);
            } else {
                XSD.addTypeInfo(baseTypeName, elm.innerHTML);
            }
            checkChildren = false;
            break;
        case "element":
            // Definiert ein Element(Property) bei Komplexen Typ
            // parent: schema, choice, all, sequence, group 
            // attribute: id, name|ref, type, substitutionGroup, default, fixed, form, maxOccurs, minOccurs, nillable, abstract, block, final, ...any
            // children: annotation(0,1), simpleType|complexType(0,1), unique|key|keyref(0,-1)
            // todo: in properties vom Übergeordneten Typ, und eventuell einen neuen eigenen Typ erstellen

            // Name, Typ und Propertys
            newPropName = elmName || elmRef || "";
            let typeName = elmType || elmRef || "";
            checkOccurAttribute(elm, newPropOptions);
            
            // In Eltern Typ setzen
            if (typeof anyOfIndex != undefined) {
                XSD.addTypOneOfProp(baseTypeName, anyOfIndex || 0, newPropName, typeName, newPropOptions.min, newPropOptions.max);
            } else {
                XSD.addTypProp(baseTypeName, newPropName, typeName, newPropOptions.min, newPropOptions.max);
            }
            checkChildren = true;
            break;
        case "enumeration":
            // Typ Einschränkung auf enum 
            XSD.addTypeEnumItem(baseTypeName, elmValue || "");
            break;
        case "extension":
            // Erweitert einen Simplen oder Komplexen Typ
            // parent: simpleContent, complexContent 
            // attribute: id, base, ...any
            // children: annotation(0,1),group|all|choice|sequence(0,1),attribute|attributeGroup(0,-1),anyAttribute(0,1)
            XSD.addTypeOptions(baseTypeName, {basetype: elmBase || "string"});
            checkChildren = true;
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
        case "maxLength":
            // Setzt die MaximalLänge eines Types
            XSD.addTypeOptions(baseTypeName, {length: parseInt(elmValue || "") || 0});
            break;
        case "notation":
            break;
        case "redefine":
            break;
        case "restriction":
            // Bestimmt Einschränkungen für einen einfachen Typ, einfachen Inhalt oder komplexen Inhalt
            // parent: simpleType, simpleContent, complexContent
            // attribute: id, base, ...any
            // children: ... ist je nach Parent unterschiedlich

            // base ist erforderlich
            if (baseTypeName) {
                XSD.addTypeOptions(baseTypeName, {basetype: elmBase || "string"});
            }
            checkChildren = true;
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
            checkChildren = true;
            break;
        case "simpleContent":
            // Enthält Erweiterung oder Einschränkungen für einen simplen Typ(property) und enthält keine Eöemente
            // parent: complexType
            // attribute: id, ...any
            // children: annotation(0,1), restriction|extension(1,1)
            checkChildren = true;
            break;
        case "simpleType":
            // Definiert einen einfachen Typ für Property oder Attribute
            // parent: attribute, element, list, restriction, schema, union
            // attribute: id, name, ...any
            // children: annotation(0,1), restriction|list|union(1,1)
            
            if (baseAttrName) {
                // Attribute wird zum Typ
                newTypeName = baseAttrName;
                newPropName = "";
                newAttrName = "";
                XSD.setType(newTypeName, {});
            } else if (basePropName) {
                newTypeName = basePropName;
                newPropName = "";
                newAttrName = "";
                XSD.setType(newTypeName, {});
            } else {
                // SimpleTyp muss Name Attribute haben
                newTypeName = elmName || "";
                newPropName = "";
                newAttrName = "";
                XSD.setType(newTypeName, {});
            }
            checkChildren = true;
            break;
        case "union":
            break;
        case "unique":
            break;

        default:
            break;
    }


    // Wenn Kindelemente prüfen
    // Alle Kindelemente von Schema durchgehen
    const children = [...elm.children];
    for (let i = 0; i < children.length; i++) {
        const elm = children[i];
        checkElement(elm, newTypeName, newPropName, newAttrName);
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
    const schemaTyp = XSD.setType("schema", {basetype: "element"});

    // Schema Attribute
    checkAttribute(schema);

    // Alle Kindelemente von Schema durchgehen
    const schemaChild = [...schema.children];
    for (let i = 0; i < schemaChild.length; i++) {
        const elm = schemaChild[i];
        checkElement(elm, "schema", "", "");
    }
}
