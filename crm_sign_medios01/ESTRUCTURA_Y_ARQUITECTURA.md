# ESTRUCTURA DEL PROYECTO, ARQUITECTURA Y PARADIGMA

Este documento describe en detalle qué contiene cada carpeta del repositorio `crm_sign_medios01`, su funcionalidad, la arquitectura general del sistema y los paradigmas de programación utilizados.

**Resumen rápido**
- Aplicación full-stack: frontend en React con Vite, backend en Node + TypeScript.
- Arquitectura: estilo limpio/por capas (Clean/Layered / elementos DDD / hexagonal en la práctica).
- Paradigma: mezcla de programación orientada a objetos (en el dominio/back-end) y programación funcional/reactiva (en el frontend con componentes funcionales de React).

**Estructura (carpeta raíz)**
- `ATTRIBUTIONS.md`: Atribuciones de terceros (licencias, recursos usados).
- `Backend-Implementation-Plan.md`, `Dashboard-Database-Integration-Plan.md`, `DATABASE_README.md`: Documentación de diseño e integración de la base de datos y plan de implementación del backend.
- `database_schema.sql`: Script SQL que define el esquema de la base de datos.
- `default_shadcn_theme.css`, `index.html`, `vite.config.ts`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `postcss.config.mjs`, `README.md`: Archivos de configuración del monorepo/paquetes, configuración de build (Vite), y assets globales.

**Carpeta `backend/`**
Estructura principal del backend en TypeScript. Sigue una separación en capas que facilita pruebas y sustitución de infraestructuras.
- `backend/package.json`, `backend/README.md`, `backend/tsconfig.json`: Configuración del paquete backend y TypeScript.
- `backend/src/main.ts`: Punto de entrada del servidor (arranque de la aplicación, binding de puertos, bootstrapping de dependencias).
- `backend/src/application/`: Implementaciones de servicios de aplicación (casos de uso). Ejemplos:
  - `databaseService.ts`: Servicio de alto nivel para operaciones con la base de datos desde la capa de aplicación.
  - `healthService.ts`: Lógica para comprobaciones de salud y endpoints relacionados.
- `backend/src/common/`: Utilidades compartidas y tipos transversales.
  - `apiResponse.ts`: Formato estándar de respuestas HTTP.
  - `config.ts`: Configuración central (variables de entorno, constantes).
- `backend/src/domain/`: Modelos del dominio y lógica agnóstica a infraestructura.
  - `database.ts`, `health.ts`: Entidades/objetos de valor y lógica del dominio.
  - `models.ts`, `models.test.ts`: Definición de modelos y tests unitarios de dominio.
- `backend/src/infrastructure/`: Implementaciones concretas de la infraestructura.
  - `database/connection.ts`: Lógica de conexión a la base de datos.
  - `database/init.sql`, `database/init.ts`: Scripts e inicializadores para crear tableros/tablas.
  - `http/routes/`: Definición de rutas HTTP (controladores o adaptadores que exponen la API).

Funcionalidad del backend: Exponer una API REST (o similar) que implementa casos de uso definidos en `application/` y usa implementaciones concretas de `infrastructure/`. La separación sugiere principios de Clean Architecture o hexagonal: la lógica del dominio no debe depender de detalles de infraestructura.

**Carpeta `src/` (frontend)**
Front-end construido con React + Vite y TypeScript.
- `src/main.tsx`: Punto de arranque del cliente React.
- `src/vite-env.d.ts`: Tipos globales para Vite/React.
- `src/app/`: Código de la aplicación React.
  - `App.tsx`, `routes.tsx`: Enrutamiento y layout principal.
  - `components/`: Componentes UI divididos por responsabilidad.
    - `BrandPanel.tsx`, `LoginCard.tsx`, `LoginForm.tsx`: Componentes globales/compartidos.
    - `dashboard/`: Subcarpeta con componentes específicos del dashboard (por ejemplo `AgentCard.tsx`, `DashboardHeader.tsx`, `KPICards.tsx`, `Sidebar.tsx`, `TicketManagement.tsx`, etc.). Aquí se gestiona la UI y lógica de interacción del panel de control.
    - `figma/`: Componentes relacionados con recursos visuales (p.ej. `ImageWithFallback.tsx`).
    - `ui/`: Biblioteca de componentes reutilizables (botones, inputs, dialogos, avatares, etc.). Parece inspirada en shadcn/ui o un diseño similar.
  - `lib/`: Código utilitario/servicios cliente, por ejemplo `auth.ts` para manejo de autenticación del cliente.
  - `pages/`: Páginas de alto nivel que usan los componentes del dashboard (`DashboardPage.tsx`, `LoginPage.tsx`, `UserManagementPage.tsx`, etc.).
  - `services/`: Clientes para APIs, p.ej. `dashboardApi.ts` que llama al backend.
