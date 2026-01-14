import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Prevent multiple connections in development with hot reload
// and ensure we don't exhaust serverless connections
const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined;
};

// Initialize Postgres Client with Serverless optimizations
const conn = globalForDb.conn ?? postgres(process.env.DATABASE_URL!, {
    max: 1, // Serverless: Use strictly 1 connection per lambda instance to allow external pooling (PgBouncer)
    idle_timeout: 20, // Close idle connections quickly
    connect_timeout: 10, // Fail fast if DB is down
});

if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
