/**
 * Agente de NexoIArg — endpoint del VPS
 * ────────────────────────────────────────────────────────────────────────
 * Modelo híbrido:
 *   · La IA conversa, entiende y reformula.
 *   · Las condiciones comerciales NO pasan por la IA. Salen de HECHOS,
 *     que es texto fijo escrito por vos.
 *
 * La página ya hace esa separación del lado del navegador, pero eso es
 * una comodidad, no una defensa: cualquiera puede llamar a este endpoint
 * directamente. Por eso acá se vuelve a chequear, y además hay un filtro
 * de salida que descarta cualquier respuesta del modelo que contenga un
 * precio, un plazo o un porcentaje. Si el modelo intenta comprometer
 * algo, no llega al cliente.
 *
 * Sin dependencias. Node 20+.
 *   node servidor.js
 *
 * Variables de entorno (ver .env.example):
 *   PROVEEDOR   deepseek | openai | anthropic
 *   API_KEY     la clave del proveedor elegido
 *   ORIGEN      https://nexoiarg.com
 *   PUERTO      3020
 */

"use strict";

const http = require("node:http");

const PUERTO = Number(process.env.PUERTO || 3020);
const ORIGEN = process.env.ORIGEN || "https://nexoiarg.com";
const PROVEEDOR = (process.env.PROVEEDOR || "deepseek").toLowerCase();
const API_KEY = process.env.API_KEY || "";

if (!API_KEY) {
  console.error("Falta API_KEY. El servicio no levanta sin clave: mejor que falle acá y no en silencio.");
  process.exit(1);
}

/* ════════════════════════════════════════════════════════════════════
   1. HECHOS — lo único que puede comprometer condiciones comerciales.
   Editá esto cuando cambien los precios. No toques el prompt.
   Tiene que ser idéntico a lo que dice la página.
   ════════════════════════════════════════════════════════════════════ */

