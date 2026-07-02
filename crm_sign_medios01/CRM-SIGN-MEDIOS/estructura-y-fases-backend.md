# Estructura del repositorio y estado del backend

Este documento describe de forma detallada la estructura del repositorio y el estado actual del desarrollo del backend, incluyendo las fases que ya han sido implementadas y las que se iniciaron pero aún no se han completado.

## 1. Estructura general del repositorio

El repositorio contiene dos grandes áreas principales:

- Frontend: la aplicación del dashboard y la interfaz de usuario.
- Backend: la infraestructura nueva para exponer APIs y conectar la lógica del negocio con la base de datos.

### 1.1 Carpeta principal del proyecto

- crm_sign_medios01/
  - Carpeta principal del proyecto de la aplicación.
  - Contiene el frontend, documentos de planificación, esquema de base de datos y la nueva estructura del backend.

## 2. Estructura detallada de carpetas y subcarpetas

### 2.1 Carpeta crm_sign_medios01/

Es la raíz del proyecto funcional y contiene los archivos principales del sistema.

#### Archivos principales

- package.json
  - Define dependencias y scripts del frontend principal.
  - Incluye herramientas como Vite, React y Tailwind.

- pnpm-lock.yaml
  - Lockfile de dependencias del workspace.

- pnpm-workspace.yaml
  - Configuración del workspace monorepo.

- vite.config.ts
  - Configuración de Vite para el frontend.

- index.html
  - Punto de entrada HTML de la aplicación.

- README.md
  - Documentación general del proyecto.

- database_schema.sql
  - Esquema relacional base para agentes, conversaciones y mensajes.

- Backend-Implementation-Plan.md
  - Plan maestro de implementación del backend.

- Dashboard-Database-Integration-Plan.md
  - Plan de integración entre el dashboard y la base de datos.

- DATABASE_README.md
  - Documentación general del esquema y las entidades de base de datos.

- default_shadcn_theme.css
  - Tema base de estilos visuales del proyecto.

#### Carpeta src/

Contiene el código fuente de la aplicación frontend.

- src/main.tsx
  - Punto de entrada React para renderizar la app.

- src/vite-env.d.ts
  - Tipos ambientales de Vite.

##### Carpeta src/app/

Es el corazón de la aplicación frontend.

- src/app/App.tsx
  - Componente raíz de la aplicación.

- src/app/routes.tsx
  - Definición de rutas del sistema.

- src/app/components/
  - Componentes reutilizables y específicos de la interfaz.
  - Incluye subcarpetas como dashboard, figma y ui.

- src/app/pages/
  - Páginas del sistema: Login, Dashboard, Directorio, Configuración, Gestión de usuarios, etc.

- src/app/services/
  - Servicios de consumo de API y otras integraciones.

- src/app/lib/
  - Utilidades y lógica compartida del frontend.

##### Carpeta src/app/components/dashboard/

Contiene los componentes relacionados con el panel del dashboard.

- AgentCard.tsx
  - Tarjeta visual de un agente.

- AgentChatTree.tsx
  - Árbol visual de conversaciones y mensajes.

- agentsData.ts
  - Datos mock de ejemplo usados temporalmente para pruebas visuales.

- DashboardHeader.tsx
  - Encabezado del dashboard.

- KPICards.tsx
  - Tarjetas de métricas y KPIs.

- ReasignacionConversaciones.tsx
  - Lógica de reasignación de conversaciones.

- Sidebar.tsx
  - Barra lateral del dashboard.

- TicketManagement.tsx
  - Gestión de tickets o conversaciones.

- types.ts
  - Definiciones de tipos compartidos usados por los componentes de dashboard.

- UserRecordForm.tsx
  - Formulario para registros de usuario.

- UserRecordManagement.tsx
  - Gestión de registros u operaciones relacionadas con usuarios.

##### Carpeta src/app/components/ui/

Contiene los componentes de diseño de la librería visual del proyecto.

- Incluye componentes reutilizables como botones, inputs, modales, tablas, tabs, dropdowns y más.
- Son piezas base para construir la interfaz de forma consistente.

##### Carpeta src/app/components/figma/

- ImageWithFallback.tsx
  - Componente para manejar imágenes con fallback.

##### Carpeta src/styles/

Contiene estilos globales y de tema del proyecto.

