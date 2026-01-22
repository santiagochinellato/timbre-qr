# Documentación de Arquitectura - Timbre QR

## Resumen General

Timbre QR es una aplicación Next.js 16 construida con React 19, diseñada para gestionar el control de acceso a puertas mediante códigos QR y transmisiones de video en vivo. Interactúa con un broker MQTT para el control de hardware y un Servicio de Video separado (Go2RTC) para streaming WebRTC.

## Stack Principal

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript (Strict Mode)
- **Base de Datos**: PostgreSQL (vía Drizzle ORM)
- **Estilos**: Tailwind CSS v4
- **Gestión de Estado**: React Server Actions + Hooks

## Estructura del Proyecto

### `/app`

Contiene la estructura del Next.js App Router.

- `actions/`: Server Actions para lógica de negocio (ej: `ringDoorbell`, `checkStatus`). Todas las acciones usan validación Zod.
- `(routes)/`: Rutas de páginas (implicito).

### `/components`

- `features/`: Componentes ricos en lógica de negocio (ej: `DoorCard`, `LiveCameraModal`).
- `hooks/`: Hooks personalizados de React extraídos de las features (ej: `useDoorbell`).
- `ui/`: Átomos de UI reutilizables (Botones, Modales).

### `/lib`

- `types/`: Interfaces TypeScript compartidas inferidas del esquema Drizzle (`DbUser`, `DbAccessLog`).
- `validations/`: Esquemas Zod para validación de inputs.
- `utils/`: Funciones auxiliares (`stream-url.ts`).

### `/db`

- `schema.ts`: Definiciones de esquema Drizzle ORM.
- `index.ts`: Configuración de conexión a base de datos.

## Patrones de Diseño Clave

### 1. Server Actions y Validación

Todas las mutaciones (ej: tocar el timbre) se manejan vía Server Actions.

- **Validación de Inputs**: Se usa `zod` para validar todos los datos de entrada antes de procesar.
- **Manejo de Errores**: Las acciones retornan objetos estandarizados `{ success: boolean, message: string, data?: T }`.

### 2. Video en Vivo

- **JSMpeg (Legacy/WebSocket)**: Usado para `CameraFeed` en las tarjetas. Requiere URL `ws://`.
- **WebRTC (Go2RTC)**: Usado para `LiveCameraModal` y transmisiones de alta calidad. Requiere URL `http://` (proxied a la fuente específica).
- **Utilidad**: `lib/utils/stream-url.ts` maneja la normalización entre esquemas `ws` y `http`.

### 3. Estado en Tiempo Real

- El hook `useDoorbell` maneja el sondeo (polling) al servidor para actualizaciones de estado (ej: "llamando").
- (Futuro): Se recomienda implementación de WebSocket/SSE para menor latencia.

## Archivos Críticos

- `app/actions/ring-doorbell.ts`: Punto de entrada principal para visitantes.
- `components/features/door-card.tsx`: UI principal para residentes/monitoreo.
- `db/schema.ts`: Fuente de verdad para modelos de datos.
