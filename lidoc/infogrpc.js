// ===============================
//   GRPC Proto Convertierungen
// ===============================
// @ts-check


// ================================
//   Typen
// --------


/**
 * @typedef {Object} ProtoField
 * @property {string} type
 * @property {string} name
 * @property {string} id
 */

/**
 * @typedef {Object} ProtoMessage
 * @property {string} name
 * @property {Array<ProtoField>} fields
 * @property {Array<ProtoMessage>} nested
 */

/**
 * @typedef {Object} ProtoSchema
 * @property {Array<ProtoMessage>} messages
 * @property {Array<string>} enums
 * @property {string} syntax
 */



// ===========================
//   Klassen
// -----------

class ProtoParser {
    /** @type {RegExpMatchArray|null} */
    tokens;
    pos = 0;

    /**
     * 
     * @param {string} source - Inhalt der Proto Datei
     */
    constructor(source) {
        // Tokenizer: Trennt Wörter, Zahlen und Sonderzeichen, ignoriert Kommentare
        this.tokens = source
            .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '') // Kommentare entfernen
            .match(/[a-zA-Z_]\w*|[0-3]+|[{};=\[\]]|\".*?\"/g);
        this.pos = 0;
    }

    /**
     * 
     * @returns {string}
     */
    peek() { return this.tokens ? this.tokens[this.pos] : ""; }
    /**
     * 
     * @returns {string}
     */
    next() { return this.tokens ? this.tokens[this.pos++] : ""; }

    /**
     * 
     * @returns {ProtoSchema}
     */
    parse() {
        /** @type {ProtoSchema} */
        const schema = { messages: [], enums: [], syntax: 'proto3' };
        if (!this.tokens) {return schema;}
        while (this.pos < this.tokens.length) {
            const token = this.next();
            if (token === 'syntax') {
                this.next(); // '='
                schema.syntax = this.next().replace(/"/g, '');
                this.next(); // ';'
            } else if (token === 'message') {
                schema.messages.push(this.parseMessage());
            }
        }
        return schema;
    }

    /**
     * 
     * @returns {ProtoMessage}
     */
    parseMessage() {
        const name = this.next();
        /** @type {ProtoMessage} */
        const msg = { name, fields: [], nested: [] };
        this.next(); // '{'

        while (this.peek() !== '}') {
            const fieldOrNested = this.next();
            if (fieldOrNested === 'message') {
                msg.nested.push(this.parseMessage());
            } else if (fieldOrNested === 'enum') {
                this.skipUntil('}'); // Vereinfacht: Enums überspringen oder analog parsen
            } else {
                // Feld parsen: type name = id;
                const type = fieldOrNested;
                const fieldName = this.next();
                this.next(); // '='
                const id = this.next();
                this.next(); // ';'
                msg.fields.push({ type, name: fieldName, id });
            }
        }
        this.next(); // '}'
        return msg;
    }

    /**
     * 
     * @param {string} char Zeichen
     */
    skipUntil(char) {
        if (this.tokens) {
            while (this.pos < this.tokens.length && this.next() !== char);
        }
    }
}


// =========================
//   Funktionen
// -------------


/**
 * 
 * @param {string} type - Typname aus der Proto Datei
 * @returns {string} Name das Javascript datenTypes
 */
export function protoType_to_jsType(type) {
    if (!type) {return "undefined";}

    // Zahlen
    if (["double", "float", "int32", "uint32", "sint32", "ficed32", "sfixed32"].indexOf(type) >= 0) {
        return "number";
    }

    // Big Integer
    if (["int64", "uint64", "sint64", "fixed64", "sfixed64"].indexOf(type) >= 0) {
        return "bigint";
    }

    if (type == "bool") {return "boolean";}
    //if (type == "string") {return "string";}
    
    if (type == "bytes") {return "Uint8Array";}

    // ObjektType - kann jede andere Klasse sein
    return type;
}


