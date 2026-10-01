(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const isLocalPreview = location.hostname === "127.0.0.1" || location.hostname === "localhost";
  const campaignKeys = ["utm_source", "utm_medium", "utm_campaign"];
  let campaign = "";
  try {
    const params = new URLSearchParams(location.search);
    const current = campaignKeys.map((key) => {
      const value = (params.get(key) || "").replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 36);
      return value ? key + "=" + value : "";
    }).filter(Boolean).join("&");
    campaign = current || sessionStorage.getItem("nexo_campaign") || "";
    if (current) sessionStorage.setItem("nexo_campaign", current);
  } catch (_) {}

  function track(eventName) {
    if (isLocalPreview) return;
    try {
      const data = JSON.stringify({ e: eventName, x: campaign || null, p: location.pathname, t: Date.now() });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/evento", new Blob([data], { type: "application/json" }));
      else fetch("/api/evento", { method: "POST", body: data, keepalive: true }).catch(() => {});
    } catch (_) {}
  }
  track("visita");
  document.addEventListener("click", (event) => {
    const item = event.target.closest("[data-ev]");
    if (item) track(item.dataset.ev);
  });
  let reachedHalf = false, reachedEnd = false;
  window.addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const fraction = max > 0 ? scrollY / max : 0;
    if (fraction >= 0.5 && !reachedHalf) { reachedHalf = true; track("scroll_50"); }
    if (fraction >= 0.9 && !reachedEnd) { reachedEnd = true; track("scroll_90"); }
  }, { passive: true });

  const menuToggle = $("menu-toggle");
  const mainNav = $("main-nav");
  function closeMenu() {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú");
  }
  menuToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  });
  mainNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const values = { c1: 0, c2: 0, c3: 0, cm: 4 };
  const calculator = $("calc");
  let calcUsed = false;
  function updateCalculator() {
    Object.keys(values).forEach((key) => { $(key).textContent = values[key]; });
    const hours = ((values.c1 + values.c2) * values.cm * 22) / 60;
    const missed = values.c3 * 22;
    const hourly = Math.max(0, Number($("vh").value) || 0);
    const hasResult = hours > 0 || missed > 0;
    $("calc-hint").hidden = hasResult;
    $("calc-numbers").hidden = !hasResult;
    $("calc-cta").hidden = !hasResult;
    $("hours-line").hidden = hours <= 0;
    $("hours").textContent = hours.toLocaleString("es-AR", { maximumFractionDigits: 1 });
    $("money-line").hidden = !(hourly > 0 && hours > 0);
    $("money").textContent = "$" + Math.round(hourly * hours).toLocaleString("es-AR");
    $("missed-line").hidden = missed <= 0;
    $("missed").textContent = missed.toLocaleString("es-AR");
    const message = "Hola Jonatan, hice la cuenta en la web: unas " +
      hours.toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " horas al mes en tareas repetibles" +
      (missed ? " y " + missed + " consultas sin responder al mes" : "") + ". Mi negocio es: ";
    $("calc-cta").href = "https://wa.me/5491168062699?text=" + encodeURIComponent(message);
    if (hasResult && !calcUsed) { calcUsed = true; track("calc_uso"); }
  }
  calculator.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-k]");
    if (!button) return;
    const key = button.dataset.k;
    const next = values[key] + Number(button.dataset.d);
    values[key] = Math.min(key === "cm" ? 30 : 99, Math.max(key === "cm" ? 1 : 0, next));
    updateCalculator();
  });
  $("vh").addEventListener("input", updateCalculator);
  updateCalculator();

  const facts = [
    { keys: ["precio", "precios", "cuanto sale", "cuanto cuesta", "tarifa", "valor", "cotiza"], text: "El agente en WhatsApp cuesta $290.000 de implementación y $180.000 por mes: implementación más primer mes, $470.000. Incluye hasta 800 respuestas del agente por mes. En web o Telegram, $190.000 de implementación y $120.000 por mes: implementación más primer mes, $310.000. Esos canales no tienen cupo comercial de conversaciones. Automatizaciones, sitios y software se presupuestan según el alcance." },
    { keys: ["cupo", "respuesta", "800", "excedente", "adicional", "limite"], text: "Una respuesta es cada mensaje enviado por el agente; los mensajes del cliente no cuentan. El plan de WhatsApp incluye 800 respuestas por mes. Te avisamos al 80%. Si llegás al límite, podés autorizar respuestas adicionales a $70 cada una o elegir derivación directa hasta el mes siguiente. El cupo de NexoIArg es distinto de las tarifas de mensajería de Meta." },
    { keys: ["puesta en marcha", "implementacion", "incluye", "instalacion"], text: "La implementación incluye carga inicial de tu información, configuración, alta del canal, pruebas con vos y panel configurado. En WhatsApp cuesta $290.000; en web o Telegram, $190.000. La mensualidad incluye acompañamiento y ajustes derivados del uso real." },
    { keys: ["stock", "actualizar", "precio de producto", "cambiar precio", "sincronizar"], text: "Podés actualizar precios y stock desde el panel o por planilla. El agente responde con lo último que cargaste. Si necesitás sincronizarlo automáticamente con otro sistema, esa integración se cotiza aparte." },
    { keys: ["celular", "mi whatsapp", "desde el telefono", "app de whatsapp"], text: "Podés seguir usando WhatsApp desde el celular si tu número admite el modo de conexión compatible. Lo verificamos antes de contratar." },
    { keys: ["baja", "permanencia", "cancelar", "contrato"], text: "El servicio es mes a mes, sin permanencia. La baja se solicita con 30 días de aviso." },
    { keys: ["plazo", "cuanto tarda", "demora", "tiempo de implementacion"], text: "El plazo estimado es de dos a tres semanas desde que recibimos tu información. Si el canal es WhatsApp, el alta del número depende también de los tiempos de Meta." },
    { keys: ["canal", "telegram", "web", "whatsapp"], text: "El agente puede atender por WhatsApp, en tu sitio web o en Telegram. Elegimos el canal según dónde consultan tus clientes y qué necesita tu negocio." },
    { keys: ["punto de venta", "pos", "caja"], text: "El punto de venta es un programa local para una PC Windows. Incluye ventas, productos, stock, caja, proveedores, cuentas corrientes y copias de seguridad. Si querés, coordinamos una demostración con datos de prueba." },
    { keys: ["quien", "jonatan", "equipo"], text: "Soy el agente de NexoIArg. Jonatan desarrolla las soluciones y atiende personalmente las consultas comerciales por WhatsApp." },
    { keys: ["ceramicas gutierrez", "caso ceramicas"], text: "Para Cerámicas Gutiérrez, Jonatan entregó el sitio web, el catálogo de productos y accesos a WhatsApp. El carrito y los pagos por Mercado Pago están en desarrollo. No hay un agente de IA implementado en ese caso como trabajo entregado." }
  ];
  const byId = Object.fromEntries(facts.map((fact, index) => [["precio", "cupo", "puesta", "actualizar", "celular", "baja", "plazo", "canal", "pos", "quien", "ceramicas"][index], fact.text]));
  const normalize = (value) => String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const containsTerm = (text, term) => {
    const escaped = normalize(term).replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
    return new RegExp("(^|[^a-z0-9])" + escaped + "([^a-z0-9]|$)").test(text);
  };
  function knownAnswer(question) {
    const text = normalize(question);
    let best = null, score = 0;
    facts.forEach((fact) => fact.keys.forEach((key) => {
      if (containsTerm(text, key) && key.length > score) { score = key.length; best = fact.text; }
    }));
    return best;
  }
  function cleanReply(value) {
    let answer = String(value || "");
    answer = answer.replace(/\[\[\s*FICHA\s*:\s*([a-z_]+)\s*\]\]/gi, (_, id) => byId[id.toLowerCase()] || "");
    answer = answer.replace(/\[\[\s*RESUMEN\s*:[\s\S]*?\]\]/gi, "").replace(/\[\[\s*LISTO\s*\]\]/gi, "");
    answer = answer.replace(/<br\s*\/?\s*>/gi, "\n").replace(/<\/(p|div|li)>/gi, "\n").replace(/<[^>]*>/g, "");
    return answer.trim().slice(0, 3500);
  }

  const panel = $("chat-panel"), launcher = $("chat-launcher"), chatBody = $("chat-body");
  const chatInput = $("chat-input"), chatStatus = $("chat-status"), suggestions = $("chat-suggestions");
  const history = [];
  let started = false, busy = false, lastFocus = null, summary = "";
  const suggested = ["¿Cuánto cuesta el agente?", "¿Cómo actualizo mi catálogo?", "¿Sirve para mi comercio?"];
  function addMessage(text, kind) {
    const item = document.createElement("div");
    item.className = "chat-message " + kind;
    item.textContent = text;
    chatBody.appendChild(item);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  function renderSuggestions(items = suggested) {
    suggestions.replaceChildren();
    items.forEach((label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => sendMessage(label));
      suggestions.appendChild(button);
    });
    const contact = document.createElement("button");
    contact.type = "button";
    contact.textContent = summary ? "Seguir por WhatsApp con resumen ↗" : "Hablar con Jonatan ↗";
    contact.addEventListener("click", () => {
      track("agente_persona");
      const message = "Hola Jonatan, estuve hablando con el agente de tu web." +
        (summary ? " " + summary.slice(0, 500) : " Quiero consultarte por mi negocio.");
      window.open("https://wa.me/5491168062699?text=" + encodeURIComponent(message), "_blank", "noopener");
    });
    suggestions.appendChild(contact);
  }
  function syncViewport() {
    if (!window.visualViewport) return;
    panel.style.setProperty("--visual-height", Math.round(window.visualViewport.height) + "px");
    panel.style.setProperty("--visual-offset", Math.round(window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop) + "px");
  }
  function openChat() {
    lastFocus = document.activeElement;
    panel.hidden = false;
    launcher.hidden = true;
    document.querySelectorAll("header,main,footer").forEach((element) => { element.inert = true; });
    syncViewport();
    if (!started) {
      started = true;
      track("agente_abrir");
      addMessage("Hola, soy el agente de NexoIArg. Puedo contarte cómo trabajamos, los precios publicados y qué datos necesitamos para evaluar tu caso. ¿Qué te gustaría saber?", "bot");
      renderSuggestions();
    }
    chatInput.focus({ preventScroll: true });
  }
  function closeChat() {
    panel.hidden = true;
    launcher.hidden = false;
    document.querySelectorAll("header,main,footer").forEach((element) => { element.inert = false; });
    chatStatus.textContent = "";
    (lastFocus && lastFocus.isConnected ? lastFocus : launcher).focus({ preventScroll: true });
  }
  document.querySelectorAll("[data-open-chat]").forEach((button) => button.addEventListener("click", openChat));
  $("chat-close").addEventListener("click", closeChat);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) { closeChat(); return; }
    if (event.key === "Tab" && !panel.hidden) {
      const focusables = Array.from(panel.querySelectorAll("button:not([disabled]),input:not([disabled])")).filter((element) => element.offsetParent !== null);
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncViewport);
    window.visualViewport.addEventListener("scroll", syncViewport);
  }
  async function sendMessage(raw) {
    const question = String(raw || "").trim().slice(0, 1000);
    if (!question || busy) return;
    busy = true;
    chatInput.value = "";
    chatInput.disabled = true;
    suggestions.replaceChildren();
    addMessage(question, "user");
    history.push({ rol: "visitante", texto: question });
    track("agente_mensaje");
    chatStatus.textContent = "Buscando una respuesta…";
    let answer = "", failed = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
    try {
      if (isLocalPreview) throw new Error("Vista previa local");
      const response = await fetch("/api/agente", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: question, historial: history.slice(-12) }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error("Servicio no disponible");
      const data = await response.json();
      if (data && data.fuente === "error") throw new Error("Modelo no disponible");
      const rawAnswer = String(data && data.respuesta || "");
      const summaries = [...rawAnswer.matchAll(/\[\[\s*RESUMEN\s*:\s*([\s\S]*?)\]\]/gi)];
      if (summaries.length) summary = summaries[summaries.length - 1][1].trim();
      answer = cleanReply(rawAnswer);
      if (!answer) throw new Error("Respuesta vacía");
    } catch (_) {
      failed = true;
      answer = knownAnswer(question) || "No puedo responder esa consulta desde acá en este momento. Escribile a Jonatan por WhatsApp para revisarla.";
    } finally {
      clearTimeout(timer);
    }
    addMessage(answer, "bot");
    history.push({ rol: "agente", texto: answer });
    chatStatus.textContent = failed
      ? (isLocalPreview ? "Vista previa: respuesta desde la ficha local. El agente completo funciona en la web publicada." : "El servicio no respondió. Mostré la información disponible en esta página.")
      : "";
    renderSuggestions(failed ? ["¿Cuánto cuesta el agente?", "¿Cómo actualizo mi catálogo?"] : suggested);
    busy = false;
    chatInput.disabled = false;
    chatInput.focus({ preventScroll: true });
  }
  $("chat-form").addEventListener("submit", (event) => { event.preventDefault(); sendMessage(chatInput.value); });
})();
