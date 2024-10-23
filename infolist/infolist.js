// ==================
//   Info Liste
// ==================
// @ts-check


// ===============================
//   Typen
// --------------

/**
 * @typedef {object} InfoObject
 * @property {string} [name]
 * @property {string[]} fields
 * @property {string[]} types
 * @property {string[]} [formats]
 * @property {any[]} data
 */

/**
 * @typedef {object} InfoList2
 * @property {string} [name]
 * @property {string[]} fields
 * @property {string[]} types
 * @property {string[]} [formats]
 * @property {Map<string,any[]>} data
 */

// ===============================
//   Constanten
// --------------


// ===============================
//   Klasse
// --------------

export class InfoList {
    // Parameter
    self = this;
    name = "";
    
    /** @type {string[]} */
    fields = [];
    
    /** @type {string[]} */
    types = [];
    
    /** @type {string[]} */
    formats = [];
    
    /** @type {Map<string|number,any[]>} */
    data = new Map();
    
    /** @type {Map<string,any>} */
    prop = new Map();


    /**
     * Ersetzt alle Daten mit einem neuen InfoObject
     * @param {InfoObject & [any]} newData 
     * @returns {void}
     */
    setData(newData) {
        if (!newData) {return;}

        // Standard Eigenschaften
        this.name = newData.name || "";
        this.fields = newData.fields;
        this.types = newData.types;
        this.formats = newData.formats || [];

        // Daten in Map
        this.data = new Map();
        const dataLength = newData.data.length;
        for (let i = 0; i < dataLength; i++) {
            this.data.set(newData[i][0], newData[i][1]);
            // todo: indexes ????
        }

        // alle anderen Eigensaften
        this.prop = new Map();
        const objKeys = Object.keys(newData);
        for (let i = 0; i < objKeys.length; i++) {
            const key = objKeys[i];

            // Klassen Parameter ignorieren
            if (" name fields types formats data ".indexOf(key) > -1) {continue;}

            this.prop.set(key, newData[key]);
        }
    } // setData()


    /**
     * Konstruktion
     * @param {InfoObject & [any]} newData 
     */
    constructor(newData) {
        this.setData(newData);
    }



    /**
     * Diese Funktion liefert ein Array/Slice für einen Datensatz zurück
     * die Feldnamen und die Reihenfolge der Daten bestimmt die "Fields" Eigenschaft von der InfoList
     * @param {string|number} id - ID Des Datensatzes 
     * @returns {any[]|undefined}
     */
    getDataRow(id) {
        return this.data.get(id);
    }


    /**
     * Setzt einen Datensatz(any[]) mit der id in der Liste.
     * Wenn vorhanden wird der Datensatz komplett überschrieben.
     * @param {string|number} id - ID des Datensatzes
     * @param {any[]} dataRow - Datenliste, die Feld Reihenfolge und type muss der von der InfoList entsprechen.
     */
    setDataRow(id, dataRow) {
        // todo: Prüfen auf Array und die richtigen Datentypen
        this.data.set(id, dataRow);
    }


    /**
     * Diese Funktion liefert den Datensatz als neues Objekt zurück.
     * Wenn kein Datensatz gefunden, wird ein neues leeres Objekt zurück geliefert.
     * @param {string|number} id 
     * @returns {object}
     */
    getObject(id) {
        const obj = {};
        const fields = this.fields;
        const dataRow = this.data.get(id);
        if (!dataRow) {return obj;}

        // Alle Felder durchgehen
        fields.forEach((name, index) => {
            obj[name] = dataRow[index];
        });

        // Objekt zurückgeben
        return obj;
    } // getAsObject


    /**
     * Schreibt die Daten des angegebenen Objektes in die Infoliste.
     * Ist bereits ein Eintrag mit der selben ID vorhanden, so wird diese überschrieben.
     * @param {string|number} id - ID des Datensatzes
     * @param {object} obj - Daten Objekt
     * @returns {void}
     */
    setObject(id, obj) {
        if (!id) {return;}
        if (!obj || typeof obj != "object") {return;}

        const dataRow = new Array(this.fields.length);

        const objKeys = Object.keys(obj);
        for (let i = 0; i < objKeys.length; i++) {
            const key = objKeys[i];
            const index = this.fields.lastIndexOf(key);
            if (index > -1) {
                dataRow[index] = obj[key];
            }
        }

        this.data.set(id, dataRow);
    }


