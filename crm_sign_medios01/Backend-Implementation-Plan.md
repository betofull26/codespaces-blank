# Plan de implementación del backend

## Objetivo
Crear un backend funcional que conecte el dashboard con la base de datos existente, permita consultar agentes, conversaciones y mensajes, y reciba mensajes entrantes desde WhatsApp mediante un webhook.

## Fase 1: Preparación del entorno
1. Definir la tecnología del backend: Node.js + Express o Fastify con TypeScript.
2. Crear la estructura base del proyecto backend dentro del repositorio.
3. Configurar variables de entorno para:
   - conexión a la base de datos
   - puerto del servidor
   - secretos de autenticación
   - credenciales de WhatsApp
4. Definir el formato de respuesta de la API para que sea consistente con el frontend.

## Fase 2: Conexión con la base de datos
1. Conectar el backend a la base de datos existente.
2. Verificar que las tablas principales estén disponibles:
   - agents
   - conversations
   - messages
3. Añadir soporte para las tablas complementarias si se van a usar en el dashboard completo.
4. Crear un esquema de acceso y consultas reutilizables para evitar lógica duplicada.

## Fase 3: Modelos y migraciones
1. Definir modelos para:
   - agentes
   - conversaciones
   - mensajes
   - clientes y usuarios si se requieren para el flujo completo
2. Crear migraciones o scripts de inicialización para asegurar que la estructura quede reproducible.
3. Incluir datos base de prueba para validar el flujo en desarrollo.
4. Definir reglas de integridad y validaciones de campos obligatorios.

## Fase 4: Endpoints base de la API
Implementar los endpoints mínimos para que el dashboard funcione:
1. GET /api/agents
   - devolver la lista de agentes.
2. GET /api/users/:userId/conversations
   - devolver conversaciones asociadas a un usuario.
3. GET /api/conversations/:conversationId/messages
   - devolver mensajes de una conversación.
4. PATCH /api/conversations/:conversationId
   - actualizar estado de una conversación.
5. POST /api/conversations/:conversationId/interventions
   - registrar intervenciones del supervisor.

## Fase 5: Integración con WhatsApp
1. Crear un endpoint webhook para recibir mensajes entrantes de WhatsApp.
2. Validar la firma o token de verificación del proveedor.
3. Procesar el payload recibido y extraer:
   - número del remitente
   - texto del mensaje
   - id externo del mensaje
4. Buscar o crear la conversación asociada al cliente o agente.
5. Guardar el mensaje en la tabla messages con source = whatsapp.
6. Evitar duplicados usando el external_message_id cuando esté disponible.

## Fase 6: Lógica de negocio
1. Definir cómo se relacionan clientes, agentes y conversaciones.
2. Crear reglas para:
   - asignación de conversaciones
   - cambio de estado
   - creación automática de conversaciones al recibir un nuevo mensaje
3. Garantizar que los mensajes aparezcan en el dashboard con el origen correcto.
4. Preparar la lógica para futuras respuestas salientes desde el backend.

## Fase 7: Seguridad y control de acceso
1. Añadir autenticación para los endpoints del dashboard.
2. Definir roles como administrador, agente y supervisor.
3. Restringir accesos según permisos.
4. Proteger el webhook con autenticación o validación de firma.

## Fase 8: Pruebas y validación
1. Probar los endpoints principales con datos reales o de prueba.
2. Validar el flujo completo:
   - recibir mensaje por WhatsApp
   - guardarlo en base de datos
   - visualizarlo en el dashboard
3. Verificar respuestas ante errores de base de datos o payload inválido.
4. Incluir pruebas unitarias y de integración para los flujos críticos.

## Fase 9: Despliegue y operación
1. Preparar el backend para entorno de desarrollo y producción.
2. Configurar logs y monitoreo básico.
3. Definir políticas de respaldo y recuperación.
4. Documentar cómo probar el webhook y los endpoints principales.

## Criterios de finalización
El backend se considera listo cuando:
- el dashboard puede leer agentes y conversaciones desde la base de datos,
- los mensajes entrantes de WhatsApp se almacenan correctamente,
- las intervenciones y cambios de estado quedan persistidos,
- y la API responde de forma consistente y segura.
