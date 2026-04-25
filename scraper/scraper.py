"""
streamx tv — Scraper Automático Completo
Corre cada 2 horas via GitHub Actions
Actualiza:
  - Canales de TV (desde listas M3U)
  - Partidos del Mundial FIFA 2026

"""

import requests
import re
import json
import os
import time
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, db as rtdb

# ══════════════════════════════════════════════════════════════════════════
#  CONEXIÓN FIREBASE
# ══════════════════════════════════════════════════════════════════════════
def conectar_firebase():
    try:
        sa = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
        if not sa:
            raise Exception("No se encontró FIREBASE_SERVICE_ACCOUNT")
        cred = credentials.Certificate(json.loads(sa))
        firebase_admin.initialize_app(cred, {
            "databaseURL": "https://streamx-53ace-default-rtdb.firebaseio.com/"
        })
        return rtdb.reference("/")
    except Exception as e:
        print(f"❌ Error Firebase: {e}")
        return None

# ══════════════════════════════════════════════════════════════════════════
#  CANALES DE TV
# ══════════════════════════════════════════════════════════════════════════
CANALES_FIJOS = [
    
    # ── StreamTP (canales premium sin proxy) ────────────────────────────
    

    # ── Bolaloca via proxy Railway ────────────────────────────────────

    
      # ── Bolaloca via proxy Railway (sin alerta Chrome) ──────────────────
]

TDT_CANALES = [
    ]


FUENTES_M3U = [
    {"nombre": "IPTV Animation", "url": "https://iptv-org.github.io/iptv/categories/animation.m3u"},
    {"nombre": "IPTV Auto", "url": "https://iptv-org.github.io/iptv/categories/auto.m3u"},
    {"nombre": "IPTV Business", "url": "https://iptv-org.github.io/iptv/categories/business.m3u"},
    {"nombre": "IPTV Classic", "url": "https://iptv-org.github.io/iptv/categories/classic.m3u"},
    {"nombre": "IPTV Comedy", "url": "https://iptv-org.github.io/iptv/categories/comedy.m3u"},
    {"nombre": "IPTV Cooking", "url": "https://iptv-org.github.io/iptv/categories/cooking.m3u"},
    {"nombre": "IPTV Culture", "url": "https://iptv-org.github.io/iptv/categories/culture.m3u"},
    {"nombre": "IPTV Documentary", "url": "https://iptv-org.github.io/iptv/categories/documentary.m3u"},
    {"nombre": "IPTV Education", "url": "https://iptv-org.github.io/iptv/categories/education.m3u"},
    {"nombre": "IPTV Entertainment", "url": "https://iptv-org.github.io/iptv/categories/entertainment.m3u"},
    {"nombre": "IPTV Family", "url": "https://iptv-org.github.io/iptv/categories/family.m3u"},
    {"nombre": "IPTV General", "url": "https://iptv-org.github.io/iptv/categories/general.m3u"},
    {"nombre": "IPTV Interactive", "url": "https://iptv-org.github.io/iptv/categories/interactive.m3u"},
    {"nombre": "IPTV Kids", "url": "https://iptv-org.github.io/iptv/categories/kids.m3u"},
    {"nombre": "IPTV Legislative", "url": "https://iptv-org.github.io/iptv/categories/legislative.m3u"},
    {"nombre": "IPTV Lifestyle", "url": "https://iptv-org.github.io/iptv/categories/lifestyle.m3u"},
    {"nombre": "IPTV Movies", "url": "https://iptv-org.github.io/iptv/categories/movies.m3u"},
    {"nombre": "IPTV Music", "url": "https://iptv-org.github.io/iptv/categories/music.m3u"},
    {"nombre": "IPTV News", "url": "https://iptv-org.github.io/iptv/categories/news.m3u"},
    {"nombre": "IPTV Outdoor", "url": "https://iptv-org.github.io/iptv/categories/outdoor.m3u"},
    {"nombre": "IPTV Public", "url": "https://iptv-org.github.io/iptv/categories/public.m3u"},
    {"nombre": "IPTV Relax", "url": "https://iptv-org.github.io/iptv/categories/relax.m3u"},
    {"nombre": "IPTV Religious", "url": "https://iptv-org.github.io/iptv/categories/religious.m3u"},
    {"nombre": "IPTV Science", "url": "https://iptv-org.github.io/iptv/categories/science.m3u"},
    {"nombre": "IPTV Series", "url": "https://iptv-org.github.io/iptv/categories/series.m3u"},
    {"nombre": "IPTV Shop", "url": "https://iptv-org.github.io/iptv/categories/shop.m3u"},
    {"nombre": "IPTV Sports", "url": "https://iptv-org.github.io/iptv/categories/sports.m3u"},
    {"nombre": "IPTV Travel", "url": "https://iptv-org.github.io/iptv/categories/travel.m3u"},
    {"nombre": "IPTV Weather", "url": "https://iptv-org.github.io/iptv/categories/weather.m3u"},
    {"nombre": "IPTV XXX", "url": "https://iptv-org.github.io/iptv/categories/xxx.m3u"},
    {"nombre": "IPTV Undefined", "url": "https://iptv-org.github.io/iptv/categories/undefined.m3u"},
    {"nombre": "IPTV Argentina", "url": "https://iptv-org.github.io/iptv/countries/ar.m3u"},
    {"nombre": "IPTV México", "url": "https://iptv-org.github.io/iptv/countries/mx.m3u"},
    {"nombre": "IPTV Colombia", "url": "https://iptv-org.github.io/iptv/countries/co.m3u"},
    {"nombre": "IPTV Chile", "url": "https://iptv-org.github.io/iptv/countries/cl.m3u"},
    {"nombre": "IPTV Perú", "url": "https://iptv-org.github.io/iptv/countries/pe.m3u"},
    {"nombre": "IPTV Venezuela", "url": "https://iptv-org.github.io/iptv/countries/ve.m3u"},
    {"nombre": "IPTV Brasil", "url": "https://iptv-org.github.io/iptv/countries/br.m3u"},
    {"nombre": "IPTV Uruguay", "url": "https://iptv-org.github.io/iptv/countries/uy.m3u"},
    {"nombre": "IPTV España", "url": "https://iptv-org.github.io/iptv/countries/es.m3u"},
    {"nombre": "IPTV Spanish Language", "url": "https://iptv-org.github.io/iptv/languages/spa.m3u"},
    {"nombre": "TDTChannels TV (España/Global)", "url": "https://www.tdtchannels.com/lists/tv.m3u8"},
    {"nombre": "TDTChannels Radio", "url": "https://www.tdtchannels.com/lists/radio.m3u8"},
]

