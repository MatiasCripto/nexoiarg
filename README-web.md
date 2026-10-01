# NexoIArg — web

## Vista previa

Desde esta carpeta:

```powershell
node preview.mjs
```

Abrí http://127.0.0.1:4173. La vista previa sirve los archivos de `sitio/`. La calculadora, navegación y chat con respuestas comerciales de respaldo funcionan localmente; la conversación con el modelo requiere el servicio del VPS.

## Estructura

- `sitio/index.html`: contenido y metadatos.
- `sitio/assets/site.css`: sistema visual y estados adaptables.
- `sitio/assets/site.js`: menú, calculadora, chat y eventos.
- `sitio/privacidad.html`: política de datos.
- `sitio/agentes-ia-whatsapp.html`, `automatizaciones-para-negocios.html`, `paginas-web-para-comercios.html` y `punto-de-venta-windows.html`: páginas de servicios para búsquedas específicas.
- `sitio/assets/interior.css`: diseño compartido de páginas interiores.
- `agente/servidor.js`: servicio de conversación y fichas comerciales fijas.
- `vps/`: copias de referencia de servicios y configuración del servidor.
- `specs/001-redisenio-web/spec.md`: especificación SDD y criterios de aceptación.
- `respaldo-2026-09-30/`: copia local anterior al rediseño.

## Verificación

```powershell
node tests/site-check.mjs
node --check sitio/assets/site.js
node --check agente/servidor.js
```

Para probar el agente sin una clave real se puede levantar con una clave de prueba; las respuestas comerciales explícitas salen de fichas fijas. Las respuestas abiertas del modelo requieren una clave válida en el VPS. `agente/pruebas.js` comprueba el precio, cupo, plazo y filtro.

## Cambios comerciales

Los importes, el cupo y las condiciones están en `sitio/index.html`, `sitio/assets/site.js`, `agente/servidor.js` y `vps/agente-servidor.js`. Actualizá esos cuatro lugares juntos y corré las verificaciones antes de publicar. No guardes claves en `sitio/` ni en Git.

## SEO y seguridad

Cada página de servicio tiene título, descripción y URL canónica propios. `sitio/sitemap.xml` incluye las seis páginas que queremos indexar; `robots.txt` permite el rastreo público. La propiedad `https://nexoiarg.com/` se verificó en Google Search Console mediante el archivo HTML que ya existe en el VPS. Ese archivo debe permanecer en `/var/www/nexoiarg/` al publicar.

`vps/nexoiarg-nginx.conf` es una propuesta adaptada a la instalación observada: redirige `www` a la URL principal, añade encabezados de seguridad y limita las rutas del agente. El hash de la política de scripts corresponde al JSON-LD de `sitio/index.html`; si cambia ese bloque, hay que recalcularlo y actualizar la configuración antes de recargar Nginx. `node tests/site-check.mjs` comprueba que coincidan.

El servicio de agente se limita a `127.0.0.1:3020`. Los eventos dejan de guardar IP y agente de usuario. Antes de sustituir servicios en el VPS hay que hacer respaldo, validar la sintaxis, aplicar la configuración con `nginx -t` y comprobar chat, eventos y páginas públicas.
