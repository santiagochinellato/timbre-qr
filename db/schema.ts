import { pgTable, uuid, text, boolean, timestamp, primaryKey, pgEnum } from "drizzle-orm/pg-core";

// ENUMS
export const roleEnum = pgEnum('role', ['admin', 'user']); // System level
export const unitRoleEnum = pgEnum('unit_role', ['owner', 'resident', 'guest']); // Unit level

// 1. USERS (Auth.js Compatible)
export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(), // Stores BCRYPT hash
  image: text("image"),
  role: roleEnum('role').default('user'),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. BUILDINGS & UNITS
export const buildings = pgTable('buildings', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(), // "Edificio Mitre"
    slug: text('slug').unique().notNull(), // "mitre-1234"
    active: boolean('active').default(true),
});

export const units = pgTable('units', {
    id: uuid('id').defaultRandom().primaryKey(),
    buildingId: uuid('building_id').references(() => buildings.id, { onDelete: 'cascade' }),
    label: text('label').notNull(), // "4B"
});

// 3. MANY-TO-MANY RELATION (Users <-> Units)
export const userUnits = pgTable('user_units', {
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    unitId: uuid('unit_id').references(() => units.id, { onDelete: 'cascade' }),
    role: unitRoleEnum('role').default('owner'),
    active: boolean('active').default(true),
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.unitId] }),
}));

// 4. PWA PUSH SUBSCRIPTIONS
export const pushSubscriptions = pgTable('push_subscriptions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('keys_p256dh').notNull(),
    auth: text('keys_auth').notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp("created_at").defaultNow(),
});

// 5. ACCESS LOGS
export const accessLogs = pgTable('access_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    unitId: uuid('unit_id').references(() => units.id),
    visitorPhotoUrl: text('visitor_photo_url'),
    status: text('status').default('ringing'), // 'ringing', 'opened', 'missed'
    openedByUserId: text('opened_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
});
