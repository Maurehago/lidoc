// HTTP-Server und Dokument generator
import * as path from "@std/path";
import * as parseMD from "./parse/parsemd.ts";
import {Site} from "./parse/parse.ts";

// Datei Handler
function file_handler(req: Request): Response {
    // nur Get Request
    // return new Response(req.method);
    console.log(req.method);

    if (req.method != "GET") {
        return new Response();
    }

    // url
    const url = new URL(req.url);

    // DateiPfad
    let rel_file_path: string = url.pathname;

    // wenn kein Dateiname angegeben -> index.html
    if (rel_file_path.endsWith("/")) {
        rel_file_path += "index.html";
    }

    let full_path: string = path.join(Deno.cwd(), rel_file_path);
    //let full_path: string = rel_file_path;

    console.log("full_path: ", full_path);
    console.log("current: ", Deno.cwd());

    // Pfaderweiterung prüfen
    let filetype: string = path.extname(rel_file_path);

    // Prüfen ob eine Markdown Datei dazu vorhanden
    if (filetype == ".html") {
        let md_file_path: string = full_path.replace(".html", ".md");

        // Datei Parsen
        let md: Site = parseMD.parse(md_file_path);
        let md_string: string|undefined = md.content;
        console.log("md: ", md_string);
        console.log("data: ", md.data);
        
        // Wenn vorhanden dann zurückschicken
        if (md_string) {
            return new Response(md_string);
        }
    } // wenn html

    // Datei zurückschicken
    // fileserver.serveFile(req, full_path).then((res) => {
    //     return res;
    // }).catch((err) => {
    //     return err;
    // });

    return new Response("test");
} // file_handler

// Server Starten
Deno.serve({port: 8080}, file_handler);

