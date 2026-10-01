/* Receptor de eventos de nexoiarg.com.
   Escucha SOLO en localhost:8790 (nginx le reenvía /api/evento) y agrega
   cada evento como una línea JSON en /var/log/nexo-eventos.jsonl.
   Sin dependencias: corre con el Node que ya está instalado.
   Descarta IP, agente de usuario y campos no esperados. */

"use strict";

const http = require("http");
const fs = require("fs");

const RUTA = "/var/log/nexo-eventos.jsonl";
const PUERTO = 8790;

http.createServer(function (req, res) {
  if (req.method !== "POST") { res.writeHead(405); res.end(); return; }

  let cuerpo = "";
  req.on("data", function (t) {
    cuerpo += t;
    if (cuerpo.length > 4096) req.destroy();   // nadie manda eventos de 4kb
  });

  req.on("end", function () {
    try {
      const e = JSON.parse(cuerpo);
      const linea = JSON.stringify({
        e:  String(e.e || "").slice(0, 64),          // nombre del evento
        x:  e.x == null ? null : String(e.x).slice(0, 200),
        p:  String(e.p || "").slice(0, 128),         // path de la página
        t:  Date.now()                               // hora del servidor
      });
      if (linea.length < 700) fs.appendFile(RUTA, linea + "\n", function () {});
    } catch (err) { /* JSON roto: se ignora, nunca se rompe */ }
    res.writeHead(204);
    res.end();
  });
}).listen(PUERTO, "127.0.0.1", function () {
  console.log("nexo-eventos escuchando en 127.0.0.1:" + PUERTO + " → " + RUTA);
});
