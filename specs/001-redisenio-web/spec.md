# Rediseño integral de nexoiarg.com

Fecha: 2026-09-30. Estado: en implementación.

## Objetivo

Convertir la web estática de NexoIArg en una presentación profesional que explique la oferta, muestre trabajo comprobable y facilite consultas comerciales sin prometer funciones ni resultados no verificados.

## Fuente de verdad

- Pedido del propietario y auditoría `Auditoria-NexoIArg-2026-09-30.md`.
- Web actual en `sitio/`, servicio de agente en `agente/` y configuración publicada en `vps/`.
- README y lista de entrega 1.1.1 de `Punto de Venta` (sólo lectura).
- Importes publicados en la web actual. No se definen nuevos precios.
- Confirmación de Jonatan: para Cerámicas Gutiérrez entregó sitio web, catálogo y acceso a WhatsApp. Carrito y Mercado Pago están en desarrollo.
- Retrato `Jonatan.png` actualizado por Jonatan el 30/09/2026; esta versión debe figurar en Git y en la web publicada.
- Ampliación autorizada por Jonatan: mejorar seguridad, SEO y visibilidad en búsquedas asistidas por IA, con libertad para revisar incluso precios. Como no hay evidencia sobre márgenes ni estrategia comercial, se mantienen los importes confirmados hasta contar con una razón verificable para cambiarlos.

## Requisitos funcionales

1. La portada identifica a comercios y pymes, las soluciones y un contacto personal claro.
2. La navegación funciona en escritorio y móvil, con acceso a trabajos, soluciones, punto de venta, precios y contacto.
3. Las fichas describen para Cerámicas Gutiérrez el sitio web, catálogo y acceso a WhatsApp ya entregados; la compra online queda identificada como desarrollo. Monti y Moto Express se presentan como sitios web realizados. No hay testimonios, cifras de resultados ni escenas atribuidas a clientes sin respaldo.
4. El agente de la web conserva `/api/agente`, ofrece preguntas sugeridas, distingue carga y error, permite abrir/cerrar con teclado y muestra texto no confiable de forma segura. Cuando el servicio no está disponible, informa la situación y ofrece hechos comerciales fijos y contacto humano.
5. La calculadora conserva la cuenta local de 22 días, no envía sus cifras a analítica y permite contactar con una estimación en el mensaje de WhatsApp.
6. WhatsApp, redes, política de privacidad, FAQ, eventos y SEO siguen accesibles. Analítica registra vista y origen de campaña sin mensajes ni datos personales.
7. Precios visibles: WhatsApp $290.000 inicial + $180.000 mensual, web/Telegram $190.000 inicial + $120.000 mensual. Mostrar $470.000 y $310.000 como implementación más primer mes. Mantener cupo de 800, aviso al 80%, excedente de $70 autorizado, baja con 30 días, actualización manual de datos, integraciones aparte y condición de WhatsApp celular. Separar cupo propio de tarifas de Meta.
8. El punto de venta 1.1.1 se presenta como programa local de una PC Windows con ventas, productos, stock, caja, cuentas corrientes, proveedores y copias. Incluye solicitud de demostración. No se afirman nube, móvil, multicaja, ARCA ni redistribución de catálogos.
9. El retrato de la sección personal utiliza la versión actual de `Jonatan.png`, con URL de recurso nueva para evitar que la caché muestre la imagen anterior.
10. Cada servicio principal tendrá una página útil y diferenciada, enlazada desde la portada, con título, descripción, contenido visible, URL canónica y presencia en el sitemap. No se crearán páginas repetidas por barrios o ciudades sin evidencia de cobertura real.
11. La información estructurada debe coincidir con lo visible; el rastreo de Google y OAI-SearchBot debe estar permitido. Las URL no canónicas redirigirán a HTTPS sin `www`.
12. La configuración pública debe limitar el agente a localhost, no confiar en IP reenviadas por visitantes, limitar tamaño y frecuencia de peticiones, y enviar encabezados de seguridad que no rompan el sitio.
13. El receptor de eventos de la web sólo guardará nombre de evento, ruta, campaña y fecha; dejará de registrar IP y agente de usuario. La política explicará por separado los registros técnicos del servidor.

## Dirección visual

Fondo marfil claro, texto grafito, verde petróleo como acento de acción y pequeños detalles cálidos. Composición editorial con alternancia de grillas, bloques de evidencia, información comercial y retrato real. Tipografía de sistema para carga rápida. Movimiento discreto y anulable por preferencia de movimiento reducido.

## Criterios de aceptación

- Sin desbordamiento horizontal ni superposición de acciones a 360, 390, 768 y 1440 px.
- Menú móvil operable con clic, teclado y Escape.
- Chat operable con teclado y en viewport móvil con teclado visible; entrada y respuestas renderizadas sin `innerHTML` de contenido no confiable.
- Calculadora comprobada con 1 consulta repetida de 4 minutos por 22 días = 1,5 horas redondeadas.
- Enlaces, anclas, precios, FAQ, privacidad y metadatos revisados.
- Capturas de escritorio y celular inspeccionadas; consola sin errores de implementación.
- Sitio desplegado sólo tras comprobar versión local y conservar respaldo de la versión publicada.
- Páginas de servicios, sitemap y datos estructurados verificados, sin promesa de posición ni presentación de clientes no confirmados.
- Revisión de las cabeceras de respuesta, acceso local al agente y funcionamiento de chat/eventos tras aplicar la configuración.

## Tareas

1. Inventario y respaldo local.
2. Reescritura de estructura, contenido, estilos y controles.
3. Corrección de chat, calculadora, medición y SEO.
4. Pruebas automáticas y revisión visual en navegador.
5. Correcciones, publicación si el acceso VPS está disponible y verificación pública.

## Límites conocidos

No hay capturas reales de los tres proyectos en `sitio/assets`, ni prueba independiente de testimonios o métricas de negocio. No se inventarán. El acceso SSH no está documentado en el repositorio; se identificará antes de publicar.
