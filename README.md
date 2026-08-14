# StreamX - Plataforma de Streaming

Plataforma full-stack de streaming para películas, series y TV en vivo con soporte web y API para app móvil Android.

## 🚀 Características

- **Catálogo de contenido**: Películas y series con metadata de TMDB
- **TV en Vivo**: Canales de TV organizados por categorías con reproductor HLS
- **Panel de Administración**: Gestión de contenido y usuarios
- **API REST**: Backend para aplicación móvil Android
- **Scraper Automático**: Actualización automática de canales y eventos deportivos
- **PWA**: Progressive Web App instalable
- **Multi-servidor**: Soporte para múltiples fuentes de video

## 📁 Estructura del Proyecto

```
streamx/
├── app.js                 # Servidor principal (puerto 3000)
├── backend/               # Servidor API secundario (puerto 3001)
│   └── server.js
├── frontend/              # Frontend React (en desarrollo)
│   └── src/
├── controllers/           # Controladores de la API
├── models/                # Modelos de MongoDB
├── routes/                # Rutas de la API
├── views/                 # Plantillas EJS
│   ├── tv.ejs            # Vista de TV en vivo
│   ├── index.ejs         # Página principal
│   └── admin/            # Panel de administración
├── public/                # Archivos estáticos
│   ├── channels.json     # Lista de canales de TV
│   └── manifest.json     # Manifiesto PWA
├── scraper/               # Scraper Python automatizado
│   └── scraper.py
├── scripts/               # Scripts de utilidad
├── services/              # Servicios externos (TMDB, Vimeus)
├── middleware/            # Middleware personalizado
├── utils/                 # Utilidades (logger, cache)
└── config/                # Configuración de base de datos
```

## 🛠️ Tecnologías

### Backend
- **Node.js** + Express
- **MongoDB** + Mongoose
- **EJS** (templating engine)
- **Firebase Realtime Database** (chat y datos en tiempo real)

### Frontend
- **React** (frontend moderno en desarrollo)
- **Vanilla JS + TailwindCSS** (vistas actuales)
- **HLS.js** (reproducción de video)

### Otros
- **Python** (scraper automático)
- **TMDB API** (metadata de películas/series)
- **GitHub Actions** (CI/CD y scraping programado)

## ⚙️ Instalación

### Requisitos previos
- Node.js >= 16.x
- MongoDB Atlas o local
- Python 3.8+ (para el scraper)
- Firebase credentials (para RTDB)

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone <repo-url>
cd streamx
```

2. **Instalar dependencias del backend principal**
```bash
npm install
```

3. **Instalar dependencias del backend API**
```bash
cd backend
npm install
cd ..
```

4. **Configurar variables de entorno**

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
- `MONGODB_URI`: URI de conexión a MongoDB
- `SESSION_SECRET`: Secreto para sesiones
- `TMDB_API_KEY`: API key de The Movie Database
- `ADMIN_SEED_USERNAME`: Usuario admin inicial
- `ADMIN_SEED_PASSWORD`: Contraseña admin inicial

5. **Instalar dependencias del frontend React (opcional)**
```bash
cd frontend
npm install
cd ..
```

6. **Instalar dependencias del scraper (opcional)**
```bash
cd scraper
pip install -r requirements.txt
cd ..
```

## 🚀 Ejecución

### Servidor Principal (puerto 3000)
```bash
npm start
```

### Backend API (puerto 3001)
```bash
cd backend
npm start
```

### Frontend React (puerto 3002)
```bash
cd frontend
npm start
```

### Scraper Automático
```bash
cd scraper
python scraper.py
```

El scraper también se ejecuta automáticamente cada 2 horas vía GitHub Actions.

## 📺 Uso de TV en Vivo

1. Navegar a `/tv` en el navegador
2. Seleccionar una categoría (Deportes, Noticias, Música, etc.)
3. Click en un canal para reproducir
4. El reproductor soporta:
   - Streams HLS (.m3u8)
   - Calidad adaptable
   - Pantalla completa
   - Reporte de problemas
   - Favoritos
   - Historial

## 🔐 Autenticación de Administradores

El sistema incluye autenticación para administradores con:
- Login seguro con bcrypt
- Sesiones persistentes en MongoDB
- Middleware de protección de rutas
- Seed inicial configurable en `.env`

## 📱 API para App Móvil

Endpoints principales (puerto 3001):
- `POST /api/auth/login` - Autenticación
- `GET /api/streams` - Listar streams
- `GET /api/channels` - Lista de canales
- `GET /api/movies` - Catálogo de películas
- `GET /api/sports` - Eventos deportivos

## 🧪 Scripts de Utilidad

- `scripts/seed.js` - Poblar base de datos inicial
- `scripts/bulkImport.js` - Importación masiva
- `scripts/fillMetadata.js` - Rellenar metadata desde TMDB
- `scripts/migrateToCloud.js` - Migración a cloud
- `scripts/fullAutoCrawl.js` - Crawling automático

## 🔒 Seguridad

- Helmet.js para headers de seguridad
- Rate limiting para prevenir abuso
- CSP (Content Security Policy) configurado
- Credenciales en variables de entorno (NO commitear `.env`)
- Sanitización de inputs

## 📊 Estado del Proyecto

| Componente | Estado | Progreso |
|------------|--------|----------|
| Backend Principal | ✅ Funcional | 90% |
| Backend API | ✅ Funcional | 85% |
| Frontend Web (EJS) | ✅ Funcional | 95% |
| Frontend React | 🚧 En desarrollo | 30% |
| TV en Vivo | ✅ Funcional | 90% |
| Scraper | ✅ Funcional | 85% |
| Documentación | ✅ Completa | 100% |
| Tests | ❌ Pendiente | 0% |

## 🐛 Problemas Conocidos

1. Código duplicado entre los dos backends (pendiente de consolidación)
2. Frontend React desconectado del backend principal
3. Canales hardcoded en el scraper (deberían ser configurables)
4. Falta de tests automatizados

## 📝 Próximas Mejoras

- [ ] Consolidar backends en un solo servidor
- [ ] Integrar frontend React completamente
- [ ] Añadir tests unitarios y de integración
- [ ] Implementar caché Redis
- [ ] Mejorar documentación de API
- [ ] Añadir sistema de notificaciones push
- [ ] Optimizar performance del scraper

## 📄 Licencia

MIT License

## 👥 Contacto

Para soporte o consultas, contactar al equipo de desarrollo.

---

**Nota**: Este proyecto es para fines educativos. Asegúrate de tener los derechos apropiados para transmitir cualquier contenido.