    /**
     * Liefert auf Grund des angegebenen Feldnamen(field)
     * die Position/Index der Spalte in der InfoList zurück
     * @param {string} field - Name des gesuchten Feldes
     * @returns {number} - Index Position des gesuchten Feldes. -1 wenn nicht gefunden.
     */
    getFieldIndex(field) {
        return this.fields.indexOf(field);
    }


    /**
     * Liefert eine Liste an Positionen/Indexes der angegebenen Spaltennamen(fieldList) zurück.
     * Für Feldnamen die nicht in der InfoListe gefunden werden, wird -1 als Position zurück gegeben.
     * @param {string[]} fieldList - Liste mit Feldnamen
     * @returns {number[]} - Liste mit Index-Positionen der gesuchten Felder. -1 wenn das Feld nicht in der Infoliste gefunden wurde.
     */
    getFieldIndexList(fieldList) {
        if (!fieldList || !Array.isArray(fieldList)) {
            return [];
        }

        const fieldListLength = fieldList.length;
        const indexes = new Array(fieldListLength);
    
        for (let i = 0; i < fieldListLength; i++) {
            let field = fieldList[i];
            if (field.indexOf(" ") >= 0) {
                field = field.split(" ")[0];
            }
            indexes[i] = this.fields.indexOf(field);
        };

        return indexes;
    }


    /**
     * Liest den Wert einer Spalte(field) vom angegebenen Datensatz(id) aus.
     * @param {string|number} id - ID des Datensatzes
     * @param {string} field - Feldname von dem der Wert gelesen wird
     * @returns {any|undefined} Wert vom angegebenen Datensatz-Feld 
     */
    getValue(id, field) {
        if (!id) {return undefined;}
        if (!field) {return undefined;}

        const index = this.fields.indexOf(field);
        if (index > -1) {
            const dataRow = this.data.get(id);
            if (dataRow) {
                return dataRow[index];
            } 
            return undefined;
        } else {
            return undefined;
        }
    }


    /**
     * Setzt den Wert(value) einer Spalte(field) im Datensatz(id)
     * @param {string|number} id - ID des Datensatzes
     * @param {string} field - Feldname
     * @param {any} value - Wert der für das angegebene Feld gesetzt wird
     * @returns {void}
     */
    setValue(id, field, value) {
        if (id == undefined || !field) {return;}

        let dataRow = this.Data.get(id);
        if (!dataRow) {
            dataRow = new Array(this.fields.length);
            this.data.set(id, dataRow);
        }

        const index = this.fields.indexOf(field);

        if (index > -1) {
            const fieldType = this.types[index];

            // Wert setzen
            switch (fieldType) {
                case "str":
                    dataRow[index] = "" + value;
                    break;
                    
                default:
                    dataRow[index] = value;
            }
        }
    } // setValue


    /**
     * Gibt ein Array an Werten für die Spalten(fieldList) eines Datensatzes(id) zurück.
     * @param {string|number} id - ID des Datensatzes
     * @param {string[]} fieldList - List mit Feldnamen
     * @returns {any[]} Liste mit Werten der angegebenen Feldnamen
     */
    getFieldValueList(id, fieldList) {
        if (id == undefined) {return [];}
        if (!fieldList || !Array.isArray(fieldList)) {
            return [];
        }

        const dataRow = this.data.get(id);
        if (!dataRow) {return [];}

        const fieldListLength = fieldList.length;
        const valueList = new Array(fieldListLength);
    
        for (let i = 0; i < fieldListLength; i++) {
            let field = fieldList[i];
            if (field.indexOf(" ") >= 0) {
                field = field.split(" ")[0];
            }
            const index = this.fields.indexOf(field);
            valueList[i] = dataRow[index];
        };

        return valueList;
    }



