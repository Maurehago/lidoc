// Infoliste

// Global Short Identifier
export function GSID () {
    return new Date().getTime().toString(36) + crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}

export class InfoList {
    // Construktion
    constructor(name) {
        this.Name = "";         // Name der Liste
        this.Path = "";         // Pfad / Gruppe
        this.Prop = new Map();  // Zusätzliche Eigenschaften der Liste
        this.Fields = [];       // FeldNamen von Data
        this.Types = [];        // FeldTypen von Data
        this.Data = new Map();  // Daten der Liste
        this.List = [];         // Wenn Auflistung statt Daten. z.B.: bei ENums

        if (name) {
            this.Name = name;
        }
    }

    // Diese Funktion liefert ein Array/Slice für einen Datensatz zurück
    // die Feldnamen und die Reihenfolge der Daten bestimmt die "Fields" Eigenschaft von der InfoList
    get(id) {
        return this.Data.get(id);
    }

    // Diese Funktion liefert den Datensatz als Objekt zurück
    getAsObject(id) {
        const obj = {};
        const fields = this.Fields;
        const data = this.Data.get(id);

        // Alle Felder durchgehen
        fields.forEach((name, index) => {
            obj[name] = data[index];
        })

        // Objekt zurückgeben
        return obj;
    } // getAsObject


    // Setzt einen Datensatz(data) mit der id in der Liste
    // Wenn vorhanden wird der Datensatz komplett überschrieben.
    set(id, data) {
        // todo: Prüfen auf Array und die richtigen Datentypen
        this.Data.set(id, data);
    }

    // Liefert auf Grund des angegebenen Feldnamen(field)
    // die Position/Index der Spalte in der InfoList zurück
    getFieldIndex(field) {
        return this.Fields.indexOf(field);
    }

    // Liefert eine Liste an Positionen/Indexes der angegebenen Spaltennamen(fields) zurück.
    getFieldIndexes(fields) {
        if (!Array.isArray(fields)) {
            return [];
        }

        const indexes = [];
        const fieldList = this.Fields;

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
        const index = this.Fields.indexOf(field);
        if (index >= 0) {
            return this.Data.get(id)[index];
        } else {
            return null;
        }
    }

