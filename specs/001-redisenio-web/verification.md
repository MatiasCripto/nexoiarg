# Verificación del rediseño

Fecha: 2026-09-30. Estado: parcial, pendiente despliegue y revisión visual de la versión publicada.

## Comprobado localmente

- `node tests/site-check.mjs`: 12 controles aprobados. Verifica anclas, archivos, imagen social y retrato, cuatro páginas de servicio y sitemap, datos de negocio y hash CSP, precios, alcance factual, chat, privacidad y límites de servicios.
- `node --check`: sintaxis válida en `sitio/assets/site.js`, `agente/servidor.js` y `vps/agente-servidor.js`.
- `node agente/pruebas.js` contra servicio local con clave de prueba: 12/12 pruebas aprobadas. Las preguntas abiertas usaron el respaldo porque no se configuró un proveedor real en el entorno de prueba.
- Vista previa estática en `http://127.0.0.1:4173`: portada, CSS, JS, privacidad y sitemap respondieron HTTP 200.
- Contraste calculado: verde principal sobre papel 5,91:1; gris de texto sobre papel 6,46:1; verde principal sobre fondo de soluciones 5,54:1; texto verde claro sobre fondo oscuro 7,93:1.
- Metadatos, imagen social de 1200 × 630, iconos y sitemap actualizados.
- `Jonatan.png` y `sitio/assets/jonatan-2026.png` tienen el mismo SHA-256; la portada usa la nueva URL para evitar la caché de la foto anterior.

## Preparación de publicación

- El VPS usa `/var/www/nexoiarg` para la web y `/opt/nexoiarg/agente/servidor.js` para el agente. Ambos archivos originales coinciden byte por byte con el respaldo local anterior al rediseño.
- Se guardaron copias previas de la web, el agente y la configuración Nginx en `/home/nexo-web/`, sin leer ni copiar el archivo privado `.env`.
- La versión nueva de `sitio/` y del agente se subió a `/home/nexo-web/` para preparar la publicación. Los SHA-256 de portada, retrato y agente coinciden con los locales.
- La carpeta web del VPS no es un repositorio Git. Se inició un repositorio local y se prepararon únicamente los archivos del sitio y `Jonatan.png`; queda por identificar el repositorio remoto y completar el envío.
- Se identificó el repositorio vacío `MatiasCripto/nexoiarg` en la cuenta GitHub de Jonatan y se configuró como remoto local.
- Se verificó `https://nexoiarg.com/` en Google Search Console con el archivo HTML existente. El informe del 20/09/2026 registra indexadas sólo `/` y `/privacidad.html`; la portada se rastreó por última vez el 11/09/2026. La nueva versión aún no está publicada, por lo que sus páginas no se enviaron al índice.

## Ampliación SEO y seguridad

- Se crearon páginas diferenciadas para agentes, automatizaciones, sitios web y punto de venta. Todas tienen título y descripción propios, canonical, enlaces desde la portada y enlaces entre soluciones.
- El sitemap enumera las seis páginas públicas. El archivo `robots.txt` permite el rastreo general, incluida la búsqueda de ChatGPT.
- La configuración Nginx preparada redirige `www` a la URL principal, oculta archivos privados y el respaldo HTML anterior, añade CSP, HSTS y otras cabeceras, y no usa la IP reenviada por un visitante como origen confiable.
- La página actual respondía sin cabeceras de seguridad al pedir `/`; la configuración corregida está pendiente de aplicación y comprobación pública.
- Agente y receptor de eventos preparados para escuchar sólo en localhost. El receptor de eventos deja de guardar IP y agente de usuario; privacidad se actualizó para reflejarlo.
- `node agente/pruebas.js` tras limitar el agente a `127.0.0.1`: 12/12 pruebas aprobadas.

## Fuentes y alcance

- Jonatan confirmó: Cerámicas Gutiérrez recibió sitio web, catálogo y acceso a WhatsApp. Carrito y Mercado Pago están en desarrollo.
- La página de catálogo de Cerámicas se abrió en Chrome y mostró filtros y productos. No se modificó ese sitio.
- Distribuidora Monti se comprobó como sitio con catálogo y recorrido de pedido. Moto Express permanece descrito sólo como sitio web, según confirmación de Jonatan.
- README del punto de venta confirma aplicación local Windows 1.1.1; no se modificó el programa.

## Pendiente

- Revisar en navegador real a 360, 390, 768 y 1440 px: capturas completas, menú, chat, calculadora, teclado, consola y superposiciones.
- Publicar frontend y ficha del agente cuando la cuenta limitada obtenga los permisos precisos; verificar respuestas reales y eventos.
- Enviar los cambios al repositorio Git remoto, incluida la imagen nueva.
- Tras publicar, enviar el sitemap actualizado desde Search Console y comprobar las nuevas URL con la herramienta de inspección.
- Confirmar visualmente la versión publicada y obtener capturas de escritorio y celular.

El navegador integrado bloqueó abrir el archivo local por su política de URL y prohibió repetir ese acceso por otra vía. Por eso la inspección visual local no se declara realizada.

La consulta de prueba al agente actualmente publicado (`¿Cuánto cuesta el agente de WhatsApp?`) devolvió `fuente: error` y su mensaje de respaldo. Jonatan confirmó que el proveedor de IA no tiene créditos. Es una observación de producción previa al despliegue; no se modificarán los créditos ni la facturación. La nueva interfaz muestra hechos comerciales locales y contacto humano mientras el proveedor no responda.
