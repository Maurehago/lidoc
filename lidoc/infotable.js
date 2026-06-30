// ============================
//    InfoTable
// ============================
// @ts-check


/** 
 * Callback Funktion die für alle Datensätze ausgeführt wird.  
 * Wenn die Funktion "true" zurückliefert, wird der Datensatz in die neue Liste und Index aufgenommen.
 * @template T
 * @callback CallbackFunction
 * @param {Array<any>} row - Datensatz Zeile
 * @param {number} [rowIndex] - Position in der Liste nach Index
 * @param {DataTable<T>} [datatable] - Referenz auf die DatenTabelle
 * @returns {any} Wenn "true" dann kommt der Datensatz in die neue gefilterte Liste wenn "break" wird abgebrochen.
 */


/** 
 * Callback Funktion die für eine Spalte einer Datenzeile.  
 * Wenn die Funktion "true" zurückliefert, wird der Datensatz in die neue Liste und Index aufgenommen.
 * @callback ColFilterFunction
 * @param {any} value - Wert der Datenspalte
 * @param {number} [colIndex] - Index der Spalte im Datensatz
 * @param {Array<any>} [rawRow] - Datenzeile
 * @returns {boolean|undefined} Wenn "true" dann kommt der Datensatz in die neue gefilterte Liste.
 */


/** 
 * Callback Funktion die für alle Datensätze ausgeführt wird.  
 * Wenn die Funktion "true" zurückliefert, wird der Datensatz in die neue Liste und Index aufgenommen.
 * @template T
 * @callback GroupFunction
 * @param {Array<number>} row - Datensatz Zeile
 * @param {DataTable<T>} [datatable] - Referenz auf die DatenTabelle
 * @returns {any} Wenn "true" dann kommt der Datensatz in die neue gefilterte Liste wenn "break" wird abgebrochen.
 */


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
 * @template T
 * @param {Object<string,any>} instance - Klassen Instanz Objekt
 * @param {Array<any>} rowArray - DatenZeile
 * @param {number} rowIndex - DatenZeile
 * @param {DataTable<T>} list - Spalten Index Objekt
 * @returns {any} mit Settern und Gettern verbessertes Instanz-Objekt
 */
