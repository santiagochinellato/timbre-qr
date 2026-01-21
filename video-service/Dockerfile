# Usamos la imagen oficial de Go2RTC (Súper ligera)
FROM alexxit/go2rtc:latest

# Copiamos la configuración
COPY go2rtc.yaml /config/go2rtc.yaml

# Railway asigna un puerto dinámico en la variable $PORT.
# Go2RTC no lee $PORT nativamente en el yaml, así que hacemos un truco al arrancar
# para reemplazar el puerto 8080 por el puerto real de Railway.
USER root
RUN apk add --no-cache gettext

# Script de arranque
CMD sed -i "s/:8080/:$PORT/g" /config/go2rtc.yaml && /bin/go2rtc -config /config/go2rtc.yaml
