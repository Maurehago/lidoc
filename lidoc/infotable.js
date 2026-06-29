// ============================
//    InfoTable
// ============================
// @ts-check

// ===================================
//   Funktionen
// -------------

/**
 * Gibt eine neue GlobalShortId zurück
 * @param {boolean} [large] - "true" Wenn in langer Form
 * @returns {string}
 */
export function getGSID(large) {
    if (large) {
        return new Date().getTime().toString(36) +
            crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    } else {
        return new Date().getTime().toString(36) +
            crypto.getRandomValues(new Uint16Array(1))[0].toString(36);
    }
}

/**
 * Prüft ob ein Wert eine Zahl ist
 * @param {string} string - Text zum Prüfen
 * @returns 
 */
export function isNumber(string) {
    return !isNaN(Number(string));
}

/**
 * Prüft ob ein Objekt eine Klasse ist
 * @param {object} obj - Zu prüfendes Objekt
 * @returns {boolean} "true" wenn angegebenes Objet eine Klasse ist
 */
export function isClass(obj) {
    return typeof obj === 'function' && obj.prototype && obj.prototype.constructor === obj;
}


/**
 * Bindet eine KlassenInstanz an einen Datensatz (Array mit Werten)
 * @param {Object<string,any>} instance - Klassen Instanz Objekt
 * @param {Array<any>} rowArray - DatenZeile
 * @param {Object<string,number>} columnIndex - Spalten Index Objekt
 * @returns {any} mit Settern und Gettern verbessertes Instanz-Objekt
 */
export function bindRow(instance, rowArray, columnIndex) {
    instance._row = rowArray;
    instance._index = columnIndex;
    instance._changes = new Set(); // Set mit Spaltennamen, dessen Werte geändert worden sind
    instance._isNew = false; // Standardmäßig existiert der Datensatz schon in der DB

    /**
     * Fragt ab ob dieser Datensatz bearbeitet worden ist
     * @returns {boolean} true wenn der Datensatz bearbeitet worden ist
     */
    instance.isChanged = function () {
        return this._changes.size > 0;
    };

    /**
     * Löscht alle Änderungs-Marker von dem Datensatz
     */
    instance.commitChanges = function () {
        this._changes.clear(); // Nach dem Server-Sync einfach die Änderungs-Flags löschen
    };

    Object.keys(columnIndex).forEach(colName => {
        Object.defineProperty(instance, colName, {
            get() {
                // Liest IMMER direkt aus dem echten, flachen Array
                return this._row[this._index[colName]];
            },
            set(val) {
                const oldVal = this._row[this._index[colName]];
                if (val !== oldVal) {
                    // Schreibe SOFORT direkt in das originale Roh-Array
                    this._row[this._index[colName]] = val;
                    // Markiere die Spalte als "changed" Bearbeitet
                    this._changes.add(colName);
                }
            },
            configurable: true,
            enumerable: true
        });
    });

    // Hilfsmethode, um alle Felder auszugeben, die nicht 'null' sind (für den Insert-Payload)
    instance.getPopulatedFields = function () {
        return Object.keys(this._index).filter(colName => this[colName] !== null);
    };

    return instance;
}

// =======================================
//   Klassen
// -------------

/**
 * Eine Daten Modell Klasse von der alle Daten Modelle für die Datentabelle erben müssen
 * @class
 * @example
 * class Customer extends DataRow {
 *   gsid = "";
 *   name = "";
 *   city = "";
 *   constructor() { super(); } // Zwingend erforderlich wenn man von einer anderen Klasse erbt
 *}
 */
export class DataRow {
    /** @type {Array<any>} Die rohe Datenzeile (Referenz) */
    _row = [];

    /** @type {Object.<string, number>} Das Spalten-Index-Mapping */
    _index = {};

    /** @type {Set<string>} Set der geänderten Spaltennamen */
    _changes = new Set();

    /** @type {boolean} Flag, ob der Datensatz brandneu auf dem Client ist */
    _isNew = false;

    /** @returns {boolean} */
    isChanged() { return false; }

    /** @returns {void} */
    commitChanges() { }

    /** @returns {Array<string>} */
    getPopulatedFields() { return []; }
}


/**
 * @template T
 */
