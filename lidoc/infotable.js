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
    isDirty() { return false; }

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
     * @param {T} modelClass - Modell Klasse
     * @param {string} idColumnName - Name der ID-DatenSpalte. Default: "gsid"
     */
    constructor(tableName, dataArray, modelClass, idColumnName = "gsid") {
        this.tableName = tableName;
        this.columns = dataArray[0] || [];
        this.rows = dataArray;
        this.idColumnName = idColumnName;
        //** @type {T} */
        this.modelClass = modelClass; // Hier merken wir uns die Daten Modell Klasse

        this.columnIndex = Object.fromEntries(this.columns.map((col, idx) => [col, idx]));
        this.rowMap = new Map();

        const idIdx = this.columnIndex[idColumnName];
        for (let i = 1; i < this.rows.length; i++) {
            this.rowMap.set(this.rows[i][idIdx], i);
        }

        this._instanzCache = new Map();
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
     * Erstellt einen neuen, stark typisierten Datensatz im System
     * @param {Object<string,any>} [initialData] - Optionale Startwerte, z.B. { name: "Interessent" }
     * @returns {InstanceType<T>} Eine instanziierte, stark typisierte Modell-Klasse (z.B. ein Customer)
     */
    insert(initialData = {}) {
        // 1. Erzeuge eine garantiert eindeutige GSID auf dem Client
        const newId = getGSID();

        // 2. Erstelle ein leeres Array, das exakt so lang ist wie die Spaltenanzahl
        //    und fülle es mit 'null' (bzw. Standardwerten)
        const newRowArray = new Array(this.columns.length).fill(null);

        // 3. Setze die ID in die dafür vorgesehene Spalte des neuen Arrays
        const idIdx = this.columnIndex[this.idColumnName];
        newRowArray[idIdx] = newId;

        // 4. Erzeuge eine frische Instanz der hinterlegten Modell-Klasse
        // @ts-ignore
        const emptyInstance = new this.modelClass();

        // 5. Verknüpfe die Instanz magisch mit dem frisch erzeugten Array
        const stronglyTypedView = bindRow(emptyInstance, newRowArray, this.columnIndex);

        // Markiere diesen Datensatz als "neu erstellt"
        stronglyTypedView._isNew = true;

        // 6. Falls Standardwerte übergeben wurden, weise sie über die Setter zu
        Object.keys(initialData).forEach(key => {
            if (key in this.columnIndex) {
                stronglyTypedView[key] = initialData[key];
            }
        });

        // 7. WICHTIG: Füge das neue Array direkt in die Rohdaten-Liste der Tabelle ein!
        this.rows.push(newRowArray);

        // Aktualisiere das Index-Mapping für spätere getById-Abfragen
        this.rowMap.set(newId, this.rows.length - 1);

        // Im Instanz-Cache merken, damit das System weiß, wer aktiv editiert wird
        this._instanzCache.set(newId, stronglyTypedView);

        return stronglyTypedView;
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

console.log(neuerKunde.gsid);  // Autogenerierte UUID (z.B. "f81d4fae-...")
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
