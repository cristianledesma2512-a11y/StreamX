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
    
    
    #── DISNEY 
    {"id":"stp45","nombre":"Disney","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp46","nombre":"Disney 1","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney1","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp47","nombre":"Disney 2","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney2","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp48","nombre":"Disney 3","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney3","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp49","nombre":"Disney 4","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney4","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp50","nombre":"Disney 5","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney5","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp51","nombre":"Disney 6","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney6","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp52","nombre":"Disney 7","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney7","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp53","nombre":"Disney 8","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney8","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp54","nombre":"Disney 9","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney9","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp55","nombre":"Disney 10","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney10","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp56","nombre":"Disney 11","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney11","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp57","nombre":"Disney 12","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney12","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp58","nombre":"Disney 13","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney13","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp59","nombre":"Disney 14","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney14","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},
    {"id":"stp60","nombre":"Disney 15","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=disney15","logo":"https://images.seeklogo.com/logo-png/4/1/disney-logo-png_seeklogo-41972.png","fallbacks":[]},

    # ── FANATIZ 
    {"id":"stp61","nombre":"Fanatiz","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp62","nombre":"Fanatiz 1","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz1","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp63","nombre":"Fanatiz 2","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz2","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp64","nombre":"Fanatiz 3","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz3","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp65","nombre":"Fanatiz 4","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz4","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp66","nombre":"Fanatiz 5","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz5","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp67","nombre":"Fanatiz 6","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz6","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp68","nombre":"Fanatiz 7","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz7","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp69","nombre":"Fanatiz 8","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz8","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp70","nombre":"Fanatiz 9","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz9","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp71","nombre":"Fanatiz 10","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz10","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp72","nombre":"Fanatiz 11","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz11","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp73","nombre":"Fanatiz 12","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz12","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp74","nombre":"Fanatiz 13","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz13","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp75","nombre":"Fanatiz 14","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz14","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp76","nombre":"Fanatiz 15","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fanatiz15","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},

    #  ESPN  
    {"id":"stp02","nombre":"ESPN","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp77","nombre":"ESPN 1","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn1","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp03","nombre":"ESPN 2","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn2","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp04","nombre":"ESPN 3","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn3","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp05","nombre":"ESPN 4","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn4","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp06","nombre":"ESPN 5","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn5","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp07","nombre":"ESPN 6","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn6","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp08","nombre":"ESPN 7","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn7","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp78","nombre":"ESPN 8","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn8","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp79","nombre":"ESPN 9","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn9","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp80","nombre":"ESPN 10","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn10","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp81","nombre":"ESPN 11","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn11","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp82","nombre":"ESPN 12","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn12","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp83","nombre":"ESPN 13","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn13","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp84","nombre":"ESPN 14","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn14","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp85","nombre":"ESPN 15","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espn15","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},

    #  DSPORTS 
    {"id":"stp13","nombre":"DSports","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp86","nombre":"DSports 1","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports1","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp14","nombre":"DSports 2","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports2","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp87","nombre":"DSports 3","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports3","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp88","nombre":"DSports 4","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports4","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp89","nombre":"DSports 5","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports5","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp90","nombre":"DSports 6","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports6","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp91","nombre":"DSports 7","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports7","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp92","nombre":"DSports 8","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports8","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp93","nombre":"DSports 9","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports9","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp94","nombre":"DSports 10","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports10","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp95","nombre":"DSports 11","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports11","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp96","nombre":"DSports 12","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports12","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp97","nombre":"DSports 13","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports13","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp98","nombre":"DSports 14","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports14","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},
    {"id":"stp99","nombre":"DSports 15","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=dsports15","logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png","fallbacks":[]},

    #  TUDN USA 
    {"id":"stp31","nombre":"TUDN USA","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp100","nombre":"TUDN USA 1","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa1","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp101","nombre":"TUDN USA 2","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa2","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp102","nombre":"TUDN USA 3","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa3","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp103","nombre":"TUDN USA 4","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa4","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp104","nombre":"TUDN USA 5","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa5","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp105","nombre":"TUDN USA 6","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa6","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp106","nombre":"TUDN USA 7","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa7","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp107","nombre":"TUDN USA 8","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa8","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp108","nombre":"TUDN USA 9","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa9","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp109","nombre":"TUDN USA 10","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa10","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp110","nombre":"TUDN USA 11","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa11","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp111","nombre":"TUDN USA 12","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa12","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp112","nombre":"TUDN USA 13","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa13","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp113","nombre":"TUDN USA 14","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa14","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp114","nombre":"TUDN USA 15","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tudn_usa15","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},

    #  MAX 
    {"id":"stp115","nombre":"Max","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp18","nombre":"Max 1","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max1","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp116","nombre":"Max 2","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max2","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp117","nombre":"Max 3","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max3","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp118","nombre":"Max 4","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max4","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp119","nombre":"Max 5","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max5","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp120","nombre":"Max 6","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max6","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp121","nombre":"Max 7","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max7","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp122","nombre":"Max 8","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max8","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp123","nombre":"Max 9","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max9","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp124","nombre":"Max 10","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max10","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp125","nombre":"Max 11","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max11","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp126","nombre":"Max 12","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max12","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp127","nombre":"Max 13","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max13","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp128","nombre":"Max 14","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max14","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},
    {"id":"stp129","nombre":"Max 15","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=max15","logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png","fallbacks":[]},

    #  OTROS CANALES INDIVIDUALES 
    {"id":"stp01","nombre":"ESPN Premium","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=espnpremium","logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png","fallbacks":[]},
    {"id":"stp09","nombre":"TyC Sports","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tycsports","logo":"https://images.seeklogo.com/logo-png/34/1/tyc-sports-logo-png_seeklogo-340604.png","fallbacks":[]},
    {"id":"stp10","nombre":"Fox Sports 1","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fox1ar","logo":"https://images.seeklogo.com/logo-png/31/1/fox-sports-logo-png_seeklogo-315883.png","fallbacks":[]},
    {"id":"stp11","nombre":"Fox Sports 2","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fox2ar","logo":"https://images.seeklogo.com/logo-png/31/1/fox-sports-logo-png_seeklogo-315883.png","fallbacks":[]},
    {"id":"stp12","nombre":"Fox Sports 3","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=fox3ar","logo":"https://images.seeklogo.com/logo-png/31/1/fox-sports-logo-png_seeklogo-315883.png","fallbacks":[]},
    {"id":"stp17","nombre":"TNT Sports","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tntsports","logo":"https://images.seeklogo.com/logo-png/51/1/tnt-sports-logo-png_seeklogo-519540.png","fallbacks":[]},
    {"id":"stp43","nombre":"Telefe","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=telefe","logo":"https://images.seeklogo.com/logo-png/45/1/telefe-tv-logo-png_seeklogo-451860.png","fallbacks":[]},
    {"id":"stp44","nombre":"TV Pública","categoria":"NOTICIAS","url":"https://streamtpnew.com/global1.php?stream=tv_publica","logo":"https://images.seeklogo.com/logo-png/18/1/tv-publica-logo-png_seeklogo-180741.png","fallbacks":[]},


    # ── Bolaloca via proxy Railway ────────────────────────────────────

    {"id":"bol01",
        "nombre":"TYC SPORT",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/77",
        "logo":"https://images.seeklogo.com/logo-png/34/1/tyc-sports-logo-png_seeklogo-340604.png",
        "fallbacks":[]},
    {"id":"bol02",
        "nombre":"ESPN PREMIUM",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/76",
        "logo":"https://images.seeklogo.com/logo-png/4/1/espn-logo-png_seeklogo-49194.png",
        "fallbacks":[]},
    {"id":"bol03",
        "nombre":"TNT SPORT",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/75",
        "logo":"https://images.seeklogo.com/logo-png/51/1/tnt-sports-logo-png_seeklogo-519540.png",
        "fallbacks":[]},
    {"id":"bol04",
        "nombre":"DSPORT",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/94",
        "logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png",
        "fallbacks":[]},
    {"id":"bol05",
        "nombre":"DSPORT2",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/95",
        "logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png",
        "fallbacks":[]},
    {"id":"bol06",
        "nombre":"DSPORT+",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/96",
        "logo":"https://images.seeklogo.com/logo-png/62/1/dsports-logo-png_seeklogo-626310.png",
        "fallbacks":[]},
    {"id":"bol07",
        "nombre":"+FOOT",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/12",
        "logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks":[]},
    {"id":"bol08",
        "nombre":"+SPORT",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/13",
        "logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks":[]},
    {"id":"bol09",
        "nombre":"+SPORT360",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/14",
        "logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks":[]},
    {"id":"bol10",
        "nombre":"EUROSPORT1",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/15",
        "logo":"https://images.seeklogo.com/logo-png/27/1/eurosport-logo-png_seeklogo-270286.png",
        "fallbacks":[]},
    {"id":"bol11",
        "nombre":"EUROSPORT",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/16",
        "logo":"https://images.seeklogo.com/logo-png/27/1/eurosport-logo-png_seeklogo-270286.png",
        "fallbacks":[]},
    {"id":"bol12",
        "nombre":"RMC SPORT1",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/17",
        "logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks":[]},
    {"id":"bol13",
        "nombre":"CM",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/18",
        "logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks":[]},
    {"id":"bol14",
        "nombre":"TUDN",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/68",
        "logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks":[]},
    {"id":"bol15",
        "nombre":"FOX DEPORTES",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/70",
        "logo":"https://images.seeklogo.com/logo-png/31/1/fox-sports-logo-png_seeklogo-315883.png",
        "fallbacks":[]},
    {"id":"bol16",
        "nombre":"LAS B",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/74",
        "logo":"https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks":[]},
    {"id":"bol17",
        "nombre":"FOXSPORT",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/78",
        "logo":"https://images.seeklogo.com/logo-png/31/1/fox-sports-logo-png_seeklogo-315883.png",
        "fallbacks":[]},
    {"id":"bol18",
        "nombre":"FOXSPORT2",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/79",
        "logo":"https://images.seeklogo.com/logo-png/31/1/fox-sports-logo-png_seeklogo-315883.png",
        "fallbacks":[]},
    {"id":"bol19",
        "nombre":"FOXSPORT3",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/80",
        "logo":"https://images.seeklogo.com/logo-png/31/1/fox-sports-logo-png_seeklogo-315883.png",
        "fallbacks":[]},
    {"id":"bol20",
        "nombre":"WINSPORT",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/81",
        "logo":"https://images.seeklogo.com/logo-png/64/1/win-sports-logo-png_seeklogo-644046.png",
        "fallbacks":[]},
    {"id":"bol21",
        "nombre":"TNTSPORT PREMIUM",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/83",
        "logo":"https://images.seeklogo.com/logo-png/37/1/tnt-sports-logo-png_seeklogo-373020.png",
        "fallbacks":[]},
    {"id":"bol22",
        "nombre":"ESPN",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/87",
        "logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png",
        "fallbacks":[]},
    {"id":"bol23",
        "nombre":"ESPN2",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/88",
        "logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png",
        "fallbacks":[]},
    {"id":"bol24",
        "nombre":"ESPN3",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/89",
        "logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png",
        "fallbacks":[]},
    {"id":"bol25",
        "nombre":"ESPN4",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/90",
        "logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png",
        "fallbacks":[]},
    {"id":"bol26",
        "nombre":"ESPN5",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/91",
        "logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png",
        "fallbacks":[]},
    {"id":"bol27",
        "nombre":"ESPN6",
        "categoria":"INTERNACIONAL",
        "url":"https://bolaloca.my/player/1/92",
        "logo":"https://images.seeklogo.com/logo-png/28/1/espn-logo-png_seeklogo-283139.png",
        "fallbacks":[]},

      # canales capoplay──────────────────

      {
        "id": "cap01",
        "nombre": "canal1",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal1.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap02",
        "nombre": "canal2",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal2.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap03",
        "nombre": "canal3",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal3.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap04",
        "nombre": "canal4",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal4.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap05",
        "nombre": "canal5",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal5.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap06",
        "nombre": "canal6",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal6.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap07",
        "nombre": "canal7",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal7.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap08",
        "nombre": "canal8",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal8.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap09",
        "nombre": "canal9",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal9.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap10",
        "nombre": "canal10",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal10.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap11",
        "nombre": "canal11",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal11.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap12",
        "nombre": "canal12",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal12.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap13",
        "nombre": "canal13",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal13.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap14",
        "nombre": "canal14",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal14.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap15",
        "nombre": "canal15",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal15.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap16",
        "nombre": "canal16",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal16.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap17",
        "nombre": "canal17",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal17.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap18",
        "nombre": "canal18",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal18.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap19",
        "nombre": "canal19",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal19.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap20",
        "nombre": "canal20",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal20.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap21",
        "nombre": "canal21",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal21.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap22",
        "nombre": "canal22",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal22.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap23",
        "nombre": "canal23",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal23.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap24",
        "nombre": "canal24",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal24.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap25",
        "nombre": "canal25",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal25.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap26",
        "nombre": "canal26",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal26.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap27",
        "nombre": "canal27",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal27.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap28",
        "nombre": "canal28",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal28.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap29",
        "nombre": "canal29",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal29.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap30",
        "nombre": "canal30",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal30.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap31",
        "nombre": "canal31",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal31.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap32",
        "nombre": "canal32",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal32.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap33",
        "nombre": "canal33",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal33.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap34",
        "nombre": "canal34",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal34.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap35",
        "nombre": "canal35",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal35.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap36",
        "nombre": "canal36",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal36.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap37",
        "nombre": "canal37",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal37.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap38",
        "nombre": "canal38",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal38.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap39",
        "nombre": "canal39",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal39.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap40",
        "nombre": "canal40",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal40.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap41",
        "nombre": "canal41",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal41.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap42",
        "nombre": "canal42",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal42.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap43",
        "nombre": "canal43",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal43.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap44",
        "nombre": "canal44",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal44.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap45",
        "nombre": "canal45",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal45.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap46",
        "nombre": "canal46",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal46.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap47",
        "nombre": "canal47",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal47.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap48",
        "nombre": "canal48",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal48.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap49",
        "nombre": "canal49",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal49.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      },
      {
        "id": "cap50",
        "nombre": "canal50",
        "categoria": "MUSICA",
        "url": "https://www.capoplay.net/canal50.php",
        "logo": "https://cdn-icons-png.flaticon.com/512/53/53283.png",
        "fallbacks": []
      }
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
