// ============================
//    InfoTable
// ============================
// @ts-check


/** 
 * Callback Funktion die für alle Datensätze ausgeführt wird.  
 * Wenn die Funktion "true" zurückliefert, wird der Datensatz in die neue Liste und Index aufgenommen.
 * @template T
 * @callback CallbackFunction
 * @param {T} obj - Datensatz Zeile
 * @param {number} [rowIndex] - Position in der Liste nach Index
 * @param {ReturnType<DataTable<T>["readOnly"]>} [datatable] - Referenz auf die DatenTabelle
 * @returns {any} Wenn "true" dann kommt der Datensatz in die neue gefilterte Liste wenn "break" wird abgebrochen.
 */


/** 
 * Callback Funktion die für alle Datensätze ausgeführt wird.  
 * Wenn die Funktion "true" zurückliefert, wird der Datensatz in die neue Liste und Index aufgenommen.
 * @template T
 * @callback GroupFunction
 * @param {Array<T>} list - Liste mit Datensatz Objekten
 * @param {ReturnType<DataTable<T>["readOnly"]>} [datatable] - Referenz auf die DatenTabelle
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
 * Eine InMemmory Datentabelle
 * @template T
 */
export class DataTable {
    /**
     * Eine InMemmory Datentabelle
     * @param {string} tableName - Name der Tabelle
     * @param {Array<Array<any>>} dataArray - DatenZeilen. Erste Zeile enthält Spaltennamen
     * @param {string} [idColumnName] - Name der ID-DatenSpalte. Default: "gsid"
     */
    constructor(tableName, dataArray, idColumnName = "gsid") {
        /** @type {string} */
        this.tableName = tableName;
        /** @type {Array<string>} */
        this.columns = dataArray[0] || [];
        /** @type {Array<Array<any>>} */
        this.rows = dataArray;
        /** @type {string} */
        this.idColumnName = idColumnName;

        /** @type {Object<string,number>} */
        this.columnIndex = {}; // Object.fromEntries(this.columns.map((col, idx) => [col, idx]));
        for (let i = 0; i < this.columns.length; i++) {
            this.columnIndex[this.columns[i]] = i;
        }

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
     * Gib die Anzahl der Listeneinträge zurück
     * @param {string|Array<number>} [indexName] - Optional Index von dem die Länge zurückgegeben wird
     */
    getLength(indexName) {
        return this.getIndexList(indexName).length;
    }


    /**
     * Gibt alle Spalten der Tabelle zurück
     * @returns {Array<string>} Alle Spalten der Tabelle in richtiger Reihenfolge
     */
    getCols() {
        return this.columns;
    }

    /**
     * Liefert die ID eines Objektes zurück
     * @param {Object<string,any>|Array<any>} obj - Datenobjekt mit dem idFeld
     * @returns {any} ID
     */
    getID(obj) {
        if (!obj) { return; }
        if (Array.isArray(obj)) {
            const idIdx = this.columnIndex[this.idColumnName];
            return obj[idIdx];
        } else {
            return obj[this.idColumnName] || undefined;
        }
    }


    /**
     * Liefter die SpaltenIndexes der Angegeben Spalten in einer Liste zurück.
     * @param {Array<string>|string} colNames - Liste mit Spaltennamen
     * @returns {Array<number>} Liste min Spalten Indexes
     */
    getColIndex(colNames) {
        /** @type {Array<number>} */
        const colIndexList = [];
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
     * Prüft ob ein Datensatz mit abgefragter ID bereits in der List ist
     * @param {string} id - ID die gesucht wird
     * @returns {boolean} 
     */
    has(id) {
        return this.rowMap.has(id);
    }


    /**
     * Lieftert die Datensatz Position in der Liste zurück oder -1 wenn nicht gefunden.
     * @param {string|number} id - ID oder Datensatzindex
     * @returns {number} Datensatz Position oder -1 wenn nicht gefunden
     */
    getRowIndex(id) {
        // Wenn ID des Datensatzen
        if (typeof id == "string") {
            return this.rowMap.get(id) || -1;
        }

        // wenn gelöscht -> abbrechen
        if (id <= 0 || this._deleted.has(id)) { return -1; }

        return id;
    }


    /**
     * Liefert eine Liste aller IDs vom angegeben Index oder allen Datensätzen zurück.  
     * Existiert der Index nicht, wird eine die ganze Liste zurück gegeben.
     * @param {string|Array<number>} [indexName] - Indexname oder Liste mit PositionsNummern
     * @returns {Array<number>} Index-Liste der Datzensätze
     */
    getIndexList(indexName) {
        if (!indexName) {
            return [...this.rows.keys()];
        } else {
            if (Array.isArray(indexName)) { return indexName; }
            return this._indexList.get(indexName) || [...this.rows.keys()];
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
     * Liefert eine Datenzeile zurück die nicht die Kopfzeile ist, und auch noch nicht gelöscht worden ist.
     * @param {string|number} id - ID oder Datenzeilen Position
     * @returns {Array<any>|undefined}
     */
    getRow(id) {
        const rowIndex = this.getRowIndex(id);

        // wenn gelöscht -> abbrechen
        if (rowIndex <= 0) { return; }

        return this.rows[rowIndex];
    }


    /**
     * Erzeugt eine neue Datenzeile die noch nicht in der Liste angelegt wird. 
     * @param {string} [id] - Optional neue ID. Wenn nicht angegeben wird eine GSID generiert
     * @returns {Partial<T>}
     */
    newObject(id) {
        /** @type {Partial<T>} */
        const obj = {};
        //@ts-ignore
        obj[this.idColumnName] = id || getGSID();
        return obj;
    }


    /**
     * Liefert einen Datensatz als Objekt zurück
     * @param {string|number} id - ID oder DatenSatz Position 
     * @returns {T|undefined} Datensatz als Objekt
     */
    getObject(id) {
        const rawRow = this.getRow(id);
        if (!rawRow) { return; }

        /** @type {T} */
        //@ts-ignore
        const obj = {};
        for (let i = 0; i < this.columns.length; i++) {
            //@ts-ignore
            obj[this.columns[i]] = rawRow[i];
        }

        return obj;
    }


    /**
     * Liefert eine Liste mit Datensatzobjekten zurück
     * @param {string|Array<string|number>|undefined} index - Index-Name oder Liste mit ID oder Datensatz position
     * @returns {Array<T>} Liste mit Datensatz-Objekten
     */
    getObjectList(index) {
        /** @type {Array<T>} */
        let objList = [];

        if (!index || typeof index == "string") {
            index = this.getIndexList(index);
        }

        // Wenn Array
        if (Array.isArray(index)) {
            for (let i = 0; i < index.length; i++) {
                const obj = this.getObject(index[i]);
                if (obj) {
                    objList.push(obj);
                }
            }
        }

        return objList;
    }


    /**
     * Liefert den Wert einer Spalte von der angegebenen Zeilenposition zurück
     * @param {string|number} row - Zeilennummer oder ID
     * @param {string|number} col - Spaltenname oder Spalten Position
     * @returns {any}
     */
    getCellValue(row, col) {
        // Datenzeile lesen
        const rawRow = this.getRow(row);
        if (!rawRow) { return; }

        if (typeof col == "string") {
            return rawRow[this.columnIndex[col]];
        } else {
            return rawRow[col];
        }
    }


    /**
     * Speichert einen wert in einer Datensatz-Spalte, legt keinen neuen Daten an wenn nicht gefunden
     * @param {string|number} row - Zeilennummer oder ID
     * @param {string|number} col - Spaltenname oder Spalten Position
     * @param {any} value - Wert der gespeichert wird
     * @returns {string|number|undefined} die ID wenn Änderung erfolgreich
     */
    setCellValue(row, col, value) {
        // DatensatzIndex lesen
        const rowIndex = this.getRowIndex(row);
        if (rowIndex <= 0) { return; }

        if (typeof col == "string") {
            this.rows[rowIndex][this.columnIndex[col]] = value;
        } else {
            this.rows[rowIndex][col] = value;
        }

        // als Geändert markieren
        this._changed.add(rowIndex);
        return row;
    }


    /**
     * Fügt einen wert in einer Datensatz-Spalte hinzu. Die Spalte muss ein Array sein oder wird in ein Array umgewandelt. 
     * @param {string|number} row - Zeilennummer oder ID
     * @param {string|number} col - Spaltenname oder Spalten Position
     * @param {any} value - Wert der gespeichert wird
     * @returns {string|number|undefined} Die ID wenn Änderung erfolgreich
     */
    addCellArrayValue(row, col, value) {
        // DatensatzIndex lesen
        const rowIndex = this.getRowIndex(row);
        if (rowIndex <= 0) { return; }

        if (typeof col == "string") {
            col = this.columnIndex[col]
        }

        const oldValue = this.rows[rowIndex][col];
        if (Array.isArray(oldValue)) {
            if (Array.isArray(value)) {
                oldValue.concat(value);
            } else {
                oldValue.push(value);
            }
        } else if (oldValue != undefined) {
            if (Array.isArray(value)) {
                this.rows[rowIndex][col] = [oldValue, ...value];
            } else {
                this.rows[rowIndex][col] = [oldValue, value];
            }
        } else {
            if (Array.isArray(value)) {
                this.rows[rowIndex][col] = value;
            } else {
                this.rows[rowIndex][col] = [value];
            }
        }

        // als Geändert markieren
        this._changed.add(rowIndex);
        return row;
    }


    /**
     * Fügt einen wert in einer Datensatz-Spalte hinzu. Die Spalte muss ein Set sein oder wird in ein Set umgewandelt. 
     * @param {string|number} row - Zeilennummer oder ID
     * @param {string|number} col - Spaltenname oder Spalten Position
     * @param {any} value - Wert der gespeichert wird
     * @returns {string|number|undefined} Die ID wenn Änderung erfolgreich
     */
    addCellSetValue(row, col, value) {
        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                this.addCellSetValue(row, col, value[i]);
            }
            return row;
        }
        
        // DatensatzIndex lesen
        const rowIndex = this.getRowIndex(row);
        if (rowIndex <= 0) { return; }

        if (typeof col == "string") {
            col = this.columnIndex[col]
        }

        const oldValue = this.rows[rowIndex][col];
        if (oldValue instanceof Set) {
            oldValue.add(value);
        } else if (oldValue != undefined) {
            this.rows[rowIndex][col] = new Set([oldValue, value]);
        } else {
            this.rows[rowIndex][col] = new Set([value]);
        }

        // als Geändert markieren
        this._changed.add(rowIndex);
        return row;
    }


    /**
     * Setzt ein Objekt in die Liste. Die ID wird aus den Einstellungen und dem Objekt-Eigenschaften gelesen.
     * @param {Partial<T>} obj - Objekt mit Daten das in die Liste aufgenommen wird.
     * @param {boolean} [createNew] - Optional ob ein neues Objekt angelegt wird wenn nicht vorhanden. Default: true
     * @returns {string|undefined} Die ID wenn Neu oder Bearbeitet
     */
    setObject(obj, createNew = true) {
        let id = this.getID(obj);

        // Wenn keine ID dann kann nicht eingefügt werden
        if (id == undefined) {
            if (createNew == false) { return; }

            // neue ID selbst vergeben
            id = getGSID();
            //@ts-ignore
            obj[this.idColumnName] = id;
        }

        /** @type {Array<string>} neue Spalten */
        const newColNames = [...Object.keys(obj)];
        const colIds = this.getColIndex(newColNames);

        /** @type {Array<any>} */
        let rawRow = [];

        let rowIndex = this.rowMap.get(id);

        // Wenn kein rowindex
        if (rowIndex == undefined) {
            if (createNew == false) { return; }
            rawRow = new Array(this.columns.length);
            rowIndex = this.rows.push(rawRow) - 1;
            this.rowMap.set(id, rowIndex);
        } else if (rowIndex > 0) {
            rawRow = this.rows[rowIndex];
        } else {
            return;
        }

        // Werte zuweisen
        for (let i = 0; i < newColNames.length; i++) {
            //@ts-ignore
            rawRow[colIds[i]] = obj[newColNames[i]];
        }

        this._changed.add(rowIndex);
        return id;
    }


    /**
     * Setzt Eigenschaften einer Datenzeile 
     * @param {string} id - ID der Datenzeile
     * @param {Partial<T>} obj - Eigenschaften die gesetzt werden
     * @param {boolean} [createNew] - Optional ob ein neues Objekt angelegt wird wenn nicht vorhanden. Default: true
     * @returns {string|number|undefined} die ID wenn Bearbeitet oder angelegt
     */
    setValues(id, obj, createNew = true) {
        //@ts-ignore
        obj[this.idColumnName] = id;
        return this.setObject(obj, createNew);
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

        // Zeilenindex lesen
        const rowIndex = this.getRowIndex(id);
        if (rowIndex) {
            // zeile als gelöscht markieren
            this._deleted.add(rowIndex);
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
            this._indexList.set(index, rowList);
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
        const readOnlyTable = this.readOnly();

        // alle durchgehen
        for (let i = 0; i < rowIndexList.length; i++) {
            const rowIndex = rowIndexList[i];
            const obj = this.getObject(rowIndex);
            if (!obj) { continue; }

            // Funktion ausführen
            const backValue = fu(obj, rowIndex, readOnlyTable);
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
        //const colIndexList = this.getColIndex(colList);

        /** @type {Map<string,Array<T>>} */
        const groupIndex = new Map(); // merkt sich den Index der Gruppe

        /**
         * Liefert den Gruppenwert der Datenzeile
         * @param {T} obj - Datenzeile
         * @returns {string} GruppenWert
         */
        let getGroupValue = function (obj) {
            let value = "";
            for (let i = 0; i < colList.length; i++) {
                //@ts-ignore
                value += obj[colList[i]] + "_";
            }
            return value;
        }

        // alle Datenzeilen durchgehen
        for (let i = 0; i < rowIndexList.length; i++) {
            const rowIndex = rowIndexList[i];
            const obj = this.getObject(rowIndex);

            // erste Datenzeile(Feldnamen) und gelöschte Datenzeilen überspringen
            if (!obj) { continue; }

            const groupValue = getGroupValue(obj);

            // Wenn es Gruppenwert schon gibt
            if (groupIndex.has(groupValue)) {
                // Index hinzufügen
                groupIndex.get(groupValue)?.push(obj);
            } else {
                // neuen Index anlegen
                groupIndex.set(groupValue, [obj]);
            }
        } // for jeder Datensatz

        // Alle Gruppen Arrays
        const groupList = [...groupIndex.keys()];
        const readOnlyTable = this.readOnly();


        // alle Gruppierten Listen durchgehen
        for (let i = 0; i < groupList.length; i++) {
            // funktion ausführen
            const backValue = fu(groupIndex.get(groupList[i]) || [], readOnlyTable);
            if (breakValue != undefined && breakValue == backValue) { return; }
        }
    }


    /**
     * Sucht in der Liste nach angegebener Quest und liefert den Datensatz Index der gefundenen Datenzeile zurück
     * @param {Object<string,any>|CallbackFunction<T>} quest - Abfrage Objekt oder FilterFunktion
     * @param {string|Array<number>} [index] - Optional Index der für die Suche verwendet wird 
     * @returns {T|undefined} Datensatz Zeilen-Index oder -1 wenn nicht gefunden.
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

            /**
             * Sucht nach allen Spalten
             * @param {T} obj - Datenzeile
             * @returns {boolean}
             */
            fu = function find(obj) {
                for (let i = 0; i < keys.length; i++) {
                    //@ts-ignore
                    const rowValue = obj[keys[i]];
                    const questValue = quest[keys[i]];

                    if (typeof questValue == "function") {
                        // Wert gegen Funktion prüfen (Wert, Spaltenindex, Dateizeile)
                        if (!questValue(rowValue, keys[i], obj)) { return false; }
                    } else if (rowValue != questValue) {
                        return false;
                    }
                }
                return true;
            }
        } else {
            return;
        }

        const readOnlyTable = this.readOnly();        

        for (let i = 0; i < indexList.length; i++) {
            const rowIndex = indexList[i];
            const obj = this.getObject(rowIndex);

            // erste datenZeile(FeldNamen) und gelöschte auslassen
            if (!obj) { continue; }
            if (fu(obj, rowIndex, readOnlyTable)) {
                return obj;
            }
        }

        // nicht gefunden
        return;
    }


    /**
     * Sucht alle Objekte aus der Liste das mit dem übergebenen Objekt übereinstimmt und gibt das erte gefundene Objekt zurück.
     * @param {Object<string,any>|CallbackFunction<T>} quest - Abfrage Objekt oder FilterFunktion
     * @param {string|Array<number>} [index] - Optional Index der für die Suche verwendet wird 
     * @param {string} [newIndex] - Optional Name unter der der Filterindex abgelegt wird. 
     * @returns {Array<T>} Liste mit Datensatz Zeilen oder Leere Liste wenn nicht gefunden.
     */
    findAll(quest, index, newIndex) {
        const indexList = this.getIndexList(index);

        /** @type {Array<number>} */
        const newIndexList = [];
        /** @type {Array<T>} */
        const newObjList = [];

        /** @type {CallbackFunction<T>} */
        let fu;

        // Wenn Quest eine Funktion
        if (typeof quest == "function") {
            //@ts-ignore
            fu = quest;
        } else if (typeof quest == "object") {
            const keys = Object.keys(quest);

            /**
             * Sucht nach allen Spalten
             * @param {T} obj - Datenzeile
             * @returns {boolean}
             */
            fu = function find(obj) {
                for (let i = 0; i < keys.length; i++) {
                    //@ts-ignore
                    const rowValue = obj[keys[i]];
                    const questValue = quest[keys[i]];

                    if (typeof questValue == "function") {
                        // Wert gegen Funktion prüfen (Wert, Spaltenindex, Dateizeile)
                        if (!questValue(rowValue, keys[i], obj)) { return false; }
                    } else if (rowValue != questValue) {
                        return false;
                    }
                }
                return true;
            }
        } else {
            return newObjList;
        }

        const readOnlyTable = this.readOnly();

        // Alle Zeilen durchgehen
        for (let i = 0; i < indexList.length; i++) {
            const rowIndex = indexList[i];
            const obj = this.getObject(rowIndex);

            // erste datenZeile(FeldNamen) und gelöschte auslassen
            if (!obj) { continue; }
            if (fu(obj, rowIndex, readOnlyTable)) {
                newIndexList.push(rowIndex);
                newObjList.push(obj);
            }
        }

        if (newIndex) {
            // Index merken
            this._indexList.set(newIndex, newIndexList);
        }

        // gefundene Indexes
        return newObjList;
    }

    /**
     * Liefert eine Schreibgeschützte Version der Liste zurück
     * @returns {{
     * getID: DataTable<T>["getID"]
     * , getLength: DataTable<T>["getLength"]
     * , getCols: DataTable<T>["getCols"]
     * , getColIndex: DataTable<T>["getColIndex"]
     * , has: DataTable<T>["has"]
     * , getRowIndex: DataTable<T>["getRowIndex"]
     * , getIndexList: DataTable<T>["getIndexList"]
     * , hasIndexList: DataTable<T>["hasIndexList"]
     * , getCellValue: DataTable<T>["getCellValue"]
     * , sort: DataTable<T>["sort"]
     * , newObject: DataTable<T>["newObject"]
     * , getObject: DataTable<T>["getObject"]
     * , getObjectList: DataTable<T>["getObjectList"]
     * , forEach: DataTable<T>["forEach"]
     * , forGroup: DataTable<T>["forGroup"]
     * , find: DataTable<T>["find"]
     * , findAll: DataTable<T>["findAll"]
     * }} 
     */
    readOnly() {
        return {
            getID: this.getID.bind(this)
            , getLength: this.getLength.bind(this)
            , getCols: this.getCols.bind(this)
            , getColIndex: this.getColIndex.bind(this)
            , has: this.has.bind(this)
            , getRowIndex: this.getRowIndex.bind(this)
            , getIndexList: this.getIndexList.bind(this)
            , hasIndexList: this.hasIndexList.bind(this)
            , getCellValue: this.getCellValue.bind(this)
            , sort: this.sort.bind(this)
            , newObject: this.newObject.bind(this)
            , getObject: this.getObject.bind(this)
            , getObjectList: this.getObjectList.bind(this)
            , forEach: this.forEach.bind(this)
            , forGroup: this.forGroup.bind(this)
            , find: this.find.bind(this)
            , findAll: this.findAll.bind(this)
        };
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

// class Customer extends DataRow {
//     /** Eindeutige ID */
//     gsid = "";
//     name = "";
//     city = "";
//     /** Test @type {Map<string,string>} */
//     test = new Map();
//     constructor() { super(); } // Zwingend erforderlich wenn man von einer anderen Klasse erbt
// }

/**
 * @typedef {Object} Customer
 * @property {string} gsid
 * @property {string} name
 * @property {string} city
 */
let CustomerCols = ["gsid", "name", "city"];

/** @type {DataTable<Customer>} */
const kundenTabelle = new DataTable("customers", rohDaten, "gsid");

// --- NEUEN DATENSATZ ANLEGEN ---
// VS Code vervollständigt dir hier alles und prüft die Typen!
const neuerKunde = kundenTabelle.newObject();
neuerKunde.city = "Salzburg";

// Werte zuweisen (schreibt LIVE ins 'rohDaten'-Array!)
neuerKunde.name = "Sabine";

console.log(neuerKunde.gsid);  // Autogenerierte GSID (z.B. "f81d4fae-...")

kundenTabelle.setObject(neuerKunde);

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
