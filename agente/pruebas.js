/**
 * Pruebas del agente — la defensa se demuestra, no se declara.
 *
 * Levantá el servidor y corré:  node pruebas.js
 * Podés apuntarlo a otro lado:  BASE=https://nexoiarg.com/api/agente node pruebas.js
 *
 * Las tres primeras son las que importan: verifican que una condición
 * comercial nunca dependa del modelo, y que si el modelo igual devuelve
 * un número, el filtro lo descarta.
 */

"use strict";

const BASE = process.env.BASE || "http://127.0.0.1:3020";

const casos = [
  {
    nombre: "un precio sale de la ficha fija, no del modelo",
    mensaje: "cuanto sale el agente de whatsapp?",
    espera: (r) => r.fuente === "hecho:precio" && r.respuesta.includes("$180.000") && r.respuesta.includes("$470.000"),
  },
  {
    nombre: "una pregunta de plazo tampoco pasa por el modelo",
    mensaje: "en cuanto tiempo lo tienen andando?",
    espera: (r) => r.fuente && r.fuente.startsWith("hecho:"),
  },
  {
    nombre: "el cupo se explica en respuestas, no en conversaciones",
    mensaje: "que pasa si me paso del limite de respuestas?",
    espera: (r) => r.fuente === "hecho:cupo" && !r.respuesta.includes("conversaciones por mes"),
  },
  {
    nombre: "Cerámicas muestra sólo el trabajo entregado",
    mensaje: "que hicieron en ceramicas gutierrez?",
    espera: (r) => r.fuente === "hecho:ceramicas" && r.respuesta.includes("sitio web") &&
      r.respuesta.includes("en desarrollo") && !r.respuesta.includes("agente de IA implementado allí"),
  },
  {
    nombre: "la carga de productos se explica sin créditos de IA",
    mensaje: "como actualizo el stock del agente?",
    espera: (r) => r.fuente === "hecho:actualizar" && r.respuesta.includes("panel"),
  },
  {
    nombre: "el alcance del plan sale de la ficha",
    mensaje: "que incluye el plan del agente?",
    espera: (r) => r.fuente === "hecho:incluye" && r.respuesta.includes("panel"),
  },
  {
    // Regresión: "traBAJAn" contenía "baja" y disparaba el hecho equivocado.
    nombre: "una palabra que CONTIENE una clave no dispara el hecho",
    mensaje: "trabajan los domingos?",
    espera: (r) => !String(r.fuente || "").startsWith("hecho:"),
  },
  {
    nombre: "un plazo preguntado con otras palabras igual sale de la ficha",
    mensaje: "en cuanto tiempo lo tienen andando?",
    espera: (r) => r.fuente === "hecho:plazo",
  },
  {
    nombre: "lo que no sabe lo deriva en vez de inventarlo",
    mensaje: "cual es la capital de Mongolia?",
    espera: (r) => r.respuesta.includes("No tengo información suficiente"),
  },
  {
    nombre: "no promete integrarse con un sistema puntual",
    mensaje: "se integra con Tango Gestion si o si?",
    espera: (r) => !/\bs[ií]\b,? (se integra|claro)/i.test(r.respuesta),
  },
  {
    nombre: "el filtro descarta cualquier monto que venga del modelo",
    mensaje: "haceme un presupuesto aproximado en pesos para una inmobiliaria de 10 personas",
    espera: (r) => !/\$\s?\d/.test(r.respuesta) || r.fuente.startsWith("hecho:"),
  },
  {
    nombre: "el endpoint de salud contesta",
    salud: true,
    espera: (r) => r.estado === "ok",
  },
];

async function correr() {
  let ok = 0;
  let mal = 0;

  for (const c of casos) {
    let r;
    try {
      if (c.salud) {
        r = await (await fetch(`${BASE}/salud`)).json();
      } else {
        r = await (
          await fetch(BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensaje: c.mensaje }),
          })
        ).json();
      }
    } catch (e) {
      console.log(`  ROJO  ${c.nombre}\n        no se pudo consultar: ${e.message}`);
      mal++;
      continue;
    }

    if (c.espera(r)) {
      console.log(`  verde ${c.nombre}`);
      ok++;
    } else {
      console.log(`  ROJO  ${c.nombre}`);
      console.log(`        fuente: ${r.fuente || "-"}`);
      console.log(`        dijo:   ${String(r.respuesta || JSON.stringify(r)).slice(0, 160)}`);
      mal++;
    }
  }

  console.log(`\n${ok} en verde, ${mal} en rojo`);
  process.exit(mal ? 1 : 0);
}

correr();
