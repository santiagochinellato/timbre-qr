import { pgTable, uuid, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

// 1. Edificios
export const buildings = pgTable('buildings', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(), // "Edificio Mitre"
    slug: text('slug').unique().notNull(), // "mitre-1234" (para la URL del QR)
    mqttTopic: text('mqtt_topic').notNull(), // "edificio/mitre/puerta"
    settings: jsonb('settings').default({ geoFenceRadius: 50 }), // Config dinámica
    active: boolean('active').default(true),
});

// 2. Unidades
export const units = pgTable('units', {
    id: uuid('id').defaultRandom().primaryKey(),
    buildingId: uuid('building_id').references(() => buildings.id, { onDelete: 'cascade' }),
    label: text('label').notNull(), // "4b"
});

// 3. Residentes (Los receptores de WhatsApp)
export const residents = pgTable('residents', {
    id: uuid('id').defaultRandom().primaryKey(),
    unitId: uuid('unit_id').references(() => units.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phone: text('phone').notNull(), // E.164 Format (+54911...)
    role: text('role').default('resident'), // 'owner', 'tenant', 'admin'
    isActive: boolean('is_active').default(true),
});

// 4. Logs de Visitas
export const accessLogs = pgTable('access_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    unitId: uuid('unit_id').references(() => units.id),
    visitorPhotoUrl: text('visitor_photo_url'), // S3/R2 URL
    status: text('status').default('pending'), // 'pending', 'opened', 'missed', 'rejected'
    openedByResidentId: uuid('opened_by_resident_id').references(() => residents.id),
    createdAt: timestamp('created_at').defaultNow(),
});