    // Sortierter Index
    getSortIndexList(sortFields) {
        // Alle Keys von der map
        const dataKeys = this.data.keys();
        const keysLength = this.data.size;
        
        const indexList = new Array(keysLength);
        for (let i = 0; i < keysLength; i++) {
            indexList[i] = dataKeys[i];
        }


        if (!Array.isArray(sortFields)) {
            return indexList;
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


// ===============================
//   Funktionen
// --------------

// Global Short Identifier
export function GSID() {
    return new Date().getTime().toString(36) +
        crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}



// Seiten Navigation
// path, name, title, date
export function InfoNav(iList) {
    const self = InfoNav;

    // Eigenschaften
    self.infoList = iList;
    self.sortFields = [];
    self.sortIndex = null;
    self.sortFields = ["path", "date DESC", "title", "name"];
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
                dirObj.title = title;
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
                    //attr = " style='background-color: rgb(255 255 255 /0.2);'";
                } else {
                    navText = "+&nbsp;" + navText;
                }
            } else {
                // kein Ordner
                if (navObj.active) {
                    attr = " style='background-color: rgb(255 255 255 /0.2);'";
                    //attr = " class='" + css_color_highlight + "'";
                }
            }

            let navLink = "<a href='" + navObj.path + "'>" + navText + "</a>";
            navString += "<li" + attr + ">" + navLink;
            
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
    const self = InfoTable;

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
            case "PageDown":
                e.preventDefault();
                e.stopImmediatePropagation();
                // Navigation prüfen
                checkKeyNav(self, "pageDown");
            break;
            case "PageUp":
                e.preventDefault();
                e.stopImmediatePropagation();
                // Navigation prüfen
                checkKeyNav(self, "pageUp");
            break;
            case "Home":
                e.preventDefault();
                e.stopImmediatePropagation();
                // Navigation prüfen
                checkKeyNav(self, "pos1");
            break;
            case "End":
                e.preventDefault();
                e.stopImmediatePropagation();
                // Navigation prüfen
                checkKeyNav(self, "end");
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

    // auf click prüfen
    let checkClick = function(e) {
        if (!e) {
            return;
        }

        let target = e.target;
        if (target && target.tagName == "TD") {
            // todo: Spalte und Zeile Merken

            // todo: auf aktiv setzen
        } 

    }

    //   Event Handler
    // -------------------------

    // Events Registrieren
    self.registerEvents = function(elm) {
        window.addEventListener("keydown", checkKeys, false);
        // window.addEventListener("keyup", this.#checkKeys, false);

        // todo: click Event
    }

    // Events entfernen
    self.unregisterEvents = function(elm) {
        window.removeEventListener("keydown", checkKeys, false);
        // window.removeEventListener("keyup", this.#checkKeys, false);

        // todo: click Event
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

    // nächstes Element
    let nextElm;
    let count = 10; // Anzahl der nächsten elemente -1
    let elm = currentElm;

    // console.log("currentElm2:", currentElm);
    switch (direction) {
        case "down":
            // Next Element
            nextElm = currentElm.nextElementSibling;
        break;

        case "up":
            // Voriges Element
            nextElm = currentElm.previousElementSibling;
        break;

        case "end":
            // letztes Element
            nextElm = currentElm.parentNode.lastElementChild;
        break;

        case "pos1":
            // Voriges Element
            nextElm = currentElm.parentNode.firstElementChild;
        break;

        case "pageDown":
            while (elm && count) {
                nextElm = elm;
                elm = elm.nextElementSibling;
                count -= 1;
            }
        break;

        case "pageUp":
            while (elm && count) {
                nextElm = elm;
                elm = elm.previousElementSibling;
                count -= 1;
            }
        break;

        default:
        break;
    }


    if (direction == "down") {
        // Next Element
        nextElm = currentElm.nextElementSibling;
    } else if (direction == "up") {
        // Voriges Element
        nextElm = currentElm.previousElementSibling;
    } else if (direction == "pageDown") {
        let count = 10; // Anzahl der nächsten elemente -1
        let elm = currentElm;
        while (elm && count) {
            nextElm = elm;
            elm = elm.nextElementSibling;
            count -= 1;
        }
    } else if (direction == "pageUp") {
        let count = 10; // Anzahl der nächsten elemente -1
        let elm = currentElm;
        while (elm && count) {
            nextElm = elm;
            elm = elm.previousElementSibling;
            count -= 1;
        }
    }

    // wenn neues Next Element
    if (nextElm) {
        currentElm.classList.remove(css_color_highlight);
        nextElm.classList.add(css_color_highlight);
        infoTable.activeRowID = nextElm.id;
        nextElm.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });    // { behavior: "smooth", block: "end", inline: "nearest" }
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
