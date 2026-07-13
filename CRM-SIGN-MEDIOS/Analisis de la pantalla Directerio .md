# Documentación de la Pantalla de Directorio y sus Funcionalidades

Este documento describe de manera exhaustiva la pantalla **Directorio** de la aplicación **CRM SIGN Medios**, detallando su estructura visual, componentes, estados de React, integración con la API del backend, modelo de base de datos y control de accesos.

---

## 1. Estructura Visual y Diseño

La pantalla de Directorio utiliza una interfaz moderna, limpia y responsiva construida con **Tailwind CSS**, estructurada mediante un diseño flexible:

1. **Estructura General (Layout):**
   - **Contenedor Principal (`flex h-screen overflow-hidden bg-slate-50`):** Ocupa toda la pantalla, con fondo gris/azul muy claro. Evita barras de scroll externas indeseadas.
   - **Sidebar (Lateral Izquierdo):** El componente `<Sidebar selectedNode="directorio" />` proporciona el menú de navegación del sistema, marcando "Directorio" como la opción activa.
   - **Área de Contenido (Derecha):** Un contenedor `flex flex-1 flex-col overflow-hidden` que contiene:
     - **DashboardHeader (Superior):** Muestra información del usuario logueado, branding y controles de perfil/notificaciones.
     - **Main Content (`main` con scroll independiente):** Alberga el título, los filtros de búsqueda, el formulario de creación y la tabla o cuadrícula de contactos.

2. **Cabecera de la Sección:**
   - Título destacado: `"Directorio"`.
   - Descripción aclaratoria: `"Contactos organizados por cuenta de WhatsApp del agente."`.

3. **Barra de Herramientas (Filtros y Acciones):**
   - **Buscador (Input de Texto):** Un campo para filtrar contactos por nombre o teléfono de manera dinámica.
   - **Botón Agregar Contacto (`+`):** Un botón circular azul con el icono de un usuario con un signo más (`UserPlus` de Lucide) que abre o despliega el formulario para crear un nuevo contacto.
   - **Filtro por Cuenta (Select):** Un dropdown (`<select>`) que permite filtrar los contactos de manera que se muestren únicamente los asociados a una cuenta de agente en particular ("Todas las cuentas" o cuentas de agentes específicos con sus números de WhatsApp asociados).

4. **Formulario de Registro (Colapsable):**
   - Se despliega de manera condicional (si `showAddForm` es verdadero). Se presenta dentro de una tarjeta con borde suave y sombra.
   - Contiene campos para **Nombre** y **Teléfono**, junto con botones de acción **Guardar** (azul) y **Cancelar** (gris).

5. **Lista/Cuadrícula de Contactos:**
   - Cabecera de la tabla que define tres columnas lógicas (con un grid de tres columnas: `sm:grid-cols-[2fr_1fr_1fr]`):
     - **Contacto**: Nombre del contacto y el nombre del agente/cuenta asignado.
     - **Teléfono**: Número de teléfono del contacto.
     - **Cuenta**: Número de WhatsApp de la cuenta asociada.
   - Cada contacto se muestra en una tarjeta interna con bordes redondeados y un fondo sutilmente sombreado o contrastado en `bg-slate-50`.

---

## 2. Gestión de Estados en React (DirectorioPage.tsx)

La pantalla maneja los siguientes estados principales de React para gobernar su comportamiento dinámico y reactivo:

| Nombre del Estado | Tipo de Datos | Descripción |
| :--- | :--- | :--- |
| `agents` | `Agent[]` | Lista de agentes del sistema cargados desde el backend, requeridos para mapear y filtrar contactos. |
| `contacts` | `Array<{ id, name, phone, createdAt, agentId }>` | Lista cruda de contactos recuperados del backend. |
| `searchTerm` | `string` | Almacena el texto de búsqueda ingresado por el usuario para filtrar la lista. |
| `selectedAgentId` | `string` | Almacena el ID del agente seleccionado en el filtro desplegable de cuentas. |
| `showAddForm` | `boolean` | Alterna la visualización del formulario para registrar un nuevo contacto. |
| `newContactName` | `string` | Valor temporal del campo de texto "Nombre" en el formulario de creación. |
| `newContactPhone` | `string` | Valor temporal del campo de texto "Teléfono" en el formulario de creación. |

### Carga Inicial de Datos (Efecto Secundario):
Se utiliza un `useEffect` con bandera de limpieza (`active`) para invocar de manera paralela y asíncrona los servicios del backend:
- `fetchAgents()`: Obtiene todos los agentes disponibles.
- `fetchContacts()`: Obtiene todos los contactos guardados en el sistema.

---

## 3. Lógica de Filtrado y Transformación

Para ofrecer una experiencia fluida, el frontend combina los datos de contactos con la información de los agentes en tiempo real a través de constantes calculadas en el ciclo de render:

1. **Mapeo de Agentes (`agentMap`):**
   Crea un mapa rápido de búsqueda de agentes a partir de su ID para evitar búsquedas costosas en bucle:
   ```typescript
   const agentMap = new Map<string, Agent>(agents.map((agent) => [agent.id, agent]));
   ```

