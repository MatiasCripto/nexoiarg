/**
 * Comprueba el filtro de salida leyendo los patrones REALES de servidor.js.
 * Si alguien afloja el filtro, esto se pone en rojo.
 *
 *   node probar-filtro.js
 */
"use strict";

const fs = require("node:fs");
const fuente = fs.readFileSync(require("node:path").join(__dirname, "servidor.js"), "utf8");

const bloque = /const COMPROMETE = \[([\s\S]*?)\n\];/.exec(fuente)[1];
const patrones = bloque
  .split("\n")
  .map((l) => l.replace(/\s*\/\/.*$/, "").trim().replace(/,$/, ""))
  .filter((l) => l.startsWith("/"))
  .map((l) => {
    const corte = l.lastIndexOf("/");
    return new RegExp(l.slice(1, corte), l.slice(corte + 1));
  });

const visible = (t) => String(t).replace(/\[\[[\s\S]*?\]\]/g, " ");
const compromete = (t) => patrones.some((re) => re.test(visible(t)));

const casos = [
  // el modelo NO puede decir esto
  ["Sale $180.000 por mes", true],
  ["Son 180.000 pesos mensuales", true],
  ["Mejora un 40% la atención", true],
  ["Lo tenés andando en 15 dias", true],
  ["Te garantizo que no falla", true],
  // esto sí puede decirlo: describe el caso del cliente
  ["Cargar los remitos todos los dias es de lo mas comun.", false],
  ["Si pasa 3 veces por dia, el trabajo se paga solo.", false],
  ["Habria que ver si tu sistema deja conectarse.", false],
  ["Si el dato esta solo en papel, primero hay que ordenarlo.", false],
  // las marcas internas no se evalúan: llevan datos del visitante
  ["[[RESUMEN: tengo una agencia de remis y hago 15 viajes por dia]] Dale, lo vemos.", false],
];

let mal = 0;
console.log(`${patrones.length} patrones cargados desde servidor.js\n`);
for (const [texto, esperado] of casos) {
  const r = compromete(texto);
  const ok = r === esperado;
  if (!ok) mal++;
  console.log(`  ${ok ? "verde" : "ROJO "}  ${esperado ? "bloquea" : "deja pasar"}: ${JSON.stringify(texto).slice(0, 74)}`);
}
console.log(mal ? `\n${mal} fallas` : `\n${casos.length} casos correctos`);
process.exit(mal ? 1 : 0);