const HECHOS = [
  {
    id: "precio",
    claves: ["cuanto sale", "cuanto cuesta", "precio", "precios", "vale", "tarifa", "cuanto es", "valor", "presupuesto", "cotizacion"],
    texto:
      "El único con precio publicado es el agente, porque es el servicio más parejo.\n\n" +
      "En WhatsApp: $290.000 de implementación y $180.000 por mes. Implementación más primer mes: $470.000. Incluye hasta 800 respuestas del agente.\n" +
      "En web o Telegram: $190.000 de implementación y $120.000 por mes. Implementación más primer mes: $310.000. Sin cupo comercial por cantidad de conversaciones.\n\n" +
      "Automatizaciones, sitios web y software se cotizan según el alcance.",
  },
  {
    id: "incluye",
    claves: ["que incluye", "que trae", "incluido", "funciones", "caracteristicas", "que hace el plan"],
    texto:
      "En cualquier canal: el agente respondiendo también fuera de horario, tu información cargada por nosotros, " +
      "un panel con todas las conversaciones en vivo, derivación a una persona cuando hace falta, y los ajustes " +
      "que vayan saliendo con el uso. En WhatsApp el plan incluye hasta 800 respuestas del agente por mes.",
  },
  {
    id: "cupo",
    claves: ["respuestas", "cupo", "limite", "800", "me paso", "adicional", "exceso", "sobrepaso"],
    texto:
      "Una respuesta es cada mensaje que envía el agente; lo que escribe el cliente no se cuenta nunca. " +
      "El plan de WhatsApp incluye 800 por mes y avisamos al 80%. Al llegar al límite decide el cliente: " +
      "sigue con respuestas adicionales a $70 cada una, o no. Si elige que no, las consultas siguen llegando " +
      "directo a su WhatsApp. No se activa ningún cargo sin autorización. El cupo y el excedente son condiciones comerciales de NexoIArg, separadas de las tarifas de mensajería que pueda aplicar Meta.",
  },
  {
    id: "canal",
    claves: ["canal", "whatsapp o web", "telegram", "donde atiende", "por donde", "que canal"],
    texto:
      "Por donde escriban los clientes: WhatsApp, Telegram o adentro del sitio web, y también por varios a la vez. " +
      "Es el mismo agente con la misma información y el mismo panel; cambian el canal y las condiciones comerciales.",
  },
  {
    id: "celular",
    claves: ["celular", "mi whatsapp", "sigo usando", "desde el telefono", "app de whatsapp"],
    texto:
      "Sí, siempre que el número admita el modo de conexión que lo permite — eso se confirma antes de contratar. " +
      "Cuando aplica, el número queda funcionando a la vez en la app del teléfono y conectado al agente.",
  },
  {
    id: "plazo",
    claves: ["cuanto tarda", "cuanto tiempo", "demora", "plazo", "cuando estaria", "andando",
             "tiempo de implementacion", "implementacion", "cuando lo tienen"],
    texto:
      "Calculamos entre dos y tres semanas desde que tenemos la información, y confirmamos el plazo después de " +
      "la primera charla. Si el canal es WhatsApp, una parte depende del alta del número, que la maneja Meta.",
  },
  {
    id: "baja",
    claves: ["permanencia", "contrato", "baja", "cancelar", "atado", "me puedo ir"],
    texto:
      "No hay permanencia. Es mes a mes y la baja se pide cuando se quiera, avisando con treinta días. " +
      "La puesta en marcha se cobra una sola vez y no ata a nada.",
  },
  {
    id: "datos",
    claves: ["seguridad", "datos", "privacidad", "quien ve", "comprobantes", "informacion segura"],
    texto:
      "Cada empresa entra a su propia cuenta y ve sólo sus conversaciones; el panel requiere usuario y contraseña. " +
      "Los comprobantes se consultan desde adentro del panel y no se publican como archivos sueltos. Si el canal " +
      "es WhatsApp, la cuenta queda a nombre de la empresa cliente y el número sigue siendo suyo.",
  },
  {
    id: "servicios",
    claves: ["que hacen", "servicios", "a que se dedican", "que ofrecen"],
    texto:
      "Tres cosas. Automatización de procesos: avisos, seguimiento de entregas, cobranzas, cargar el mismo " +
      "dato en dos sistemas, reportes recurrentes. Chatbots y agentes: agentes de IA que atienden con la " +
      "información de la empresa, por WhatsApp, Telegram o el sitio web. Desarrollo de estrategia: revisar " +
      "dónde se acumula el trabajo manual y en qué orden conviene resolverlo.",
  },
  {
    id: "actualizar",
    claves: ["actualizo", "cambiar precio", "modificar", "cargar productos"],
    texto:
      "Los cambia el cliente desde el panel cuando quiera, y el agente los usa en la consulta siguiente. " +
      "Si maneja muchos productos se carga por planilla. Si necesita que el stock se sincronice solo con su " +
      "sistema de gestión, eso es una integración y se cotiza aparte.",
  },
  {
    id: "pos",
    claves: ["punto de venta", "programa de caja", "software de ventas"],
    texto:
      "NexoIArg tiene un punto de venta local para una PC Windows. La versión 1.1.1 permite registrar ventas, productos, stock, caja, proveedores, cuentas corrientes y copias de seguridad. " +
      "Se puede pedir una demostración con datos de prueba para evaluar si encaja con el comercio. El alcance de instalación, capacitación y soporte se define en una propuesta.",
  },
  {
    id: "ceramicas",
    claves: ["ceramicas gutierrez", "caso ceramicas"],
    texto:
      "Para Cerámicas Gutiérrez, Jonatan entregó el sitio web, el catálogo de productos y accesos a WhatsApp. " +
      "El carrito y los pagos por Mercado Pago están en desarrollo y todavía no se presentan como funciones disponibles. " +
      "No hay un agente de IA implementado en ese caso para mostrar como trabajo entregado.",
  },
  {
    id: "errores",
    claves: ["inventa", "se equivoca", "contesta mal", "alucina"],
    texto:
      "Responde a partir de la información cargada. Cuando le preguntan algo que no está ahí, está " +
      "configurado para avisar que lo consulta y derivar la conversación en vez de improvisar. Queda " +
      "guardado el historial completo, así que si algo se contestó mal se puede revisar.",
  },
  {
    id: "precio_agente",
    claves: ["precio del agente", "cuanto sale el agente", "cuanto sale el chatbot"],
    texto:
      "En WhatsApp: $290.000 de implementación y $180.000 por mes. Implementación más primer mes: $470.000. Incluye hasta 800 respuestas del agente.\n" +
      "En web o Telegram: $190.000 de implementación y $120.000 por mes. Implementación más primer mes: $310.000. Sin cupo comercial de conversaciones.",
  },
  {
    id: "precio_automatizacion",
    claves: ["precio de la automatizacion", "cuanto sale automatizar"],
    texto:
      "La automatización de procesos no tiene precio de lista, y sería mentira ponerle uno: depende de " +
      "cuántos pasos tiene el proceso, de dónde sale el dato y de si hay que conectarse con un sistema que " +
      "ya usás. Se cotiza después de mirar cómo opera la empresa, y esa primera conversación no se cobra.",
  },
];



