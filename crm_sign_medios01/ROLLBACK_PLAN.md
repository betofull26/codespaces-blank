# Plan de rollback para despliegue controlado

## Estado actual validado
- Contenedor de PostgreSQL: activo y saludable.
- Backend: pruebas ejecutadas correctamente con 37/37 aprobadas.
- Respaldo local creado en: storage/backups/deployment-control/20260722-000148

## Pasos de despliegue controlado
1. Mantener el entorno actual funcionando.
2. Desplegar solo cambios aprobados en desarrollo.
3. Validar salud del backend, conexión a base de datos y rutas clave.
4. Revisar logs y auditoría.

## Plan de rollback
Si el despliegue presenta errores:
1. Detener o desactivar la versión recién desplegada.
2. Restaurar el respaldo local del proyecto desde storage/backups/deployment-control/20260722-000148.
3. Revertir la base de datos al estado previo usando la copia de seguridad disponible o los scripts de migración anteriores.
4. Reiniciar el entorno de desarrollo y volver a ejecutar las pruebas.
5. Reintentar el despliegue solo después de corregir la causa.

## Criterios para continuar
- Backend responde correctamente.
- Pruebas pasan.
- La base de datos está accesible.
- No aparecen errores críticos en logs.
