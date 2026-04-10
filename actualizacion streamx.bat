@echo off
cd /d C:\streamxfinal
echo [TECNOCOM] Iniciando mantenimiento semanal...

:: 1. Importar nuevas pelis y series de Vimeus (actualización semanal)
node scripts/fullAutoCrawl.js


echo [TECNOCOM] Proceso finalizado con exito.
exit