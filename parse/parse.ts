// deno-lint-ignore-file no-explicit-any
// Daten Struktur für das Parsing
export interface Site {
    name: string;
    path: string;
    date?: string;
    template?: string;
    tags?: Array<string>;
    data?: any;
    content?: string;
    children?: Array<Element>;
}

// element
export interface Element {
    tag: string;
    id?: string;
    parrent?: Element;
    props?: string;
    text?: string;
}

