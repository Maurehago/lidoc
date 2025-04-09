// =======================
//   Formular Hilfen
// =======================
// @ts-check



// =============================
//   Funktionen
// -------------

/**
 * Gibt einen String mit formartierter Zahl zurück.  
 * z.B.: formatNumber(1234.5, 2, ",") => "1234,50"  
 * z.B.: formatNumber(-1234.5678, 2, ",", "___ ___,___") => "-1 234,57_"  
 * @param {string|number} num - Zahl die formatiert wird
 * @param {number} decimals - Anzahl der Dezimalstellen
 * @param {string} [base] - Optional Kommerzeichen. Default = "." 
 * @param {boolean} [seperate] - Optional Tausender Trennzeichen (thin space)
 * @returns {string} Formatierte Zahl
 */
export function formatNumber(num, decimals, base, seperate) {
    if (!decimals) { decimals = 0; }
    if (typeof decimals == "string") {
        decimals = parseInt(decimals);
    }

    let numString = "";
    if (typeof num == "string") {
        // Falsche Komma(",") ersetzen 
        let posPoint = num.lastIndexOf(".");
        let posKomma = num.lastIndexOf(",");
        if (posKomma > posPoint) {
            num = num.substring(0, posKomma) + "." + num.substring(posKomma + 1);
        } else {
            num = num.replaceAll(",", "");
        }
        numString = parseFloat(num).toFixed(decimals);
    } else if (typeof num == "number") {
        numString = "" + num.toFixed(decimals);
    } else {
        numString = "" + parseFloat("0").toFixed(decimals);
    }

    if (seperate) {
        // * schmales Leerzeichen 	U+2009 	8201 	THIN SPACE 	&#8201; 	&#x2009; 	&thinsp;
        // * schmales nicht umbrechendes Leerzeichen 	U+202F 	8239 	NARROW NO-BREAK SPACE 	&#8239; 	&#x202f; 	n. z.    // Dezimalstellen
        // 123 456 789.123 456 789
        let pos1 = numString.indexOf(".");
        let pos2 = pos1 > -1 ? pos1 - 3 : numString.length - 3;
        while (pos2 > 0) {
            //if (pos2 < numString.length && pos2 != pos1) {
            numString = numString.substring(0, pos2) + "&#8239;" + numString.substring(pos2);
            //}
            pos2 -= 3;
        }
    }

    // Kommazeichen setzen
    if (typeof base == "string" && base != ".") {
        numString = numString.replace(".", base);
    }


    return numString;
}

// =============================
//   Event Funktionen
// --------------------

// nächste Position einer Zahl finden
function nextDigit(input, cursorpos, isBackspace) {
    if (isBackspace) {
        for (let i = cursorpos - 1; i > 0; i--) {
            if (/\d/.test(input[i])) {
                return i
            }
        }
    } else {
        for (let i = cursorpos - 1; i < input.length; i++) {
            if (/\d/.test(input[i])) {
                return i
            }
        }
    }

    return cursorpos
}


// Bei Eingabe von Zahlen
export function onInputNumber(e) {
    let cursorPos = e.target.selectionStart;
    let value = e.target.value;
    let decimals = e.target.dataset.dec || 0; // data-dec
    let base = e.target.dataset.base || "."; // data-base
    let formatInput = formatNumber(value, decimals, base, true)

    // Wert neu setzen
    e.target.value = formatInput;

    // Position prüfen
    let isBackspace = (e?.data == null) ? true : false
    let nextCusPos = nextDigit(formatInput, cursorPos, isBackspace)

    e.target.setSelectionRange(nextCusPos + 1, nextCusPos + 1);
}