2. **Combinación de Datos (`combinedContacts`):**
   Cada objeto de contacto se extiende añadiendo los campos `agentName` y `agentPhone` provenientes del agente que tiene asociado:
   - Si no tiene agente asignado, por defecto se etiqueta como perteneciente al `"Directorio"`.
   ```typescript
   const combinedContacts = contacts.map((contact) => {
     const agent = agentMap.get(contact.agentId);
     return {
       ...contact,
       agentName: agent?.name ?? 'Directorio',
       agentPhone: agent?.phone ?? '—',
     };
   });
   ```

3. **Filtrado Combinado (`filteredContacts`):**
   Aplica simultáneamente el filtro de texto (`searchTerm`) sobre el nombre o teléfono, junto con el filtro de cuenta de agente (`selectedAgentId`):
   ```typescript
   const filteredContacts = combinedContacts.filter((contact) => {
     const q = searchTerm.trim().toLowerCase();
     const matchesSearch = !q || contact.name.toLowerCase().includes(q) || contact.phone.includes(q);
     const matchesAgent = !selectedAgentId || contact.agentId === selectedAgentId;
     return matchesSearch && matchesAgent;
   });
   ```

---

## 4. Funcionalidades y Acciones de Usuario

1. **Filtrar y Buscar:**
   - La búsqueda y el filtro de cuentas se aplican de inmediato en caliente al cambiar los valores de los inputs, sin requerir clics adicionales.

2. **Crear Contacto:**
   - El botón circular despliega un formulario.
   - Al pulsar **Guardar**, se valida que tanto el nombre como el teléfono contengan valores no vacíos (aplicándoles `.trim()`).
   - Se llama asíncronamente a `createContact(name, phone)`.
   - Si la petición es exitosa, se vuelve a consultar la lista de contactos (`fetchContacts()`) para actualizar el estado, se limpian los campos del formulario, se colapsa la sección y se notifica al usuario con un mensaje flotante.

---

## 5. Integración con el Backend (API)

La comunicación se centraliza mediante llamadas al módulo `dashboardApi.ts`:

- **Obtener Agentes:** `GET /api/agents` (mapeado en la ruta general de agentes).
- **Obtener Todos los Contactos:** `GET /api/contacts`
  - Devuelve todos los contactos almacenados.
  - Implementado en `contactRoute.ts` usando `PostgresContactRepository.listAllContacts()`.
- **Crear Contacto General (sin cuenta obligatoria):** `POST /api/contacts`
  - Envía `{ name, phone, agentId: null }` (o con `agentId` si corresponde).
  - Devuelve el contacto recién creado con estado `201 Created`.
- **Obtener Contactos por Agente (Específico):** `GET /api/agents/:agentId/contacts`
  - Devuelve la lista filtrada de contactos asignados a la cuenta de WhatsApp de un agente específico.

---

## 6. Persistencia y Base de Datos (PostgreSQL)

La persistencia de los contactos se maneja mediante la tabla `contacts` en PostgreSQL, definida en el script de inicialización (`init.sql`):

```sql
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CONSTRAINT fk_contacts_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);
```

### Relaciones:
- **`agent_id` (Clave Foránea):** Vincula el contacto con la tabla `agents`. Si el agente correspondiente es eliminado, la restricción `ON DELETE CASCADE` borra de manera automática sus contactos para prevenir datos huérfanos. Puede ser `NULL` para contactos pertenecientes al directorio global.

### Capa de Repositorio (`PostgresContactRepository`):
- **`listByAgent(agentId)`**: Ejecuta una consulta SQL para retornar los contactos de un agente ordenados por fecha de creación descendente (`created_at DESC`).
- **`listAllContacts()`**: Retorna todos los contactos sin distinción de cuenta.
- **`create(agentId, name, phone)`**: Genera un identificador único (con prefijo `contact-`, marca de tiempo y componente aleatorio) y registra el nuevo registro con la fecha y hora actual en formato ISO string.

---

## 7. Control de Accesos y Permisos (RBAC)

El acceso y el comportamiento de la pantalla de Directorio varían según el rol del usuario autenticado:

1. **Permiso de Lectura/Visualización:**
   - Tanto los usuarios de rol **admin** como **supervisor** pueden acceder y visualizar todos los contactos de la pantalla de Directorio.
   - El rol de **agente** está bloqueado para establecer sesiones web en la interfaz por diseño arquitectónico, protegiendo la información de fugas no deseadas.

2. **Permiso de Escritura (Creación):**
   - El backend refuerza la seguridad a través del middleware `authenticateRequest` y la lógica de validación de roles en la ruta de creación (`POST /contacts` y `POST /agents/:agentId/contacts`):
     ```typescript
     const role = req.user?.role;
     if (role === 'agent') {
       return res.status(403).json(buildErrorResponse('No tienes permisos para crear contactos', 'FORBIDDEN'));
     }
     ```
   - Solo usuarios con rol **admin** o **supervisor** están autorizados a persistir nuevos contactos. Cualquier intento por parte de un agente será rechazado con un código de estado `403 Forbidden`.