    // Gibt ein Array/Slice an Werten für die Spalten(fields) eines Datensatzes(id) zurück.
    getValues(id, fields) {
        const data = [];
        const fieldNames = this.Fields;
        const dataList = this.Data.get(id);

        // Alle Felder durchgehen
        fields.forEach((name, i) => {
            // index der Spalte
            const index = fieldNames.indexOf(name);

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
        const index = this.Fields.indexOf(field);

        if (index >= 0) {
            const fieldType = this.Types[index];
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

    // Sortierter Index 
    getSortIndex(fields) {
        // Alle Keys von der map
        const dataIndex = Array.from(this.Data.keys());
        let fieldIndex = [];

        if (Array.isArray(fields)) {
            fieldIndex = this.getFieldIndexes(fields);
        } else if (typeof fields === "string" && fields != "") {
            fieldIndex = [this.getFieldIndex(fields)];
        } else {
            // Aktuellen nicht sortierten Index zurückgeben
            return dataIndex;
        }
        
        // Sortieren
        dataIndex.sort((a,b) =>{
            const dataA = this.Data.get(a);
            const dataB = this.Data.get(b);

            let sort = 0;

            // Prüfen
            fieldIndex.some((d, i) =>{
                const fieldName = fields[i];

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


    // Index Filtern
    // eine Funktion die True oder False zurückliefert mit übergeben
    getFilterIndex(filterFunc, ...params) {
        const filterIndex = [];
        if (typeof filterFunc !== "function") {
            return filterIndex;
        }

        const fields = this.Fields;

        // Alle Daten durchgehen
        this.Data.forEach((data, id) =>{
            const obj = {};
    
            // Alle Felder durchgehen
            fields.forEach((name, index) => {
                obj[name] = data[index];
            })
    
            if (filterFunc(obj, ...params)) {
                filterIndex.push(id);
            }
        })

        return filterIndex;
    } // get FilterIndex


    // Tabellen Daten lesen
    getTableDataHTML(fields, index) {
        const fieldIndex = this.getFieldIndexes(fields);
        let tableDataString = ""

        // Daten in String
        function dataToString(data, id) {
            let dataString = "";

            // Datenzeile
            dataString = '<tr id="' + id + '">';

            // Feldindex durchgehen
            fieldIndex.forEach((index) => {
                let content = data[index];
                if (typeof content === "string") {
                    content = content.replaceAll("\n", "</br>");
                }
                dataString += '<td>' + content + '</td>';
            })

            // Ende Datenzeile
            dataString += "</tr>";

            return dataString;
        } // dataToString

        // wenn Index
        if (index) {
            // Alle Daten nach Index durchgehen
            index.forEach((value) => {
                const data = this.Data.get(value);
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
        const il = {};
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

    // Daten von einem Server laden
    async fetch(path, listName) {
        if (!path) {
            path = this.Path;
        }
        if (!listName) {
            listName = this.Name;
        }

        if (!path || !listName) {
            return;
        }

        let url = "";

        path = path.replace("\\", "/");
        if (path.endsWith("/")) {
            url = "/ilist/" + path + listName + ".json";
        } else {
            url = "/ilist/" + path + "/" + listName + ".json";
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Response Status: " + response.status);
            }

            // Json lesen
            const obj = await response.json();

            // Infoliste 
            Object.assign(this, obj);

            // nur infolist Prop und Data
            //let myObject = new Map(Object.entries(raw_data));
            if (this.Prop) {
                this.Prop = new Map(Object.entries(this.Prop));
            } else {
                this.Prop = new Map();
            }
            if (this.Data) {
                this.Data = new Map(Object.entries(this.Data));
            } else {
                this.Data = new Map();
            }

            return;
        } catch (error) {
            console.error(error.message);
            return;
        }
    } // fetch

    // Liste senden
    async send(path, listName) {
        if (!path) {
            path = this.Path;
        }
        if (!listName) {
            listName = this.Name;
        }

        if (!path || !listName) {
            return;
        }

        let url = "";

        path = path.replace("\\", "/");
        if (path.endsWith("/")) {
            url = "/ilist/" + path + listName + ".json";
        } else {
            url = "/ilist/" + path + "/" + listName + ".json";
        }

        try {
            const response = await fetch(url, {
                method: "POST"
                , body: this.stringify()
            });
            if (!response.ok) {
                throw new Error("Response Status: " + response.status);
            }

            return;
        } catch (error) {
            console.error(error.message);
        }
    } // send
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
        const obj = {};

        // Alle Listen durchgehen
        this.forEach((value, key) => {
            // Value ist InfoList
            if (value instanceof InfoList) {
                const il = {};
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
            const il = new InfoList(key);
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


// Funktion die alle Tabellen mit Daten füllt
// tabelle muss ein "data-ilist" Attribut haben, welches den Pfad und Schrägstrich(/) getrennt den Namen der Liste angibt
// z.B.: <table data-ilist="test/liste1">
// für die Anzuzeigenden Spalten muss die Tabelle Spalten (th oder td) mit dem Attribut "data-col" haben, welches den Spaltennamen angibt
// z.B.: <tr><th data-col="feld1">Test 1</th><th data-col="feld2">Test 2</th></tr>
// im <tbody> der Tabelle, werden dann die Daten als HTML eingefügt.
export function checkTables() {
    // Alle Tabellen lesen
    const tables = document.querySelectorAll("table[data-ilist]");
    
    // alle Tabellen durchgehen
    tables.forEach((tableElm) => {
        const tbodyElm = tableElm.querySelector("tbody");
        tbodyElm.innerHTML = "";

        // Infolist Information lesen
        const iListInfo = tableElm.dataset.ilist.split("/"); // iListInfo[0] = Path / iListInfo [1] = Name

        // infoList erzeugen
        const iList = new InfoList();
        if (iListInfo.length == 1) {
            iList.Name = iListInfo[0];
        } else {
            iList.Path = iListInfo[0];
            iList.Name = iListInfo[1];
        }

        // Alle Kopfspalten
        const fields = [];
        const heads = tableElm.querySelectorAll("[data-col]");
        heads.forEach((headElm) => {
            // Feldnamen einfügen
            fields.push(headElm.dataset.col);
        }) // forEach Head Element

        // Infolist Daten holen
        iList.fetch().then(() => {
            // test:
            // console.log("infoList:", iList);

            // HTML Daten von Liste erzeugen und anzeigen
            const innerHTML = iList.getTableDataHTML(fields);
            tbodyElm.insertAdjacentHTML("afterbegin", innerHTML);
        })
    }) // forEach Table Element
} // checkTables
