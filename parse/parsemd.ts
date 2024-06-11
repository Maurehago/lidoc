// lidoc Markdown Parser

import { existsSync } from "@std/fs/exists";
import { Site } from "./parse.ts";

let is_first_line: boolean = false;
let is_data: boolean = false;
let data: any = {};
let last_obj: any = {};
let last_key: string = "";
let last_step: number = 0;
let data_path: string = "";
let step_path: any = {};


// Markdown
var row_tag: string = "r_float";
var col_tag: string = "c_float";
var is_row: boolean = false;
var is_col: boolean = false;
var is_p: boolean = false;
var is_code: boolean = false;
var is_multiline = false;

// neuer Text zum anzeigen
var new_text: string = "";


/**
 * Trennt einen Text beim ersten Vorkommen des Trennzeichens
 * und gibt ein String-Array mit 3 Werten zurück.
 * ["erster Teil", "zweiter Teil", "ok"/"value"/"nok"]
 * "ok" = wurde getrennt / "value" = kein erster wert Vorhanden / "nok" = Trennzeichen nicht gefunden
 * @param s {string} Der Text der getrennt wird
 * @param sep {string} Trennzeichen
 * @returns {string[]}
 */
function cut_string(s: string, sep: string): string[] {
    let pos1: number = s.indexOf(sep);
    if (pos1 < 0) {
        return [s, "", ""];
    } else if (pos1 == 0) {
        return ["", s.substring(1), "value"];
    }

    // Auftrennen
    let key: string = s.substring(0, pos1);
    let value: string = s.substring(pos1 +1);

    return [key, value, "ok"];
} // cut_string

/**
 * Liefert einen Wert von einem Datenobjekt mit angegebenen Pfad zurück.
 * Der Pfad muss dabei mit "." getrennt angegeben werden
 * @param obj {object} Daten-Objekt
 * @param path {string} Pfad zu der Eigenschaft von obj. Wird mit "." getrennt
 * @returns {any} Wert vom obj[path]
 */
function get_data_value(obj: any, path: string): any {
    let len: number = path.length;
    if (len < 1) {
        return obj;
    }

    // Aufsplitten
    let s: string[] = cut_string(path, ".");
    let key: string = s[0];
    let next_path:string = s[1];
    let ok: string = s[2];

    if (ok == "nok") {
        return obj[path];
    } else if (ok == "value") {
        return obj[next_path];
    }
    return get_data_value(obj[key], next_path);
} // get_data_value


// Daten parsen
function parse_data(line: string) {
    // Wenn keine Daten zum Parsen
    if (!is_data) {
        return;
    }

    // Wenn letzte Datenzeile
    if (line.startsWith("---")) {
        // todo: eventuell letzte Daten abschliessen
        is_data = false;
        return;
    }

    let step: number = line.search(/\S|$/);

    // Zeile ohne Leerzeichen am Beginn und Ende
    let trim_line: string = line.trim();

    // Wenn Zeile Leer
    if (trim_line == "") {
        // Wenn letzte Zeile Text war
        if (last_obj) {
            let v: any = last_obj[last_key];
            if (typeof(v) == "string") {
                last_obj[last_key] += "\n";
            }
        }
        return;
    } // wenn Leere Zeile

    // Zeile mit ":" auftrennen
    let kv: string[] = cut_string(trim_line, ":")   // 0 = Key / 1 = value / 2 = "ok" wurde getrennt
    let key: string = kv[0];
    let value: string = kv[1].trim();
    let ok:string = kv[2];
    
    // Wenn an der Basis
    if (step == 0) {
        data_path = "";
        last_key = "";  // ???
        last_obj = data;
    } else if (step > last_step) {
        // nächster pfad wenn kein Text
        if (typeof(last_obj[last_key]) == "object") {
            // neues Objekt merken
            last_obj = last_obj[last_key];
            
            // Pfad zu Objekt erhöhen
            if (data_path) {
                data_path += "." + last_key;
            } else {
                data_path = last_key;
            }
        }

        // Daten-Pfad für Stufe merken
        step_path[step] = data_path;
    } else if (step < last_step) {
        // voriges Objekt - im Pfad einen schritt zurück
        //let pos1: number = data_path.lastIndexOf(".");
        //data_path = data_path.substring(0, pos1);
        data_path = step_path[step];
        last_obj = get_data_value(data, data_path);
    }

    // Stufe merken
    last_step = step;

    // Wenn Key/Value / ist Objekt
    if (ok == "ok") {
        // multiline
        if (is_multiline) {
            if (step == 0) {
                is_multiline = false;
            } else if (typeof last_obj[last_key] == "string") {
                // wenn String
                last_obj[last_key] += trim_line + "\n";
            }
            return;
        }

        // Wenn Key ein Item
        if (key.startsWith("- ")) {
            // Ist Objekt Item -> Letztes Objekt muss ein Array sein
            key = key.replace("- ", "");

            // Wenn kein Array dann letztes Objekt in ein Array
            if (!Array.isArray(last_obj)) {
                // Vorletztes Objekt lesen
                let pos1: number = data_path.lastIndexOf(".");
                let path = data_path.substring(0, pos1);
                let obj = get_data_value(data, path);
                obj[last_key] = [];
                last_obj = obj[last_key];
            }

            // neues Objekt hinzufügen
            let new_obj: any = {};
            new_obj[key] = value;
            let new_key: number = last_obj.push(new_obj) -1;
            last_key = new_key.toString();
        } else if (value == "|") {
            // Es folgt mehrzeiliger Text
            last_obj[key] = "";
            last_key = key;
            is_multiline = true;
        } else if (value == "") {
            // Ist Objekt
            last_obj[key] = {};
            
            // neue Merken
            last_key = key;
        } else {
            // Nur Key Value
            last_obj[key] = value;
        }
    } else {
        // Zeile ist Wert
        value = trim_line;

        // auf Item prüfen
        if (value.startsWith("- ")) {
            // ist Item
            value = value.replace("- ", "");

            // Wenn kein Array dann letztes Objekt in ein Array
            if (!Array.isArray(last_obj)) {
                // Vorletztes Objekt lesen
                let pos1: number = data_path.lastIndexOf(".");
                let path = data_path.substring(0, pos1);
                let obj = get_data_value(data, path);
                obj[last_key] = [];
                last_obj = obj[last_key];
            }

            // neues Objekt hinzufügen
            last_obj.push(value);
        } else if (typeof last_obj[last_key] == "string") {
            // wenn String
            last_obj[last_key] += trim_line + "\n";
        }
    } // if else ok
} // parse_data