- globals.css
- index.css
- shadcn.css
- tailwind.css
- theme.css
- fonts.css

### 2.2 Carpeta backend/

Es la nueva carpeta creada para implementar el backend con una arquitectura modular y separada del frontend.

#### Archivos principales

- package.json
  - Dependencias y scripts del backend.

- tsconfig.json
  - Configuración TypeScript.

- .env.example
  - Variables de entorno base.

- .gitignore
  - Archivos que no deben versionarse.

- README.md
  - Documentación breve del backend.

#### Carpeta src/

Contiene la implementación del backend.

##### src/common/

- apiResponse.ts
  - Define el formato estándar de respuestas de la API.

- config.ts
  - Centraliza la lectura de variables de entorno.

##### src/domain/

- Contiene las entidades y reglas de negocio del dominio.
- models.ts
  - Modelos para agentes, conversaciones, mensajes, clientes y usuarios.
- models.test.ts
  - Pruebas de validación de modelos.
- database.ts
  - Tipos y utilidades para representar el estado de la base de datos.
- health.ts
  - Modelo de estado del servicio.

##### src/application/

- healthService.ts
  - Servicio para obtener el estado de salud del backend.
- databaseService.ts
  - Servicio para validar el estado de la base de datos.

##### src/infrastructure/

- Contiene la integración con tecnologías externas y recursos concretos.

###### src/infrastructure/database/

- connection.ts
  - Configuración de conexión con PostgreSQL.

- init.sql
  - Script SQL de inicialización y seed de datos base.

- init.ts
  - Script de ejecución del bootstrap inicial.

###### src/infrastructure/http/

- routes/
  - healthRoute.ts
    - Ruta de salud del servidor.
  - databaseRoute.ts
    - Ruta para consultar el estado de la base de datos.
  - bootstrapRoute.ts
    - Ruta para inicializar la base de datos.

##### src/main.ts

- Punto de entrada del servidor Express.

## 3. Estado de las fases del backend

### Fases terminadas

#### Fase 1: Preparación del entorno
- Se definió la tecnología base del backend: Node.js + Express.
- Se creó la estructura base del proyecto backend.
- Se configuraron variables de entorno base.
- Se definió un formato estándar de respuesta de la API.

#### Fase 2: Conexión con la base de datos
- Se preparó la conexión con PostgreSQL.
- Se implementó la verificación del estado de la base de datos.
- Se añadieron rutas para consultar el estado de la conexión.
- Se dejó lista la infraestructura para futuras consultas reales.

#### Fase 3: Modelos y migraciones
- Se definieron modelos para agentes, conversaciones, mensajes, clientes y usuarios.
- Se crearon validaciones básicas de integridad.
- Se añadieron scripts de inicialización SQL con datos base de prueba.
- Se incorporaron pruebas básicas para validar los modelos.

### Fases iniciadas pero no terminadas

#### Fase 4: Endpoints base de la API
- La estructura para exponer endpoints está preparada, pero los endpoints reales de negocio aún no están completamente implementados.
- Falta integrar las consultas concretas para agentes, conversaciones y mensajes con la base real.

#### Fase 5: Integración con WhatsApp
- No se ha implementado el webhook ni el procesamiento de mensajes entrantes.
- Falta la validación del proveedor, extracción del payload y persistencia de mensajes desde WhatsApp.

#### Fase 6: Lógica de negocio
- No se ha definido completamente la relación entre clientes, agentes y conversaciones.
- Falta implementar reglas de asignación, actualización de estado y creación automática de conversaciones.

#### Fase 7: Seguridad y control de acceso
- No se ha implementado autenticación ni roles completos para la API.
- Falta proteger los endpoints y el webhook.

#### Fase 8: Pruebas y validación
- Se han agregado pruebas básicas de modelos, pero aún no hay pruebas de integración completas del backend.

#### Fase 9: Despliegue y operación
- No se ha preparado la operación completa para desarrollo y producción.
- Falta monitoreo, logs y documentación avanzada de despliegue.

## 4. Resumen general

El repositorio ya cuenta con una base sólida para avanzar en el backend. La arquitectura inicial quedó organizada, la conexión a base de datos quedó preparada y los modelos y migraciones están definidos. Sin embargo, aún falta completar las capas de API, negocio y seguridad para que el sistema sea completamente funcional.
