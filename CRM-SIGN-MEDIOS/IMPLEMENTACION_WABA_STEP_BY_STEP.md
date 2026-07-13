# Implementación paso a paso: Registro insertado e integración de clientes WABA

Este documento recoge, paso a paso, todas las tareas necesarias para implementar el registro insertado (embedded signup) de Meta, incorporar clientes empresariales (WABA) como proveedores/partners, y soportar usuarios de la aplicación WhatsApp Business en la plataforma.

---

## Resumen
Objetivo: permitir a clientes empresariales completar el proceso de registro insertado, intercambiar el código por credenciales/identificadores, almacenar y mapear cuentas WABA y números empresariales, sincronizar contactos y chats, y ofrecer UI/UX de gestión y sincronización en el frontend.

---

## Pre-requisitos
- Ser socio/proveedor de tecnología o socio de soluciones (credenciales Meta). 
- Certificado SSL válido en el dominio donde se aloje el registro insertado.
- Webhooks públicos (endpoint HTTPS) configurados y accesibles.
- Acceso y permisos en la app de Meta (APP_ID, APP_SECRET, configuration ID para embedded signup).
- Entorno de desarrollo con backend y frontend levantados.

---

## Paso 0 — Preparación
1. Documentar los requisitos y responsables (seguridad, backend, frontend, DBA, QA).
2. Crear iessues/tickts por cada bloque (frontend, backend, DB, pruebas, despliegue).
3. Añadir dominios y URIs autorizados en la app de Meta (dominios de dev/staging/producción).
4. Generar `configuration_id` para el embedded signup y guardar en secrets/config.

---

## Paso 1 — Frontend: añadir registro insertado (embedded signup)
1. Crear la pantalla `Conexión de Dispositivos` (ruta: `/devices/connect`):
   - Botón para lanzar el flow (`Login with Facebook`).
   - Incluir script del SDK de Facebook (`https://connect.facebook.net/.../sdk.js`).
   - Inicializar `FB.init` usando `APP_ID` y `GRAPH_API_VERSION` desde variables de entorno.
   - Implementar función `launchWhatsAppSignup()` que llama a `FB.login` con `config_id`.
   - Añadir `window.addEventListener('message', ...)` para capturar eventos `WA_EMBEDDED_SIGNUP` (session events).
   - En la respuesta/`authResponse` capturar el `code` y enviarlo al backend inmediatamente.
2. Manejo UX:
   - Mostrar estados: iniciando, en progreso, éxito, error, cancelado.
   - Redirigir a `Dashboard` tras registro exitoso (según flujo definido).
3. Seguridad: no enviar `APP_SECRET` al cliente. Solo enviar `config_id` y `APP_ID` públicos.

Archivo que edito el agente para implementar el frontend
- `src/app/pages/ConexionDispositivosPage.tsx`
- `src/app/services/dashboardApi.ts`
- `src/app/routes.tsx`
---

## Paso 2 — Backend: endpoints y flujo de intercambio
1. Endpoint para recibir el `code` desde frontend (POST `/api/waba/onboard/exchange`):
   - Validar origen y autenticación del request.
   - Intercambiar `code` por access token/identificador con Graph API (`/oauth/access_token`).
   - Registrar respuesta temporal en logs de auditoría.
2. Flujo de incorporación (server-side):
   - Usar token obtenido para consultar Graph API y obtener `waba_id`, `phone_number_id`, y assets seleccionados.
   - Crear o actualizar registros en BD: `waba_accounts`, `business_phone_numbers`, `waba_assets`.
   - Registrar `onboarding_status` y `owner` (partner/provider) y timestamps.
   - Si el cliente seleccionó migración o acceso API, completar pasos de permisos necesarios.
3. Endpoint para recibir y procesar webhooks `account_update` y `WA_EMBEDDED_SIGNUP` (POST `/api/waba/webhook`):
   - Verificar firma (app secret verification) si aplica.
   - Extraer `waba_id`, `phone_number_id`, `event` y procesar: actualizar BD, disparar jobs de sincronización.
4. Endpoint para iniciar sincronización (POST `/api/waba/:wabaId/sync`):
   - Solo admins permitidos (RBAC).
   - Lanza jobs en background para sincronizar contactos y chat history.

---

## Paso 3 — Base de datos: nuevo modelado y migraciones
1. Nuevas tablas (sugerido mínimo):
   - `providers` (id, name, type, contact, created_at, updated_at)
   - `waba_accounts` (id, provider_id, waba_id, name, business_id, onboarding_status, created_at, updated_at)
   - `business_phone_numbers` (id, waba_account_id, phone_number_id, phone_number, verified, created_at, updated_at)
   - `waba_assets` (id, waba_account_id, asset_type, asset_id, metadata, created_at)
   - `waba_sessions` (id, waba_account_id, token_hash, expires_at, created_at)
   - `waba_sync_jobs` (id, waba_account_id, job_type, status, last_run_at, details)
   - Mapeos: `agent_mappings` (agent_user_id, waba_account_id, phone_number_id)
2. Ajustes en tablas existentes:
   - `users` o `agents`: añadir campos opcionales `linked_waba_id`, `linked_phone_number_id`.
   - `contacts`: añadir `source` y `source_id` (p.ej. `waba_phone_id`).
   - `messages`: añadir `source_waba_id`, `source_phone_number_id`.