// Zeile zu neuen Text hinzufügen
function add_text(text: string) {
    // Prüfen auf Zeile und Spalte
    if (!is_row) {
        // noch keine Zeile
        new_text += "<" + row_tag + "><" + col_tag + ">" + text;
        is_row = true;
        is_col = true; 
    } else if (!is_col) {
        // noch keine Spalte
        new_text += "<" + col_tag + ">" + text;
    } else {
        // nur Text hinzufügen
        new_text += text;
    }
} // add_text

// Absatz prüfen
function parse_p(line: string): boolean {
    var text: string = "";
    if (!is_p) {
        text = "<p>" + line;
        is_p = true;
    } else {
        text = "</br>" + line;
    }
    add_text(text);
    return true;
} // parse_p

// Code prüfen
function parse_code(line: string): boolean {
    if (line.startsWith("```")) {
        let code_param: string = line.replace("```", "");
        if (code_param) {
            // todo: Code Parameter prüfen
        }

        let text: string = "";

        // Wenn schon ein Codeblock
        if (is_code) {
            text += "</code></pre>";
            is_code = false;
        } else {
            // Code beginnen
            text += "<pre><code>";
            is_code = true;
        }

        // Text hinzufügen
        add_text(text);
        return true;
    } // wenn Code Beginn / ende

    if (is_code) {
        // zeile hinzufügen
        new_text += line + "</br>";
        return true;
    }

    // kein Code
    return false;
} // parse_code

// Header Zeilen prüfen
function parse_header(line: string): boolean {
    if (!line.startsWith("#")) {
        // kein header
        return false;
    }

    let text: string = "";
    let tag: string = "";

    // Anzahl Header Zeichen "#"
    let header = cut_string(line, " ");

    // Wenn richtig gecuttet
    if (header[2] == "ok") {
        let anz: number = header[0].length;
        tag = "h" + anz;
        text = header[1];
    }

    if (!tag) {
        // kein header
        return false;
    }

    // todo: Header attribute

    // Wenn noch ein Absatz offen
    if (is_p) {
        new_text += "</p>";
        is_p = false;
    }

    // Text hinzufügen
    add_text("<" + tag + ">" + text + "</" + tag + ">");

    // OK
    return true;
} // parse_header


// Markdown parsen
function parse_row(line:string) {
    let trim_line: string = line.trim();

    // Wenn zeile leer ist
    if (trim_line == "") {
        // Wenn Absatz
        if (is_p) {
            // Absatz schliessen
            new_text += "</p>";
            is_p = false;

            // todo: prüfen auf 2. Leerzeile

            return;
        }
    } // if leere Zeile

    // Code Parsen
    if (parse_code(line)) {
        return;
    }

    // Header Parsen
    if (parse_header(line)) {
        return;
    }

    // Absatz
    if (parse_p(line)) {
        return;
    }
} // parse_row



// Parse Funktion
export function parse(filePath: string): Site {
    // Wenn die Datei nicht existiert
    if (!existsSync(filePath, {isReadable: true, isFile: true})) {
        return {};
    }

    // Datei laden
    let file = Deno.readTextFileSync(filePath);

    // in Zeilen aufsplitten
    let lines = file.split("\n");
    is_first_line = true;

    // Alle Zeilen durchgehen
    lines.forEach((line: string, index: number) => {
       // console.log(is_first_line, is_data, line);

        // wenn erste Zeile
        if (is_first_line && line.startsWith("---")) {
            // Datenzeile
            is_data = true;

            // Daten zurücksetzen
            data = {};
            data_path = "";
            last_key = "";
            last_step = 0;

        } else if (is_data) {
            // Daten Parsen
            parse_data(line);
        } else {
            // Zeile als Markdown parsen
            parse_row(line);
        }

        // erste Zeile zurücksetzen
        is_first_line = false;
    })

    // console.log(data);

    // Rückgabe
    let site_data: Site = {
        data: data
        , content: new_text
    }

    return site_data;
} // parse
