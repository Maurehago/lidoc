// =======================
//   XML Tools
// =======================
// @ts-check

import { Children } from "react";
import { Schema, DataProperty, DataType, DataObject } from "./infoschema.js";

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
 * @param {string} [propName] - Property name
 * @returns {DataProperty} Daten Property in dem die Anzahl Vorkommen abgelegt sind
 */
function checkOccurAttribute(elm, propName) {
    const prop = new DataProperty(propName);
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
    return prop;
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
 * @param {string} baseObjName - Eltern Objekt
 * @param {string} [basePropName] - Basis Property/Attribute
 * @param {number} [anyOfIndex] - Index bei Auswahl(choice)
 */
function checkElement(elm, baseObjName, basePropName, anyOfIndex) {
    /** Neue Optionen für Untergeordnete Elemente und Typen
     * @type {DataPropOptions} */
    let newPropOptions = {};
    let newObjName = baseObjName;
    let newPropName = basePropName;
    let newAttrName = "";
    
    /** @type {DataObject|undefined}  Eltern Objekt */
    let obj = XSD.getObject(baseObjName);

    /** @type {DataProperty|undefined} Property Objekt */
    let prop = basePropName ? XSD.getProp(baseObjName, basePropName) : undefined;

    /** @type {DataType|undefined}  DatenTyp Objekt vom Property*/
    const type = basePropName ? XSD.getPropType(baseObjName, basePropName) : undefined;

    let newAnyOfIndex;

    // Wenn Kindelment geprüft werden sollen
    let checkChildren = false;

    // Name, Rferenz und Typ Lesen
    const elmName = elm.getAttribute("name") || undefined;
    const elmRef = elm.getAttribute("ref") || undefined;
    const elmType = elm.getAttribute("type") || undefined;
    const elmBase = elm.getAttribute("base") || undefined;
    const elmValue = elm.getAttribute("value") || undefined;

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
            checkChildren = true;
            break;
        case "any":
            // Bestimmt das das Schema um zusätzliche Elemente erweitert werden darf
            // Attribute: id, maxOccurs, minOccurs, namespace, processContents, ...any
            // children: annotation(0,1)
            
            if (obj) {
                obj.additionalProperties = true;
            }
            break;
        case "anyAttribute":
                // Bestimmt das das Eleternelement um zusätzliche Attribute erweitert werden darf
                // Attribute: id, namespace, processContents, ...any
                // children: annotation(0,1)
                
                if (obj) {
                    obj.additionalAttribute = true;
                }
            break;
        case "appinfo":
            // Information zu der Anwendung
            // parent: annotation
            // attribute: -
            // children: -
            if (basePropName) {
                XSD.addPropInfo(baseObjName, basePropName, "appinfo: " + elm.innerHTML);
            } else {
                XSD.addObjInfo(baseObjName, "appinfo: " + elm.innerHTML);
            }
            checkChildren = false;
            break;
        case "attribute":
            // definiert ein Attribute Typ
            // parent: attributeGroup, schema, complexType, restriction (both simpleContent and complexContent), extension (both simpleContent and complexContent)
            // attribute: default, fixed, form, id, name, ref, type, use, ...any (name und ref dürfen nicht gleichzeitig vorkommen)
            // children: annotation(0,1), simpleType(0,1)
            // todo: Datentyp für Attribute festlegen, bei "ref" DataType.attribute typ von "ref" setzen
            newAttrName = elmName || elmRef || "";
            prop = checkOccurAttribute(elm, newAttrName);
            if (basePropName) {
                // todo: setPropAttribute für Property Objekt
                XSD.addPropAttribute(baseObjName, basePropName, newAttrName, prop);
            } else {
                XSD.addAttribute(baseObjName, newAttrName, prop);
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

            if (typeof anyOfIndex == "undefined") {
                // index setzen
                anyOfIndex = 0;
            } else {
                // Index erhöhen
                anyOfIndex ++;
            }

            // Alle Kindelemente durchgehen
            let coiceChildren = [...elm.children];
            for (let i = 0; i < coiceChildren.length; i++) {
                // KindElemente mit AuswahlIndex prüfen
                checkElement(coiceChildren[i], baseObjName, basePropName, anyOfIndex + i);
            }
            checkChildren = false;

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

            // Objekt anlegen und registrieren wenn "elmName" vorhanden
            obj = XSD.setObject(elmName);

            // aus Property.type wird Objekt
            if (basePropName) {
                prop = XSD.getProp(baseObjName, basePropName);
            } else if (elmName) {
                // neues Property Objekt erstellen
                prop = XSD.addProperty(baseObjName, elmName);
            }
            if (prop) {
                // Property anpassen
                prop.art = "object";
                if (obj.name) {
                    prop.type = obj.name; // Eigenschaft zeigt auf neues Objekt
                    newObjName = obj.name; // neue Objekt Referenz setzen
                    newPropName = undefined;
                } else {
                    // Property Typ wird "unnamed" Objekt
                    prop.type = obj; // Eigenschaft enthält neues Objekt
                }
            }
            checkChildren = true;
            break;
        case "documentation":
            // Beschreibung
            // parent: annotation
            // attribute: source, xml:lang
            // children: -
            if (basePropName) {
                XSD.addPropInfo(baseObjName, basePropName, elm.innerHTML);
            } else {
                XSD.addObjInfo(baseObjName, elm.innerHTML);
            }
            checkChildren = false;
            break;
        case "element":
            // Definiert ein Element(Property) bei Komplexen Typ
            // parent: schema, choice, all, sequence, group 
            // attribute: id, name|ref, type, substitutionGroup, default, fixed, form, maxOccurs, minOccurs, nillable, abstract, block, final, ...any
            // children: annotation(0,1), simpleType|complexType(0,1), unique|key|keyref(0,-1)

            // Property erstellen
            newPropName = elmName || elmRef || ""; // es muss entweder Name oder Referenz vorhanden sein
            prop = checkOccurAttribute(elm, newPropName);
            prop.type = elmType || elmRef || "string";

            // In Eltern Typ setzen
            if (typeof anyOfIndex != undefined) {
                XSD.addOneOfProperty(baseObjName, newPropName, anyOfIndex || 0, prop);
            } else {
                XSD.addProperty(baseObjName, newPropName, prop);
            }

            checkChildren = true;
            break;
        case "enumeration":
            // Typ Einschränkung auf enum 
            if (type) {
                // Enum Item hinzufügen
                if (typeof type.enum == "string") {
                    XSD.addEnumItem(type.enum, elmValue || "");
                } else {
                    XSD.addEnumItem(type.name || "", elmValue || "");
                }
            }
            break;
        case "extension":
            // Erweitert einen Simplen oder Komplexen Typ
            // parent: simpleContent, complexContent 
            // attribute: id, base, ...any
            // children: annotation(0,1),group|all|choice|sequence(0,1),attribute|attributeGroup(0,-1),anyAttribute(0,1)
            XSD.addTypeOptions(baseTypeName, { basetype: elmBase || "string" });
            checkChildren = true;
            break;
        case "field":
            break;
        case "fractionDigits":
            if (type) {
                type.decimals = parseInt(elmValue || "");
            }
            break;
        case "group":
            // Gruppe von Elementen die zu "complexType" hinzugefügt werden
            // parent: schema, choice, sequence, complexType, restriction (both simpleContent and complexContent), extension (both simpleContent and complexContent)
            // attribute: id, name, ref, maxOccurs, minOccurs, ...any
            // children: annotation(0,1), all|choice|sequence(0,1)

            // Property erstellen
            prop = checkOccurAttribute(elm, basePropName);
            prop.art = "group"; // Die Property Art muss vom Typ "group" sein!

            // Property dem Eltern Element zuweisen
            // wenn Name dann neue Gruppe
            if (elmName) {
                // Gruppe Objekt anlegen und registrieren wenn diese einen Namen hat
                obj = XSD.setObject(elmName);

                // Property Eigenschaften anpassen
                prop.name = elmName;
                prop.type = obj.name || obj;

                // Referenz auf das Gruppe Objekt für Kind-Elemente
                newObjName = elmName;
                newPropName = "";
                checkChildren = true;
            } else if (elmRef) {
                // Wenn Referenz auf bestehende Gruppe

                // Property Eigenschaften anpassen
                prop.name = elmRef;
                prop.type = elmRef;

                // Referenz auf neuen Property Namen setzen für Kind-Elemente
                newPropName = elmRef;
            } else {
                prop.name = "group";
            }

            // Property hinzufügen
            if (typeof anyOfIndex != "undefined") {
                // Wenn in Auswahl (choice)
                XSD.addOneOfProperty(baseObjName, prop.name, anyOfIndex, prop);
            } else {
                XSD.addProperty(baseObjName, prop.name, prop);
            }

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
            if (type) {
                type.maxLength = parseInt(elmValue || "");
            }
            break;
        case "minLength":
            // Setzt die MinimalLänge eines Types
            if (type) {
                type.minLength = parseInt(elmValue || "");
            }
            break;
        case "maxExclusive":
            // Setzt ren Maximalwert eines Types
            if (type) {
                type.maxExclusive = parseInt(elmValue || "");
            }
            break;
        case "minExclusive":
            // Setzt ren Minimalwert eines Types
            if (type) {
                type.minExclusive = parseInt(elmValue || "");
            }
            break;
        case "maxInclusive":
            // Setzt ren Maximalwert eines Types
            if (type) {
                type.maxInclusive = parseInt(elmValue || "");
            }
            break;
        case "minInclusive":
            // Setzt ren Minimalwert eines Types
            if (type) {
                type.minInclusive = parseInt(elmValue || "");
            }
            break;
        case "notation":
            break;
        case "pattern":
            // Setzt ren Minimalwert eines Types
            if (type) {
                type.pattern = elmValue;
            }
            break;
        case "redefine":
            break;
        case "restriction":
            // Bestimmt Einschränkungen für einen einfachen Typ, einfachen Inhalt oder komplexen Inhalt
            // parent: simpleType, simpleContent, complexContent
            // attribute: id, base, ...any
            // children: ... ist je nach Parent unterschiedlich

            if (type) {
                type.base = elmBase;
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

            // Wenn Attribute "name" - darf nur vorhanden sein wenn "simpleType" ein Kind von "schema" ist
            if (elmName) {
                // wird Property von Schema
                newPropName = elmName;
                prop = new DataProperty(newPropName);
                prop.type = elmName;
                XSD.addProperty(baseObjName, newPropName, prop);

                // Typ registriren
                XSD.setType(elmName);
            } else {
                // ist Kind von Property
                newPropName = basePropName;
            }

            // Kind Elemente prüfen
            checkChildren = true;
            break;
        case "totalDigits":
            // Setzt die Anzahl Zeichen/Stellen
            if (type) {
                type.length = parseInt(elmValue || "");
            }
            break;
        case "union":
            break;
        case "unique":
            break;

        default:
            break;
    }


    // Wenn Kindelemente prüfen
    if (checkChildren) {
        // Alle Kindelemente von Schema durchgehen
        const children = [...elm.children];
        for (let i = 0; i < children.length; i++) {
            const elm = children[i];
            checkElement(elm, newObjName, newPropName, anyOfIndex);
        }
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
    if (!schema) { return; }

    // Schema Objekt anlegen
    const schemaObj = XSD.setObject("schema");
    schemaObj.type = "object";

    // Schema Attribute
    // const attributes = [...schema.attributes];
    // for (let i = 0; i < attributes.length; i++) {
    //     XSD.addAttribute("schema", attributes[i].name)
    // }

    // Alle Kindelemente von Schema durchgehen
    const schemaChild = [...schema.children];
    for (let i = 0; i < schemaChild.length; i++) {
        const elm = schemaChild[i];
        checkElement(elm, "schema", "", "");
    }
}
