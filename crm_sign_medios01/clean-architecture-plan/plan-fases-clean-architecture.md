# Plan en fases para una Clean Architecture formal del programa

## Objetivo
Implementar una arquitectura más limpia, escalable y mantenible para el proyecto CRM, separando claramente las capas de dominio, aplicación, infraestructura e interfaces.

## Fase 1: Diagnóstico inicial (Completada)
- ~~Revisar el estado actual del frontend, backend y base de datos.~~
  - ~~Frontend: proyecto en React + Vite con componentes de interfaz, páginas y servicios para consumir APIs.~~
  - ~~Backend: servicio en Node.js + Express que expone endpoints bajo /api.~~
  - ~~Base de datos: esquema SQL y conexión con PostgreSQL mediante un cliente de base de datos.~~
- ~~Identificar módulos que ya están bien aislados y los que mezclan responsabilidades.~~
  - ~~Bien aislados: la capa de rutas HTTP, la conexión a la base de datos y los modelos de dominio.~~
  - ~~Mezclados: el backend aún concentra parte de la lógica en los puntos de entrada y la UI consume servicios sin una separación clara entre presentación y casos de uso.~~
- ~~Definir los límites entre UI, reglas de negocio y acceso a datos.~~
  - ~~La UI debe encargarse solo de presentar información y capturar eventos.~~
  - ~~La lógica de negocio debe moverse a servicios de aplicación o casos de uso.~~
  - ~~El acceso a datos debe quedar encapsulado en repositorios o adaptadores de infraestructura.~~
- ~~Hallazgos principales del diagnóstico.~~
  - ~~El proyecto ya tiene frontend, backend y base de datos, pero no está completamente organizado bajo una Clean Architecture formal.~~
  - ~~Existe una base modular, pero aún falta una separación más estricta entre dominio, aplicación, infraestructura e interfaces.~~
  - ~~El frontend está preparado para consumir API, pero el backend no expone aún todos los endpoints que la UI espera.~~
- ~~Conclusión de la fase 1.~~
  - ~~La base del proyecto existe, pero el diseño actual todavía necesita una reorganización más estricta para avanzar hacia una Clean Architecture real y sostenible.~~

## Fase 2: Definición de la arquitectura propuesta (Completada)
- ~~Proponer una arquitectura en capas para el backend, manteniendo el dominio independiente de la UI y de la base de datos.~~
- ~~Separar el backend en capas:~~
  - ~~Domain: entidades principales del sistema, reglas de negocio y contratos de repositorio.~~
  - ~~Application: casos de uso y servicios de aplicación para operaciones como listar agentes, obtener conversaciones, crear mensajes y actualizar estados.~~
  - ~~Infrastructure: implementación de repositorios, conexión a la base de datos, integraciones externas y adaptadores técnicos.~~
  - ~~Interface: controladores, rutas HTTP, DTOs y adaptadores de entrada/salida.~~
- ~~Definir una estructura de carpetas estándar y consistente para escalar el proyecto:~~
  - ~~src/domain~~
  - ~~src/application~~
  - ~~src/infrastructure~~
  - ~~src/interface~~
- ~~Establecer principios de diseño para la transición:~~
  - ~~El dominio no debe depender de Express, PostgreSQL ni de React.~~
  - ~~La aplicación debe orquestar los casos de uso, no contener lógica técnica redundante.~~
  - ~~La infraestructura debe implementar los contratos del dominio sin exponer detalles de implementación al negocio.~~
  - ~~Las interfaces deben traducir solicitudes externas a acciones del sistema de forma simple y clara.~~
- ~~Resultado esperado: una base sólida para evolucionar el proyecto hacia una arquitectura más formal, mantenible y preparada para crecer.~~

