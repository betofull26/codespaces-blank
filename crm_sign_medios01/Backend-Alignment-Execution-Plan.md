# Plan de Ejecución: Alineación del Backend al Nuevo Esquema de Base de Datos

Este documento detalla los pasos a seguir para completar la migración de la base de datos y alinear el código del Backend (modelos, repositorios, casos de uso y rutas) a las nuevas estructuras de datos en `crm_sign_medios01`.

## Fase 1: Actualización de Modelos de Dominio y DTOs

1. **Refactorizar `ContactModel` y `ConversationModel`**
   - Archivo: `backend/src/domain/models.ts`
   - Acción: Reemplazar la propiedad `agentId` por `userId`. Añadir `contactId` en las conversaciones para relacionarlas adecuadamente.

2. **Refactorizar `MessageModel`**
   - Archivo: `backend/src/domain/models.ts`
   - Acción: Eliminar campos legacy (`sender`, `time`, `source`, `text`) y reemplazarlos por los campos del nuevo esquema: `contentType`, `textBody`, `mediaFileId`, `channel`, `createdAt`.

3. **Actualizar DTOs e Interfaces**
   - Archivo: `backend/src/interface/dtos.ts`
   - Acción: Modificar los esquemas de validación (ej. Zod) y tipos TypeScript para asegurar que las entradas y salidas de la API esperan y devuelven `userId`, `contactId` y los nuevos campos de mensajes.

## Fase 2: Adaptación de Repositorios (Capa de Infraestructura)

1. **`PostgresContactRepository`**
   - Archivo: `backend/src/infrastructure/database/repositories.ts`
   - Acción: Actualizar las firmas de los métodos (`listByAgent`, `create`, `update`) para recibir `userId`. Modificar las consultas SQL (eliminar `user_id AS "agentId"`).

2. **`PostgresConversationRepository`**
   - Archivo: `backend/src/infrastructure/database/repositories.ts`
   - Acción: Refactorizar consultas SQL para usar de forma nativa `user_id` y `contact_id`. Eliminar alias temporales de compatibilidad.

3. **`PostgresMessageRepository`**
   - Archivo: `backend/src/infrastructure/database/repositories.ts`
   - Acción: Remover las funciones `COALESCE` en las consultas SELECT que mapeaban campos legacy. Asegurar que las consultas de inserción y lectura coincidan con las columnas `content_type`, `text_body`, `channel`, `created_at`.

4. **Repositorios Secundarios**
   - Acción: Asegurar que la inserción de archivos (`PostgresMediaFileRepository`) enlaza correctamente `message_id`. Verificar que la lógica de `devices` y `auth_users` guarda datos alineados a `users`.

## Fase 3: Refactorización de Casos de Uso y Servicios (Capa de Aplicación)

1. **Ajuste de Servicios Base**
   - Archivos: `contactService.ts`, `conversationService.ts`, `agentService.ts`
   - Acción: Renombrar variables y parámetros de `agentId` a `userId`. (Idealmente migrar la nomenclatura de `agentService` a `userService` si el dominio lo requiere).

2. **Refactorización de `useCases.ts`**
   - Archivo: `backend/src/application/useCases.ts`
   - Acción: Actualizar `createConversation` para requerir y vincular `userId` y `contactId`.

3. **Webhook e Ingestión de Mensajes (WhatsApp / Dashboard)**
   - Acción: En la lógica de recepción de mensajes (ingestión de WhatsApp), buscar o crear el contacto usando `userId`. Guardar el mensaje especificando el canal (`channel = 'whatsapp'`) y rellenar correctamente `textBody` en vez de `text`.

## Fase 4: Actualización de Rutas (Endpoints)

1. **Actualización de Endpoints Rest**
   - Archivos: `backend/src/infrastructure/http/routes/*`
   - Acción: Modificar rutas que referencien `agentId`. Por ejemplo, actualizar los endpoints `/agents/:agentId/contacts` a `/users/:userId/contacts` o mantener la compatibilidad de URL pero usar `userId` internamente.
   - Acción: Ajustar la extracción de parámetros de `req.body` o `req.params` de `agentId` a `userId`.

2. **Ajustar Generación de Backup**
   - Archivo: `backupService.ts` y rutas de backup
   - Acción: Actualizar las consultas del generador de backups en CSV/JSON para que referencien `user_id` y la nueva estructura en vez del esquema anterior.

## Fase 5: Pruebas y Validación

1. **Refactorizar Pruebas Unitarias**
   - Archivos: `*.test.ts` (ej. `contactService.test.ts`, `useCases.test.ts`, `models.test.ts`)
   - Acción: Modificar los fixtures (datos falsos de prueba) para usar `userId`, `textBody`, `channel`, etc.

2. **Ejecución y Comprobación**
   - Acción: Ejecutar `CI=true pnpm test` para asegurar que el backend sigue siendo estable y todo pasa correctamente sin errores de importación y de tipos TypeScript.
   - Acción: Probar manualmente el flujo end-to-end de envío y recepción de un mensaje para certificar la persistencia en DB.