export class DataTable {
    /**
     * Eine InMemmory Datentabelle
     * @param {string} tableName - Name der Tabelle
     * @param {Array<Array<any>>} dataArray - DatenZeilen. Erste Zeile enthält Spaltennamen
     * @param {T} modelClass - Daten Modell Klasse
     * @param {string} idColumnName - Name der ID-DatenSpalte. Default: "gsid"
     */
    constructor(tableName, dataArray, modelClass, idColumnName = "gsid") {
        /** @type {string} */
        this.tableName = tableName;
        /** @type {Array<string>} */
        this.columns = dataArray[0] || [];
        /** @type {Array<Array<any>>} */
        this.rows = dataArray;
        /** @type {string} */
        this.idColumnName = idColumnName;
        //** @type {T} */
        this.modelClass = modelClass; // Hier merken wir uns die Daten Modell Klasse

        this.columnIndex = Object.fromEntries(this.columns.map((col, idx) => [col, idx]));
        
        /** @type {Map<string,number>} */
        this.rowMap = new Map();

        const idIdx = this.columnIndex[idColumnName];
        for (let i = 1; i < this.rows.length; i++) {
            this.rowMap.set(this.rows[i][idIdx], i);
        }

        this._instanzCache = new Map();
        /** @type {Map<string,Array<number>>} */
        this._indexList = new Map();
    }

    /**
     * Liefert die ID eines Objektes zurück
     * @param {Object<string,any>|Array<any>} obj - Datenobjekt mit dem idFeld
     * @returns {any} ID
     */
    getID(obj) {
        if (!obj) {return;}
        if (Array.isArray(obj)) {
            const idIdx = this.columnIndex[this.idColumnName];
            return obj[idIdx];
        } else {
            return obj[this.idColumnName];
        }
    }


    /**
     * Liefert eine DatenModellKlasse Instanz zurück 
     * @param {string} id - eindeutige ID des Datensatzes
     * @returns {InstanceType<T>|null} DatenModell instanz
     */
    getById(id) {
        if (this._instanzCache.has(id)) return this._instanzCache.get(id);

        if (!this.rowMap.has(id)) return null;
        const rowIndex = this.rowMap.get(id);
        if (rowIndex == undefined) {return null;}
        const rawRow = this.rows[rowIndex];

        // leere Instanz der Daten Model Klasse erstellen
        // @ts-ignore
        const emptyInstance = new this.modelClass();

        // Daten Array mit der Daten-Modell Instanz verknüpfen
        const stronglyTypedView = bindRow(emptyInstance, rawRow, this.columnIndex);

        // Instanz im Chache merken
        this._instanzCache.set(id, stronglyTypedView);
        return stronglyTypedView;
    }

    /**
     * Liefert eine Liste aller IDs vom angegeben Index oder allen Datensätzen zurück.  
     * Existiert der Index nicht, wird eine leere Liste zurück gegeben.
     * @param {string|Array<number>} [index] - Indexname
     * @returns {Array<number>} Index-Liste der Datzensätze
     */
    getIndexList(index) {
        if (!index) {
            return [...this.rows.keys()];
        } else {
            if (Array.isArray(index)) { return index; }
            return this._indexList.get(index) || [];
        }
    }

    /**
     * Prüft ob ein bestimmter index in der Liste vorhanden ist
     * @param {string} index - Index Name
     * @returns {boolean} "true" wenn Index mit dem Namen vorhanden
     */
    hasIndexList(index) {
        return this._indexList.has(index);
    }



    /**
     * Erstellt einen neuen, stark typisierten Datensatz im System
     * @param {Object<string,any>} [initialData] - Optionale Startwerte, z.B. { name: "Interessent" }
     * @returns {InstanceType<T>} Eine instanziierte, stark typisierte Modell-Klasse (z.B. ein Customer)
     */
    insert(initialData = {}) {
        // eindeutige GSID erstellen
        const newId = initialData[this.idColumnName] || getGSID();

        // leeres Array, das exakt so lang ist wie die Spaltenanzahl
        // und mit 'null' (bzw. Standardwerten) befüllen
        const newRowArray = new Array(this.columns.length).fill(null);

        // ID in richtige Spalte setzen
        const idIdx = this.columnIndex[this.idColumnName];
        newRowArray[idIdx] = newId;

        // neue Instanz der hinterlegten Modell-Klasse
        // @ts-ignore
        const emptyInstance = new this.modelClass();

        // Instanz mit dem Array verknüpfen
        const stronglyTypedView = bindRow(emptyInstance, newRowArray, this.columnIndex);

        // Datensatz als "neu erstellt" markieren
        stronglyTypedView._isNew = true;

        // übergebene Standardwerte über die Setter zuweisen
        Object.keys(initialData).forEach(key => {
            if (key in this.columnIndex) {
                stronglyTypedView[key] = initialData[key];
            }
        });

        // das neue Array direkt in die Rohdaten-Liste der Tabelle einfügen
        this.rows.push(newRowArray);

        // Index-Mapping erstellen für spätere getById-Abfragen
        this.rowMap.set(newId, this.rows.length - 1);

        // Im Instanz-Cache merken, damit das System weiß, wer aktiv editiert wird
        this._instanzCache.set(newId, stronglyTypedView);

        return stronglyTypedView;
    }