## Fase 3: Organización del dominio (Completada)
- ~~Extraer las entidades principales del sistema para que el dominio quede bien definido y no dependa de la capa de interfaz ni de la infraestructura.~~
  - ~~Agent: representa a un agente del sistema, con estado de conexión y rol.~~
  - ~~Conversation: representa una conversación activa o en espera con un cliente.~~
  - ~~Message: representa un mensaje dentro de una conversación.~~
  - ~~User: representa un usuario del sistema cuando aplique en futuras funcionalidades.~~
  - ~~Ticket: puede incorporarse más adelante si el sistema amplía la gestión de solicitudes.~~
- ~~Definir contratos de repositorio para persistencia sin acoplar el dominio a una tecnología concreta.~~
  - ~~Repositorio de agentes.~~
  - ~~Repositorio de conversaciones.~~
  - ~~Repositorio de mensajes.~~
- ~~Mover la lógica de negocio fuera de los controladores y rutas.~~
  - ~~Las reglas de negocio deben quedar en el dominio o en servicios de aplicación.~~
  - ~~Los controladores solo deben traducir peticiones y respuestas.~~
- ~~Resultado esperado: un núcleo del negocio claro, independiente de la base de datos y de la interfaz.~~

## Fase 4: Separación de casos de uso (Completada)
- ~~Crear servicios de aplicación para operaciones clave como:~~
  - ~~listar agentes~~
  - ~~obtener conversaciones~~
  - ~~crear mensajes~~
  - ~~actualizar estados~~
  - ~~registrar eventos o interacciones~~
- ~~Definir cada caso de uso con una responsabilidad clara y un flujo simple:~~
  - ~~Listar agentes: obtener la información necesaria desde el repositorio y devolverla como resultado de negocio.~~
  - ~~Obtener conversaciones: recuperar el historial asociado a un agente o a un cliente según la regla del negocio.~~
  - ~~Crear mensajes: validar el contenido, asociarlo a la conversación correcta y registrar el evento.~~
  - ~~Actualizar estados: aplicar reglas de transición de estado y persistir el cambio.~~
  - ~~Registrar eventos o interacciones: centralizar la captura de acciones para mantener trazabilidad.~~
- ~~Asegurar que los casos de uso dependan de interfaces y no de implementaciones concretas.~~
  - ~~Los servicios de aplicación deben recibir dependencias mediante contratos.~~
  - ~~La lógica no debe quedar acoplada directamente a Express, PostgreSQL ni a componentes del frontend.~~
  - ~~Esto permitirá sustituir o cambiar la infraestructura sin afectar las reglas del negocio.~~
- ~~Resultado esperado: una capa de aplicación ordenada, reutilizable y preparada para crecer sin mezclar lógica técnica con reglas del negocio.~~

## Fase 5: Infraestructura y persistencia (Completada)
- ~~Encapsular el acceso a la base de datos en repositorios.~~
  - ~~Cada entidad principal debe tener un repositorio encargado de persistir y recuperar sus datos.~~
  - ~~Los repositorios deben implementar los contratos definidos en el dominio.~~
- ~~Mantener la conexión y los queries en una capa separada.~~
  - ~~La conexión a la base de datos debe quedar en un adaptador de infraestructura.~~
  - ~~Los queries y las operaciones SQL deben organizarse de forma aislada para no mezclarse con la lógica de negocio.~~
- ~~Definir cómo se manejarán migraciones, seed data y validaciones de datos.~~
  - ~~Las migraciones deben mantenerse como parte del ciclo de desarrollo y despliegue.~~
  - ~~El seed data se utilizará para inicializar datos base del sistema de forma controlada.~~
  - ~~Las validaciones de datos deben aplicarse tanto en la capa de aplicación como en la infraestructura cuando sea necesario.~~
- ~~Completar la transición de la persistencia hacia una arquitectura más formal.~~
  - ~~Los repositorios concretos deben quedar aislados del dominio y de los casos de uso.~~
  - ~~La conexión a la base de datos debe poder cambiarse sin modificar la lógica de negocio.~~
  - ~~La infraestructura debe proporcionar una base estable para futuras expansiones del sistema.~~
