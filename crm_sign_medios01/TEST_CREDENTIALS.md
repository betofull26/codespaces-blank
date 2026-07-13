# 🔐 Credenciales de Prueba

## ⚠️ IMPORTANTE: Inicializar Base de Datos

**Antes de intentar login, debes inicializar la base de datos ejecutando:**

```bash
# Opción 1: Desde terminal
curl -X POST http://localhost:3000/api/database/bootstrap

# Opción 2: Desde navegador
Abre en navegador: http://localhost:3000/api/database/bootstrap
```

Esto creará todas las tablas y insertará el usuario admin.

---

## Usuario Admin (Producción)

| Campo | Valor |
|-------|-------|
| **Usuario** | `admin` |
| **Contraseña** | `secret` |
| **Rol** | `admin` |
| **Estado** | Activo |
| **Acceso al Panel** | ✅ Sí |

### Cómo Usar

1. **Inicializa BD:** `curl -X POST http://localhost:3000/api/database/bootstrap`
2. Abre [http://localhost:5173](http://localhost:5173) en el navegador
3. Ingresa las credenciales arriba en el formulario de login
4. Acceso completo al dashboard y funcionalidades

---

## 🔑 Detalles de Seguridad

- ✅ La contraseña se almacena **hasheada** con bcrypt (rounds: 10)
- ✅ El hash se valida en el backend antes de crear sesión
- ✅ La sesión se protege con JWT
- ✅ El token se almacena en `localStorage` del navegador
- ✅ Hash del admin: `$2b$10$hg4TvuIRgYqYhGHt5Yg4aesOkO907HPGOJ6eyjw4.PlfMyTcD4q/u` (contraseña: `secret`)

---

## 📝 Crear Más Usuarios de Prueba

### Vía Base de Datos

```sql
-- Conectar a PostgreSQL
docker-compose exec postgres psql -U user -d crm_sign_medios

-- Insertar nuevo usuario (contraseña: secret123)
INSERT INTO users (
  id, full_name, username, password_hash, 
  role, status, access_to_panel, created_at, updated_at
) VALUES (
  'user-test-1', 
  'Usuario Prueba', 
  'test', 
  '$2b$10$O6LVqMBb.LxMr9V9d3bh8uF5N5b5K8zY1LmLJx7v5d7K8p5R5y2jK',
  'supervisor', 
  'active', 
  TRUE, 
  NOW()::TEXT, 
  NOW()::TEXT
);
```

### Vía API Backend

El backend tiene endpoints para crear usuarios (una vez autenticado):

```bash
# POST /api/users
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Nuevo Usuario",
    "username": "nuevo",
    "password": "tu-contraseña",
    "role": "agent"
  }'
```

---

## ⚠️ Importante para Desarrollo

- **NO** uses estas credenciales en producción
- Estas son **solo para desarrollo local**
- Cambia el `JWT_SECRET` en `backend/.env` antes de desplegar
- Usa un gestor de secretos en producción (AWS Secrets Manager, HashiCorp Vault, etc.)

---

## 🔄 Resetear Base de Datos

Si necesitas resetear la BD completamente:

```bash
# Detener PostgreSQL
docker-compose down

# Remover volúmenes (DESTRUCTIVO)
docker-compose down -v

# Reiniciar
docker-compose up -d

# Esperar ~10 segundos para que se inicie PostgreSQL
sleep 10

# Backend se reconectará automáticamente y aplicará init.sql
```

---

## 📊 Hash Bcrypt Incluido

El hash `$2b$10$qcqISJoLWPKLqXHlKpGTkO0kVHN9gJZgBNg3HzKjQ0P7u6P6G4kMi` corresponde a:
- Contraseña: `secret`
- Algoritmo: bcrypt
- Rounds: 10
- Único para cada ejecución en producción

---

## 🆘 Troubleshooting

### ❌ "Unauthorized" al hacer login

**Posibles causas:**
1. ❌ Contraseña incorrecta
2. ❌ Usuario no existe
3. ❌ Usuario no tiene `access_to_panel = true`
4. ❌ Usuario está inactivo (`status != 'active'`)

**Solución:**
Verifica el usuario en la BD:
```bash
docker-compose exec postgres psql -U user -d crm_sign_medios -c \
  "SELECT id, username, status, access_to_panel FROM users WHERE username = 'admin';"
```

### ❌ "Connection refused" al intentar hacer login

1. Asegúrate que el **backend** está corriendo: `cd backend && pnpm dev`
2. Verifica que escucha en `http://localhost:3000`
3. Revisa la consola del backend para errores

### ❌ Token expirado o inválido

Los tokens JWT expiran. Para hacer logout y login nuevamente:
```javascript
// En la consola del navegador
localStorage.removeItem('crm_session_token');
// Luego recarga la página
```
