# Informe de Estado del Acoplamiento Backend-Frontend con el Diseño de Base de Datos

Tras la revisión de la documentación, planes y el estado actual del repositorio, este documento resume las tareas faltantes para terminar el acoplamiento del backend y el frontend con el nuevo diseño de base de datos ("Clean Architecture").

## 1. Migración y Alineación del Backend

- **Actualizar Repositorios:** Modificar `contacts.agent_id` a `contacts.user_id`, y `conversations.agent_id` a `conversations.user_id` en las consultas a la base de datos para alinearse al nuevo esquema (tabla `users` central y `auth_users`).
- **Nuevas Tablas y Relaciones:** Implementar persistencia y acceso para las tablas nuevas: `media_files` (archivos adjuntos), `audit_logs` (trazabilidad) y `user_sessions` (tokens de sesión).
- **Esquema de Mensajes:** Actualizar el repositorio de mensajes para manejar `content_type`, `text_body`, `media_file_id`, y `channel` en lugar de la estructura antigua.
- **Flujos de Autenticación y Autorización:** Separar las credenciales en `auth_users` y mantenerlas sincronizadas con `users` y `devices`. Implementar roles y control de acceso en los endpoints.

## 2. API Endpoints y Webhook (Capa Interfaz)

- **Endpoints Base de Negocio:** Completar la implementación de endpoints clave:
  - `GET /api/agents/:agentId/conversations` (y cargar/listar mensajes).
  - Creación y actualización de contactos, conversaciones e intervenciones de forma dinámica desde el frontend.
- **Integración con WhatsApp:**
  - Implementar validación del proveedor y extracción del payload.
  - Almacenar los mensajes entrantes con `channel = 'whatsapp'`, vinculándolos a las conversaciones y contactos correspondientes, evitando duplicidad usando `external_message_id`.
  - Crear lógica de asignación automática o reglas de enrutamiento al recibir mensajes.

## 3. Integración en el Frontend

- **Reemplazar Mocks (Fallbacks):** Reemplazar definitivamente el consumo de mocks y datos locales (ej. `agentsData.ts`, interceptores en Vite locales si existen) por llamadas HTTP reales utilizando servicios (como `dashboardApi.ts`).
- **Intervenciones y KPIs Reales:** Conectar el envío de mensajes e intervenciones del supervisor en tiempo real contra el servidor. Calcular las métricas o pedir KPIs al servidor, en lugar de manejar simulaciones estáticas.
- **Manejo de Sesión Real:** Actualizar el Login y flujos de autenticación para consumir la API e inyectar el token (JWT) de manera segura basado en la nueva arquitectura de `user_sessions`.

## 4. Pruebas y Despliegue

- **Pruebas de Integración y Unitarias:** Faltan pruebas completas (E2E y unitarias en backend) sobre la creación de mensajes y conversaciones, especialmente en el flujo de WhatsApp entrante y los nuevos repositorios alineados.
- **Logs y Monitoreo:** No hay documentación de despliegue final ni de logs estructurados o alertas vinculadas a `audit_logs`.

## Conclusión

La estructura base de _Clean Architecture_ ha sido iniciada y definida claramente, así como la conexión a la base de datos PostgreSQL. No obstante, **el núcleo de negocio del backend (persistencia de mensajes reales, webhook de Meta/WhatsApp, flujos relacionales de contactos y sesiones)** debe desarrollarse para exponer los endpoints verdaderos y consumirlos desde el frontend sin mocks locales.