    /**
     * Setzt ein objekt in die Liste. Die ID wird aus den Einstellungen und dem Objekt-Eigenschaften gelesen.
     * @param {Object<string,any>} obj - Obekt das in die Liste aufgenommen wird.
     * @returns {InstanceType<T>|null} Eine instanziierte, stark typisierte Modell-Klasse (z.B. ein Customer)
     */
    setObject(obj) {
        const id = this.getID(obj);

        // Wenn keine ID dann kann nicht eingefügt werden
        if (id == undefined) {return null;}

        // Prüfen ob bereits in der Liste
        if (this.rowMap.has(id)) {
            const view = this.getById(id);
            if (!view) {return null;}

            // übergebene Standardwerte über die Setter zuweisen
            Object.keys(obj).forEach(key => {
                if (key in this.columnIndex && key != this.idColumnName) {
                    //@ts-ignore
                    view[key] = obj[key];
                }
            });
            return view;
        } else {
            // Daten neu einfügen
            return this.insert(obj);
        }
    }

    /**
     * Sortiert die Daten nach angegebenen Spalten. Groß-Kleinschreibung bei Texten wird ignoriert.  
     * Aufsteigend: A > B = 1  
     * Wenn kein "index" angegeben, werden alle Daten sortiert.
     * Wenn "index" angegeben, werden nur die Daten unter diesem Index sortiert.
     * Wenn "newIndex" angegeben, wird die Sortierung unter "newIndex" abgelegt.
     * @param {Array<string>} sortCols - Liste mit Spalten nach denen Sortiert wird oder eine Sortierungsfunktion (|CallbackSortFunction<T>)
     * @param {string|Array<number>} [index] - Index Name oder Liste mit ID's der zum sortieren verwendet wird.
     * @param {string} [newIndexName] - Index Name der nach dem Sortieren gesetzt wird.
     * @returns {Array<number>} sortierte Liste mit sortiertem Datenzeilen Index
     * @example
     * const sortList = dataList.sortRows(["name", "hausnummer DESC"], "sortListe");
     */
    sort(sortCols, index, newIndexName) {
        // Alle Datenzeile in einer liste
        const rowList = this.getIndexList(index); // todo: ??? prüfen ob Kopie oder Referenz ???

        // Wenn Sortierungs Funktion
        if (typeof sortCols == "function") {
            // @ts-ignore
            rowList.sort(sortCols);
        } else {
            // wenn keine SortierungsSpalten angegeben
            if (!Array.isArray(sortCols)) {
                // nur Index merken
                if (typeof index == "string") { this._indexList.set(index, rowList); }
                // unsortierte Liste mit ID's
                return rowList;
            }

            // Feld Indexes lesen und Sortier Reihenfolge
            const colLength = sortCols.length;
            const orderIndex = new Array(colLength);
            const isString = new Array(colLength);
            /** @type {Array<number>} */
            const sCols = new Array(colLength); // Spalten Index
            const sDirection = new Array(colLength);

            // 1. Daten-Datensatz(1) lesen / erste Zeile(0) enthält Feldnamen
            let row = this.rows[1];
            if (!row) { return rowList; }

            // Alle sortierspalten durchgehen
            for (let i = 0; i < colLength; i++) {
                let col = sortCols[i];
                let direction = 1; // 1 = Aufsteigend sortieren / -1 = Absteigend sortieren

                // prüfen auf Sortier Richtung
                const fieldData = col.split(" ");
                sCols[i] = this.columnIndex[fieldData[0]]; // Spalten-ID für spätere Verwendung merken
                sDirection[i] = "ASC";
                if (fieldData[1]?.trim().toUpperCase() == "DESC") {
                    direction = -1;
                    sDirection[i] = "DESC"; // Sortierrichtung für spätere Verwendung merken
                }

                orderIndex[i] = direction;
                isString[i] = typeof row[sCols[i]] == "string" ? true : false; // dataType?.type == "string" ? true : false;
            }


            // Sortieren
            rowList.sort((a, b) => {
                const aRow = this.rows[a] || [];
                const bRow = this.rows[b] || [];

                // Prüfen
                for (let i = 0; i < colLength; i++) {
                    const aValue = aRow[sCols[i]];
                    const bValue = bRow[sCols[i]];
                    if (aValue == undefined && bValue == undefined) {
                        continue;
                    } else if (aValue != undefined && bValue == undefined) {
                        if (orderIndex[i] < 0) {
                            // Absteigend
                            return -1;
                        } else {
                            // Aufsteigend
                            return 1;
                        }
                    } else if (aValue == undefined && bValue != undefined) {
                        if (orderIndex[i] < 0) {
                            // Absteigend
                            return 1;
                        } else {
                            // Aufsteigend
                            return -1;
                        }
                    }

                    // absteigend
                    if (orderIndex[i] < 0) {
                        //if (typeof aRow[colIndex[i]] == "string" && typeof bRow[colIndex[i]] == "string") {
                        if (isString[i]) {
                            // @ts-ignore
                            if (aValue.toLowerCase() > bValue.toLowerCase()) { return -1; }
                            // @ts-ignore
                            if (aValue.toLowerCase() < bValue.toLowerCase()) { return 1; }
                        } else {
                            // @ts-ignore
                            if (aValue > bValue) { return -1; }
                            // @ts-ignore
                            if (aValue < bValue) { return 1; }
                        }
                    } else {
                        // Aufsteigend
                        if (isString[i]) {
                            // @ts-ignore
                            if (aValue.toLowerCase() > bValue.toLowerCase()) { return 1; }
                            // @ts-ignore
                            if (aValue.toLowerCase() < bValue.toLowerCase()) { return -1; }
                        } else {
                            // @ts-ignore
                            if (aValue > bValue) { return 1; }
                            // @ts-ignore
                            if (aValue < bValue) { return -1; }
                        }
                    }
                } // alle Felder vergleichen

                // alle gleich
                return 0;
            });
        }

        // neuen Index speichern
        if (typeof newIndexName == "string") {
            this._indexList.set(newIndexName, rowList);
        } else if (typeof index == "string") {
            // this.#indexList.set(index, rowList);
            //this.#sortCols.set(index, sCols);
            //this.#sortColsDirection.set(index, sDirection);
        }
        return rowList;
    } // sort
}