FUENTES_SIN_FILTRO = []


def buscar_canales_m3u(max_por_fuente=5000, max_total=10800):
    print("\n🔍 Escaneando fuentes M3U...")
    # Fix prevent TypeError: asegura que c sea dict y tenga "nombre"
    nombres_existentes = {
        c["nombre"].upper() for c in CANALES_FIJOS + TDT_CANALES 
        if isinstance(c, dict) and "nombre" in c
    }
    
    encontrados = []
    ids_vistos = set()
    headers = {"User-Agent": "Mozilla/5.0 (compatible; StreamX-Scraper/2.0)"}

    for fuente_info in FUENTES_M3U:
        if len(encontrados) >= max_total:
            break
            
        # Extraer URL y Nombre del diccionario de la fuente
        fuente_url = fuente_info["url"]
        fuente_nombre = fuente_info["nombre"]
        
        try:
            print(f"  📥 Procesando: {fuente_nombre}...")
            r = requests.get(fuente_url, timeout=25, headers=headers)
            if r.status_code != 200:
                print(f"      ❌ HTTP {r.status_code}")
                continue
                
            lineas = r.text.split("\n")
            agregados_fuente = 0
            
            for i in range(len(lineas) - 1):
                linea = lineas[i].strip()
                if not linea.startswith("#EXTINF"):
                    continue
                
                url_linea = lineas[i+1].strip()
                if not url_linea.startswith("http"):
                    continue

                # Parsear Metadatos
                logo_m = re.search(r'tvg-logo="([^"]*)"', linea)
                logo = logo_m.group(1) if logo_m else ""
                
                grp_m = re.search(r'group-title="([^"]*)"', linea)
                grp = grp_m.group(1).upper() if grp_m else ""
                
                nombre = linea.split(",")[-1].strip() if "," in linea else "Canal Desconocido"
                n = nombre.upper()
                key = n # Usamos el nombre como clave de duplicidad

                if not nombre or key in nombres_existentes or key in ids_vistos:
                    continue

                # Lógica de Categorización Mejorada
                if any(x in (grp + n) for x in ["SPORT", "DEPORT", "FUTBOL", "FOOTBALL", "LIGA", "COPA", "MOTOR", "ESPN", "FOX S"]):
                    cat = "DEPORTES"
                elif any(x in (grp + n) for x in ["MOVIE", "CINE", "PELICULA", "HBO", "STAR", "CINEMAX", "WARNER"]):
                    cat = "CINE"
                elif any(x in (grp + n) for x in ["NEWS", "NOTICIAS", "INFO", "24H", "PRENSA"]):
                    cat = "NOTICIAS"
                elif any(x in (grp + n) for x in ["MUSIC", "MUSICA", "HITS", "MTV", "VH1"]):
                    cat = "MUSICA"
                elif any(x in (grp + n) for x in ["DOCU", "WILD", "HISTORY", "NAT GEO", "DISCOVERY", "ANIMAL", "DISC."]):
                    cat = "DOCUMENTALES"
                elif any(x in (grp + n) for x in ["KIDS", "INFANTIL", "CHILDREN", "CARTOON", "DISNEY", "NICK", "BOOMERANG"]):
                    cat = "INFANTIL"
                elif any(x in (grp + n) for x in ["XXX", "ADULT", "PLAYBOY", "PENTHOUSE", "VENUS", "SEX"]):
                    cat = "ADULTOS"
                else:
                    cat = "INTERNACIONAL"

                encontrados.append({
                    "nombre": nombre, 
                    "url": url_linea,
                    "logo": logo or "https://cdn-icons-png.flaticon.com/512/716/716429.png",
                    "categoria": cat,
                    "origen": fuente_nombre
                })
                
                ids_vistos.add(key)
                agregados_fuente += 1
                
                if agregados_fuente >= max_por_fuente or len(encontrados) >= max_total:
                    break
                    
            print(f"      ✅ {agregados_fuente} canales nuevos")
            
        except Exception as e:
            print(f"      ❌ Error en fuente: {str(e)[:50]}")

    print(f"  📊 Total M3U extraído: {len(encontrados)}")
    return encontrados


