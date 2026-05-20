// ========================================
//   Syntax Highlight für Visual Foxpro
// ADD-ON zu Prism
// 2026-05-20
// ========================================


// Wenn Prism Verwendet wird
if (Prism) {
    Prism.languages['foxpro'] = {
        // Kommentare: Zeilenkommentare mit * oder NOTE, Inline-Kommentare mit &&
        'comment': [
            {
                pattern: /(?:^\s*\*|^\s*NOTE\b).*/im,
                lookbehind: true
            },
            {
                pattern: /&&.*/,
                greedy: true
            }
        ],
        // Strings in FoxPro können mit "", '' oder [] umschlossen werden
        'string': {
            pattern: /"([^"\r\n]*)"|'([^'\r\n]*)'|\[([^\]\r\n]*)\]/,
            greedy: true
        },
        // Wichtige FoxPro-Schlüsselwörter (Case-Insensitive durch /i)
        'keyword': /\b(?:DO|WHILE|ENDDO|FOR|ENDFOR|EACH|IF|ELSE|ENDIF|CASE|OTHERWISE|ENDCASE|SWITCH|LOCAL|PUBLIC|PRIVATE|PROCEDURE|FUNCTION|ENDFUNC|ENDPROC|RETURN|PARAMETERS|LPARAMETERS|APPEND|BLANK|REPLACE|WITH|SELECT|FROM|WHERE|CURSOR|TABLE|USE|CLOSE|ALL|DATA|CREATE|CLASS|ENDCLASS|DEFINE|ENDDEFINE|AS)\b/i,
        // Systemvariablen und Konstanten
        'boolean': /\b(?:\.[TF]\.)\b/i,
        // Zahlen (Integers und Floats)
        'number': /\b\d+(?:\.\d+)?\b/,
        // Systemfunktionen oder Prozedur-Aufrufe
        'function': /\b\w+(?=\()/i,
        // Mathematische und logische Operatoren
        'operator': /==|!=|<>|<=|>=|[+\-*/=\^@]/
    };

    // Optional: Alias einrichten, falls man auch class="language-vfp" nutzen möchte
    Prism.languages['vfp'] = Prism.languages['foxpro'];
}
