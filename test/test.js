// Testen von Infoliste
import { InfoList } from "../infolist/infolist.js";

// Liste anlegen
let liste1 = new InfoList("liste1");
liste1.Fields = ["id", "Name", "Adresse"];
liste1.Types = ["int", "str", "str"];

// Daten anlegen
liste1.Data = new Map();
liste1.Data.set("1", [1, "Max Muster", "Musterstrasse 1"]);
liste1.Data.set("2", [2, "Hugo Habich", "Vogelweg 25"]);

// Log vor Strinify
console.log("infolist: ", liste1);

// In JSON string umwandeln
const jsonString = liste1.stringify();

// String loggen
console.log("string:", jsonString);

// neue Infoliste
let neueListe = new InfoList();

// JSON einlesen
neueListe.parse(jsonString);

// neue Listen anzeigen
console.log("neu: ", neueListe);

// Wert auslesen
const value = neueListe.getValues("2", ["Name", "Adresse"]);
console.log("wert: ", value);

// Wert setzen
neueListe.setValue("1", "Name", "nur Testy");
console.log("neuer Wert in Datensatz: ", neueListe.get("1"));

// neuen Datensatz setzen
neueListe.set("5", [5, "neuer Name", "neue Adresse"]);

console.log("liste:", neueListe);

// TableDataString
const tableDataString = neueListe.getTableDataHTML(["Name", "Adresse"], ["5", "2", "1"]);
console.log("tableData:", tableDataString)
