# Usamos la imagen oficial de Go2RTC (Súper ligera, ~20MB)
FROM alexxit/go2rtc:latest

# Copiamos la configuración
COPY go2rtc.yaml /config/go2rtc.yaml

# Go2RTC soporta variables de entorno nativamente en el YAML (${PORT})
# así que no necesitamos scripts de arranque complejos.

