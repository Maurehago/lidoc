// Testen von Infoliste
import { ILists, InfoList } from "../infolist/infolist.js";

// Liste anlegen
let liste1 = new InfoList("liste1");
liste1.Fields = ["id", "Name", "Adresse"];
liste1.Types = ["int", "str", "str"];

// Daten anlegen
liste1.Data = new Map();
liste1.Data.set("1", [1, "Max Muster", "Musterstrasse 1"]);
liste1.Data.set("2", [2, "Hugo Habich", "Vogelweg 25"]);

// Infoliste anlegen
let iList = new ILists();

// Liste zuordnen
iList.set("liste1", liste1);

// Log vor Strinify
console.log("infolist: ", iList);

// In JSON string umwandeln
const jsonString = iList.Marshal();

// String loggen
console.log("string:", jsonString);

// neue Infoliste
let neueListen = new ILists();

// JSON einlesen
neueListen.Unmarshal(jsonString);

// neue Listen anzeigen
console.log("neu: ", neueListen);

// Wert auslesen
const il2 = neueListen.get("liste1");
const value = il2.GetValues("2", ["Name", "Adresse"]);
console.log("wert: ", value);

// Wert setzen
il2.SetValue("1", "Name", "nur Testy");
console.log("neuer Wert in Datensatz: ", il2.Get("1"));

// neuen Datensatz setzen
il2.Set("5", [5, "neuer Name", "neue Adresse"]);

console.log("liste:", il2);