// Umsetzung
// Alles in Tabellen Strucktur
// 1. Zeile enthält Feldnamen - Wichtig IDFeld muss immer angegeben werden
// Neue Datensätze (ID) In Map (_newRows)
// generische Klasse constructor (Array in daten)
// funktion toArray -> Feldnamen in Richtige Spalten vom Array



/// Example
// @ts-check
// import { DataTable } from "./data-table.js";
// import { Customer } from "./customer.js";

const rohDaten = [
    ["gsid", "name", "city"],
    ["C-1", "Max", "Wien"]
];

class Customer extends DataRow {
    /** Eindeutige ID */
    gsid = "";
    name = "";
    city = "";
    /** Test @type {Map<string,string>} */
    test = new Map();
    constructor() { super(); } // Zwingend erforderlich wenn man von einer anderen Klasse erbt
}

const kundenTabelle = new DataTable("customers", rohDaten, Customer, "gsid");


// --- NEUEN DATENSATZ ANLEGEN ---
// VS Code vervollständigt dir hier alles und prüft die Typen!
const neuerKunde = kundenTabelle.insert({ city: "Salzburg" });

// Werte zuweisen (schreibt LIVE ins 'rohDaten'-Array!)
neuerKunde.name = "Sabine";

console.log(neuerKunde.gsid);  // Autogenerierte GSID (z.B. "f81d4fae-...")
console.log(neuerKunde._isNew); // true (Wichtig für den Server-Sync als INSERT)
console.log(neuerKunde.test.get("aa")); 

// Überprüfung der globalen Rohdaten:
console.log(rohDaten);
/*
Output zeigt, dass die Zeile vollautomatisch am Ende des Arrays angefügt wurde:
[
  ["gsid", "name", "city"],
  ["C-1", "Max", "Wien"],
  ["f81d4fae-...", "Sabine", "Salzburg"]
]
*/
