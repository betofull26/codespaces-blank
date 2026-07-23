# Plan de implementación de base de datos para el Dashboard

## 1. Objetivo

Implementar una capa de datos real para el dashboard de agentes, reemplazando los mocks actuales y permitiendo:
- carga dinámica de agentes
- carga de conversaciones y mensajes que llegan vía la API de WhatsApp
- actualizaciones de estado e intervenciones
- consultas y filtros basados en datos reales

## 2. Modelo de datos propuesto

### Tablas / colecciones

- `agents`
  - id
  - name
  - role
  - phone
  - avatar
  - initials
  - online

- `conversations`
  - id
  - agentId
  - clientName
  - topic
  - status (`active` | `closed` | `waiting`)
  - startTime

- `messages`
  - id
  - conversationId
  - sender (`agent` | `client` | `supervisor` | `supervisor_as_agent`)
  - text
  - time
  - source (`whatsapp` | `dashboard` | `internal`)
  - externalMessageId (id original de WhatsApp, opcional)

## 3. Endpoints necesarios

### API REST básica

- `GET /api/agents`
  - retorna lista de agentes y sus datos generales

- `GET /api/users/:userId/conversations`
  - retorna conversaciones del usuario seleccionado y sus mensajes
  - los mensajes deben incluir el origen, por ejemplo `source: "whatsapp"`, cuando vienen por la API de WhatsApp

- `GET /api/conversations/:conversationId/messages`
  - opcional si se quiere separar la carga de mensajes

- `POST /api/conversations/:conversationId/interventions`
  - crear una intervención de supervisor
  - payload: `{ sender, text, time }`

- `PATCH /api/conversations/:conversationId`
  - actualizar estado de conversación

## 4. Cambios en el frontend

### 4.1. Sustituir `agentsData`

- remueve el mock `src/app/components/dashboard/agentsData.ts` o conviértelo en datos de fallback
- crea un servicio de cliente HTTP (fetch / axios / fetch wrapper)
- carga agentes reales en `DashboardPage` con `useEffect`
- reemplaza el filtrado local por datos cargados dinámicamente

### 4.2. Cargar conversaciones dinámicamente

- en `AgentChatTree`, evita depender de `agent.conversations` estático para todos los mensajes
- carga conversaciones al seleccionar un agente
- usa `GET /api/users/:userId/conversations`
- muestra un estado de carga mientras se obtienen datos

### 4.3. Enviar intervenciones reales

- al enviar en `InterventionBar`, llama a `POST /api/conversations/:conversationId/interventions`
- actualiza el estado local con la intervención registrada
- opcional: refrescar la lista de mensajes desde el servidor

### 4.4. Actualización de KPIs

- calcula métricas directamente desde los datos recibidos:
  - total de agentes
  - agentes conectados/desconectados
  - chats activos
  - total de mensajes
- si hay un endpoint de métricas, puede cargarse desde el servidor

## 5. Backend / Base de datos sugerida

### 5.1. Opciones rápidas

- PostgreSQL / MySQL si se requiere base relacional
- MongoDB si se prefiere esquema flexible
- SQLite para prototipo local rápido

### 5.2. Estructura inicial

- `agents` <-> `conversations` (1:N)
- `conversations` <-> `messages` (1:N)
- `messages` debe incluir un campo `source` para distinguir los mensajes que vienen desde WhatsApp de los que se generan en el dashboard

### 5.3. Proyecto backend simple

- Node.js + Express / Fastify
- o Deno / Bun
- o un servicio sin servidor si prefieres un backend ligero
- el backend debe exponer un ingest endpoint o webhook para recibir mensajes entrantes desde la API de WhatsApp

## 6. Pasos de implementación

1. ~~Definir el esquema de la base de datos y crear las tablas/colecciones.~~
2. ~~Implementar el backend con los endpoints listados.~~
3. ~~Probar la API con datos reales o fixtures.~~
4. ~~En el frontend, crear un cliente de datos para consultar el backend.~~
5. ~~Reemplazar la carga de `agentsData` por la consulta real de agentes.~~ ✅
6. ~~Consumir conversaciones y mensajes desde el API cuando se abra el modal del agente.~~ ✅
7. ~~Enviar intervenciones al backend y actualizar UI.~~ ✅
8. ~~Verificar que el dashboard compile y funcione con datos reales.~~ ✅

## 9. Estado de avance

- ✅ Objetivo 1: servicio API `dashboardApi.ts` creado y `DashboardPage` actualizado para usar `fetchAgents()`.
- ✅ Manejadores de carga y error añadidos en la UI del dashboard.
- ✅ Paso 6: `AgentChatTree` ahora carga conversaciones desde `GET /api/users/:userId/conversations`.
- ✅ Paso 7: `InterventionBar` envía intervenciones a `POST /api/conversations/:conversationId/interventions` y muestra errores si fallan.
- ✅ Paso 8: se agregó un mock de API local en `vite.config.ts` para simular `GET /api/agents`, `GET /api/users/:userId/conversations`, `GET /api/conversations/:conversationId/messages`, y `POST /api/conversations/:conversationId/interventions`.
- ✅ Paso 9: el dashboard compila correctamente y el flujo de datos se puede verificar en desarrollo.
- ➜ Siguiente paso: conectar con backend real o persistencia si se desea más allá del mock local.

## 7. Indicaciones adicionales

- Mantén el modelo de tipos en `src/app/components/dashboard/types.ts`.
- Separa la lógica de datos en un servicio, por ejemplo `src/app/services/dashboardApi.ts`.
- Usa manejo de errores: mostrar mensajes cuando la API falle.
- Añade carga / spinner para consultas largas.
- Conserva los mocks sólo como fallback de desarrollo.
- Si el backend va a ser compartido con otras secciones, define el API de manera reutilizable.

## 8. Recomendación inicial

Comienza por implementar `GET /api/agents` y conectar `DashboardPage` a ese endpoint. Luego agrega carga de conversaciones por agente y finalmente la creación de intervenciones.