def actualizar_canales(ref):
    print("\n📡 Iniciando actualización en Firebase...")
    ahora = datetime.utcnow().isoformat()
    data = {}

    # 1. Canales fijos (Estructura AR)
    for c in CANALES_FIJOS:
        data[c["id"]] = {
            "nombre": c["nombre"],
            "url": c["url"],
            "logo": c["logo"],
            "categoria": c.get("categoria", "AIRE").upper(),
            "fallbacks": c.get("fallbacks", []),
            "fijo": True,
            "actualizado": ahora
        }

    # 2. Canales TDT (Estructura Internacional/España)
    for c in TDT_CANALES:
        data[c["id"]] = {
            "nombre": c["nombre"],
            "url": c["url"],
            "logo": c["logo"],
            "categoria": c.get("categoria", "AIRE").upper(),
            "fallbacks": [],
            "fijo": False,
            "actualizado": ahora
        }

    # 3. Canales extra de fuentes M3U (Generación de IDs tdt_ext_...)
    extra = buscar_canales_m3u()
    for i, c in enumerate(extra):
        # Generamos un ID único para Firebase basado en el índice
        canal_id = f"ext_{i+1:05d}"
        data[canal_id] = {
            "nombre": c["nombre"],
            "url": c["url"],
            "logo": c["logo"],
            "categoria": c["categoria"],
            "fallbacks": [],
            "fijo": False,
            "actualizado": ahora
        }

    # 4. Preservar estado "activo" desde Firebase
    try:
        existentes = ref.child("canales").get()
        for cid, canal in data.items():
            if existentes and cid in existentes and "activo" in existentes[cid]:
                canal["activo"] = existentes[cid]["activo"]
            else:
                canal["activo"] = True 
    except Exception as e:
        print(f"  ⚠️ Error sincronizando estado activo: {e}")
        for canal in data.values(): canal["activo"] = True

    # 5. Guardado final
    ref.child("canales").set(data)
    print(f"  💾 Guardado exitoso: {len(data)} canales totales en Firebase.")

# ══════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════
def main():
    print("=" * 55)
    print("  🏆 streamx tv — Scraper Automático Completo")
    print(f"  🕐 {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 55)

    ref = conectar_firebase()
    if not ref:
        exit(1)

    actualizar_canales(ref)
    
    

    print("\n" + "=" * 55)
    print("  ✅ TODO ACTUALIZADO EN FIREBASE")
    print("=" * 55)

if __name__ == "__main__":
    main()
