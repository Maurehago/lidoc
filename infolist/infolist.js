// Infoliste

// ===============================
//   Constanten
// --------------

// Hilight CSS class
const css_color_highlight = "color-h";


// ===============================

// Global Short Identifier
export function GSID() {
    return new Date().getTime().toString(36) +
        crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}

export class InfoList {
    // Construktion
    constructor(name) {
        this.Name = ""; // Name der Liste
        this.Path = ""; // Pfad / Gruppe
        this.Prop = new Map(); // Zusätzliche Eigenschaften der Liste
        this.Fields = []; // FeldNamen von Data
        this.Types = []; // FeldTypen von Data
        this.Data = new Map(); // Daten der Liste
        this.List = []; // Wenn Auflistung statt Daten. z.B.: bei ENums

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
        });

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

        fields.forEach((v, i) => {
            if (v.indexOf(" ") >= 0) {
                v = v.split(" ")[0];
            }
            indexes[i] = fieldList.indexOf(v);
        });

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
        });
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
        dataIndex.sort((a, b) => {
            const dataA = this.Data.get(a);
            const dataB = this.Data.get(b);

            let sort = 0;

            // Prüfen
            fieldIndex.some((d, i) => {
                const fieldName = fields[i];

                // Wenn Absteigend
                if (fieldName.endsWith(" DESC")) {
                    if (dataA[d] > dataB[d]) {
                        sort = -1;
                        return true;
                    } else if (dataA[d] < dataB[d]) {
                        sort = 1;
                        return true;
                    }
                } else {
                    // Aufsteigend
                    if (dataA[d] > dataB[d]) {
                        sort = 1;
                        return true;
                    } else if (dataA[d] < dataB[d]) {
                        sort = -1;
                        return true;
                    }
                }
                return false;
            }); // Prüfen

            // Sortierung zurückgeben
            return sort;
        });

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
        this.Data.forEach((data, id) => {
            const obj = {};

            // Alle Felder durchgehen
            fields.forEach((name, index) => {
                obj[name] = data[index];
            });

            if (filterFunc(obj, ...params)) {
                filterIndex.push(id);
            }
        });

        return filterIndex;
    } // get FilterIndex

    // Tabellen Daten lesen
    getTableDataHTML(fields, index) {
        const fieldIndex = this.getFieldIndexes(fields);
        let tableDataString = "";

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
                dataString += "<td>" + content + "</td>";
            });

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
            });
        } else {
            // Alle Einträge in der map
            this.Data.forEach((data, key) => {
                tableDataString += dataToString(data, key);
            });
        }

        return tableDataString;
    } // getTableDataHTML

    // Infoliste in einen String umwandeln
    stringify() {
        // in JSON String umwandeln
        const il = {};
        il.Name = this.Name; // Name der Liste
        il.Prop = Object.fromEntries(this.Prop); // Zusätzliche Eigenschaften der Liste
        il.Fields = this.Fields; // FeldNamen von Data
        il.Types = this.Types; // FeldTypen von Data
        il.Data = Object.fromEntries(this.Data); // Daten der Liste

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
                method: "POST",
                body: this.stringify(),
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


// Seiten Navigation
// path, name, title, date
export function InfoNav(iList) {
    const self = this;

    // Eigenschaften
    self.infoList = iList;
    self.sortFields = [];
    self.sortIndex = null;
    self.sortFields = ["path", "date", "title", "name"];
    self.elmID = "";

    let pathIndex = -1;
    let nameIndex = -1;
    let titleIndex = -1;
    let dateIndex = -1;

    function setIndexes() {
        if (self.infoList instanceof InfoList) {
            pathIndex = self.infoList.getFieldIndex("path");
            nameIndex = self.infoList.getFieldIndex("name");
            titleIndex = self.infoList.getFieldIndex("title");
            dateIndex = self.infoList.getFieldIndex("date");

            self.sortIndex = self.infoList.getSortIndex(self.sortFields);
        } else {
            pathIndex = -1;
            nameIndex = -1;
            titleIndex = -1;
            dateIndex = -1;
        }
    }

    // bei Start ausführen
    setIndexes()

    //  Setzt die InfoListe für die Tabelle
    self.setInfoList = function(iList) {
        self.infoList = iList;
        setIndexes();
    }

    // Sortierung
    self.setSortIndex = function(sortIndex) {
        if (Array.isArray(sortIndex)) {
            self.sortIndex = sortIndex;
        }
    }

    self.showNav = function(elm) {
        // Prüfen
        if (!elm && self.elmID != "") {
            elm = document.body.querySelector(self.elmID);
        }
        if (elm instanceof HTMLElement) {
            self.elmID = elm.id;
        } else {
            return;
        }
        if ((!self.infoList) instanceof InfoList) {
            return;
        }

        // Feldindex aktualisiern
        setIndexes();

        // Navigation Objekt
        function NavObj() {
            const self = this;
            
            self.active = false;
            self.title = "";
            self.path = "";
            self.isDir = false;
            self.children = [];
        };

        let dirList = new Map();

        // // Basis Navigation Objekt
        let baseNav = new NavObj();
        baseNav.url = "/";
        baseNav.isDir = true;
        dirList.set("/", baseNav);

        // Aktuellen Pfad lesen
        const fullPath = window.location.pathname;

        // Eltern Navigations Objekt holen
        function getDirObj(path) {
            let lastPos = path.lastIndexOf("/");
            let parentPath = path.substring(0, lastPos);
            if (parentPath == "") {
                parentPath = "/";
            }

            // test:
            console.log("dirPath:", path);

            let obj = dirList.get(parentPath);
            if (!obj) {
                obj = new NavObj();
                obj.title = parentPath.substring(parentPath.lastIndexOf("/") + 1);
                obj.path = parentPath;
                obj.isDir = true;
                dirList.set(parentPath, obj);

                // in Eltern Element hinzufügen
                parent = getDirObj(parentPath);
                parent.children.push(obj);
            }

            // aktiv prüfen
            if (fullPath.startsWith(parentPath)) {
                obj.active = true;
            }
            return obj;
        } // getDirObj

        // ListItem
        function dataToNavList(data) {
            if (!data) {return;}
            
            // Pfad lesen
            let path = data[pathIndex];
            if (!path) {
                return "";
            }

            // Titel festlegen
            let title = data[titleIndex];
            let name = data[nameIndex];
            if (!title) {
                title = name;
            }

            // Pfade
            if (path.endsWith("/")) {
                path += name + ".html";
            } else {
                path += "/" + name + ".html";
            }

            let dirObj = getDirObj(path);

            if (name == "index") {
                return;
            }

            let obj = new NavObj();
            obj.path = path;
            obj.title = title;

            // auf aktiv prüfen
            if (path == fullPath) {
                obj.active = true;
            }

            // In Directory einfügen
            dirObj.children.push(obj);
        } // dataToNavList


        // wenn Index
        if (self.sortIndex && self.sortIndex.length > 0) {
            // Alle Daten nach Index durchgehen
            self.sortIndex.forEach((value) => {
                const data = self.infoList.Data.get(value);
                dataToNavList(data);
            });
        } else {
            // Alle Einträge in der map
            self.infoList.Data.forEach((data, key) => {
                dataToNavList(data);
            });
        }

        // HTML zusammenbauen
        let navString = "<ul>";

        // liste aller KindElemente prüfen
        function setNavString(navObj) {
            if (!navObj instanceof NavObj) {return;}
            
            let navText = navObj.title;
            let attr = "";
            if (navObj.isDir) {
                if (navObj.active) {
                    navText = "-&nbsp;" + navText;
                    attr = " style='background-color: rgb(255 255 255 /0.2);'";
                } else {
                    navText = "+&nbsp;" + navText;
                }
            } else {
                // kein Ordner
                if (navObj.active) {
                    attr = " class='" + css_color_highlight + "'";
                }
            }

            let navLink = "<a href='" + navObj.path + "'>" + navText + "</a>";
            navString += "<li" + attr + "'>" + navLink;
            
            // wenn Directory
            if (navObj.active && navObj.isDir) {
                navString += "<ul>";
                navObj.children.forEach(setNavString);
                navString += "</ul>";
            }

            // Listen Element abschliessen
            navString += "</li>"
        } // setNavString

        // test:
        console.log("dirList:", dirList);        

        // Alle Kindelemente vom Basis Nav durchgehen
        baseNav.children.forEach(setNavString);

        // abschliessen
        navString += "</ul>";

        // navigation erzeugen
        elm.insertAdjacentHTML("beforeend", navString);        
    } // showNav
} // InfoNav



//  Info Tabelle
export function InfoTable(iList, col_list, col_titles)  {
    const self = this;

    // Eigenschaften
    self.infoList = iList;
    self.cols = col_list;
    self.colTitles = col_titles || [];
    self.sortFields = [];
    self.sortIndex = [];
    self.elmID = "";
    self.activeRowID = "";

    // todo: Gruppierung
    // todo: Filter
    // todo: Formular


    //  Setzt die InfoListe für die Tabelle
    self.setInfoList = function(iList) {
        self.infoList = iList;
    }

    // Setzt die Spalten
    self.setCols = function(col_list, col_titles) {
        self.cols = col_list;
        if (col_titles) {
            self.colTitles = col_titles;
        }
    }

    // Sortierung
    self.setSortIndex = function(sortIndex) {
        self.sortIndex = sortIndex;
    }

    // todo: Gruppierungen

    // todo: filter

    // todo: Formular

    // Tabellen Daten lesen
    let getDataHTML = function() {
        let tableDataString = "";
        const fieldIndex = self.infoList.getFieldIndexes(self.cols);
        const fieldTypes = self.infoList.Types;

        // console.log("#getDataHTML");

        // Daten in String
        function dataToString(data, id) {
            let dataString = "";

            // Datenzeile
            dataString = '<tr id="' + id + '">';

            // Feldindex durchgehen
            fieldIndex.forEach((index) => {
                let content = data[index];
                let attr = "";
                const type = fieldTypes[index];
                if (type == "int" || type == "num") {
                    attr = " text-r"; // Leerzeichen davor
                } else if (type == "bool") {
                    attr = " text-c"; // Leerzeichen davor
                } else if (type == "str") {
                    content = content.replaceAll("\n", "</br>");
                }
                dataString += "<td" + attr + ">" + content + "</td>";
            });

            // Ende Datenzeile
            dataString += "</tr>";

            return dataString;
        } // dataToString

        // wenn Index
        if (self.sortIndex && self.sortIndex.length > 0) {
            // Alle Daten nach Index durchgehen
            self.sortIndex.forEach((value) => {
                const data = self.infoList.Data.get(value);
                tableDataString += dataToString(data, value);
            });
        } else {
            // Alle Einträge in der map
            self.infoList.Data.forEach((data, key) => {
                tableDataString += dataToString(data, key);
            });
        }

        // console.log("tableDataString");

        return tableDataString;
    } // getTableDataHTML

    // Daten Anzeigen
    self.showData = function(elm) {
        // Prüfen
        if (!elm && self.elmID != "") {
            elm = document.body.querySelector(self.elmID);
        }
        if (elm instanceof HTMLTableElement) {
            self.elmID = elm.id;
        } else {
            return;
        }
        if ((!self.infoList) instanceof InfoList) {
            return;
        }
        if (!Array.isArray(self.cols)) {
            return;
        }

        // console.log("showData:");

        // Body Element
        const tbodyElm = elm.querySelector("tbody");
        if (!tbodyElm) {
            tbodyElm = document.createElement("tbody");
            elm.appendChild(tbodyElm);
        }

        // console.log("tbodyElm:", tbodyElm);

        // HTML Daten von Liste erzeugen und anzeigen
        const innerHTML = getDataHTML();
        // console.log("innerHTML:", innerHTML);
        tbodyElm.insertAdjacentHTML("beforeend", innerHTML);
    } // schowData

    // Aktive Zeile festlegen
    let setActive = function(id) {
        let newElm = document.body.getElementById(id);
        let oldElm = document.body.getElementById(self.activeRowID);
        if (oldElm) {
            oldElm.classList.remove(css_color_highlight);
        }
        if (newElm) {
            newElm.classList.add(css_color_highlight);
            self.activeRowID = id;
        }
    } // setActive

    // ====================
    //   Events
    // ---------

    // Auf Taste prüfen
    let checkKeys = function(e) {
        console.log("keycode:", e.code);
        switch (e.code) {
            case "ArrowUp":
                e.preventDefault();
                e.stopImmediatePropagation();
                // Navigation prüfen
                checkKeyNav(self, "up");
                //e.preventDefault();
                break;
            case "ArrowDown":
                e.preventDefault();
                e.stopImmediatePropagation();
                // Navigation prüfen
                checkKeyNav(self, "down");
                //e.preventDefault();
                break;
            case "ArrowRight":
                // some code here…
                break;
            case "ArrowLeft":
                // some code here…
                break;
            case "Enter":
                // some code here…
                break;
            case "Insert":
                // some code here…
                break;
            case "Delete":
                // some code here…
                break;
        }
    }

    //   Event Handler
    // -------------------------

    // Events Registrieren
    self.registerEvents = function(elm) {
        window.addEventListener("keydown", checkKeys, false);
        // window.addEventListener("keyup", this.#checkKeys, false);
    }

    // Events entfernen
    self.unregisterEvents = function(elm) {
        window.removeEventListener("keydown", checkKeys, false);
        // window.removeEventListener("keyup", this.#checkKeys, false);
    }
} // InfoTable

// aktuelles Datensatz Element holen
function getActiveRow(infoTable) {
    let currentElm;
    
    // Wenn eine Aktive Row festgelegt
    if (infoTable.activeRowID) {
        currentElm = document.querySelector("#" + infoTable.activeRowID);
    } else {
        let tableElm = document.querySelector("#" + infoTable.elmID);
        if (!tableElm) {return null;}
        let tbody = tableElm.querySelector("tbody");
        if (tbody) {
            currentElm = tbody.querySelector("tr");
            if (!currentElm) {return null;}
        }
    }
    return currentElm;
} // getActiveRow


// Tastatur Navigation Prüfung
function checkKeyNav(infoTable, direction) {
    // console.log(infoTable);
    if (!infoTable) {return;}

    let currentElm = getActiveRow(infoTable);
    if (!currentElm) {return;}

    // console.log("currentElm2:", currentElm);
    if (direction == "down") {
        // Next Element
        let nextElm = currentElm.nextElementSibling;
        if (nextElm) {
            currentElm.classList.remove(css_color_highlight);
            nextElm.classList.add(css_color_highlight);
            infoTable.activeRowID = nextElm.id;
            nextElm.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });    // { behavior: "smooth", block: "end", inline: "nearest" }
        }
    } else if (direction == "up") {
        // Voriges Element
        let prevElm = currentElm.previousElementSibling;
        if (prevElm) {
            currentElm.classList.remove(css_color_highlight);
            prevElm.classList.add(css_color_highlight);
            infoTable.activeRowID = prevElm.id;
            prevElm.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
    }
} // checkKeyNav

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
        // const tbodyElm = tableElm.querySelector("tbody");
        const sortString = tableElm.getAttribute("data-sort");
        // if (tbodyElm) {
        //     tbodyElm.innerHTML = "";
        // } else {
        //     tbodyElm = tableElm;
        // }

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
        }); // forEach Head Element

        // InfoTabelle erstellen
        const infoTable = new InfoTable(iList, fields);
        tableElm.infoTable = infoTable;

        // Infolist Daten holen
        iList.fetch().then(() => {
            // test:
            // console.log("infoList:", iList);

            // Sortierung
            let sortIndex = null;
            if (sortString) {
                sortIndex = iList.getSortIndex(sortString.split(","));
            }
            infoTable.setSortIndex(sortIndex);

            // HTML Daten von Tabelle erzeugen und anzeigen
            infoTable.showData(tableElm);
            // const innerHTML = iList.getTableDataHTML(fields, sortIndex);
            // tbodyElm.insertAdjacentHTML("beforeend", innerHTML);

            // Events registrieren todo: eventuell Optional?
            infoTable.registerEvents(tableElm);
        });
    }); // forEach Table Element
} // checkTables


