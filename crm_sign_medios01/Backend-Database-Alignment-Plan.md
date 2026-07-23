# Plan de alineación del backend al nuevo esquema de base de datos

## Objetivo

Alinear el backend de `crm_sign_medios01` con el nuevo modelo de datos definido en `CRM-SIGN-MEDIOS/Guía Completa de Tablas de la Base de Datos - CRM SIGN Medios.md`. Esto incluye migrar la lógica de lectura/escritura de la base de datos antigua hacia las tablas normalizadas y las nuevas relaciones entre `users`, `auth_users`, `devices`, `contacts`, `conversations`, `messages`, `media_files`, `audit_logs`, `user_sessions` y `backups`.

## Fase 1: Auditoría y diagnóstico

1. Revisar el nuevo esquema y listar todas las tablas y columnas esperadas.
2. Identificar en el backend los puntos donde todavía se usan campos antiguos:
   - `agent_id` en `contacts` y `conversations`
   - `client_name`, `phone`, `status`, `source`, `sender`, `text`, `time`, `external_message_id` en `conversations` y `messages`
   - `devices` y `auth_users` ya presentes, pero validarlos en repositorios y rutas
3. Detectar tablas nuevas sin uso activo: `media_files`, `user_sessions`, `audit_logs`.

## Fase 2: Migraciones y estructura de datos

1. Garantizar que `backend/src/infrastructure/database/init.sql` y `backend/src/infrastructure/database/schema.ts` reflejen completamente el nuevo esquema.
2. Crear/mantener scripts de migración para:
   - renombrar `agent_id` a `user_id` en `contacts` y `conversations`
   - crear `auth_users`, `devices`, `media_files`, `user_sessions`, `audit_logs`, `backups`
   - asegurar claves foráneas correctas entre `users`, `contacts`, `conversations`, `messages`, `media_files` y `auth_users`
3. Validar el script de inicialización con pruebas unitarias existentes y agregar casos faltantes.

## Fase 3: Actualizar repositorios de datos

1. Modificar `backend/src/infrastructure/database/repositories.ts` para:
   - usar `contacts.user_id` en lugar de `contacts.agent_id`
   - usar `conversations.user_id` y `conversations.contact_id` en lugar de `conversations.agent_id`
   - eliminar/ajustar `client_name`, `phone`, `status` si no pertenecen al nuevo modelo
   - persistir `messages` con `content_type`, `text_body`, `media_file_id`, `channel`, `created_at`
2. Implementar acceso a `media_files` desde el backend:
   - crear métodos para insertar y leer archivos multimedia
   - enlazar `media_files.message_id` con `messages.id`
3. Verificar la lógica de `devices` y `auth_users` en repositorios y en `userManagementRoute`, asegurando la persistencia de `assigned_phone` y credenciales.
4. Agregar o corregir repositorios de `audit_logs` y `user_sessions` si es necesario.


//qudamos aqui revisar 
## Fase 4: Ajustar casos de uso y aplicación

1. Cambiar lógica de creación y obtención de conversaciones en `backend/src/application/useCases.ts` para:
   - crear conversaciones vinculadas a `users.id`
   - enlazar `contact_id` cuando exista un contacto correspondiente
   - usar `topic` como etiqueta principal del chat
2. Actualizar ingestión de WhatsApp en `backend/src/application/useCases.ts`, `backend/src/infrastructure/http/routes/agentConversationRoute.ts` y los adaptadores para que:
   - busquen/crean contactos en `contacts` antes de crear conversaciones
   - guarden los mensajes con `channel = 'whatsapp'` o `dashboard`
   - mantengan `external_message_id` y eviten duplicados
3. Revisar los servicios de backup y auditoría para que consuman los datos del nuevo modelo.

## Fase 5: Endpoints y validación de respuesta

1. Revisar `backend/src/infrastructure/http/routes` para asegurar que los endpoints devuelvan datos actualizados:
   - `/api/agents`
   - `/api/users/:id/conversations`
   - `/api/conversations/:id/messages`
   - `/api/contacts`
   - `/api/users`, `/api/devices`
2. Ajustar mapeos DTO en `backend/src/infrastructure/http` y `backend/src/interface/dtos.ts` según los nuevos nombres de columnas.
3. Garantizar que los endpoints de creación/actualización de usuarios mantengan sincronizados `users`, `auth_users` y `devices`.

## Fase 6: Pruebas y aseguramiento

1. Extender pruebas existentes para cubrir:
   - repositorios con `contacts.user_id` y `conversations.contact_id`
   - creación y lectura de `messages` con nuevo esquema
   - persistencia de `media_files`
   - creación de `auth_users` y `devices`
   - obtención de `user_sessions` y `audit_logs`
2. Añadir pruebas de integración para el flujo de WhatsApp entrante:
   - nuevo mensaje crea o actualiza conversación usando `contacts`
   - mensajes se guardan con `created_at`, `content_type`, `channel`
3. Ejecutar validación de esquema con `backend/src/infrastructure/database/schema.ts`.

## Fase 7: Despliegue y documentación

1. Documentar los cambios de esquema en el README y en la guía de migración.
2. Actualizar los scripts de inicialización y los comandos de bootstrap del backend.
3. Registrar las dependencias entre tablas nuevas y las rutas afectadas.
4. Verificar el despliegue en un entorno de prueba antes de pasar a producción.

## Prioridades inmediatas

1. Corregir `contacts` y `conversations` para usar `user_id` y `contact_id`.
2. Reescribir consultas de `messages` en el backend para el nuevo modelo de mensajes.
3. Validar el script de inicialización `init.sql` y el esquema requerido.
4. Ajustar rutas de usuario/dispositivo para mantener `auth_users` y `devices` sincronizados.
5. Asegurar que el webhook WhatsApp respete el nuevo modelo relacional antes de continuar con el frontend.