3. Crear migraciones y scripts de backfill si existen datos previos.
4. Indices y constraints: asegurar índices sobre `waba_id`, `phone_number_id`, `agent_user_id`.

---

## Paso 4 — Graph API y llamadas servidor a servidor
1. Implementar helpers para:
   - Intercambio `code` → `/oauth/access_token`.
   - Consultas a `/vX.Y/<WABA_ID>/phone_numbers`, `/vX.Y/<WABA_ID>/...` para assets.
   - Refresh o rotación de tokens si aplica.
2. Manejar errores y límites de rate (backoff, reintentos), y registrar métricas.

---

## Paso 5 — Sincronización de contactos y chats
1. Definir jobs asincrónicos (worker) para:
   - Obtener lista de contactos y guardarlos (`contacts` con `source='waba'`).
   - Migrar/descargar historial de chats (si la API lo permite) y guardarlos en `messages` con metadatos.
2. Proceso de restauración optimista: conservar IDs originales cuando sea posible y evitar duplicados.
3. Añadir endpoints que devuelvan progreso del job para mostrar en UI.

---

## Paso 6 — Frontend: UI/UX adicional
1. `Conexión de Dispositivos` (ya descrito en Paso 1).
2. `Dashboard`: tras conexión mostrar tarjeta por WABA y botón `Sincronizar / Recuperar historial` (visible solo para Admins).
3. `Directorio`: añadir filtro por agentes conectados via WABA; mostrar origen del contacto (WABA vs manual).
4. Páginas de estado de onboarding: listar cuentas WABA registradas, estado (`pending`, `onboarded`, `failed`), últimos intentos y logs.
5. Manejo de errores y mensajes claros para el usuario (p.ej. instrucciones cuando no exista ficha de usuario para un número WABA).

---

## Paso 7 — RBAC, seguridad y privacidad
1. Restricciones:
   - Solo roles `admin` o `supervisor` pueden iniciar sincronizaciones/restauraciones.
   - Solo usuarios autenticados pueden acceder a rutas que muestren datos WABA.
2. Seguridad:
   - No almacenar `APP_SECRET` en código cliente.
   - Almacenar tokens con `hash` cuando sea necesario y evitar exponerlos en logs.
   - Verificar y validar webhooks (firma/secret).
3. Auditoría: registrar eventos de incorporación, sincronización y revocación en tabla `audit_logs`.

---

## Paso 8 — Pruebas y QA
1. Tests unitarios para:
   - Intercambio de `code` (mock de Graph API).
   - Procesamiento de webhook con payloads `WA_EMBEDDED_SIGNUP`, `account_update` y CANCEL.
   - Migraciones y backfill.
2. Tests de integración e2e:
   - Simular embedded signup (usar stubs o cuentas de prueba Meta).
   - Flujo completo: onboard → persistir WABA → sync contacts → visualizar en Directorio.
3. Pruebas de seguridad y revisión de permisos.

---

## Paso 9 — Despliegue y roll-out
1. Preparar entornos: `staging` con dominio HTTPS y configuración Meta apuntando a dominios de staging.
2. Desplegar backend con migraciones y workers/cron.
3. Desplegar frontend con variables de entorno (`VITE_API_PROXY_TARGET`, `APP_ID`, `CONFIG_ID` pero sin `APP_SECRET`).
4. Probar onboarding en staging con cuentas de prueba.
5. Plan de roll-out por fases: habilitar para 1-2 clientes, validar, luego hacer rollout global.

---

## Paso 10 — Monitoreo y operación
1. Añadir métricas: cantidad de onboardings, éxito/fracaso, tiempo de sincronización, errores Graph API.
2. Alertas: fallos en webhook processing, tokens expirados, jobs en estado `failed`.
3. Documentar procedimientos de soporte para errores comunes del registro insertado (p.ej. `ERROR` en payload, orígenes no autorizados).

---

## Criterios de aceptación
- Un cliente puede completar el registro insertado desde el frontend y el backend registra `waba_account` y `business_phone_number`.
- Admin puede iniciar sincronización y ver contactos y chats en Directorio/Dashboard.
- Los roles y permisos están respetados; agentes sin acceso no pueden lanzar sincronizaciones.
- Webhooks son procesados correctamente y actualizan el estado de onboarding.

---

## Checklist rápida (para seguimiento)
- [ ] Añadir dominios autorizados en la app Meta
- [ ] Crear `configuration_id` y guardarlo en secrets
- [ ] Implementar frontend embedded signup
- [ ] Implementar endpoint `/api/waba/onboard/exchange`
- [ ] Implementar webhook receiver `/api/waba/webhook`
- [ ] Crear migraciones y tablas nuevas en BD
- [ ] Implementar jobs de sincronización
- [ ] Añadir UI de sincronización en Dashboard
- [ ] Añadir filtros/origen en Directorio
- [ ] Tests unitarios e integración
- [ ] Desplegar a staging y validar

---

## Notas finales
- Delegar las llamadas directas a Graph API exclusivamente al backend (no exponer `APP_SECRET`).
- Priorizar implementación incremental: empezar con onboarding y persistencia de `waba_account` + `phone_number`, luego añadir sincronización de contactos, y finalmente historial de mensajes.

---

*Documento generado como guía de implementación. Si quieres, puedo generar las migraciones SQL propuestas y ejemplos de endpoints next.*
