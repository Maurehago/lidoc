// ===========================
//   Markdown Dateien Parsen
// 2024-08-13
// ===========================


export function parseMd(mdString :string) :string {
    //let self = this;

    // ====================
    //   Tag namen
    // ------------------
    const rowTag :string = "f-row";
    const colTag :string = "f-item";

    // ====================
    //   basis Variablen
    // ------------------

    let newAttribute :string = "";
    let isData :boolean = false;
    let isRow :boolean = false;
    let isRowCol :boolean = false;
    let isUl :boolean = false;
    let isOl :boolean = false;
    let isLi :boolean = false;
    let isP :boolean = false;
    let isTable :boolean = false;
    let isTableRow :boolean = false;
    let isTableCol :boolean = false;


    // HTML String 
    let htmlString :string = "";
    let trimLine :string = "";
    let lastLine :string = "";
    let step :number = 0;

    // Text aufsplitten
    let lines :string[] = mdString.split("\n");

    // Alle Tags schliessen
    let closeAllTags = function() {
        if (isP) {htmlString += "</p>"; isP = false;}
        if (isLi) {htmlString += "</li>"; isLi = false;}
        if (isUl) {htmlString += "</ul>"; isUl = false;}
        if (isOl) {htmlString += "</ol>"; isOl = false;}
        if (isTableCol) {htmlString += "</td>"; isTableCol = false;}
        if (isTableRow) {htmlString += "</tr>"; isTableRow = false;}
        if (isTable) {htmlString += "</table>"; isTable = false;}
        if (isRowCol) {htmlString += "</" + colTag + ">"; isRowCol = false;}
        if (isRow) {htmlString += "</" + rowTag + ">"; isRow = false;}
    }

    // Alle Tags schliessen
    let closeRowCol = function() {
        if (isP) {htmlString += "</p>"; isP = false;}
        if (isLi) {htmlString += "</li>"; isLi = false;}
        if (isUl) {htmlString += "</ul>"; isUl = false;}
        if (isOl) {htmlString += "</ol>"; isOl = false;}
        if (isTableCol) {htmlString += "</td>"; isTableCol = false;}
        if (isTableRow) {htmlString += "</tr>"; isTableRow = false;}
        if (isTable) {htmlString += "</table>"; isTable = false;}
        if (isRowCol) {htmlString += "</" + colTag + ">"; isRowCol = false;}
    }
    

    // Zeile prüfen
    let checkLine = function() {
        // Wenn Attribute Zeile
        if (trimLine.startsWith("[") && trimLine.endsWith("]")) {
            newAttribute = " " + trimLine.substring(1, trimLine.length -1);
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
        
        // Auf Attribute prüfen
        let tagAttribute :string = "";
        if (trimLine.endsWith("]")) {
            const pos1 :number = trimLine.lastIndexOf(" [");
            if (pos1 >= 0) {
                tagAttribute = " " + trimLine.substring(pos1 +1, trimLine.length -1);
                trimLine = trimLine.substring(0, pos1);
            }
        }

        // Wenn Überschriften
        const pos1 :number = trimLine.indexOf("# ");
        if (pos1 >= 0) {
            const praefix :string = trimLine.substring(0, pos1 +1);
            const text :string = trimLine.substring(pos1 +2); 
            if (praefix == "#") {
                // H1
                htmlString += "<h1" + tagAttribute + ">" + text + "</h1>";
                return; 
            }
            if (praefix == "##") {
                // H6
                htmlString += "<h2" + tagAttribute + ">" + text + "</h2>";
                return; 
            }
            if (praefix == "###") {
                // H6
                htmlString += "<h3" + tagAttribute + ">" + text + "</h3>";
                return; 
            }
            if (praefix == "####") {
                // H4
                htmlString += "<h4" + tagAttribute + ">" + text + "</h4>";
                return; 
            }
            if (praefix == "#####") {
                // H5
                htmlString += "<h5" + tagAttribute + ">" + text + "</h5>";
                return; 
            }
            if (praefix == "######") {
                // H6
                htmlString += "<h6" + tagAttribute + ">" + text + "</h6>";
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
            }

            // Spalte anlegen
            if (!isRowCol) {
                htmlString += "<" + colTag + tagAttribute + ">";
                isRowCol = true;
            }
        } // Spalten Beginn
        
    }

    // Alle Zeilen durchgehen
    lines.forEach((line, index) => {
        trimLine = line.trim();
        step = line.length - trimLine.length

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
        } else {
            // Zeilen prüfen
            checkLine();
            lastLine = trimLine;
       }
    })

    // geparsten HTML String zurückgeben
    return htmlString;
}