- `src/imports/`: (posible carpeta generada por framework o para alias de importaciones).
- `src/styles/`: Archivos CSS globales y variables de tema (`fonts.css`, `globals.css`, `shadcn.css`, `tailwind.css`, `theme.css`).

Funcionalidad del frontend: Interfaz SPA (single-page application) con componentes funcionales, llamadas a APIs a través de `services/`, y uso de una librería de diseño (shadcn o Tailwind). Los componentes en `ui/` sugieren un enfoque atómico y reutilizable.

**Otras carpetas y archivos relevantes**
- `CRM-SIGN-MEDIOS/`: Documentación del proyecto y especificaciones (por ejemplo `estructura-y-fases-backend.md`, `autenticación-de-usuarios-(login)-spec.md`).
- `guidelines/`: Guías del equipo y convenciones (`Guidelines.md`).
- Archivos raíz como `README.md` y `ATTRIBUTIONS.md` ofrecen contexto y dependencias del proyecto.

**Arquitectura general**
- Tipo: Clean Architecture / Layered + Domain-Driven Design (práctico).
  - Señales: Carpetas `application/`, `domain/`, `infrastructure/` que separan casos de uso, lógica del dominio y dependencias concretas.
  - Adaptadores/puertos: `infrastructure/http/routes` y `infrastructure/database` actúan como adaptadores que conectan el mundo exterior con los puertos definidos en `application`/`domain`.
- Frontend: Arquitectura de aplicación SPA con componentes y servicios, organizada en `pages`, `components`, y `services`.

Ventajas de esta arquitectura en el repo:
- Desacoplamiento alto entre lógica de negocio y detalles de infraestructura.
- Facilita testing: los `models.test.ts` y la separación permiten pruebas unitarias del dominio.
- Reemplazo de infraestructuras sencillo (p.ej., cambiar base de datos) sin tocar la lógica de negocio.

**Paradigma(s) de programación**
- Backend (TypeScript/Node): mezcla de paradigmas
  - Orientado a objetos: Entidades y modelos de dominio que encapsulan reglas.
  - Funcional/modular: Servicios y funciones puras para casos de uso en `application/`.
  - Principios SOLID y DDD: Inyección de dependencias entre capas, separación de responsabilidades.
- Frontend (React + TypeScript): programación declarativa y funcional
  - Componentes funcionales y hooks (reactivos). Estado local y efectos manejados con hooks.
  - Enfoque component-driven (UI atómica) y reactivo para la actualización de la interfaz.

**Flujo típico de una petición (alto nivel)**
1. Frontend llama a un endpoint usando `services/dashboardApi.ts`.
2. `backend/src/infrastructure/http/routes` recibe la petición y la adapta a un caso de uso de `application/`.
3. El caso de uso en `application/` solicita operaciones al `domain/` y/o a la `infrastructure/database` a través de interfaces/puertos.
4. La `infrastructure/database` realiza las consultas y devuelve resultados.
5. La respuesta se normaliza con `common/apiResponse.ts` y se envía al cliente.

**Recomendaciones rápidas**
- Mantener la separación de capas: seguir colocando lógica de negocio en `domain/` y `application/`, y evitar mezclar con `infrastructure/`.
- Añadir diagramas (por ejemplo un diagrama de capas o flujo) en la documentación para facilitar la integración a nuevos desarrolladores.
- Documentar contratos de API en `backend/` (OpenAPI/Swagger) y el formato de los `services` en frontend.

---

Si deseas, puedo:
- Añadir un diagrama (Mermaid) que visualice las capas y la comunicación.
- Generar un archivo `ARCHITECTURE_DIAGRAM.md` con diagramas y ejemplos de llamadas.
- Actualizar el `README.md` para incluir un resumen y enlaces a este documento.

