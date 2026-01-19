# Documentación de Infraestructura (Docker + Redis)

## Resumen

Hemos implementado un entorno de desarrollo robusto y resiliente utilizando Docker y Redis. El objetivo principal fue asegurar la persistencia de datos (específicamente para Rate Limiting) y aislar los servicios críticos.

## 1. Orquestación con Docker (`docker-compose.yml`)

Configuramos un entorno multi-contenedor que orquesta tres servicios principales:

- **Redis (`redis`)**:
  - Base de datos en memoria para gestión de sesiones y rate limiting.
  - Configurado con persistencia (`appendonly yes`) y volumen local (`./.docker-data/redis`) para que los datos sobrevivan a reinicios del contenedor.
  - Incluye `healthcheck` para asegurar que otros servicios esperen a que Redis esté listo.

- **Servicio de Video (`video-service`)**:
  - Microservicio aislado para procesamiento de video.
  - Configurado con `restart: on-failure` para resiliencia automática.

- **Aplicación Next.js (`app`)**:
  - Ejecuta la aplicación principal.
  - Utiliza un `Dockerfile.dev` personalizado para instalar dependencias y correr en modo desarrollo.
  - Se conecta a Redis a través de la red interna de Docker (`REDIS_URL=redis://redis:6379`).

## 2. Cliente Redis (`lib/redis.ts`)

Implementamos un cliente de Redis utilizando `ioredis` con un patrón **Singleton**.

- **Propósito**: Evitar múltiples conexiones innecesarias durante el "hot-reloading" de Next.js en desarrollo.
- **Flexibilidad**: Detecta automáticamente si está corriendo dentro de Docker (usando `REDIS_URL`) o en local (`localhost`).

## 3. Utilidad de Rate Limiting (`lib/rate-limit.ts`)

Creamos una función `checkRateLimit` que utiliza operaciones atómicas en Redis.

- **Lógica**: Usa un script Lua para ejecutar `INCR` (incrementar) y `EXPIRE` (expirar) en una sola operación atómica.
- **Beneficio**: Garantiza precisión en entornos concurrentes y evita condiciones de carrera.

## Cómo Usar

Para iniciar todo el stack de infraestructura:

```bash
docker-compose up --build
```

La aplicación estará disponible en `http://localhost:3000`.

### Modo Híbrido (Recomendado para Desarrollo)

Si prefieres correr la App con `npm run dev` para tener feedback más rápido, pero quieres usar la infraestructura de Docker:

```bash
docker-compose up -d redis video-service
```

Esto levantará solo la base de datos y el servicio de video en segundo plano, dejando el puerto 3000 libre para tu entorno local.

## Archivos Creados

- `docker-compose.yml`
- `Dockerfile.dev`
- `lib/redis.ts`
- `lib/rate-limit.ts`

## ¿Qué hicimos?

Hemos profesionalizado la infraestructura "detrás de escena" de la aplicación. En lugar de tener todos los componentes corriendo sueltos, ahora cada parte vital (la Aplicación, el sistema de Video y la Base de Datos de velocidad) vive en su propio contenedor seguro y aislado (usando Docker). Además, implementamos un sistema de memoria inteligente (Redis) que recuerda la actividad de los usuarios.

## ¿Qué problemas evitamos con esto? (Beneficios clave)

### 1. Evitamos caídas masivas del sistema

- **Antes:** Si el sistema de video fallaba, podía arrastrar consigo a toda la aplicación web, dejando a los usuarios sin servicio.
- **Ahora:** Los servicios están **aislados**. Si el video falla, la web sigue funcionando perfectamente y el sistema de video intenta reiniciarse solo automáticamente.

### 2. Evitamos ataques de abuso y spam (Rate Limiting)

- **Antes:** Un usuario malintencionado o un bot podía intentar adivinar contraseñas o enviar miles de solicitudes por segundo, saturando el servidor y haciéndolo lento para los usuarios reales.
- **Ahora:** Tenemos un "portero" (Rate Limiting con Redis) que cuenta exactamente cuántas veces intenta entrar alguien. Si detecta un comportamiento abusivo, lo bloquea temporalmente de inmediato.

### 3. Evitamos pérdida de datos al reiniciar

- **Antes:** Si el servidor se reiniciaba por mantenimiento o error, se "olvidaba" quién estaba bloqueado o quién había excedido sus intentos.
- **Ahora:** La memoria es **persistente**. Si reiniciamos el servidor, el sistema recuerda exactamente qué usuarios deben seguir bloqueados, manteniendo la seguridad intacta.

### 4. Evitamos lentitud por conexiones "zombis"

- **Antes:** En momentos de alto tráfico o desarrollo, el sistema podía quedarse con conexiones abiertas innecesariamente, consumiendo memoria.
- **Ahora:** Usamos un patrón de conexión inteligente (Singleton) que gestiona los recursos de forma eficiente, haciendo la app más rápida y estable.

> **En resumen:** Hemos blindado la aplicación para que sea más difícil de atacar, más difícil de tumbar y mucho más rápida para recuperarse de cualquier fallo.

## ¿Qué garantiza exactamente esta implementación?

Si tu Product Owner o un inversor te pregunta "¿Por qué perdimos tiempo en Docker?", esta es la respuesta técnica:

### 1. Inmunidad al Reinicio (Persistencia)

- **Antes:** Si Railway o Vercel reiniciaban el servidor (algo común en serverless/cloud), el contador de "intentos fallidos" volvía a cero. Un atacante podía reiniciar su ataque cada vez.
- **Ahora:** Los datos viven en el volumen `./.docker-data/redis` (o en el disco de Railway). Reinicias la App 100 veces y el bloqueo del usuario malicioso sigue ahí.

### 2. Cero "Efecto Dominó" (Aislamiento)

- **Antes:** Si FFmpeg se colgaba procesando un video corrupto, se llevaba consigo toda la memoria RAM, matando el login y el dashboard.
- **Ahora:** Si `video-service` explota, Docker lo reinicia (`restart: on-failure`). Mientras tanto, la App Principal sigue sirviendo el login y la UI sin enterarse.

### 3. Consistencia Atómica (Race Conditions)

- **Al usar scripts Lua en Redis (el INCR + EXPIRE atómico):** garantizas que si 50 usuarios tocan el timbre en el mismo milisegundo, el contador sube exactamente 50. Con la solución anterior en memoria de Node.js, podías perder conteos en alta concurrencia.
