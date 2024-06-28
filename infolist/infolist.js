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
    get(id) {
        return this.Data.get(id);
    }

    // Setzt einen Datensatz(data) mit der id in der Liste
    // Wenn vorhanden wird der Datensatz komplett überschrieben.
    set(id, data) {
        // todo: Prüfen auf Array und die richtigen Datentypen
        this.Data.set(id, data);
    }

    // Liefert auf Grund des angegebenen Feldnamen(field)
    // die Position/Index der Spalte in der InfoList zurück
    getIndex(field) {
        return this.Fields.indexOf(field);
    }

    // Liefert eine Liste an Positionen/Indexes der angegebenen Spaltennamen(fields) zurück.
    getIndexes(fields) {
        if (!Array.isArray(fields)) {
            return [];
        }

        let indexes = [];
        let fieldList = this.Fields;

        fieldList.forEach((v,i) => {
            if (v.indexOf(" ") >= 0) {
                v = v.split(" ")[0];
            } 
            indexes[i] = fieldList.indexOf(v);
        })

        return indexes;
    }

    // Liest den Wert einer Spalte(field) vom angegebenen Datensatz(id) aus.
    getValue(id, field) {
        let index = this.Fields.indexOf(field);
        if (index >= 0) {
            return this.Data.get(id)[index];
        } else {
            return null;
        }
    }

    // Gibt ein Array/Slice an Werten für die Spalten(fields) eines Datensatzes(id) zurück.
    getValues(id, fields) {
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
    setValue(id, field, value) {
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
    } // setValue

    // Sortierten Index 
    getSortIndex(fields) {
        // Alle Keys von der map
        let dataIndex = Array.from(Map.keys());
        let fieldIndex = this.getIndexes(fields);
        
        // Sortieren
        dataIndex.sort((a,b) =>{
            let valueA = "";
            let valueB = "";

            let dataA = this.Data.get(a);
            let dataB = this.Data.get(b);

            let sort = 0;

            // Prüfen
            fieldIndex.some((d, i) =>{
                let fieldName = fields[i];

                // Wenn Absteigend
                if (fieldName.endsWith(" DESC")) {
                    if (dataA[d] > dataB[d]) {
                        sort = 1;
                        return true;
                    } else if (dataA[d] < dataB[d]) {
                        sort = -1;
                        return true;
                    }
                } else {
                    // Aufsteigend
                    if (dataA[d] > dataB[d]) {
                        sort = -1;
                        return true;
                    } else if (dataA[d] < dataB[d]) {
                        sort = 1;
                        return true;
                    }
                }
                return false;
            }) // Prüfen

            // Sortierung zurückgeben
            return sort;
        })

        return dataIndex;
    } // getSortIndex

    // Tabelleen Daten lesen
    getTableDataHTML(fields, index) {
        let fieldList = this.Fields;
        let fieldIndex = [];
        let tableDataString = ""

        // Feldindexes lesen
        fields.forEach((name, i) => {
            fieldIndex[i] = fieldList.indexOf(name);
        })

        // Daten in String
        function dataToString(data, id) {
            let dataString = "";

            // Datenzeile
            dataString = '<tr id="' + id + '">';

            // Feldindex durchgehen
            fieldIndex.forEach((index) => {
                dataString += '<td>' + data[index] + '</td>';
            })

            // Ende Datenzeile
            dataString += "</tr>";

            return dataString;
        } // dataToString

        // wenn Index
        if (index) {
            // Alle Daten nach Index durchgehen
            index.forEach((value) => {
                let data = this.Data.get(value);
                tableDataString += dataToString(data, value);
            })
        } else {
            // Alle Einträge in der map
            this.Data.forEach((data, key) => {
                tableDataString += dataToString(data, key);
            })
        }

        return tableDataString;
    } // getTableDataHTML

    // Infoliste in einen String umwandeln
    stringify() {
        // in JSON String umwandeln
        let il = {};
        il.Name = this.Name;         // Name der Liste
        il.Prop = Object.fromEntries(this.Prop);  // Zusätzliche Eigenschaften der Liste
        il.Fields = this.Fields;       // FeldNamen von Data
        il.Types = this.Types;        // FeldTypen von Data
        il.Data = Object.fromEntries(this.Data);   // Daten der Liste

        return JSON.stringify(il);
    } // stringify

    // Liest einen JSON-String in die InfoList ein
    parse(listString) {
        if (typeof listString != "string") {
            return;
        }

        // String in Javascript Objekt
        const obj = JSON.parse(listString);

        // Infoliste 
        Object.assign(this, obj);

        // nur infolist Prop und Data
        //let myObject = new Map(Object.entries(raw_data));
        this.Prop = new Map(Object.entries(this.Prop));
        this.Data = new Map(Object.entries(this.Data));

        return "";
    } // parse
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

