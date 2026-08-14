# 🤝 Guía de Contribución - StreamX

¡Gracias por tu interés en contribuir a StreamX! Esta guía te ayudará a empezar.

## 📋 Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [Primeros Pasos](#primeros-pasos)
3. [Flujo de Trabajo](#flujo-de-trabajo)
4. [Estándares de Código](#estándares-de-código)
5. [Commits](#commits)
6. [Pull Requests](#pull-requests)

## 🎯 Código de Conducta

- Sé respetuoso con otros contribuidores
- No toleramos discriminación ni acoso
- Mantene un tono profesional en issues y PRs
- Feedback constructivo siempre

## 🚀 Primeros Pasos

### 1. Fork del Repositorio

```bash
# Click en "Fork" en GitHub
git clone https://github.com/TU_USUARIO/streamx.git
cd streamx
```

### 2. Configurar Remoto Original

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/streamx.git
git fetch upstream
```

### 3. Instalar Dependencias

```bash
# Backend principal
npm install

# Backend API (si trabajás en eso)
cd backend && npm install && cd ..

# Frontend React (opcional)
cd frontend && npm install && cd ..
```

### 4. Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales locales
```

### 5. Crear Rama

```bash
git checkout -b feature/tu-feature
# o para fixes:
git checkout -b fix/tu-fix
```

## 🔄 Flujo de Trabajo

```bash
# 1. Sincronizar con upstream
git fetch upstream
git rebase upstream/main

# 2. Hacer cambios...

# 3. Testear cambios
npm test  # cuando haya tests

# 4. Commit
git add .
git commit -m "feat: descripción clara"

# 5. Push
git push origin feature/tu-feature

# 6. Crear Pull Request en GitHub
```

## 📝 Estándares de Código

### JavaScript/Node.js

```javascript
// ✅ BUENO
const express = require('express');
const PORT = process.env.PORT || 3000;

async function getUser(id) {
  const user = await User.findById(id);
  if (!user) throw new Error('Usuario no encontrado');
  return user;
}

// ❌ MALO
var port = 3000;
function getuser(ID){
  var u = User.findById(ID);
  return u;
}
```

### Reglas Generales

- Usar comillas simples `'`
- Indentación de 2 espacios
- Punto y coma `;` al final
- Nombres descriptivos en inglés o español consistente
- Máximo 80 caracteres por línea (soft limit)
- Funciones cortas (< 50 líneas idealmente)

### Estructura de Archivos

```
controllers/     # Lógica de negocio
models/          # Modelos de datos
routes/          # Definición de rutas
views/           # Plantillas EJS
middleware/      # Middleware personalizado
utils/           # Utilidades
services/        # Servicios externos
scripts/         # Scripts one-off
```

## 📌 Commits

### Convención de Commits

```
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formato, sin cambios de lógica
refactor: refactorización
test: añadir tests
chore: mantenimiento, dependencias
```

### Ejemplos

```bash
# ✅ Buenos commits
git commit -m "feat: agregar filtro por categoría en TV"
git commit -m "fix: corregir error de conexión MongoDB"
git commit -m "docs: actualizar README con instrucciones de instalación"
git commit -m "refactor: simplificar lógica de autenticación"

# ❌ Malos commits
git commit -m "changes"
git commit -m "fix stuff"
git commit -m "asdfasdf"
```

## 🔀 Pull Requests

### Checklist antes de Enviar

- [ ] Código testeado localmente
- [ ] Sin console.log() de debug
- [ ] Documentación actualizada si corresponde
- [ ] Commits limpios y descriptivos
- [ ] Resuelve un issue específico (si aplica)

### Template de PR

```markdown
## Descripción
Breve descripción de los cambios

## Tipo de Cambio
- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
- [ ] Documentación

## Testing
Cómo probaste los cambios:
- [ ] Tests manuales
- [ ] Tests automáticos añadidos

## Screenshots (si aplica)
[Imágenes del cambio]

## Issues Relacionados
Closes #123
```

## 🧪 Testing

Cuando se implementen tests:

```bash
# Correr tests
npm test

# Coverage
npm run coverage

# Linting
npm run lint
```

## 📚 Recursos Útiles

- [Documentación de Express](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [EJS Templates](https://ejs.co/)
- [React Docs](https://react.dev/)

## 💬 ¿Necesitás Ayuda?

- Abrir un issue con la etiqueta "question"
- Revisar issues existentes
- Leer documentación del proyecto

## 🎉 ¡Gracias por Contribuir!

Tu ayuda hace que StreamX sea mejor para todos. 🙌

---

**Última actualización**: Diciembre 2024
