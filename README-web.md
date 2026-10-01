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
