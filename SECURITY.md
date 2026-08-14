# 🔒 Políticas de Seguridad - StreamX

## 🚨 CRÍTICO: Credenciales Expuestas Detectadas

### Problema Identificado

El archivo `.env` contiene credenciales reales y **NO DEBE** ser commiteado al repositorio.

**Credenciales expuestas:**
- MongoDB URI con usuario y contraseña
- TMDB API Key
- Session Secret
- Credenciales de administrador por defecto

### ✅ Acciones Realizadas

1. **Actualizado `.gitignore`** para excluir `.env`
2. **Creado `.env.example`** con valores de ejemplo (sin credenciales reales)
3. **Creado este documento SECURITY.md**

### 🔧 Pasos Inmediatos Requeridos

#### 1. Rotar TODAS las Credenciales

```bash
# 1. MongoDB Atlas
# - Ir a https://cloud.mongodb.com
# - Database Access → Cambiar contraseña del usuario
# - Network Access → Verificar IPs permitidas

# 2. TMDB API Key
# - Ir a https://www.themoviedb.org/settings/api
# - Regenerar API Key

# 3. Session Secret
# - Generar nuevo secreto aleatorio (min 32 chars)
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 4. Admin Password
# - Cambiar contraseña en producción inmediatamente
# - Actualizar en MongoDB si ya está seedeada
```

#### 2. Eliminar .env del Historial de Git

```bash
# Si .env ya fue commiteado, eliminar del historial
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "chore: remove .env from repository"

# Opcional: usar BFG Repo-Cleaner para limpieza profunda
# java -jar bfg.jar --delete-files .env  mi-repo.git
```

#### 3. Verificar Secrets en GitHub

Si el repositorio está en GitHub:
1. Ir a Settings → Secrets and variables → Actions
2. Añadir como secrets:
   - `MONGODB_URI`
   - `TMDB_API_KEY`
   - `SESSION_SECRET`
   - `ADMIN_SEED_PASSWORD`

### 📋 Checklist de Seguridad

- [ ] Rotar credenciales de MongoDB
- [ ] Regenerar TMDB API Key
- [ ] Cambiar Session Secret
- [ ] Cambiar contraseña de admin
- [ ] Eliminar .env del repositorio
- [ ] Verificar que .env esté en .gitignore
- [ ] Habilitar 2FA en MongoDB Atlas
- [ ] Revisar logs de acceso no autorizado
- [ ] Actualizar README con instrucciones de seguridad

### 🔐 Mejores Prácticas Implementadas

1. **Variables de Entorno**: Todas las credenciales deben estar en `.env`
2. **.gitignore Actualizado**: Excluye archivos sensibles
3. **.env.example**: Plantilla segura para nuevos desarrolladores
4. **Helmet.js**: Headers de seguridad HTTP implementados
5. **Rate Limiting**: Protección contra brute-force
6. **CSP**: Content Security Policy configurada

### 🛡️ Configuración de Seguridad Actual

```javascript
// Helmet configuration (app.js)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", ...],
      // ... más directivas
    }
  }
}));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 requests
  message: { error: 'Demasiadas peticiones.' }
}));
```

### 📞 Reportar Vulnerabilidades

Si encontrás una vulnerabilidad de seguridad:
1. NO crear un issue público
2. Enviar email privado al equipo de desarrollo
3. Esperar respuesta antes de divulgar

### 🔄 Mantenimiento Regular

- [ ] Rotar credenciales cada 90 días
- [ ] Revisar logs de acceso semanalmente
- [ ] Actualizar dependencias mensualmente
- [ ] Auditar permisos de base de datos trimestralmente

---

**Última actualización**: Diciembre 2024
**Estado**: ⚠️ Acción requerida - Rotar credenciales
