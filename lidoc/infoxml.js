// =======================
//   XML Tools
// =======================
// @ts-check

import { Schema, getGSID } from "./infoschema.js";

// ============================
//   Typen
// --------------


// ============================
//   Parameter
// --------------

// neues Schema anlegen
export let XSD = new Schema("xsd");

// Parameter Speicher die zwichen Funktionen ausgetauscht werden können
/** @type {Object<string,any>} */
let localData = {};


// ============================
//   Funktionen
// --------------


/**
 * Prüft das XSD Element
 * @param {Element} elm - XML Element
 * @param {string} typeName - ObjektName
 * @param {string} [propID] - Objekt Eigenschaft Name
 */
function checkElement(elm, typeName, propID) {
    /** @type {string|undefined} */
    let newTypeName = typeName;
    /** @type {string|undefined} */
    let newPropID = propID;

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

    let prop_options = XSD.newProperty();

    // Minnimum, Maximumm, required
    let minString = elm.getAttribute("minOccurs") || "";
    let maxString = elm.getAttribute("maxOccurs") || "";
    let use = elm.getAttribute("use");

    // ================================
    //   Property Optionen
    // ---------------------
    if (!prop_options.gsid) { prop_options.gsid = getGSID(); }
    prop_options.object_name = typeName;

    if (maxString) {
        if (maxString == "unbounded") {
            prop_options.max = -1;
        } else {
            prop_options.max = parseInt(maxString);
        }
    }
    if (use == "required") {
        prop_options.min = 1;
    } else if (use == "prohibited") {
        prop_options.max = 0;
    } else if (minString) {
        prop_options.min = parseInt(minString);
    }

    if (elmDefault != undefined) {
        prop_options.default = elmDefault;
    }
    if (elmFixed != undefined) {
        prop_options.fix = elmFixed;
    }

    //if (typeof choice != "undefined") {
    //    options.use = choice;
    //}


    // =================================

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

            // todo: Prüfen von Namespace -> ##any - elements from any namespace is allowed (this is default) / ##other - elements from any namespace that is not the namespace of the parent element can be present / ##local - elements must come from no namespace / ##targetNamespace - elements from the namespace of the parent element can be present List of {URI references of namespaces, ##targetNamespace, ##local} - elements from a space-delimited list of the namespaces can be present
            prop_options.min = elmUse == "required" ? 1 : 0;
            prop_options.prop_type = "any";
            newPropID = XSD.addProperty(typeName, "any", prop_options) || "";
            XSD.addMoreProperties(typeName, newPropID);

            checkChildren = true;
            break;
        case "anyAttribute":
            // Bestimmt das das Eleternelement um zusätzliche Attribute erweitert werden darf
            // Attribute: id, namespace, processContents, ...any
            // children: annotation(0,1)

            prop_options.min = elmUse == "required" ? 1 : 0;
            prop_options.prop_type = "any";
            newPropID = XSD.addProperty(typeName, "any", prop_options) || "";
            XSD.addMoreAttributes(typeName, newPropID);

            checkChildren = true;
            break;
        case "appinfo":
            // Information zu der Anwendung
            // parent: annotation
            // attribute: -
            // children: -

            // todo: ReferenzTyp und ID bestimmen
            XSD.setInfo({ type_name: typeName, text: elm.innerHTML }); // todo: Sprache (de)??
            checkChildren = false;
            break;
        case "attribute":
            // definiert ein Attribute Typ
            // parent: attributeGroup, schema, complexType, restriction (both simpleContent and complexContent), extension (both simpleContent and complexContent)
            // attribute: default, fixed, form, id, name, ref, type, use, ...any (name und ref dürfen nicht gleichzeitig vorkommen)
            // children: annotation(0,1), simpleType(0,1)

            prop_options.min = elmUse == "required" ? 1 : 0;
            newPropID = XSD.addProperty(typeName, "@" + (elmName || elmRef || ""), prop_options);

            checkChildren = true;
            break;
        case "attributeGroup":
            // Definiert eine Gruppe von Attribute
            // parent: attributeGroup, complexType, schema, restriction (both simpleContent and complexContent), extension (both simpleContent and complexContent)
            // attribute: id, name, ref, ...any (name und ref dürfen nicht gleichzeitig vorkommen)
            // children: annotation(0,1), attribute|attributeGroup(0,-1), anyAttribute(0,1)

            // Wenn Name dann neue Gruppe(Type) Erstellen
            if (elmName) {
                // Typ anlegen
                newTypeName = XSD.setDataType({ name: "@" + elmName, art: "group" }) || "";

                // Als Property hinzufügen
                newPropID = XSD.addProperty(typeName, "@" + elmName, prop_options);

                // newPropID = undefined; // ????
            } else if (elmRef) {
                // Neues Attribute zur Liste setzen
                newPropID = XSD.addProperty(typeName, "@" + elmRef, prop_options);
            } else {
                // sollte nicht vorkommen
            }
            checkChildren = true;
            break;
        case "choice":
            // Bestimmt das nur eines der Kind-Elemente vorkommen darf (entweder/oder)
            // parent: group, choice, sequence, complexType, restriction (both simpleContent and complexContent), extension (both simpleContent and complexContent)
            // attribute: id, maxOccurs, minOccurs, ...any
            // children: annotation(0,1), element|group|choice|sequence|any(0,-1)
            // todo: Kind Elemente in DataTyp.oneOfProperties[] einfügen

            // ein neuen Typ erstellen
            newTypeName = XSD.setDataType({ art: "choice" });

            // Typ bei Property setzen
            if (propID) {
                XSD.setProperty({ gsid: propID, prop_type: newTypeName });
            }
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

            // neuen Typ anlegen
            newTypeName = XSD.setDataType({ name: elmName || getGSID(), art: "object" });

            // Wenn Property -> neuen Typ der Property zuweisen
            if (propID) {
                XSD.setProperty({ gsid: propID, prop_type: newTypeName });
            }
            newPropID = undefined;

            checkChildren = true;
            break;
        case "documentation":
            // Beschreibung
            // parent: annotation
            // attribute: source, xml:lang
            // children: -

            // todo: prüfen auf EnumItem oder RefItem, und xml:lang prüfen
            let text = elm.innerHTML;
            let lang = elm.getAttribute("xml:lang") || "de";
            localData.info = text; // für Referenz Objekte

            XSD.setInfo({ type_name: typeName, prop_gsid: propID, lang, text });
            checkChildren = false;
            break;
        case "element":
            // Definiert eine Property in einem Objekt
            // parent: schema, choice, all, sequence, group 
            // attribute: id, name|ref(to column), type, substitutionGroup, default, fixed, form, maxOccurs, minOccurs, nillable, abstract, block, final, ...any
            // children: annotation(0,1), simpleType|complexType(0,1), unique|key|keyref(0,-1)

            // todo: weitere Attribute prüfen

            // Typ bestimmern
            prop_options.prop_type = elmType || "string";

            newPropID = XSD.addProperty(typeName, elmName || elmRef || getGSID(), prop_options);
            checkChildren = true;
            break;
        case "enumeration":
            // Typ Einschränkung auf enum 
            if (elmValue != undefined) { // value muss vorhanden sein
                newPropID = elmValue; // für Dokumentation

                // Wenn es das erste Kindelement ist
                const prevElm = elm.previousElementSibling;
                if (!prevElm || prevElm.localName !== "enumeration") {
                    // neuen Enum Typ anlegen
                    newTypeName = XSD.setDataType({ art: "enum" });

                    // zu bestehender property den neuen Typ hinzufügen
                    if (propID) {
                        XSD.setProperty({ gsid: propID, prop_type: newTypeName });
                    }
                } // newTypename ist standardmäßig auf TypeName gesetzt

                // Enum Eintrag erstellen
                XSD.setEnumItem(newTypeName, elmValue);
            }
            checkChildren = true; // für Dokumentation
            break;
        case "extension":
            // Erweitert einen Simplen oder Komplexen Typ
            // parent: simpleContent, complexContent 
            // attribute: id, base, ...any
            // children: annotation(0,1),group|all|choice|sequence(0,1),attribute|attributeGroup(0,-1),anyAttribute(0,1)

            if (elmBase) { // base muss vorhanden sein
                XSD.setDataType({ name: typeName, base_name: elmBase });
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
                XSD.setSimpleType({ name: typeName, decimals: parseInt(elmValue) });
            }
            checkChildren = false;
            break;
        case "group":
            // Gruppe von Elementen die zu "complexType" hinzugefügt werden
            // parent: schema, choice, sequence, complexType, restriction (both simpleContent and complexContent), extension (both simpleContent and complexContent)
            // attribute: id, name, ref, maxOccurs, minOccurs, ...any
            // children: annotation(0,1), all|choice|sequence(0,1)

            // Wenn Name dann neue Gruppe(Type) Erstellen
            if (elmName) {
                newTypeName = XSD.setDataType({ name: elmName, art: "group" });
                newPropID = undefined;
            } else if (elmRef) {
                // Neues Property zur Liste setzen
                prop_options.prop_type = elmRef;
                newPropID = XSD.addProperty(typeName, elmRef, prop_options);
            } else {
                // sollte nicht vorkommen
                newTypeName = getGSID();
                newTypeName = XSD.setDataType({ name: getGSID(), art: "group" });
                newPropID = undefined;
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
                localData.refer = elm.getAttribute("refer");
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
                XSD.setSimpleType({ name: typeName, max_length: parseInt(elmValue) });
            }
            break;
        case "minLength":
            // Setzt die MinimalLänge eines Types
            if (elmValue) {
                XSD.setSimpleType({ name: typeName, min_length: parseInt(elmValue) });
            }
            break;
        case "maxExclusive":
            // Setzt den Maximalwert eines Types - kann auch String z.B.: "2027-07-07" Datum sein
            if (elmValue) {
                XSD.setSimpleType({ name: typeName, max_exclusive: elmValue });
            }
            break;
        case "minExclusive":
            // Setzt den Minimalwert eines Types - kann auch String z.B.: "2027-07-07" Datum sein
            if (elmValue) {
                XSD.setSimpleType({ name: typeName, min_exclusive: elmValue });
            }
            break;
        case "maxInclusive":
            // Setzt den Maximalwert eines Types - kann auch String z.B.: "2027-07-07" Datum sein
            if (elmValue) {
                XSD.setSimpleType({ name: typeName, max_inclusive: elmValue });
            }
            break;
        case "minInclusive":
            // Setzt den Minimalwert eines Types - kann auch String z.B.: "2027-07-07" Datum sein
            if (elmValue) {
                XSD.setSimpleType({ name: typeName, min_inclusive: elmValue });
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
                XSD.setSimpleType({ name: typeName, pattern: elmValue });
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
                XSD.setDataType({ name: typeName, base_name: elmBase });
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
                newTypeName = XSD.setDataType({ name: elmName });
                // Ist Kind vom Schema - Name ist erforderlich
                if (typeName == "schema") {
                    XSD.addProperty(typeName, elmName, { prop_type: newTypeName });
                }
                newPropID = undefined;
            } else if (elm.parentElement?.localName == "union") {
                // neuen Typ anlegen
                newTypeName = XSD.setDataType({ name: getGSID() });

                // mit aktuellen Type verlinken
                XSD.linkSimpleType(typeName, newTypeName);
            } else {
                // neuen Simplen Typ anlegen
                newTypeName = XSD.setSimpleType({ name: getGSID() });

                // neuen Typ der Property zuweisen
                if (propID) {
                    // PropertyTyp setzen
                    XSD.setProperty({ gsid: propID, object_name: typeName, prop_type: newTypeName });
                }
                newPropID = undefined; // einstellungen auf neuen Simplen Typ
            }

            // Kind Elemente prüfen
            checkChildren = true;
            break;
        case "totalDigits":
            // Setzt die Anzahl Zeichen/Stellen
            if (elmValue) {
                XSD.setSimpleType({ name: typeName, length: parseInt(elmValue) });
            }
            break;
        case "union":
            // Das Union-Element definiert einen einfachen Typ als eine Sammlung (Union) von Werten aus vorgegebenen einfachen Datentypen.
            // entweder "memberTypes"-attribute: ist eine mit Leerzeichen getrennte Liste von Registrirten simplen TypeNamen
            // und/oder "simpleType"-Kindelemente 
            // parent: simpleType
            // attribute: id(0,1), memberTypes(0,1), ...any(0,-1) 
            // children: annotation(0,1), simpleType(0,-1)

            // Legt einen neuen Typ an
            //newTypeName = getGSID();
            let memberTypes = elm.getAttribute("memberTypes");
            if (memberTypes) {
                XSD.linkSimpleType(typeName, memberTypes.split(" "));
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

            // Konstanten innerhalb der Schleife sichern den Zustand für DIESES spezifische Kind.
            // Selbst wenn ein Kind danach Variablen ändert, bleibt der Wert für das nächste Kind stabil.
            const currentChildType = newTypeName;
            const currentChildProp = newPropID;

            checkElement(elm, currentChildType, currentChildProp);
        }

        // Nach dem Prüfen von Kindelementen
        switch (afterCheckChildren) {
            case "unique":
            case "key": // Beide verhalten sich bei der Pfad-Zusammenstellung identisch
                if (elmName && localData.objPath && localData.field) {
                    // Sichert ab, dass es immer ein Array ist (falls nur ein Feld existiert)
                    const fields = Array.isArray(localData.field) ? localData.field : [localData.field];

                    // Mappt alle Felder elegant zu: "pfad.feldname"
                    const fieldList = fields.map(f => localData.objPath + "." + f);

                    XSD.setUnique({ name: elmName, object_name: typeName, object_props: fieldList });
                }
                break;

            case "keyref":
                if (elmName && localData.objPath && localData.field && localData.refer) {
                    const fields = Array.isArray(localData.field) ? localData.field : [localData.field];
                    const fieldList = fields.map(f => localData.objPath + "." + f);

                    XSD.setRef({ name: elmName, object_name: typeName, ref_name: localData.refer, ref_props: fieldList });
                }
                break;

            default:
                break;
        }

        localData.field = undefined;
        localData.objPath = undefined;
        localData.refer = undefined;
    }
}



/**
 * Liest eine XSD Datei in Typen
 * @param {string} xsdString - eine XSD Datei als String
 */
export function parseXSD(xsdString) {
    // Scheman neu anlegen
    XSD = new Schema("schema");

    // XML Parser erstellen
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xsdString, "text/xml");

    // test:
    console.log("xmlDoc: ", xmlDoc);

    // Schema Element lesen
    const schema = xmlDoc.querySelector("schema");
    if (!schema) { return; }

    // Schema Typ
    XSD.setDataType({ name: "schema", art: "object" });

    // Schema Attribute
    const attributes = [...schema.attributes];
    for (let i = 0; i < attributes.length; i++) {
        XSD.addProperty("schema", "@" + attributes[i].name, { fix: attributes[i].value });
    }

    // Alle Kindelemente von Schema durchgehen
    const schemaChild = [...schema.children];
    for (let i = 0; i < schemaChild.length; i++) {
        const elm = schemaChild[i];
        checkElement(elm, "schema");
    }
}
