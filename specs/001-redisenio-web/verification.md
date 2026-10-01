# Verificación del rediseño

Fecha: 2026-10-01. Estado: publicado, comprobado y enviado a Git.

## Pruebas locales

- `node tests/site-check.mjs`: 13/13 controles aprobados el 01/10. Comprueban rutas, archivos, metadatos, marca y portfolio, sumas, contenido factual, privacidad, acceso y CSP.
- `node agente/pruebas.js`, con servidor local y clave de prueba: 12/12 aprobadas. Las preguntas abiertas usaron el respaldo ante la ausencia de un proveedor de IA con créditos; el motor evita inventar importes y deriva lo que no sabe.
- `Jonatan.png` y `sitio/assets/jonatan-2026.jpg` son idénticos en bytes. El original tiene contenido JPEG y la copia web usa extensión y URL nuevas.
- Las seis páginas referencian CSS versionado `site-2026.css` y `professional-2026-v3.css` para evitar la caché de estilos anteriores. La prueba de archivos comprueba que existen.

## Publicación y seguridad

- Jonatan ejecutó `bash /home/nexo-web/deploy-nexoiarg.sh` desde su sesión root tras preparar cada paquete. El script crea respaldo bajo `/var/backups/nexoiarg`, valida Nginx y servicios, limita la copia a rutas de NexoIArg y revierte si falla.
- Se confirmó el CSS final `professional-2026-v3.css` en `/var/www/nexoiarg` y respuesta HTTPS 200 con tipo `text/css`.
- Respuestas públicas comprobadas: portada, página de agentes, privacidad y sitemap 200; respaldo HTML antiguo 404. La portada envía CSP, HSTS, `nosniff` y `Permissions-Policy`.
- El agente y el receptor de eventos escuchan sólo en localhost. El receptor almacena evento, ruta, campaña y fecha; no texto del chat, IP ni agente de usuario.
- No se leyó ni publicó el `.env` del VPS. No se modificaron Cerámicas Gutiérrez ni Punto de Venta.

## Revisión visual y recorridos

- En Chrome se revisó la portada y una página de servicio a ancho de escritorio; tarjetas de precios de escritorio con alturas iguales (604 px), total del primer mes y botones alineados a un píxel.
- En navegador real a 390 px se revisaron portada, Cerámicas, Monti, Moto Express y ambos planes. El logo final de Moto Express mide 220 × 220 px dentro de un marco de 341 × 220 px, con `object-fit: contain`; la captura publicada muestra el círculo y su borde inferior completos. No hay desbordamiento horizontal.
- El botón móvil del agente se colocó en la cabecera; la captura de precios muestra importes completos y ninguna acción sobre el contenido. El chat abre como panel móvil y muestra su bienvenida, sugerencias, campo y cierre.
- Se comprobó el menú y las anclas de navegación durante la revisión previa. En la última revisión del chat, la herramienta de navegador rechazó la acción de enviar una pregunta por límite de uso de la revisión automática; no se repitió por otra vía. Las 12 pruebas locales cubren la respuesta comercial y el respaldo del agente.
- La identidad final usa blanco/gris claro, azul tinta y acento azul, logo real en cabecera y favicon, sin franja redundante ni sombra desplazada.

## SEO y descubrimiento

- Google Search Console verificó `https://nexoiarg.com/`. Se envió `sitemap.xml` y se solicitó indexación de las cuatro páginas de servicio; la consola confirmó la cola prioritaria. El informe aún indicaba “Descubierta: actualmente sin indexar” para páginas nuevas.
- La clave pública de IndexNow respondió por HTTPS y el envío de las seis URL recibió HTTP 202. Es acuse de recepción, no prueba de indexación.
- Las seis páginas tienen canonicals y entradas en el sitemap; cuatro páginas de servicio contienen títulos y contenido propio. `robots.txt` permite el rastreo general y OAI-SearchBot.
- No se creó Perfil de Empresa ni páginas por localidad: falta confirmación de zona real y datos de elegibilidad. Nadie puede garantizar que Google o una IA recomienden la web en todas las consultas.

## Git

- El remoto es el repositorio público `MatiasCripto/nexoiarg`. La revisión automática rechazó el primer intento por posible exposición de información. Tras auditar los archivos preparados y confirmar que no contenían `.env`, llaves, tokens ni respaldos, se creó el commit `e43b353` y se envió `main` a `origin/main`. `Jonatan.png` está incluido como pidió Jonatan.
