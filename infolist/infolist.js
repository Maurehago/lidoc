// Infoliste

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
        return this.Data[id];
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

        fieldList.forEach((i,v) => {
            indexes[i] = fieldList.indexOf(v);
        })

        return indexes;
    }

    // Liest den Wert einer Spalte(field) vom angegebenen Datensatz(id) aus.
    GetValue(id, field) {
        let index = this.Fields.indexOf(field);
        if (index >= 0) {
            return this.Data[id][index];
        } else {
            return null;
        }
    }

    // Gibt ein Array/Slice an Werten für die Spalten(fields) eines Datensatzes(id) zurück.
    GetValues(id, fields) {
        let data = [];
        let fieldNames = this.Fields;
        let dataList = this.Data[id];

        // Alle Felder durchgehen
        fields.forEach((i, name) => {
            // index der Spalte
            let index = fieldNames.indexOf(name);

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

            // Wert setzen
            switch (fieldType) {
            case "int", "num", "bool":
                this.Data[id][index] = value;
                break;

            default:
                this.Data[id][index] = "" + value;
            }
        }
    }
} // Class InfoList

// Map von Infolisten
export class ILists extends Map {
    constructor() {
        super();
    }

    // liefert einen JsonBlob([]byte) von der InfoList Auflistung zurück.
    // Für Datenübertragung und zum Speichern in eine Datei.
    Marshal() {
        // todo in JSON Strin umwandeln

        return "";
    } // Marshal

    // Liest einen JsonBlob([]byte) in die InfoList Auflistung ein
    Unmarshal(data) {
        // todo: data(JSONstring) in Objekte umwandeln
        
        // nur infolist Prop und Data
        let myObject = new Map(Object.entries(raw_data));
        return "";
    } // unmarshal
} // class IList

