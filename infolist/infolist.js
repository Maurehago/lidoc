// Infoliste

// Global Short Identifier
export function GSID () {
    return new Date().getTime().toString(36) + crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}

export class InfoList {
    // Construktion
    constructor(name) {
        this.Name = "";         // Name der Liste
        this.Prop = new Map();  // Zusätzliche Eigenschaften der Liste
        this.Fields = [];       // FeldNamen von Data
        this.Types = [];        // FeldTypen von Data
        this.Data = new Map();   // Daten der Liste

        if (name) {
            this.Name = name;
        }
    }

    // Diese Funktion liefert ein Array/Slice für einen Datensatz zurück
    // die Feldnamen und die Reihenfolge der Daten bestimmt die "Fields" Eigenschaft von der InfoList
    Get(id) {
        return this.Data.get(id);
    }

    // Setzt einen Datensatz(data) mit der id in der Liste
    // Wenn vorhanden wird der Datensatz komplett überschrieben.
    Set(id, data) {
        // todo: Prüfen auf Array und die richtigen Datentypen
        this.Data.set(id, data);
    }

    // Liefert auf Grund des angegebenen Feldnamen(field)
    // die Position/Index der Spalte in der InfoList zurück
    GetIndex(field) {
        return this.Fields.indexOf(field);
    }

    // Liefert eine Liste an Positionen/Indexes der angegebenen Spaltennamen(fields) zurück.
    GetIndexes(fields) {
        if (!Array.isArray(fields)) {
            return [];
        }

        let indexes = [];
        let fieldList = this.Fields;

        fieldList.forEach((v,i) => {
            indexes[i] = fieldList.indexOf(v);
        })

        return indexes;
    }

    // Liest den Wert einer Spalte(field) vom angegebenen Datensatz(id) aus.
    GetValue(id, field) {
        let index = this.Fields.indexOf(field);
        if (index >= 0) {
            return this.Data.get(id)[index];
        } else {
            return null;
        }
    }

    // Gibt ein Array/Slice an Werten für die Spalten(fields) eines Datensatzes(id) zurück.
    GetValues(id, fields) {
        let data = [];
        let fieldNames = this.Fields;
        let dataList = this.Data.get(id);

        // Alle Felder durchgehen
        fields.forEach((name, i) => {
            // index der Spalte
            let index = fieldNames.indexOf(name);

            // Testen
            // console.log("name, index: ", name, index);

            if (index >= 0) {
                data[i] = dataList[index];
            } else {
                data[i] = null;
            }
        })
        return data;
    }

    // Setzt den Wert(value) einer Spalte(field) im Datensatz(id)
    SetValue(id, field, value) {
        let index = this.Fields.indexOf(field);

        if (index >= 0) {
            let fieldType = this.Types[index];
            let dataList = this.Data.get(id);
            if (!dataList) {
                dataList = [];
                this.set(id, dataList);
            }

            // Wert setzen
            switch (fieldType) {
            case "int", "num", "bool":
                dataList[index] = value;
                break;

            default:
                dataList[index] = "" + value;
            }
        }
    }
} // Class InfoList

// Map von Infolisten
export class ILists extends Map {
    constructor() {
        super();
    }

    // liefert einen JSON-String von der InfoList Auflistung zurück.
    // Für Datenübertragung und zum Speichern in eine Datei.
    Marshal() {
        // in JSON String umwandeln
        let obj = {};

        // Alle Listen durchgehen
        this.forEach((value, key) => {
            // Value ist InfoList
            if (value instanceof InfoList) {
                let il = {};
                il.Name = value.Name;         // Name der Liste
                il.Prop = Object.fromEntries(value.Prop);  // Zusätzliche Eigenschaften der Liste
                il.Fields = value.Fields;       // FeldNamen von Data
                il.Types = value.Types;        // FeldTypen von Data
                il.Data = Object.fromEntries(value.Data);   // Daten der Liste
                obj[key] = il;
            }
        }) // forEach Infolist

        return JSON.stringify(obj);
    } // Marshal

    // Liest einen JsonBlob([]byte) in die InfoList Auflistung ein
    Unmarshal(listString, removeAll) {
        // todo: data(JSONstring) in Objekte umwandeln
        if (typeof listString != "string") {
            return;
        }

        if (removeAll) {
            this.clear()
        }

        // String in Javascript Objekt
        const obj = JSON.parse(listString);

        // Alle Listen durchgehen
        Object.entries(obj).forEach(([key, value]) => {
            // Infoliste 
            let il = new InfoList(key);
            Object.assign(il, value);

            // nur infolist Prop und Data
            //let myObject = new Map(Object.entries(raw_data));
            il.Prop = new Map(Object.entries(il.Prop));
            il.Data = new Map(Object.entries(il.Data));

            this.set(key, il);
        });

        return "";
    } // unmarshal
} // class IList

