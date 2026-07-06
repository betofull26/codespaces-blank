**Configurar el webhook para Codespaces**

Este proyecto usa exclusivamente el reenvío de puertos nativo de GitHub Codespaces para exponer el backend al exterior.

Flujo recomendado:
1. Asegúrate de que el backend escuche en `http://127.0.0.1:3000` o `0.0.0.0:3000`.
2. En la UI de Codespaces, abre la sección de Puertos y expón el puerto `3000` como público.
3. GitHub Codespaces generará una URL pública del tipo `https://*.app.github.dev`.
4. Usa esa URL completa en la consola de Meta como callback URL para el webhook.
5. Configura el mismo `META_VERIFY_TOKEN` en Meta y en `.env`.

Ejemplo de URL esperada:
- `https://<codigo>-3000.app.github.dev/api/whatsapp/webhook`

Notas importantes:
- El backend debe responder a peticiones HTTP normales en `localhost/127.0.0.1`.
- El middleware `requireHttps` debe recibir tráfico con `X-Forwarded-Proto: https` o, en este flujo, puede tratarse como un proxy de Codespaces que ya entrega HTTPS.
- Para seguridad, deja activado `META_APP_SECRET` en `.env` y usa `verifyWebhookSignature`.
- No se recomienda ni se usa ngrok, localtunnel u otras herramientas de túneles externas en este proyecto.
