import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const root = join(import.meta.dirname, "..", "sitio");
const html = readFileSync(join(root, "index.html"), "utf8");
const privacy = readFileSync(join(root, "privacidad.html"), "utf8");
const js = readFileSync(join(root, "assets/site.js"), "utf8");
const css = readFileSync(join(root, "assets/site.css"), "utf8");
const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
const robots = readFileSync(join(root, "robots.txt"), "utf8");
const nginx = readFileSync(join(root, "..", "vps/nexoiarg-nginx.conf"), "utf8");
const tests = [];
const check = (name, fn) => tests.push([name, fn]);

check("los destinos internos existen", () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  assert.equal(ids.size, [...html.matchAll(/\bid="([^"]+)"/g)].length, "hay id duplicados");
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert(ids.has(target), "falta #" + target);
});
check("los archivos publicados existen", () => {
  for (const [, file] of html.matchAll(/(?:src|href)="\/(assets\/[^"]+)"/g)) {
    assert(existsSync(join(root, file)), "falta " + file);
  }
});
check("la imagen para compartir coincide con sus metadatos", () => {
  const png = readFileSync(join(root, "assets/og.png"));
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert(html.includes('content="1200"'));
  assert(html.includes('content="630"'));
});
check("cada servicio tiene una página enlazada e indexable", () => {
  const pages = [
    "agentes-ia-whatsapp.html", "automatizaciones-para-negocios.html",
    "paginas-web-para-comercios.html", "punto-de-venta-windows.html"
  ];
  const titles = new Set();
  for (const file of pages) {
    const page = readFileSync(join(root, file), "utf8");
    const canonical = "https://nexoiarg.com/" + file;
    assert(html.includes('href="/' + file + '"'), "sin enlace interno: " + file);
    assert(sitemap.includes("<loc>" + canonical + "</loc>"), "fuera del sitemap: " + file);
    assert(page.includes('rel="canonical" href="' + canonical + '"'), "sin URL canónica: " + file);
    assert.equal([...page.matchAll(/<h1\b/g)].length, 1, "se espera un título principal: " + file);
    assert(page.includes('name="description"'));
    const title = page.match(/<title>([^<]+)<\/title>/)?.[1];
    assert(title && !titles.has(title), "título duplicado: " + file);
    titles.add(title);
  }
  assert(robots.includes("User-agent: *") && robots.includes("Allow: /"));
  assert(!robots.includes("Disallow: /"));
});
check("datos de negocio y política de scripts coinciden", () => {
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert(jsonLd, "sin datos estructurados");
  const data = JSON.parse(jsonLd);
  assert.equal(data["@graph"][0].name, "NexoIArg");
  assert.equal(data["@graph"][0].telephone, "+5491168062699");
  const hash = createHash("sha256").update(jsonLd).digest("base64");
  assert(nginx.includes("'sha256-" + hash + "'"), "la CSP bloquearía los datos estructurados");
  assert(nginx.includes("script-src 'self'"));
  assert(!nginx.includes("unsafe-inline"));
});
check("el retrato publicado es la versión actual de Jonatan", () => {
  const source = readFileSync(join(root, "..", "Jonatan.png"));
  const published = readFileSync(join(root, "assets/jonatan-2026.png"));
  assert(source.equals(published));
  assert(html.includes('src="/assets/jonatan-2026.png"'));
});
check("precios y sumas coinciden", () => {
  for (const value of ["$290.000", "$180.000", "$470.000", "$190.000", "$120.000", "$310.000", "$70", "800"]) {
    assert(html.includes(value), "falta " + value);
  }
  assert.equal(290000 + 180000, 470000);
  assert.equal(190000 + 120000, 310000);
});
check("proyectos y POS tienen alcance factual", () => {
  assert(html.includes("SITIO WEB REALIZADO"));
  assert(html.includes("versión distribuida es 1.1.1"));
  for (const claim of ["tres llamadas por hora", "Andando en 3 empresas", "ventas aumentaron", "facturación ARCA"]) {
    assert(!html.includes(claim), "afirmación no respaldada: " + claim);
  }
});
check("chat y medición no usan HTML inseguro ni envían mensajes a eventos", () => {
  assert(!js.includes("innerHTML"));
  assert(js.includes("item.textContent = text"));
  assert(js.includes("track(\"visita\")"));
  const eventPayload = js.match(/const data = JSON\.stringify\(\{([^}]+)\}\)/)?.[1] || "";
  assert(!/question|message|history|mensaje|historial/.test(eventPayload));
});
check("hay accesibilidad y adaptación móvil", () => {
  assert(html.includes('class="skip-link"'));
  assert(html.includes('aria-expanded="false"'));
  assert(html.includes('role="log"'));
  assert(css.includes(":focus-visible"));
  assert(css.includes("prefers-reduced-motion:reduce"));
  assert(css.includes("max-width:380px"));
});
check("privacidad explica la medición", () => {
  assert(privacy.includes("Medición de la web"));
  assert(privacy.includes("no incluyen el texto del chat"));
  assert(privacy.includes("tu dirección IP ni datos del navegador"));
  assert(privacy.includes("30 de septiembre de 2026"));
});
check("servicios privados y cabeceras públicas están limitados", () => {
  const agent = readFileSync(join(root, "..", "vps/agente-servidor.js"), "utf8");
  const events = readFileSync(join(root, "..", "vps/servidor.js"), "utf8");
  assert(agent.includes('servidor.listen(PUERTO, "127.0.0.1"'));
  assert(agent.includes('req.headers["x-real-ip"]'));
  assert(!agent.includes('req.headers["x-forwarded-for"]'));
  assert(!events.includes("ip: ip") && !events.includes("ua: String"));
  for (const header of ["Content-Security-Policy", "Strict-Transport-Security", "X-Content-Type-Options", "Permissions-Policy"]) assert(nginx.includes(header));
  assert(nginx.includes("location = /api/agente"));
});

let failures = 0;
for (const [name, fn] of tests) {
  try { fn(); process.stdout.write("OK  " + name + "\n"); }
  catch (error) { failures++; process.stderr.write("FAIL  " + name + ": " + error.message + "\n"); }
}
process.exitCode = failures ? 1 : 0;