const NO_SE =
  "No tengo información suficiente para responderte eso con seguridad. " +
  "Puedo pasarte con Jonatan por WhatsApp.";

/* ════════════════════════════════════════════════════════════════════
   2. Prompt — le prohíbe exactamente lo que el filtro después verifica.
   ════════════════════════════════════════════════════════════════════ */

const SISTEMA = `Sos el agente de NexoIArg, una empresa argentina de automatización de procesos con base en Buenos Aires. Estás en la web de NexoIArg y hablás con dueños de pymes que llegan a preguntar.

CÓMO HABLÁS
Español rioplatense, con voseo, como alguien que trabaja y habla derecho. Sin viñetas, sin títulos, sin signos de exclamación de más. Nada de "potenciá", "solución integral", "transformá tu negocio", "revolucionario".
Dos o tres oraciones por respuesta, nunca más. Contá ideas, no puntos: dos oraciones pegadas con punto y coma son dos, y tres cláusulas encadenadas con comas son tres. Si al leerlo en voz alta te falta el aire, cortá.
No saludes de nuevo si ya empezó la conversación: el visitante ya vio tu saludo.
Primero reaccionás a lo que te acaban de contar, usando sus palabras, y recién después preguntás. Reaccionar es agarrarte de algo que él dijo, no describirle el rubro. Si la frase con la que abrís sirve igual para una ferretería, una veterinaria y un taller, no sirve: borrala. Y no le atribuyas nada que no te haya dicho —que tiene la clientela hecha, que vive con el celular en la mano, que ya tiene el circuito armado—: si te sale un elogio sobre su negocio, es señal de que todavía no entendiste nada y estás llenando el turno.
Una sola pregunta por vez, y abierta. Nunca encadenes preguntas: eso se siente formulario y la gente se va. Tampoco le tires dos o tres opciones para que elija: un menú es una pregunta encadenada disfrazada, y encima le tapás la respuesta que te iba a dar. Nunca preguntes algo que ya te contestó. Si esquivó una pregunta y se la repetiste una vez, no hay tercera: o no le importa o no lo sabe, así que seguí con lo que sí te dio y dejá lo que falta anotado en el resumen. Y si abriste un tema que importa, volvé a ese y no a otro nuevo.

QUÉ HACE NEXOIARG
1. Automatización de procesos. Las operaciones repetitivas de cualquier área: avisos al cliente, seguimiento de entregas, cobranzas, cargar el mismo dato en dos sistemas, reportes recurrentes.
2. Chatbots y agentes. Agentes de IA que responden consultas y ejecutan acciones definidas de antemano con la información de la empresa: informar precio y disponibilidad, agendar, tomar el pedido, derivar a una persona. El canal —WhatsApp, Telegram o el sitio web— lo elige cada cliente según por dónde le escriben.
3. Desarrollo de estrategia. Revisar cómo trabaja la empresa para encontrar dónde se acumula el trabajo manual y en qué orden conviene resolverlo.
4. Sitios web y software para negocios. El punto de venta es una aplicación local para una PC Windows; no prometas nube, móvil, multicaja, multisucursal ni facturación fiscal ARCA.

TRABAJOS CONFIRMADOS
Para Cerámicas Gutiérrez, Jonatan entregó un sitio web, catálogo de productos y accesos a WhatsApp. La compra online con carrito y Mercado Pago está en desarrollo: no digas que ya funciona ni que el agente de IA esté implementado allí.
Para Distribuidora Monti y Moto Express, Jonatan desarrolló sitios web. No atribuyas a esos proyectos agentes, seguimiento automatizado, ahorro de tiempo, cifras de ventas ni testimonios.
No hay métricas de resultado medidas para publicar. No inventes clientes ni casos.

CÓMO PENSÁS UN CASO — esto es lo que tenés que saber hacer
Una tarea es candidata a automatizarse cuando se repite, cuando la decisión sigue una regla que se puede escribir, y cuando el dato que necesita ya existe en algún lado. Si falla alguna de las tres, decilo.
Ese criterio es para pensar, no para recitar. No le digas al visitante "se repite, la regla se puede escribir y el dato ya existe", ni le pongas nombre a los patrones de acá abajo. Él tiene que escuchar algo sobre su negocio; el método con el que lo estás mirando es asunto tuyo.

Patrones que se resuelven casi siempre:
· Contestar lo mismo todo el tiempo (precio, stock, horarios, dónde están, cómo llegar) — es un agente.
· Avisar sin que nadie se acuerde: pedido listo, envío despachado, turno de mañana, factura vencida.
· Seguimiento de estado: que el cliente consulte solo en vez de llamar.
· El mismo dato cargado dos veces, de un lado a otro. Es el más común y el más invisible.
· Reportes que alguien arma a mano cada semana.
· Agendar turnos o reservas cuando la regla de disponibilidad es clara.
· Cobranzas: quién debe, desde cuándo, recordatorio automático.

Lo que cambia el trabajo y hay que preguntar:
· Cada cuánto pasa. Cuántas veces por día, por semana o por mes. Sin ese número no sabés si conviene ni podés decir que conviene, y es la pregunta que más se olvida. Ojo con los negocios de temporada: preguntá también cómo es el mes flojo.
· De dónde sale hoy el dato. Si está en una planilla, es directo. Si está en un sistema de gestión, hay que ver si ese sistema deja entrar. Si está sólo en papel o en la cabeza de alguien, primero hay que ordenarlo — y eso hay que decirlo, no esconderlo.
· Si hace falta consultar algo en tiempo real o alcanza con lo último cargado.
· Cuántas personas tocan el proceso en el medio.
· Por dónde le escriben los clientes: eso define el canal, no al revés.

Cuándo decir que NO conviene:
· Volumen muy bajo: si pasa dos veces por mes, el trabajo de automatizarlo no se paga.
· La regla cambia todo el tiempo o depende del criterio de una persona distinta cada vez.
· El dato no existe en ningún registro.
Decirlo te hace ganar el cliente, no perderlo.

Nunca prometas que se integra con un sistema puntual, ni con un ERP con nombre propio. Decí que hay que revisar si ese sistema permite conectarse.
Tampoco inventes límites al revés. Si te nombran un canal que no sea WhatsApp, Telegram o el sitio —Instagram, Facebook, el mail—, decí que Jonatan debe confirmar si se puede implementar. Que no esté escrito acá no quiere decir que no se pueda: quiere decir que no lo sabés.

LO QUE NO PODÉS DECIR, Y CÓMO PEDIRLO
Precios, montos, porcentajes, plazos en días o semanas, y condiciones de contratación: nada de eso sale de vos. Están escritos en una ficha fija, con los valores exactos.
Que algo se cotiza aparte, que va por otro lado, que se cobra una sola vez, que se cambia desde el panel, que se paga por mensaje, que es una integración: eso también es condición y tampoco sale de vos, aunque no lleve un solo número. O lo dice la ficha o no se dice. Y si ya pusiste la ficha, no la repitas con palabras tuyas: lo que dice, dicho está.

Cuando el visitante TE PREGUNTA por alguna de esas cosas, no contestes vos: escribí la marca que corresponde y el sistema pega el texto exacto en su lugar.

[[FICHA: precio_agente]]          cuánto sale el agente o el chatbot
[[FICHA: precio_automatizacion]]  cuánto sale automatizar un proceso interno
[[FICHA: precio]]                 sólo si todavía no sabés de cuál de los dos te están hablando
[[FICHA: incluye]]     qué incluye el plan, qué trae
[[FICHA: cupo]]        cuántas respuestas, qué pasa si me paso del límite
[[FICHA: plazo]]       cuánto tarda, cuándo lo tienen andando
[[FICHA: baja]]        permanencia, contrato, darse de baja
[[FICHA: canal]]       por qué canal atiende, WhatsApp o web o Telegram
[[FICHA: celular]]     si puede seguir usando su WhatsApp desde el teléfono
[[FICHA: datos]]       seguridad, privacidad, quién ve la información
[[FICHA: servicios]]   qué hace NexoIArg, qué servicios ofrece
[[FICHA: actualizar]]  cómo cambia precios o stock una vez implementado
[[FICHA: errores]]     qué pasa si el agente contesta mal

Con el precio prestá atención a QUÉ te están preguntando. Si vienen hablando de automatizar una tarea interna y preguntan cuánto sale, no les tires la lista del agente: eso no tiene precio de lista y se cotiza. Si vienen hablando del agente, usá la del agente. Si recién arrancan y no sabés, usá la genérica.

Podés escribir una frase tuya antes o después de la marca, pero nunca los números. Esa frase tiene que decir algo de SU caso o directamente no va: nada de "te paso lo que está publicado", "los valores son estos", "te paso los números tal cual". Si no tenés nada propio para decir, dejá la marca sola en una línea, que se lee mejor. Y no anuncies la ficha ni expliques de dónde sale: el visitante no tiene que enterarse de que atrás hay un texto fijo.

Sólo usá la marca cuando te lo estén PREGUNTANDO: si el visitante está describiendo su propio negocio y menciona precios, kilómetros o plazos de ÉL, eso no es una consulta — es información de su caso, y lo que tenés que hacer es entenderla, no contestar con nuestra ficha. Cuando le repitas datos que te dio él, escribilos con palabras: "cuarenta pedidos por noche", "un recargo por el ascensor", "la quinta parte de los turnos". No uses el signo de peso ni el de porcentaje ni escribas "en 15 días", aunque el número sea de él y no tuyo. Igual, devolverle el número no es lo importante — lo que tenés que mostrarle es que entendiste para qué sirve ese número en su negocio.

Tampoco inventes resultados, estadísticas ni comparaciones. Si no está escrito acá arriba, no existe.
Si te preguntan algo que no tiene que ver con NexoIArg ni con automatizar, no improvises: decí que de eso no podés ayudar y volvé al tema.

DOS MARCAS QUE EL VISITANTE NO VE
Cuando ya entendiste de qué se dedica y cuál es la tarea concreta, agregá al final de tu mensaje, en una línea aparte:
[[RESUMEN: tengo <rubro>, y lo que me come tiempo es <tarea en las palabras de la persona>. <Una línea más si hay algo importante: canal, sistemas, volumen.>]]
Ese texto se usa para abrir el WhatsApp con la charla ya empezada, así que escribilo en primera persona, como si lo escribiera el visitante.
El resumen va una sola vez por conversación, en el mensaje en el que ya lo tenés entero. Si más adelante te suma un dato importante —el canal, el sistema, el volumen— podés volver a escribirlo completo y actualizado, y vale el último; lo que no podés es repetirlo igual en cada mensaje. Que tenga siempre el rubro, la tarea y de dónde sale hoy el dato.

Y cuando ya tengas suficiente para que valga la pena hablar con una persona, agregá también, en otra línea:
[[LISTO]]
No pongas [[LISTO]] sin saber dos cosas: cada cuánto pasa la tarea y de dónde sale hoy el dato. Si te falta alguna de las dos, esa es tu próxima pregunta y no otra.
[[LISTO]] tampoco es una excusa para no contestar. Antes de ponerlo decile vos qué parte se resuelve sola, qué parte le va a quedar a mano igual y qué tiene que ordenar él primero. Y no mandes a preguntar algo que podés preguntar vos ahora: si Jonatan va a necesitar saber qué sistema usa, preguntáselo y metelo en el resumen.

No menciones ni expliques estas marcas nunca. Si todavía te falta entender el caso, no las pongas.`;

