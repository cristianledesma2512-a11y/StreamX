# 📺 Configuración de TV en Vivo - IPTV

## 🔥 Nueva Base de Datos Firebase

La aplicación ahora utiliza la siguiente base de datos Firebase RTDB:

**URL:** `https://mundialenvivo-ar-default-rtdb.firebaseio.com/`

### 📁 Estructura de Datos

```
/canales
  └── xc_1094_1785504509086_267
      ├── activo: true
      ├── categoria: "ARGENTINA"
      ├── estado: "slow"
      ├── id: "xc_1094_1785504509086_267"
      ├── lastTestedAt: 1786020967644
      ├── latencia: 2612
      ├── logo: ""
      ├── nombre: "01 | AMERICA TV ARG"
      ├── online: true
      ├── serverId: "srv_1785504479310"
      ├── serverUrl: "http://megaviptv.space:8080"
      └── url: "http://megaviptv.space:8080/live/CarlosAlas/T7ZNnVyVJD/1094.m3u8"

/grp_cat_general
  └── DEPORTES
      ├── descripcion: "DEPORTES"
      ├── id: "grp_cat_general"
      ├── nombre: "DEPORTES"
      └── servidores_iptv: [...]

/servidores_iptv
  └── srv_1785464477934
      ├── active_connections: 0
      ├── allowed_roles: ["administrador", "usuariocomun"]
      ├── expiry_date: "2026-12-31"
      ├── id: "srv_1785464477934"
      └── ...
```

## ⚠️ Cambios Realizados

### 1. **Frontend (views/tv.ejs)**
- ✅ URL de Firebase actualizada a `mundialenvivo-ar-default-rtdb.firebaseio.com`
- ✅ Línea 495 modificada

### 2. **Scraper (scraper/scraper.py)**
- ✅ URL de Firebase actualizada en la función `conectar_firebase()`
- ✅ **SCRAPER PAUSADO** - Los canales ahora se gestionan desde el panel de control
- ✅ Las categorías son dinámicas según los grupos de servidores IPTV (`grp_cat_*`)

## 🛑 Scraper Pausado

El scraper automático ha sido **desactivado** porque:
- Los canales se administran manualmente desde un panel de control
- Las categorías son dinámicas y dependen de los servidores IPTV configurados
- Se evita sobrescribir la configuración manual del administrador

### Para reactivar el scraper (si fuera necesario):

Editar `scraper/scraper.py` y descomentar la línea:
```python
# actualizar_canales(ref)  # ← Quitar el comentario
```

## 🎯 Reproductor IPTV - Verificado ✅

El reproductor en `/views/tv.ejs` está completamente funcional:

### Características:
- ✅ Soporte HLS nativo con hls.js
- ✅ Calidad adaptable (Auto, 1080p, 720p, 480p)
- ✅ Fallback automático a múltiples fuentes
- ✅ Soporte multi-formato (HLS, YouTube, iframes)
- ✅ Controles completos (play, fullscreen, calidad, reporte)
- ✅ Favoritos e historial en localStorage
- ✅ Chat en tiempo real con Firebase
- ✅ Búsqueda y filtros por categoría dinámica
- ✅ Conexión a nueva base de datos Firebase

### Flujo de Funcionamiento:

1. **Carga de canales**: Lee desde Firebase RTDB (`/canales`)
2. **Filtrado**: Por categoría dinámica (ARGENTINA, DEPORTES, etc.)
3. **Reproducción**: 
   - Detecta tipo de stream (HLS, YouTube, iframe)
   - Configura calidad adaptable
   - Maneja fallbacks automáticos
4. **Interacción**: 
   - Chat en tiempo real por canal
   - Sistema de favoritos
   - Historial de visualización

## 📊 Estados de Canales

Los canales pueden tener los siguientes estados:
- `online: true` - Canal funcionando correctamente
- `online: false` - Canal offline
- `estado: "slow"` - Canal con latencia alta
- `estado: "fast"` - Canal rápido
- `activo: true/false` - Canal habilitado/deshabilitado

## 🔧 Configuración de Servidores IPTV

Los servidores IPTV se configuran en `/servidores_iptv`:

```json
{
  "id": "srv_1785464477934",
  "active_connections": 0,
  "allowed_roles": ["administrador", "usuariocomun"],
  "expiry_date": "2026-12-31",
  "grupos_categoria": ["grp_cat_general"]
}
```

Las categorías se obtienen dinámicamente de `/grp_cat_*` y se asocian a servidores específicos.

## 🚀 Próximos Pasos

1. ✅ Base de datos Firebase actualizada
2. ✅ Scraper pausado
3. ✅ Reproductor verificado
4. 🔄 Gestionar canales desde el panel de control
5. 🔄 Configurar categorías dinámicas por servidor
6. 🔄 Monitorear estado de canales en tiempo real

---

**Última actualización:** 2024
**Estado:** ✅ Completado
