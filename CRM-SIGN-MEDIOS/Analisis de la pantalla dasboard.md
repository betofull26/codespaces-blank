# Documentación de la Pantalla del Dashboard

Este documento proporciona una descripción detallada de la pantalla **Dashboard** del sistema **CRM SIGN Medios**, analizando su estructura visual, componentes, flujo de datos, integración con servicios y tipos de datos asociados.

---

## 1. Información General

- **Ruta del archivo principal**: `crm_sign_medios01/src/app/pages/DashboardPage.tsx`
- **Propósito**: Actuar como el centro de control y monitoreo en tiempo real para supervisores, permitiéndoles visualizar el historial de conversaciones de WhatsApp de los clientes, buscar chats específicos e intervenir en las conversaciones enviando mensajes directamente desde la plataforma.

---

## 2. Estructura Visual y Layout

La pantalla adopta un diseño responsivo de pantalla completa (`h-screen overflow-hidden`) con tonos de fondo claros (`bg-slate-50`) y se divide en las siguientes áreas principales:

### A. Barra Lateral (`Sidebar`)
- Componente: `<Sidebar selectedNode="dashboard" />` ubicado en `src/app/components/dashboard/Sidebar.tsx`.
- Permite la navegación principal a través de los diferentes módulos del sistema (Dashboard, Dispositivos, Directorio, Usuarios, etc.).

### B. Encabezado (`DashboardHeader`)
- Componente: `<DashboardHeader />` ubicado en `src/app/components/dashboard/DashboardHeader.tsx`.
- Muestra el encabezado superior con la información del usuario autenticado, perfil y configuraciones de sesión.

### C. Área de Contenido Principal
Se organiza utilizando CSS Grid (`grid xl:grid-cols-[360px,1fr]`) para pantallas anchas, dividiéndose en dos paneles principales:

❌ #### 1. Panel Izquierdo: Buscador e Historial de Conversaciones
- **Buscador de Chats**: Un campo de texto con ícono de lupa que filtra dinámicamente las conversaciones en tiempo real según el **nombre del cliente** o el **tema (topic)** del chat.
- **Lista de Conversaciones**: Muestra todas las conversaciones disponibles. Cada tarjeta de conversación incluye:
  - Nombre del cliente.
  - Asunto o tema de consulta.
  - Etiqueta/Badge de estado con colores intuitivos:
    - `Activa` (Verde: `bg-emerald-100 text-emerald-700`)
    - `En espera` (Naranja: `bg-amber-100 text-amber-700`)
    - `Cerrada` (Gris: `bg-slate-100 text-slate-500`)
  - Teléfono del cliente con ícono de teléfono.
  - Hora de inicio con ícono de reloj.

#### 2. Panel Derecho: Detalle de Chat e Intervención ❌
Si no hay ninguna conversación seleccionada, se muestra un estado vacío interactivo ("Selecciona una conversación para ver el detalle"). Al seleccionar un chat, se despliega:
- **Cabecera del Chat**: Muestra el nombre completo del cliente, tema de la conversación, número de teléfono y estado actual de la conversación.
- **Historial de Mensajes**: Un contenedor scrollable que renderiza los mensajes mediante burbujas de chat (`MessageBubble`):
  - **Mensajes Propios (Supervisor / Supervisor como Agente)**: Alineados a la derecha, de color azul (`bg-blue-600 text-white`).
  - **Mensajes del Cliente o del Canal WhatsApp**: Alineados a la izquierda, de color gris (`bg-slate-100 text-slate-800`). Llevan una etiqueta especial **"WhatsApp"** en color verde si provienen directamente de la API de WhatsApp (`source === "whatsapp"`).
  - Cada mensaje incluye la hora de envío/recepción y un ícono de reloj.
- **Barra de Entrada de Intervención**:
  - Un área de texto (`textarea`) ajustable de dos líneas para redactar respuestas.
  - Botón de envío con ícono de avión de papel (`Send`). Cuando se está procesando el envío, el botón se deshabilita y muestra un spinner de carga animado (`Loader2`).
  - Mapeo y visualización de errores específicos de red o de permisos si la intervención falla.


//La logica de abajo hay que cambiarla.

## 3. Flujo de Datos y Tiempo Real (WebSockets)

La pantalla de Dashboard está completamente conectada con el backend de manera bidireccional:

1. **Carga Inicial**:
   - Al montarse el componente (`useEffect`), realiza una consulta asíncrona a `fetchConversations()` para traer los chats desde la base de datos real.
   - Al seleccionar una conversación, se cargan sus respectivos mensajes dinámicamente mediante `fetchConversationMessages(selectedConversationId)`.
2. **Sincronización en Tiempo Real**:
   - Inicializa una conexión de WebSocket con `socket.io-client` mediante `io()`.
   - Escucha el evento `"message.created"`.
   - Al recibir un nuevo mensaje del socket, actualiza el estado local (`messagesByConversation` y `conversations`) de forma instantánea sin necesidad de recargar la página completa.
3. **Actualización Optimista (Optimistic UI Updates)**:
   - Al enviar un mensaje de intervención, se agrega inmediatamente al estado local con un ID temporal de manera "optimista" para ofrecer una experiencia de usuario instantánea y fluida.
   - Si la petición HTTP de `postConversationIntervention` tiene éxito, el mensaje se consolida. Si falla, el mensaje se elimina del estado local y se muestra un banner de error con la descripción del fallo.

---

## 4. Integración con Servicios (`dashboardApi.ts`)

La pantalla se comunica con el backend a través de las siguientes funciones exportadas en `src/app/services/dashboardApi.ts`:

- `fetchConversations()`: `GET /api/conversations` (Obtiene el listado global de chats).
- `fetchConversationMessages(conversationId)`: `GET /api/conversations/:conversationId/messages` (Obtiene el listado de mensajes asociados a un ID de conversación).
- `postConversationIntervention(conversationId, payload)`: `POST /api/conversations/:conversationId/interventions` (Registra la intervención de un supervisor en el chat).

---

## 5. Tipos de Datos Utilizados (`src/app/components/dashboard/types.ts`)

Los objetos de datos en el Dashboard están estrictamente tipados bajo las siguientes interfaces de TypeScript:

### ChatMessage
```typescript
export interface ChatMessage {
  id: string;
  conversationId?: string;
  sender: "agent" | "client" | "supervisor" | "supervisor_as_agent";
  text: string;
  time: string;
  source?: "whatsapp" | "dashboard" | "internal";
  externalMessageId?: string;
}
```

### Conversation
```typescript
export interface Conversation {
  id: string;
  agentId: string;
  clientName: string;
  topic: string;
  status: "active" | "closed" | "waiting";
  startTime: string;
  phone?: string | null;
  messages: ChatMessage[];
}
```

### Agent
```typescript
export interface Agent {
  id: string;
  name: string;
  role: string;
  phone: string;
  avatar: string;
  initials: string;
  online: boolean;
  conversations?: Conversation[];
}
```