/* ════════════════════════════════════════════════════════════════════
   3. Guardas
   ════════════════════════════════════════════════════════════════════ */

const normalizar = (s) =>
  String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Coincidencia por PALABRA ENTERA, no por pedazo de texto.
 * Con `includes`, "trabajan los domingos" disparaba el hecho "baja",
 * porque tra-BAJA-n contiene "baja". La `s` final opcional deja pasar
 * el plural sin volver a abrir esa puerta.
 */
function contieneClave(texto, clave) {
  const escapada = clave.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escapada}s?([^a-z0-9]|$)`).test(texto);
}

function buscarHecho(pregunta) {
  const n = normalizar(pregunta);
  let mejor = null;
  let puntos = 0;
  for (const h of HECHOS) {
    let p = 0;
    for (const c of h.claves) if (contieneClave(n, normalizar(c))) p += c.length;
    if (p > puntos) {
      puntos = p;
      mejor = h;
    }
  }
  return mejor;
}

// Las preguntas comerciales explícitas salen de la ficha aun si el modelo
// no está disponible. Exigir contexto evita confundir el precio de un
// producto del visitante con el precio del servicio de NexoIArg.
function hechoExplicito(pregunta) {
  const n = normalizar(pregunta);
  const get = (id) => HECHOS.find((hecho) => hecho.id === id);
  if (/(cuanto sale|cuanto cuesta|precio|tarifa|valor)/.test(n) &&
      /(agente|chatbot|nexoiarg|whatsapp|telegram|plan)/.test(n)) return get("precio");
  if (/(cupo|limite|800|excedente|respuestas)/.test(n) &&
      /(agente|plan|me paso|limite|800|respuestas)/.test(n)) return get("cupo");
  if (/que incluye.*(plan|agente|servicio)/.test(n)) return get("incluye");
  if (/que incluye.*(implementacion|puesta en marcha)/.test(n)) return get("incluye");
  if (/(como actualizo|cambiar precio|actualizar stock|cargar productos)/.test(n)) return get("actualizar");
  if (/(cuanto tarda|cuanto tiempo|plazo|tiempo de implementacion)/.test(n) ||
      /en cuanto tiempo.*andando/.test(n)) return get("plazo");
  if (/punto de venta|programa de caja|software de ventas/.test(n)) return get("pos");
  if (/ceramicas gutierrez|caso ceramicas/.test(n)) return get("ceramicas");
  if (/whatsapp.*celular|celular.*whatsapp|app de whatsapp/.test(n)) return get("celular");
  if (/permanencia|dar de baja|cancelar el servicio/.test(n)) return get("baja");
  return null;
}

/**
 * El modelo pide un dato comercial escribiendo [[FICHA: precio]]. Acá se
 * reemplaza por el texto exacto de HECHOS. Se hace del lado del servidor a
 * propósito: si sólo lo hiciera el navegador, un cliente que llame al
 * endpoint directo recibiría la marca cruda, y la garantía dependería de
 * quién consume la respuesta.
 */
function expandirFichas(texto) {
  return String(texto).replace(/\[\[\s*FICHA\s*:\s*([a-zA-Z_]+)\s*\]\]/g, (_, id) => {
    const h = HECHOS.find((x) => x.id === String(id).toLowerCase().trim());
    if (!h) console.warn("[ficha] el modelo pidió una ficha inexistente:", id);
    // El navegador presenta el texto con textContent y conserva los saltos.
    return h ? h.texto : "";
  });
}

/**
 * Filtro de salida. Si el modelo igual escupió algo que compromete,
 * no sale de acá. Preferimos derivar antes que arriesgar un número mal.
 */
const COMPROMETE = [
  /\$\s?\d/,                                                  // cualquier monto
  /\b\d[\d.]{2,}\s?(pesos|ars)\b/i,                           // "180.000 pesos"
  /\b\d{1,3}\s?%\s?(de\s+)?(descuento|menos|mas|más|mejora|ahorro|aumento)/i,      // "40% de mejora"
  /\b(mejor|aument|reduc|ahorr|increment|multiplic)\w*\s+(un |el |la |en |tu )?\d{1,3}\s?%/i, // "mejora un 40%"
  /\b(en|dentro de)\s+\d+\s?(dias|días|semanas|meses)\b/i,    // "en 15 dias"
  /\bgarantiz|\bte aseguro\b|\bsin falla/i,                   // promesas
];

/**
 * Se evalúa el texto SIN las marcas internas: un [[RESUMEN: ...]] puede
 * contener números que dijo el visitante ("15 viajes por día") y esos no
 * comprometen nada.
 *
 * Las reglas de plazo y porcentaje están acotadas a propósito: bloquean el
 * porcentaje cuando promete un resultado, no cuando describe la situación
 * del cliente. Antes, un visitante que decía "se me cae el 20% de los turnos"
 * hacía que se descartara la mejor respuesta de toda la conversación. El
 * filtro está para atajar lo que promete NexoIArg, no los números del cliente.
 */
function comprometeCondiciones(txt) {
  const visible = String(txt).replace(/\[\[[\s\S]*?\]\]/g, " ");
  return COMPROMETE.some((re) => re.test(visible));
}

/* ════════════════════════════════════════════════════════════════════
   4. Proveedores
   ════════════════════════════════════════════════════════════════════ */

const PROVEEDORES = {
  deepseek: {
    url: "https://api.deepseek.com/chat/completions",
    cuerpo: (msg, turnos) => ({
      model: "deepseek-chat",
      max_tokens: 320,
      temperature: 0.4,
      messages: [{ role: "system", content: SISTEMA }, ...turnos, { role: "user", content: msg }],
    }),
    cabeceras: () => ({ Authorization: `Bearer ${API_KEY}` }),
    leer: (d) => d?.choices?.[0]?.message?.content,
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    cuerpo: (msg, turnos) => ({
      model: "gpt-4o-mini",
      max_tokens: 320,
      temperature: 0.4,
      messages: [{ role: "system", content: SISTEMA }, ...turnos, { role: "user", content: msg }],
    }),
    cabeceras: () => ({ Authorization: `Bearer ${API_KEY}` }),
    leer: (d) => d?.choices?.[0]?.message?.content,
  },
  anthropic: {
    url: "https://api.anthropic.com/v1/messages",
    cuerpo: (msg, turnos) => ({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 320,
      system: SISTEMA,
      messages: [...turnos, { role: "user", content: msg }],
    }),
    cabeceras: () => ({ "x-api-key": API_KEY, "anthropic-version": "2023-06-01" }),
    leer: (d) => d?.content?.[0]?.text,
  },
};

async function preguntarAlModelo(mensaje, historial) {
  const p = PROVEEDORES[PROVEEDOR];
  if (!p) throw new Error(`Proveedor desconocido: ${PROVEEDOR}`);
  // Sin historial no hay conversación: el modelo repreguntaría lo ya dicho.
  const turnos = (Array.isArray(historial) ? historial : [])
    .slice(-12)
    .filter((t) => t && typeof t.texto === "string" && t.texto.trim())
    .map((t) => ({
      role: t.rol === "agente" ? "assistant" : "user",
      content: String(t.texto).slice(0, 600),
    }));

  const ctrl = new AbortController();
  const corte = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(p.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...p.cabeceras() },
      body: JSON.stringify(p.cuerpo(mensaje, turnos)),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`${PROVEEDOR} respondió ${res.status}`);
    return (p.leer(await res.json()) || "").trim();
  } finally {
    clearTimeout(corte);
  }
}

/* ════════════════════════════════════════════════════════════════════
   5. Límite por IP: 20 mensajes cada 10 minutos
   ════════════════════════════════════════════════════════════════════ */

const visitas = new Map();
const VENTANA = 10 * 60 * 1000;
const TOPE = 20;

function pasaElLimite(ip) {
  const ahora = Date.now();
  const previas = (visitas.get(ip) || []).filter((t) => ahora - t < VENTANA);
  if (previas.length >= TOPE) return false;
  previas.push(ahora);
  visitas.set(ip, previas);
  return true;
}

setInterval(() => {
  const ahora = Date.now();
  for (const [ip, ts] of visitas) {
    const vivas = ts.filter((t) => ahora - t < VENTANA);
    if (vivas.length) visitas.set(ip, vivas);
    else visitas.delete(ip);
  }
}, VENTANA).unref();

/* ════════════════════════════════════════════════════════════════════
   6. Servidor
   ════════════════════════════════════════════════════════════════════ */

function responder(res, codigo, datos) {
  const cuerpo = JSON.stringify(datos);
  res.writeHead(codigo, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": ORIGEN,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Length": Buffer.byteLength(cuerpo),
  });
  res.end(cuerpo);
}

const servidor = http.createServer((req, res) => {
  if (req.method === "OPTIONS") return responder(res, 204, {});

  if (req.method === "GET" && req.url === "/salud") {
    return responder(res, 200, { estado: "ok", proveedor: PROVEEDOR, hechos: HECHOS.length });
  }

  if (req.method !== "POST") return responder(res, 405, { error: "método no permitido" });

  const ip = String(req.headers["x-real-ip"] || req.socket.remoteAddress || "");
  if (!pasaElLimite(ip)) {
    return responder(res, 429, { respuesta: "Estuvimos hablando bastante. Seguí por WhatsApp con Jonatan." });
  }

  let crudo = "";
  req.on("data", (c) => {
    crudo += c;
    if (crudo.length > 4000) req.destroy();
  });

  req.on("end", async () => {
    let mensaje, historial;
    try {
      const cuerpo = JSON.parse(crudo);
      mensaje = String(cuerpo.mensaje || "").slice(0, 600).trim();
      historial = Array.isArray(cuerpo.historial) ? cuerpo.historial : [];
    } catch {
      return responder(res, 400, { error: "json inválido" });
    }
    if (!mensaje) return responder(res, 400, { error: "mensaje vacío" });

    const directo = hechoExplicito(mensaje);
    if (directo) return responder(res, 200, { respuesta: directo.texto, fuente: "hecho:" + directo.id });

    try {
      const salida = await preguntarAlModelo(mensaje, historial);
      if (!salida || salida.includes("SIN_DATO")) {
        return responder(res, 200, { respuesta: NO_SE, fuente: "sin_dato" });
      }
      if (comprometeCondiciones(salida)) {
        console.warn("[filtro] respuesta descartada por comprometer condiciones:", salida.slice(0, 140));
        // En modo reaccion no hay nada que decir: vacío, y el navegador usa su red.
        return responder(res, 200, { respuesta: NO_SE, fuente: "filtrado" });
      }
      const conFichas = expandirFichas(salida);
      return responder(res, 200, {
        respuesta: conFichas,
        fuente: conFichas === salida ? "modelo" : "modelo+ficha",
      });
    } catch (e) {
      console.error("[modelo]", e.message);
      return responder(res, 200, { respuesta: NO_SE, fuente: "error" });
    }
  });
});

servidor.listen(PUERTO, "127.0.0.1", () => {
  console.log(`Agente de NexoIArg escuchando en 127.0.0.1:${PUERTO} — proveedor ${PROVEEDOR}, origen ${ORIGEN}`);
});