export function bindRow(instance, rowArray, rowIndex, list) {
    instance._row = rowArray;
    instance._rowIndex = rowIndex;
    instance._columnIndex = list.columnIndex;
    instance._changes = new Set(); // Set mit Spaltennamen, dessen Werte geändert worden sind
    instance._isNew = false; // Standardmäßig existiert der Datensatz schon in der DB
    instance._isDeleted = false; // Wenn Datensatz als gelöscht markiert ist
    instance._list = list;

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

    // Alle bekannten Spalten durchgehen
    for (let i = 0; i < list.columnIndex.length; i++) {
        const colName = list.columnIndex[i];
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
                    this._list._changed.add(this._rowIndex);
                }
            },
            configurable: true,
            enumerable: true
        });
    };

    // Hilfsmethode, um alle Felder auszugeben, die nicht 'null' sind (für den Insert-Payload)
    instance.getPopulatedFields = function () {
        const colList = [];
        for (let i = 0; i < instance._index; i++) {
            if (instance[instance._index[i]] !== null) {
                colList.push(instance._index[i]);
            }
        }
        return colList;
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
     * @param {Array<Array<any>>|undefined} dataArray - DatenZeilen. Erste Zeile enthält Spaltennamen
     * @param {T} modelClass - Daten Modell Klasse
     * @param {string} idColumnName - Name der ID-DatenSpalte. Default: "gsid"
     */
    constructor(tableName, dataArray, modelClass, idColumnName = "gsid") {
        /** @type {string} */
        this.tableName = tableName;

        if (!dataArray) {
            //@ts-ignore
            dataArray = [[...Object.keys(modelClass)]];
        }

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
            this.rowMap.set(this.rows[i][idIdx] + "", i);
        }

        this._instanzCache = new Map();
        /** @type {Map<string,Array<number>>} */
        this._indexList = new Map();

        /** @type {Set<number>} */
        this._changed = new Set();

        /** @type {Set<number>} */
        this._deleted = new Set();
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
     * Liefter die SpaltenIndexes der Angegeben Spalten in einer Liste zurück.
     * @param {Array<string>|string} colNames - Liste mit Spaltennamen
     * @returns {Array<number>} Liste min Spalten Indexes
     */
    getColIndex(colNames) {
        /** @type {Array<number>} */
        const colIndexList =[];
        if (Array.isArray(colNames)) {
            for (let i = 0; i < colNames.length; i++) {
                colIndexList.push(this.columnIndex[colNames[i]]);
            }
            return colIndexList;
        } else {
            return [this.columnIndex[colNames]];
        }
    }


    /**
     * Liefert eine DatenModellKlasse Instanz zurück 
     * @param {string|number} id - eindeutige ID oder PositionsIndex des Datensatzes
     * @returns {InstanceType<T>|undefined} DatenModell instanz
     */
    getAsObject(id) {
        let rowIndex = -1;
        let rowId = "";
        if (typeof id === "string") {
            rowId = id;
            rowIndex = this.rowMap.get(id) || -1;
        } else {
            rowIndex = id;
        }

        // nicht Vorhanden oder gelöscht
        if (rowIndex < 0 || this._deleted.has(rowIndex)) { return; }

        const rawRow = this.rows[rowIndex];
        if (!rowId) {
            rowId = this.getID(rawRow);
        }

        // Wenn bereits im cache -> zurückliefern
        if (this._instanzCache.has(rowId)) return this._instanzCache.get(rowId);

        // neue leere Instanz der Daten Model Klasse erstellen
        // @ts-ignore
        const emptyInstance = new this.modelClass();

        // Daten Array mit der Daten-Modell Instanz verknüpfen
        const stronglyTypedView = bindRow(emptyInstance, rawRow, rowIndex, this);

        // Instanz im Chache merken
        this._instanzCache.set(id, stronglyTypedView);
        return stronglyTypedView;
    }


    /**
     * Liefert den Wert einer Spalte von der angegebenen Zeilenposition zurück
     * @param {number|string} row - Zeilennummer oder ID
     * @param {string|number} col - Spaltenname oder Spalten Position
     * @returns {any}
     */
    getCellValue(row, col) {
        let rowIndex = -1;
        if (typeof row == "string") {
            rowIndex = this.rowMap.get(row) || -1;
        } else {
            rowIndex = row;
        }
        
        // wenn gelöscht -> abbrechen
        if (this._deleted.has(rowIndex)) {return;}

        // Datenzeile lesen
        const rawRow = this.rows[rowIndex];

        if (typeof col == "string") {
            return rawRow[this.columnIndex[col]];
        } else {
            return rawRow[col];
        }
    }


    /**
     * Liefert eine Liste aller IDs vom angegeben Index oder allen Datensätzen zurück.  
     * Existiert der Index nicht, wird eine leere Liste zurück gegeben.
     * @param {string|Array<number>} [indexName] - Indexname oder Liste mit PositionsNummern
     * @returns {Array<number>} Index-Liste der Datzensätze
     */
    getIndexList(indexName) {
        if (!indexName) {
            return [...this.rows.keys()];
        } else {
            if (Array.isArray(indexName)) { return indexName; }
            return this._indexList.get(indexName) || [];
        }
    }

    /**
     * Prüft ob ein bestimmter index in der Liste vorhanden ist
     * @param {string} indexName - Index Name
     * @returns {boolean} "true" wenn Index mit dem Namen vorhanden
     */
    hasIndexList(indexName) {
        return this._indexList.has(indexName);
    }



    /**
     * Erstellt einen neuen, stark typisierten Datensatz im System
     * @param {Object<string,any>} [initialData] - Optionale Startwerte, z.B. { name: "Interessent" }
     * @param {boolean} [overwrite] - Obptional bestehenden Datensatz überschreiben. Default: true 
     * @returns {InstanceType<T>} Eine instanziierte, stark typisierte Modell-Klasse (z.B. ein Customer)
     */
    insert(initialData = {}, overwrite = true) {
        // eindeutige GSID erstellen
        const newId = initialData[this.idColumnName] || getGSID();

        // Prüfen ob schon vorhanden
        if (this.rowMap.has(newId)) {
            const view = this.getAsObject(newId);
            if (view && overwrite) {
                // neue Werte zuweisen
                Object.assign(view, initialData);
                return view;
            }
        }

        // ab hier ID nicht vorhnden oder gelöscht

        // leeres Array, das exakt so lang ist wie die Spaltenanzahl
        // und mit 'null' (bzw. Standardwerten) befüllen
        const newRowArray = new Array(this.columns.length).fill(null);

        // ID in richtige Spalte setzen
        const idIdx = this.columnIndex[this.idColumnName];
        newRowArray[idIdx] = newId;

        // neue Instanz der hinterlegten Modell-Klasse
        // @ts-ignore
        const emptyInstance = new this.modelClass();

        // das neue Array direkt in die Rohdaten-Liste der Tabelle einfügen
        const rowIndex = this.rows.push(newRowArray) -1;

        // Instanz mit dem Array verknüpfen
        const stronglyTypedView = bindRow(emptyInstance, newRowArray, rowIndex, this);

        // Datensatz als "neu erstellt" markieren
        stronglyTypedView._isNew = true;

        // übergebene Standardwerte über die Setter zuweisen
        Object.assign(stronglyTypedView, initialData);

        // ID Sicherhaltshalber neu setzen -> falls noch nicht vorhanden oder Überschrieben worden ist
        stronglyTypedView[this.idColumnName] = newId;

        // Index-Mapping erstellen für spätere getById-Abfragen
        this.rowMap.set(newId, this.rows.length - 1);

        // Im Instanz-Cache merken, damit das System weiß, wer aktiv editiert wird
        this._instanzCache.set(newId, stronglyTypedView);

        return stronglyTypedView;
    }


    /**
     * Setzt ein objekt in die Liste. Die ID wird aus den Einstellungen und dem Objekt-Eigenschaften gelesen.
     * @param {Object<string,any>} obj - Obekt das in die Liste aufgenommen wird.
     * @returns {InstanceType<T>|undefined} Eine instanziierte, stark typisierte Modell-Klasse (z.B. ein Customer)
     */
    setObject(obj) {
        const id = this.getID(obj);

        // Wenn keine ID dann kann nicht eingefügt werden
        if (id == undefined) {return;}

        // Prüfen ob bereits in der Liste
        if (this.rowMap.has(id)) {
            const view = this.getAsObject(id);
            if (!view) {return;}
            
            // neue Werte zuweisen
            Object.assign(view, obj);
            return view;
        } else {
            // Daten neu einfügen
            return this.insert(obj);
        }
    }


    /**
     * Markiert einen oder mehrere Datensätze aus der Liste als gelöscht
     * @param {string|number|Array<string|number>} id - ID oder ZeilenIndex oder Liste mit Ids oder ZeilenIndexes
     */
    delete(id) {
        // Wenn liste mit ID's
        if (Array.isArray(id)) {
            for (let i = 0; i < id.length; i++) {
                this.delete(id);
            }
            return;
        }

        // Wenn id String, ist ID-Wert
        if (typeof id == "string") {
            this._deleted.add(this.rowMap.get(id) || -1);
        } else {
            this._deleted.add(id);
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
     * @returns {Array<number>} sortierte Liste mit sortiertem Datenzeilen-Positionen
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

                // Kopfzeile immer als erstes
                if (a === 0) return -1; // 'a' ist die Kopfzeile, bleibt oben
                if (b === 0) return 1;  // 'b' ist die Kopfzeile, bleibt oben

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


    /**
     * Führt die angegebene Funktion für jeden Datensatz, oder jeden Datensatz im angegebenen index, aus.  
     * @param {CallbackFunction<T>} fu - Funktion die pro Datensatz ausgeführt wird.
     * @param {string} [index] - optionaler Index Name oder Liste von ID's der als Datenquelle verwendet wird
     * @param {any} [breakValue] - Optionaler Wert, wenn dieser von der Funktion zurückgegeben wird, wird Abgebrochen und dieser Wert zurückgegeben
     * @returns {void}
     */
    forEach(fu, index, breakValue) {
        if (typeof fu != "function") { return; }
        
        // Daten zum Filtern
        const rowIndexList = this.getIndexList(index);

        // alle durchgehen
        for (let i = 0; i < rowIndexList.length; i++) {
            const rowIndex = rowIndexList[i];
            if (rowIndex == 0 || this._deleted.has(rowIndex)) {continue;}
            
            // Funktion ausführen
            const backValue = fu(this.rows[rowIndex], rowIndex, this);
            if (backValue != undefined && backValue == breakValue) { 
                return backValue;
            };
        }
    }


    /**
     * Führt die Angegebene Funktion, pro Gruppierung nach den Angegebenen Spalten, aus.
     * @param {GroupFunction<T>} fu - Funktion die für jede Gruppierung aufgerufen wird.
     * @param {string|Array<string>} colList - Liste der Spalten nach denen Gruppiert wird.
     * @param {string|Array<number>} [index] - Optionaler Index der für die Gruppierung verwendet wird.
     * @param {any} [breakValue] - Optionaler Wert der die Ausführung abbricht.
     * @returns {void}
     */
    forGroup(fu, colList, index, breakValue) {
        if (typeof fu != "function") { return; }
        
        // Daten zum Filtern
        const rowIndexList = this.getIndexList(index);
        const colIndexList = this.getColIndex(colList);
        
        /** @type {Map<string,Array<number>>} */
        const groupIndex = new Map(); // merkt sich den Index der Gruppe

        /**
         * Liefert den Gruppenwert der Datenzeile
         * @param {Array<any>} row - Datenzeile
         * @returns {string} GruppenWert
         */
        let getGroupValue = function(row) {
            let value = "";
            for (let i = 0; i < colIndexList.length; i++) {
                value += row[colIndexList[i]];
            }
            return value;
        }

        // alle Datenzeilen durchgehen
        for (let i = 0; i < rowIndexList.length; i++) {
            const rowIndex = rowIndexList[i];

            // erste Datenzeile(Feldnamen) und gelöschte Datenzeilen überspringen
            if (rowIndex == 0 || this._deleted.has(rowIndex)) {continue;}

            const groupValue = getGroupValue(this.rows[rowIndex]);

            // Wenn es Gruppenwert schon gibt
            if (groupIndex.has(groupValue)) {
                // Index hinzufügen
                groupIndex.get(groupValue)?.push(rowIndex);
            } else {
                // neuen Index anlegen
                groupIndex.set(groupValue, [rowIndex]);
            }
        } // for jeder Datensatz

        // Alle Gruppen Arrays
        const groupList = [...groupIndex.keys()];

        // alle Gruppierten Listen durchgehen
        for (let i = 0; i < groupList.length; i++) {
            // funktion ausführen
            const backValue = fu(groupIndex.get(groupList[i]) || [], this);
            if (breakValue != undefined && breakValue == backValue) {return;}
        }
    }


    /**
     * Sucht in der Liste nach angegebener Quest und liefert den Datensatz Index der gefundenen Datenzeile zurück
     * @param {Object<string,any>|CallbackFunction<T>} quest - Abfrage Objekt oder FilterFunktion
     * @param {string|Array<number>} [index] - Optional Index der für die Suche verwendet wird 
     * @returns {number|-1} Datensatz Zeilen-Index oder -1 wenn nicht gefunden.
     */
    find(quest, index) {
        const indexList = this.getIndexList(index);

        /** @type {CallbackFunction<T>} */
        let fu;

        // Wenn Quest eine Funktion
        if (typeof quest == "function") {
            //@ts-ignore
            fu = quest;
        } else if (typeof quest == "object") {
            const keys = Object.keys(quest);
            const colIndexList = this.getColIndex(keys);
    
            /**
             * Sucht nach allen Spalten
             * @param {Array<any>} row - Datenzeile
             * @returns {boolean}
             */
            fu = function find(row) {
                for (let i = 0; i < keys.length; i++) {
                    const rowValue = row[colIndexList[i]];
                    const questValue = quest[keys[i]];

                    if (typeof questValue == "function") {
                        // Wert gegen Funktion prüfen (Wert, Spaltenindex, Dateizeile)
                        if (!questValue(rowValue, colIndexList[i], row)) { return false; }
                    } else if (rowValue != questValue) {
                        return false;
                    }
                }
                return true;
            }
        } else {
            return -1;
        }


        for (let i = 0; i < indexList.length; i++) {
            const rowIndex = indexList[i];

            // erste datenZeile(FeldNamen) und gelöschte auslassen
            if (rowIndex == 0  || this._deleted.has(rowIndex)) {continue;}
            if (fu(this.rows[rowIndex], rowIndex, this)) {
                return rowIndex;
            }
        }

        // nicht gefunden
        return -1;
    }


    /**
     * Sucht ein Objekt aus der Liste das mit dem übergebenen Objekt übereinstimmt und gibt das erte gefundene Objekt zurück.
     * @param {Object<string,any>|CallbackFunction<T>} quest - Abfrage Objekt oder FilterFunktion
     * @param {string|Array<number>} [index] - Optional Index der für die Suche verwendet wird 
     * @param {string} [newIndex] - Optional Name unter der der Filterindex abgelegt wird. 
     * @returns {Array<number>} Liste mit Datensatz Zeilen-Indexes oder Leere Liste wenn nicht gefunden.
     */
    findAll(quest, index, newIndex) {
        const indexList = this.getIndexList(index);
        
        /** @type {Array<number>} */
        const newIndexList = [];

        /** @type {CallbackFunction<T>} */
        let fu;

        // Wenn Quest eine Funktion
        if (typeof quest == "function") {
            //@ts-ignore
            fu = quest;
        } else if (typeof quest == "object") {
            const keys = Object.keys(quest);
            const colIndexList = this.getColIndex(keys);
    
            /**
             * Sucht nach allen Spalten
             * @param {Array<any>} row - Datenzeile
             * @returns {boolean}
             */
            fu = function find(row) {
                for (let i = 0; i < keys.length; i++) {
                    const rowValue = row[colIndexList[i]];
                    const questValue = quest[keys[i]];

                    if (typeof questValue == "function") {
                        // Wert gegen Funktion prüfen (Wert, Spaltenindex, Dateizeile)
                        if (!questValue(rowValue, colIndexList[i], row)) { return false; }
                    } else if (rowValue != questValue) {
                        return false;
                    }
                }
                return true;
            }
        } else {
            return newIndexList;
        }

        // Alle Zeilen durchgehen
        for (let i = 0; i < indexList.length; i++) {
            const rowIndex = indexList[i];

            // erste datenZeile(FeldNamen) und gelöschte auslassen
            if (rowIndex == 0  || this._deleted.has(rowIndex)) {continue;}
            if (fu(this.rows[rowIndex], rowIndex, this)) {
                newIndexList.push(rowIndex);
            }
        }

        if (newIndex) {
            // Index merken
            this._indexList.set(newIndex, newIndexList);
        }

        // gefundene Indexes
        return newIndexList;
    }


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
