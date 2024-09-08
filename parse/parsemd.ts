// ===========================
//   Markdown Dateien Parsen
// 2024-08-27
// ===========================

type Data = {
    [key: string]: string | string[];
};

// Informationen zu der geparsten Seite
export interface SiteInfo {
    html: string;
    data: Data;
    imageList: string[];
    linkList: string[];
}

// Optionen für den Parser
export interface ParseOptions {
    rowTag: string; // HTML-TagName einer Zeile
    colTag: string; // HTML-TagName einer Spalte
}

// Erzeugt aus dem Inhalt einer Markdown Datei
// eine Seiten Information, mit geparstem html
export function parseMd(mdString: string, options?: ParseOptions): SiteInfo {
    // ====================
    //   Tag namen
    // ------------------
    const rowTag: string = options?.rowTag || "f-row";
    const colTag: string = options?.colTag || "f-item";

    // Regular Expression

    // Fettschrift
    const regularBold = new RegExp("\*\*(.*?)\*\*");

    // ====================
    //   basis Variablen
    // ------------------

    // neue Seite
    let site: SiteInfo = {
        html: "",
        data: {},
        imageList: [],
        linkList: [],
    };

    let newAttribute: string = "";
    let isData: boolean = false;
    let isCode: boolean = false;
    let isRow: boolean = false;
    let isRowCol: boolean = false;
    let isList: boolean = false;
    let isLi: boolean = false;
    let isP: boolean = false;
    let isTable: boolean = false;

    // HTML String
    let htmlString: string = "";
    let trimLine: string = "";
    let lastLine: string = "";
    let step: number = 0;
    let lastStep: number = 0;
    let listTag: string = "ul";
    let lastKey: string = "";
    let dataList: string[] = [];

    // Text aufsplitten
    let lines: string[] = mdString.split("\n");

    // Alle Tags schliessen
    let closeAllTags = function () {
        if (isP) {
            htmlString += "</p>";
            isP = false;
        }
        if (isLi) {
            htmlString += "</li>";
            isLi = false;
        }
        if (isList) {
            htmlString += "</" + listTag + ">";
            isList = false;
        }
        if (isTable) {
            htmlString += "</tr></thead><tbody></tbody></table>";
            isTable = false;
        }
        if (isRowCol) {
            htmlString += "</" + colTag + ">";
            isRowCol = false;
        }
        if (isRow) {
            htmlString += "</" + rowTag + ">";
            isRow = false;
        }
    };

    // Alle Tags schliessen
    let closeRowCol = function () {
        if (isP) {
            htmlString += "</p>";
            isP = false;
        }
        if (isLi) {
            htmlString += "</li>";
            isLi = false;
        }
        if (isList) {
            htmlString += "</" + listTag + ">";
            isList = false;
        }
        if (isTable) {
            htmlString += "</tr></thead><tbody></tbody></table>";
            isTable = false;
        }
        if (isRowCol) {
            htmlString += "</" + colTag + ">";
            isRowCol = false;
        }
    };

    // Text prüfen
    let checkText = function (text: string): string {
        let newText: string = text;

        // Auf Link oder Bild prüfen
        let linkPos2: number = newText.indexOf("](");
        while (linkPos2 > 0) {
            const bildPos1: number = newText.indexOf("![");
            const linkPos1: number = newText.indexOf("[");
            const endPos: number = newText.indexOf(")", linkPos2);
            if (bildPos1 >= 0 && bildPos1 < linkPos2) {
                // Bild
                const part1: string = newText.substring(0, bildPos1);
                const part2: string = newText.substring(bildPos1 + 2, linkPos2);
                const part3: string = newText.substring(linkPos2 + 2, endPos);
                const part4: string = newText.substring(endPos + 1);

                // BildLink
                newText = part1 + "<img tag='" + part2 + "' src='" + part3 +
                    "'>" + part4;
                site.imageList.push(part3);
            } else if (linkPos1 >= 0 && linkPos1 < linkPos2) {
                // Link
                const part1: string = newText.substring(0, linkPos1);
                const part2: string = newText.substring(linkPos1 + 1, linkPos2);
                const part3: string = newText.substring(linkPos2 + 2, endPos);
                const part4: string = newText.substring(endPos + 1);

                // Link
                newText = part1 + "<a href='" + part3 + "'>" + part2 + "</a>" +
                    part4;
                site.linkList.push(part3);
            } else {
                // Abbrechen bei keinem Gültigen Link oder Bild
                break;
            }

            linkPos2 = newText.indexOf("](");
        } // while linkPos2

        // Auf Fettschrift prüfen
        newText = newText.replaceAll(regularBold, "<b>$1</b>");

        return newText;
    };

    // Liste prüfen
    let checkListe = function (isSorted: boolean) {
        if (!trimLine || !trimLine.startsWith("- ")) return;

        // ListTag
        listTag = "ul";
        if (isSorted) {
            listTag = "ol";
        }

        // Text
        let text: string = trimLine.substring(2);
        text = checkText(text);

        // Wenn noch keine Liste oder Unterliste beginn
        if (!isList || step > lastStep) {
            htmlString += "<" + listTag + ">";
            isList = true;
        }

        // wenn Einrückung kleiner voriger Einrückung
        if (step < lastStep) {
            // Wenn bereits ein List-Item
            if (isLi) {
                htmlString += "</li></" + listTag + ">";
            }
        } else if (isLi && step == lastStep) {
            htmlString += "</li>";
            isLi = false;
        }

        // neues ListenElement
        htmlString += "<li>" + text;
        isLi = true;

        // Stufe merken
        lastStep = step;
    }; // checkListe

    // Zeile prüfen
    let checkLine = function () {
        // Wenn Attribute Zeile
        if (trimLine.startsWith("[") && trimLine.endsWith("]")) {
            newAttribute = " " + trimLine.substring(1, trimLine.length - 1);
            return;
        }

        // Bei Leerzeilen alles schliessen
        if (trimLine == "") {
            closeAllTags();
            return;
        }

        if (trimLine == "%") {
            // Zeilenumbruch / Leerzeile
            htmlString += "</br>";
            return;
        }

        // Ab hier ist keine Leerzeile

        // Auf Attribute prüfen
        let tagAttribute: string = "";
        if (trimLine.endsWith("]")) {
            const pos1: number = trimLine.lastIndexOf(" [");
            if (pos1 >= 0) {
                tagAttribute = " " +
                    trimLine.substring(pos1 + 2, trimLine.length - 1);
                trimLine = trimLine.substring(0, pos1);
            }
        }

        // Wenn Überschriften
        const pos1: number = trimLine.indexOf("# ");
        if (pos1 >= 0) {
            const praefix: string = trimLine.substring(0, pos1 + 1);
            const text: string = trimLine.substring(pos1 + 2);
            if (praefix == "#") {
                // H1
                htmlString += "<h1" + tagAttribute + ">" + text + "</h1>";
                tagAttribute = "";
                return;
            }
            if (praefix == "##") {
                // H6
                htmlString += "<h2" + tagAttribute + ">" + text + "</h2>";
                tagAttribute = "";
                return;
            }
            if (praefix == "###") {
                // H6
                htmlString += "<h3" + tagAttribute + ">" + text + "</h3>";
                tagAttribute = "";
                return;
            }
            if (praefix == "####") {
                // H4
                htmlString += "<h4" + tagAttribute + ">" + text + "</h4>";
                tagAttribute = "";
                return;
            }
            if (praefix == "#####") {
                // H5
                htmlString += "<h5" + tagAttribute + ">" + text + "</h5>";
                tagAttribute = "";
                return;
            }
            if (praefix == "######") {
                // H6
                htmlString += "<h6" + tagAttribute + ">" + text + "</h6>";
                tagAttribute = "";
                return;
            }

            return;
        } // Überschriften Header

        if (trimLine == "---") {
            // Spalten schliessen
            closeRowCol();
            return;
        }

        // Wenn zuvor ein Spaltenbeginn
        if (lastLine == "---") {
            // Prüfen auf Zeile
            if (!isRow) {
                htmlString + "<" + rowTag + newAttribute + ">";
                isRow = true;
                newAttribute = "";
            }

            // Spalte anlegen
            if (!isRowCol) {
                htmlString += "<" + colTag + tagAttribute + ">";
                isRowCol = true;
                tagAttribute = "";
            }
        } // Spalten Beginn

        // Liste
        if (trimLine.startsWith("- ")) {
            // Liste prüfen
            checkListe(false);
            return;
        }
        if (trimLine.indexOf(". ") <= 2) {
            // Sortierte Liste prüfen
            checkListe(true);
            return;
        }

        // Tabelle
        if (trimLine.startsWith("| ")) {
            // Tabelle prüfen
            if (!isTable) {
                htmlString += "<table" + newAttribute + "><thead><tr>";
                isTable = true;
                newAttribute = "";
            }

            // Tabellen Spalte
            let text = trimLine.substring(2);
            htmlString += "<td" + tagAttribute + ">" + text + "</td>";
            return;
        }

        // =============================
        //   nur Text
        // -----------

        let text: string = checkText(trimLine);

        if (!isP) {
            htmlString += "<p" + tagAttribute + ">" + text;
            isP = true;
        } else {
            htmlString += "</br>" + text;
        }
    }; // checkLine

    // Code prüfen
    let checkCode = function (line: string) {
        // Code beenden
        if (isCode && trimLine == "```") {
            htmlString += "</code></pre>";
            isCode = false;
            return;
        }

        // Code Starten
        if (!isCode && trimLine.startsWith("```")) {
            let codeParam = trimLine.substring(3);

            if (codeParam != "") {
                // code Parameter setzen
                htmlString += "<pre><code class='language-" + codeParam + "' >";
            } else {
                htmlString += "<pre><code>";
            }
            isCode = true;
            return;
        }

        // CodeZeile hinzufügen
        if (isCode) {
            let newLine = line.replaceAll("<", "&lt;"); // < HTML-TAG Zeichen müssen umgewandelt werden
            htmlString += newLine + "\n";
        }
    }; // checkCode

    // Daten prüfen
    let checkData = function () {
        // auf Listen Eintrag prüfen
        if (trimLine.startsWith("- ")) {
            dataList.push(trimLine.substring(2));
            return;
        }

        // Auf Liste prüfen
        if (trimLine.endsWith(":")) {
            lastKey = trimLine.substring(0, trimLine.length - 1);
            dataList = [];
            site.data[lastKey] = dataList;
            return;
        }

        // Auf Text prüfen
        let pos1: number = trimLine.indexOf(": ");
        if (pos1 > 0) {
            lastKey = trimLine.substring(0, pos1);
            let text: string = trimLine.substring(pos1 + 2);
            site.data[lastKey] = text;
        } else if (pos1 < 0) {
            site.data[lastKey] += "\n" + trimLine;
        }
    }; // checkData

    // Alle Zeilen durchgehen
    lines.forEach((line, index) => {
        trimLine = line.trim();
        step = line.length - trimLine.length;

        // Data
        if (index == 0 && trimLine == "---") {
            // Daten prüfen
            isData = true;
            return;
        } else if (isData) {
            if (trimLine == "---") {
                isData = false;
                return;
            }

            checkData();
        } else if (isCode || trimLine.startsWith("```")) {
            // Code prüfen
            checkCode(line);
        } else {
            // Zeilen prüfen
            checkLine();
            lastLine = trimLine;
        }
    });

    // geparsten HTML String zurückgeben
    site.html = htmlString;
    return site;
} // parseMd
