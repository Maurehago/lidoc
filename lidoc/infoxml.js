// =======================
//   XML Tools
// =======================
// @ts-check

import { Children } from "react";
import { Schema, DataType } from "./infoschema.js";

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

// Parameter Speicher die zwichen Funktionen ausgetauscht werden können
/** @type {Object<string,any>} */
let localData = {};



// ============================
//   Funktionen
// --------------


/**
 * Prüft das XSD Element
 * @param {Element} elm - XML Element
 * @param {string} baseTypeName - TabellenName
 * param {string} [baseTypeName] - Index bei Auswahl(choice)
 */
function checkElement(elm, baseTypeName) {
    let newTypeName = baseTypeName;

    /** @type {Object<string,any>} */
    let options = {};

    // Wenn Kindelment geprüft werden sollen
    let checkChildren = false;
    let afterCheckChildren = ""; // wenn gesetzt wird die nach dem Prüfen der Kindelemente diese Option ausgeführt


    // Name, Rferenz und Typ Lesen
    const elmName = elm.getAttribute("name") || undefined;
    const elmRef = elm.getAttribute("ref") || undefined;
    const elmType = elm.getAttribute("type") || undefined;
    const elmBase = elm.getAttribute("base") || undefined;
    const elmValue = elm.getAttribute("value") || undefined;
    const elmDefault = elm.getAttribute("default") || undefined;
    const elmFixed = elm.getAttribute("fixed") || undefined;
    const elmUse = elm.getAttribute("use") || undefined;


    // Minnimum, Maximumm, required
    let minString = elm.getAttribute("minOccurs") || "";
    let maxString = elm.getAttribute("maxOccurs") || "";
    let use = elm.getAttribute("use");
    let min = 1;
    let max = 1;
    if (typeof maxString == "string") {
        if (maxString = "unbounded") {
            max = -1;
        } else {
            max = parseInt(maxString);
        }
    }
    if (use == "required") {
        min = 1;
    } else if (use == "prohibited") {
        max = 0;
    } else if (typeof minString == "string") {
        min = parseInt(minString);
    }

    // Je nach TagName anders behandeln
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

            newTypeName = XSD.addAnyCol(baseTypeName, min, max).name;
            checkChildren = true;
            break;
        case "anyAttribute":
            // Bestimmt das das Eleternelement um zusätzliche Attribute erweitert werden darf
            // Attribute: id, namespace, processContents, ...any
            // children: annotation(0,1)

            newTypeName = XSD.addAnyAttribute(baseTypeName, min, max).name;
            //newColName = "anyattr";
            checkChildren = true;
            break;
        case "appinfo":
            // Information zu der Anwendung
            // parent: annotation
            // attribute: -
            // children: -

            XSD.addTypeAppinfo(baseTypeName, elm.innerHTML);
            checkChildren = false;
            break;
        case "attribute":
            // definiert ein Attribute Typ
            // parent: attributeGroup, schema, complexType, restriction (both simpleContent and complexContent), extension (both simpleContent and complexContent)
            // attribute: default, fixed, form, id, name, ref, type, use, ...any (name und ref dürfen nicht gleichzeitig vorkommen)
            // children: annotation(0,1), simpleType(0,1)

            options = {
                min: elmUse == "required" ? 1 : 0
                , max
                , default: elmDefault
                , fixed: elmFixed
                , type: elmType || "string"
            }

            if (elmName) {
                newTypeName = XSD.addAttribute(baseTypeName, elmName, options).name;
            } else if (elmRef) {
                options.base = elmRef;
                newTypeName = XSD.addAttribute(baseTypeName, elmRef, options).name;
            }

            // newColName = "";
            checkChildren = true;
            break;
        case "attributeGroup":
            // Definiert eine Gruppe von Attribute
            // parent: attributeGroup, complexType, schema, restriction (both simpleContent and complexContent), extension (both simpleContent and complexContent)
            // attribute: id, name, ref, ...any (name und ref dürfen nicht gleichzeitig vorkommen)
            // children: annotation(0,1), attribute|attributeGroup(0,-1), anyAttribute(0,1)

            // Wenn Name dann neue Gruppe(Liste) Erstellen
            if (elmName) {
                newTypeName = XSD.addList(elmName).name;
                // newColName = "";
            } else if (elmRef) {
                // Neues Attribute zur Liste setzen
                newTypeName = XSD.addAttribute(baseTypeName, elmRef, {base: elmRef}).name;
            }
            checkChildren = true;
            break;
        case "coice":
            // Bestimmt das nur eines der Kind-Elemente vorkommen darf (entweder/oder)
            // parent: group, choice, sequence, complexType, restriction (both simpleContent and complexContent), extension (both simpleContent and complexContent)
            // attribute: id, maxOccurs, minOccurs, ...any
            // children: annotation(0,1), element|group|choice|sequence|any(0,-1)
            // todo: Kind Elemente in DataTyp.oneOfProperties[] einfügen

            // neue AuswahlGruppe anlegen
            newTypeName = XSD.addCol(baseTypeName, "choice", { min, max }).name;
            // newColName = "";
            checkChildren = true;
            break;
        case "complexContent":
            // Bestimmt Erweiterung oder Einschränkung für einen Komplexen Typ
            // parent: complexType
            // attribute: id, mixed, ...any
            // children: annotation(0,1), restriction|extension(1,1)

            checkChildren = true;
            break;
        case "complexType":
            // Definiert einen Kompexen Typ(object)
            // parent: element, redefine, schema
            // attribute: id, name, abstract, mixed, block, final, ...any
            // children: annotation(0,1), simpleContent|complexContent|group|all|choice|sequence(0,1), attribute|attributeGroup(0,-1), anyAttribute(0,1)

            // Wenn Name -> Neue Liste
            if (elmName) {
                newTypeName = XSD.addList(elmName).name;
                if (baseTypeName && baseTypeName != "schema") {
                    // Referenziert auf den Komplexen Typ
                    XSD.setType(baseTypeName, {type: newTypeName});
                }
            }
            // else - wird selbst zum Komplexen Typ sobald Attribute oder Cols hinzugefügt werden

            checkChildren = true;
            break;
        case "documentation":
            // Beschreibung
            // parent: annotation
            // attribute: source, xml:lang
            // children: -

            // todo: xml:lang prüfen
            localData.info = elm.innerHTML; // für Referenz Objekte
            XSD.addTypeInfo(baseTypeName, elm.innerHTML);
            checkChildren = false;
            break;
        case "element":
            // Definiert ein Spalte in einer Liste(komplex Type)
            // parent: schema, choice, all, sequence, group 
            // attribute: id, name|ref(to column), type, substitutionGroup, default, fixed, form, maxOccurs, minOccurs, nillable, abstract, block, final, ...any
            // children: annotation(0,1), simpleType|complexType(0,1), unique|key|keyref(0,-1)

            // todo: weitere Attribute prüfen

            // optionen festlegen
            options = {
                min
                , max
                , default: elmDefault
                , fixed: elmFixed
                , type: elmType || "string"
            };

            // Neue Spalte registrieren - es muss name oder ref vorhanden sein
            if (elmName) {
                newTypeName = XSD.addCol(baseTypeName, elmName, options).name;
            } else if (elmRef) {
                options.base = elmRef;
                newTypeName = XSD.addCol(baseTypeName, elmRef, options).name;
            }
            
            checkChildren = true;
            break;
        case "enumeration":
            // Typ Einschränkung auf enum 
            if (typeof elmValue != "undefined") { // value muss vorhanden sein
                XSD.addEnum(baseTypeName, elmValue);
            }
            checkChildren = false;
            break;
        case "extension":
            // Erweitert einen Simplen oder Komplexen Typ
            // parent: simpleContent, complexContent 
            // attribute: id, base, ...any
            // children: annotation(0,1),group|all|choice|sequence(0,1),attribute|attributeGroup(0,-1),anyAttribute(0,1)

            if (elmBase) { // base muss vorhanden sein
                XSD.setType(baseTypeName, {base: elmBase});
            }
            checkChildren = true;
            break;
        case "field":
            // Das Feldelement gibt einen XPath-Ausdruck an, der den Wert angibt, der zur Definition einer Identitätsbeschränkung verwendet wird
            if (Array.isArray(localData.field)) {
                localData.field.push(elm.getAttribute("xpath"));
            } else {
                localData.field = [elm.getAttribute("xpath")];
            }
            break;
        case "fractionDigits":
            if (elmValue) { // muss vorhanden sein
                XSD.setType(baseTypeName, {decimals: parseInt(elmValue)});
            }
            checkChildren = false;
            break;
        case "group":
            // Gruppe von Elementen die zu "complexType" hinzugefügt werden
            // parent: schema, choice, sequence, complexType, restriction (both simpleContent and complexContent), extension (both simpleContent and complexContent)
            // attribute: id, name, ref, maxOccurs, minOccurs, ...any
            // children: annotation(0,1), all|choice|sequence(0,1)

            if (elmName) {
                // neue Gruppe anlegen
                newTypeName = XSD.addType(elmName, {min, max}).name;
            } else if (elmRef) {
                // Basis setzen
                XSD.setType(baseTypeName, {base: elmRef});
            }
            checkChildren = true;
            break;
        case "import":
            // Fügt weitere Schema Namespaces hinzu
            // parent: schema
            // attribute: id(0,1), namespace(0,1), schemaLocation(0,1), ...any
            // children: annotation(0,1)
            // todo: zusätzliche Schema Namenspaces
            break;
        case "include":
            // Das include-Element wird verwendet, um mehrere Schemas mit demselben Zielnamensraum zu einem Dokument hinzuzufügen.
            // parent: schema
            // attribute: id(0,1), schemaLocation(1,1), ...any(0,-1)
            // children: annotation(0,1)
            // todo: noch nicht unterstützt
            break;
        case "key":
            // Das Schlüsselelement gibt ein Attribut oder einen Elementwert als Schlüssel (eindeutig, nicht nullierbar und immer vorhanden) innerhalb des enthaltenden Elements in einem Instanzdokument an.
            // parent: element
            // attribute: id(0,1), name(1,1), ...any(0,-1) 
            // children: annotation(0,1),selector(1,1),field(1,-1)
            if (elmName) {
                afterCheckChildren = "key";
            }
            checkChildren = true;
            break;
        case "keyref":
            // Das keyref-Element gibt an, dass ein Attribut oder ein Elementwert denen des angegebenen Schlüssels oder eindeutigen Elements entspricht.
            // parent: element
            // attribute: id(0,1), name(1,1), refer(1,1), ...any(0,-1)
            // children: annotation(0,1), selector(1,-1), field(1,-1)
            if (elmName) {
                afterCheckChildren = "keyref";
            }
            checkChildren = true;
            break;
        case "list":
            // Das Listenelement definiert ein einfaches Typelement als eine Liste von Werten eines bestimmten Datentyps
            // parent: simpleType
            // attribute: id(0,1), itemType(0,1 nur wenn kein Kind-Element "simpleType"), ...any(0,-1)
            // children: annotation(0,1), simpleType(0,1)
            // todo: noch nicht unterstützt
            break;
        case "maxLength":
            // Setzt die MaximalLänge eines Types
            if (elmValue) {
                XSD.setType(baseTypeName, {maxLength: parseInt(elmValue)});
            }
            break;
        case "minLength":
            // Setzt die MinimalLänge eines Types
            if (elmValue) {
                XSD.setType(baseTypeName, {minLength: parseInt(elmValue)});
            }
            break;
        case "maxExclusive":
            // Setzt den Maximalwert eines Types
            if (elmValue) {
                XSD.setType(baseTypeName, {maxExclusive: parseInt(elmValue)});
            }
            break;
        case "minExclusive":
            // Setzt den Minimalwert eines Types
            if (elmValue) {
                XSD.setType(baseTypeName, {minExclusive: parseInt(elmValue)});
            }
            break;
        case "maxInclusive":
            // Setzt den Maximalwert eines Types
            if (elmValue) {
                XSD.setType(baseTypeName, {maxInclusive: parseInt(elmValue)});
            }
            break;
        case "minInclusive":
            // Setzt den Minimalwert eines Types
            if (elmValue) {
                XSD.setType(baseTypeName, {minInclusive: parseInt(elmValue)});
            }
            break;
        case "notation":
            // Das Notationselement beschreibt das Format von Nicht-XML-Daten innerhalb eines XML-Dokuments.
            // parent: schema
            // attribute: id(0,1), name(1,1), public(1,1), system(0,1), ...any(0,-1)
            // children: annotation(0,1)
            // todo: noch nicht unterstützt
            break;
        case "pattern":
            // Setzt eine Regular Expression für den Typ
            if (elmValue) {
                XSD.setType(baseTypeName, {pattern: elmValue});
            }
            break;
        case "redefine":
            // Das Redefine-Element definiert einfache und komplexe Typen, Gruppen und Attributgruppen aus einem externen Schema neu.
            // parent: schema
            // attribute: id(0,1), schemaLocation(1,1), ...any(0,-1)
            // children: annotation(0,1), simpleType|complexType|group|attributeGroup(0,-1)
            // todo: noch nicht unterstützt
            break;
        case "restriction":
            // Bestimmt Einschränkungen für einen einfachen Typ, einfachen Inhalt oder komplexen Inhalt
            // parent: simpleType, simpleContent, complexContent
            // attribute: id(0,1), base(1,1), ...any(0,-1)
            // children: ... ist je nach Parent unterschiedlich
            if (elmBase) {
                XSD.setType(baseTypeName, {base: elmBase});
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
            // Das Auswahlelement gibt einen XPath-Ausdruck an, der eine Reihe von Elementen für eine Identitätsbeschränkung (Eindeutige, Schlüssel- und Schlüsselelemente) auswählt.
            // parent: key, keyref, unique
            // attribute: id(0,1), xpath(1,1), ...any(0,-1)
            // children: annotation(0,1)
            localData.objPath = elm.getAttribute("xpath");
            break;
        case "sequence":
            // Das Sequenzelement gibt an, dass die untergeordneten Elemente in einer Sequenz erscheinen müssen. Jedes untergeordnete Element kann von 0 bis zu einer beliebigen Anzahl auftreten.
            // parent: group, choice, sequence, complexType, restriction (both simpleContent and complexContent), extension (both simpleContent and complexContent)
            // children: annotation(0,1),element|group|choice|sequence|any(0,-1)
            // todo: min, max für Kindelemente - können mehrere/beliebig viele der Kindelemente enthalten, ändert den default von (1,1) für neue Elemente
            checkChildren = true;
            break;
        case "simpleContent":
            // Enthält Erweiterung oder Einschränkungen für einen simplen Typ(property) und enthält keine Elemente
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
                // Ist Kind vom Schema - Name ist erforderlich
                // Typ Registrieren
                newTypeName = XSD.addType(elmName).name;
                // kein "min", "max"
            } else {
                // ist Kind von Spalte oder "union" - Name darf nicht angegeben werden
                // ändert baseType
                
                // wenn Elternelement "union" muss SimpleType registriert werden
                if(elm.parentElement?.localName == "union") {
                    newTypeName = XSD.addType().name;
                    // TypName hinzufügen
                    XSD.addTypeName(baseTypeName, newTypeName);
                }
            }

            // Kind Elemente prüfen
            checkChildren = true;
            break;
        case "totalDigits":
            // Setzt die Anzahl Zeichen/Stellen
            if (elmValue) {
                XSD.setType(baseTypeName, {length: parseInt(elmValue)});
            }
            break;
        case "union":
            // Das Union-Element definiert einen einfachen Typ als eine Sammlung (Union) von Werten aus vorgegebenen einfachen Datentypen.
            // entweder "memberTypes"-attribute: ist eine mit Leerzeichen getrennte Liste von Registrirten simplen TypeNamen
            // und/oder "simpleType"-Kindelemente 
            // parent: simpleType
            // attribute: id(0,1), memberTypes(0,1), ...any(0,-1) 
            // children: annotation(0,1), simpleType(0,-1)
            let memberTypes = elm.getAttribute("memberTypes");
            if (memberTypes) {
                XSD.addTypeName(baseTypeName, memberTypes.split(" "), true);
            } else {
                XSD.addTypeName(baseTypeName, [], true);
            }
            checkChildren = true;
            break;
        case "unique":
            // Das unique Element definiert, dass ein Element oder ein Attributwert innerhalb des Geltungsbereichs eindeutig sein muss
            // parent: element
            // attribute: id(0,1), name(1,1), ...any(0,-1)
            // children: annotation(0,1), selector(1,1), field(1,1)
            if (elmName) {
                afterCheckChildren = "unique";
            }
            checkChildren = true;
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
            checkElement(elm, newTypeName);
        }

        // Nach dem Prüfen von Kindelementen
        switch (afterCheckChildren) {
            case "unique":
                if (elmName && localData.objPath && localData.field) {
                    XSD.addUnique(baseTypeName, elmName, localData.objPath, localData.field, localData.info);
                }
                break;
            case "key":
                if (elmName && localData.objPath && localData.field) {
                    XSD.addId(baseTypeName, elmName, localData.objPath, localData.field);
                }
                break;
            case "keyref":
                if (elmName && localData.objPath && localData.field && localData.refer) {
                    XSD.addRefId(baseTypeName, elmName, localData.objPath, localData.field, localData.refer, localData.info);
                }
                break;
        
            default:
                break;
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

    // Schema Attribute
    const attributes = [...schema.attributes];
    for (let i = 0; i < attributes.length; i++) {
        XSD.attributes.set(attributes[i].name, attributes[i].value);
    }

    // Alle Kindelemente von Schema durchgehen
    const schemaChild = [...schema.children];
    for (let i = 0; i < schemaChild.length; i++) {
        const elm = schemaChild[i];
        checkElement(elm, "schema");
    }
}