// Funktion die alle NavigationsElemente mit Daten füllt
// nav muss ein "data-ilist" Attribut haben, welches den Pfad und Schrägstrich(/) getrennt den Namen der Liste angibt
// optional kann noch eine Sortierung nach den Feldern path,date,title,name angegeben werden
// z.B.: <nav data-ilist="lidoc/sites" data-sort="path,date,title,name">
export function checkNav() {
    // Alle Tabellen lesen
    const navs = document.querySelectorAll("nav[data-ilist]");

    // alle gefunden NavigationsElemente durchgehen
    navs.forEach((navElm) => {
        // const tbodyElm = tableElm.querySelector("tbody");
        const sortString = navElm.getAttribute("data-sort");

        // Infolist Information lesen
        const iListInfo = navElm.dataset.ilist.split("/"); // iListInfo[0] = Path / iListInfo [1] = Name

        // infoList erzeugen
        const iList = new InfoList();
        if (iListInfo.length == 1) {
            iList.Name = iListInfo[0];
        } else {
            iList.Path = iListInfo[0];
            iList.Name = iListInfo[1];
        }

        // InfoTabelle erstellen
        const infoNav = new InfoNav(iList);
        navElm.infoNav = infoNav;

        // Infolist Daten holen
        iList.fetch().then(() => {
            // test:
            // console.log("infoList:", iList);

            // Sortierung
            let sortIndex = null;
            if (sortString) {
                sortIndex = iList.getSortIndex(sortString.split(","));
                infoNav.setSortIndex(sortIndex);
            } else {
                sortIndex = iList.getSortIndex("path", "date", "title", "name");
                infoNav.setSortIndex(sortIndex);
            }
            

            // HTML Daten von Navigation erzeugen und anzeigen
            infoNav.showNav(navElm);
        });
    }); // forEach Nav Element
} // checkNav
