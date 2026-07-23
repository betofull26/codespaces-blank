# Plan de Finalización del Acoplamiento: Base de Datos, Backend y Frontend

Este documento detalla los pasos necesarios para eliminar la deuda técnica (legacy) y completar la integración nativa entre el frontend, el backend y el nuevo modelo de base de datos de Clean Architecture.

## 1. Fase Backend: Eliminación de la Abstracción "Agent"

Actualmente, el backend mantiene una abstracción legacy llamada `AgentModel` que se construye con un `JOIN` complejo entre las tablas `users`, `auth_users` y `devices` (en `PostgresAgentRepository`). En el nuevo diseño, la entidad dominante es `User`.

**Pasos a seguir:**

1.  **Refactorizar Capa de Dominio:**
    *   Eliminar la interfaz `AgentModel` y el validador `validateAgent` de `backend/src/domain/models.ts`.
    *   Eliminar la interfaz `AgentRepository` de `backend/src/domain/repositories.ts`.
2.  **Refactorizar Capa de Aplicación:**
    *   Eliminar los archivos y referencias a `agentService.ts`.
    *   Eliminar las funciones relacionadas a agentes (ej. `listAgents`) de `backend/src/application/useCases.ts`.
3.  **Refactorizar Capa de Infraestructura (Persistencia):**
    *   Borrar por completo la clase `PostgresAgentRepository` del archivo `backend/src/infrastructure/database/repositories.ts`.
4.  **Actualizar Capa de Interfaz (HTTP):**
    *   Actualizar las rutas en `app.ts` o los endpoints correspondientes para que los llamados a `/agents` sean redirigidos o reemplazados por `/users` filtrando por el rol `agent` usando `UserRepository` y los DTOs de `UserProfileDto`.

## 2. Fase Frontend: Actualización de Tipos de Datos y APIs

El frontend en React todavía usa interfaces legacy (como `Agent` y dependencias de variables `snake_case`) y adapta la respuesta de la API nueva.

**Pasos a seguir:**

1.  **Limpiar Definiciones de Tipos:**
    *   En `src/app/components/dashboard/types.ts`, eliminar o reemplazar la interfaz `Agent`.
    *   Revisar la interfaz `ChatMessage` y `Conversation` para asegurarse de que todas las propiedades usen estrictamente `camelCase` nativo de TypeScript y se alineen con el esquema `camelCase` del backend de Node, sin dejar condicionales (ej. eliminar mappings como `m.conversationId ?? m.conversation_id`).
2.  **Actualizar el API Client:**
    *   En `src/app/services/dashboardApi.ts`, modificar la función `fetchConversationMessages` para que no contenga operadores de *coalescencia nula* para parsear `snake_case`. El backend ya debe devolver las propiedades serializadas en `camelCase` correctamente.
    *   Eliminar `fetchAgents` y reemplazar su uso en toda la aplicación por `fetchUsers('agent')`.
    *   Revisar `fetchAgentConversations` y endpoints que apunten a rutas como `/agents/:id/...` para migrarlos a `/users/:id/...` si el router del backend fue actualizado.
3.  **Refactorizar Componentes de UI (Páginas):**
    *   Modificar `src/app/pages/DashboardPage.tsx` para que consuma usuarios (con rol 'agent') en lugar de la llamada legacy de agentes.
    *   Modificar `src/app/pages/DirectorioPage.tsx` y `SettingsPage.tsx` para que utilicen la nueva estructura de `User` y los campos de `auth_users` y `devices` al mostrar la información del equipo.

## 3. Fase Base de Datos: Limpieza Final (Cleanup)

El esquema de base de datos ya fue migrado con un script inicial. Sin embargo, hay un último paso que debe realizarse en producción una vez que todo el código esté desplegado y validado.

**Pasos a seguir:**

1.  **Verificación de Dependencias SQL:**
    *   Asegurar que ninguna Query SQL en `repositories.ts` utilice joins hacia columnas viejas o asuma roles fijos estáticos en tablas que no corresponden (e.g. asegurar que los roles vengan 100% de `auth_users`).
2.  **Archivos de Backup:**
    *   Ejecutar un backup final (`npm run rollback:backup` o similar en el servidor).
3.  **Depuración de Logs (Opcional pero recomendado):**
    *   Implementar un job (cron) que mueva registros antiguos de la tabla `audit_logs` a almacenamiento frío después de 90 días, para evitar problemas de volumen en el futuro.

## 4. Pruebas y Despliegue

1.  **Pruebas End-to-End (E2E):** Ejecutar cualquier flujo que afecte a usuarios, especialmente la asignación de conversaciones, asegurando que los UUIDs coincidan correctamente entre la nueva tabla de `users` y las asignaciones de chat.
2.  **Monitoreo POST-Lanzamiento:** Revisar el registro de `audit_logs` para asegurarse que el sistema ya no interacciona con funciones descontinuadas (como el `PostgresAgentRepository`).