# Paso 1: Inventario de compatibilidad del modelo nuevo

## Esquema revisado
Se revisaron los archivos:
- [backend/src/infrastructure/database/init.sql](backend/src/infrastructure/database/init.sql)
- [backend/src/infrastructure/database/repositories.ts](backend/src/infrastructure/database/repositories.ts)

## Tablas presentes en el esquema actual
### Tablas del modelo nuevo
- users
- auth_users
- devices
- contacts
- conversations
- messages
- media_files
- audit_logs
- backups
- user_sessions
- agents

## Hallazgos clave
### 1. No se detectan tablas antiguas activas en el SQL actual
El esquema actual ya no define tablas heredadas como fuente de verdad. La estructura presente corresponde al modelo nuevo, con users como entidad central.

### 2. Sí existe una capa de compatibilidad transicional en el backend
El repositorio aún sincroniza información entre varias tablas relacionadas:
- users
- auth_users
- devices
- agents

Esto significa que el sistema ya no depende de un modelo viejo en forma de tablas, pero sí mantiene una lógica de sincronización que actúa como puente entre la identidad de usuario y sus proyecciones de autenticación, dispositivo y agente.

## Consultas que todavía dependen de esta capa transicional
En [backend/src/infrastructure/database/repositories.ts](backend/src/infrastructure/database/repositories.ts), las operaciones de usuario aún hacen lo siguiente:
- escribir en users
- sincronizar auth_users
- crear o actualizar devices
- crear o actualizar agents

Estas consultas son compatibles con el modelo nuevo, pero aún no están completamente centralizadas en una sola ruta de escritura.

## Clasificación propuesta
### Tablas nuevas de referencia
- users: fuente principal de identidad y perfil
- auth_users: proyección de autenticación
- devices: proyección de dispositivos
- contacts: fichas/contactos
- conversations: conversaciones
- messages: mensajes
- audit_logs: auditoría
- user_sessions: sesiones
- backups: respaldos

### Compatibilidad heredada todavía presente
- agents: sigue siendo poblada desde los cambios de usuarios, pero funciona como una proyección de apoyo para el flujo de agentes.

## Punto de corte definido
El corte de compatibilidad debería ocurrir cuando:
1. todas las operaciones de negocio escriban y lean a través de users y sus tablas relacionadas nuevas;
2. no exista ninguna ruta de fallback ni lógica de compatibilidad que dependa del esquema anterior;
3. las pruebas cubran los flujos principales sin depender de sincronizaciones transicionales.

## Conclusión del paso 1
El modelo nuevo ya está presente en el esquema y en la lógica de persistencia. Lo que falta ahora es consolidar las operaciones para que el sistema quede completamente alineado con esa estructura y pueda eliminar cualquier capa transicional restante.
