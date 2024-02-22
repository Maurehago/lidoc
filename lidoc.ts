// HTTP-Server und Dokument generator

// Datei Handler
function file_handler(req: Request): Response {
    return new Response("Test");
}

// Server Starten
Deno.serve({port: 8080}, file_handler);