- ~~Resultado esperado: una capa de infraestructura preparada para soportar la persistencia sin acoplar el negocio a la tecnología concreta de la base de datos.~~

## Fase 6: Frontend alineado con la arquitectura (Completada)
- ~~Mantener el frontend orientado a la presentación y la interacción.~~
  - ~~Los componentes deben encargarse de mostrar datos y capturar eventos, pero no de implementar lógica de negocio.~~
  - ~~La interfaz debe quedar enfocada en la experiencia del usuario y en la composición visual.~~
- ~~Centralizar llamadas a la API en servicios de cliente.~~
  - ~~Las operaciones de red deben agruparse en un componente de servicios o adaptadores de cliente.~~
  - ~~Esto evita duplicar lógica de fetch, manejo de errores y transformación de respuestas.~~
- ~~Evitar que la UI conozca detalles internos del backend.~~
  - ~~Los componentes no deben depender directamente de rutas internas, formatos técnicos o detalles de infraestructura.~~
  - ~~La comunicación con el backend debe ocurrir a través de contratos claros y servicios estables.~~
- ~~Completar la alineación del frontend con la arquitectura propuesta.~~
  - ~~Los componentes deben seguir centrados en la presentación y la interacción del usuario.~~
  - ~~Las llamadas a la API deben consolidarse en servicios de cliente reutilizables y estables.~~
  - ~~La interfaz debe mantenerse independiente de detalles internos del backend para facilitar cambios futuros.~~
- ~~Resultado esperado: un frontend más limpio, más mantenible y consistente con la arquitectura propuesta para el sistema.~~

## Fase 7: Mejora de la calidad del código (Completada)
- ~~Introducir validaciones y DTOs para las entradas y salidas de la API.~~
  - ~~Las peticiones y respuestas deben transformarse mediante objetos claros y tipados.~~
  - ~~Esto reduce acoplamientos y facilita el mantenimiento.~~
- ~~Aplicar principios SOLID de forma progresiva.~~
  - ~~Mantener una responsabilidad única por módulo y por servicio.~~
  - ~~Favorecer la inversión de dependencias y el uso de interfaces en lugar de implementaciones concretas.~~
- ~~Añadir pruebas unitarias e integración para las capas más críticas.~~
  - ~~Probar casos de uso, repositorios y adaptadores de interfaz.~~
  - ~~Garantizar que los cambios no rompan el comportamiento del sistema.~~
- ~~Resultado esperado: un proyecto más robusto, legible y preparado para escalar con menos riesgo de regresiones.~~

## Fase 8: Implementación gradual (Completada)
- ~~Migrar un módulo por vez, empezando por los más críticos.~~
  - ~~Priorizar primero los flujos de negocio más importantes, como agentes y conversaciones.~~
  - ~~Esto reduce el riesgo y permite validar cada cambio con mayor claridad.~~
- ~~Evitar cambios masivos al inicio.~~
  - ~~La transición debe hacerse de forma incremental para no afectar de manera desproporcionada el sistema.~~
  - ~~Cada cambio debe tener un alcance controlado y medible.~~
- ~~Validar que cada fase no rompa el funcionamiento del sistema.~~
  - ~~Probar los módulos afectados después de cada migración.~~
  - ~~Asegurar que la arquitectura nueva preserve el comportamiento actual del producto.~~
- ~~Resultado esperado: una adopción segura y ordenada de la Clean Architecture, sin introducir regresiones innecesarias.~~

## Entregables esperados (Completados)
- ~~Estructura de carpetas limpia y coherente para el proyecto.~~
- ~~Separación clara entre dominio, aplicación e infraestructura.~~
- ~~Backend más mantenible, más testeable y menos acoplado.~~
- ~~Base sólida para escalar el proyecto con menor riesgo y mayor control sobre los cambios.~~

## Resultado final esperado (Completado)
~~Contar con un proyecto que aplique una Clean Architecture formal, escalable y preparada para crecer, donde la lógica de negocio quede separada de la infraestructura y de la interfaz de usuario.~~
