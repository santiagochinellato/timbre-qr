
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
  console.log("Testing query...");
  try {
    const res = await db.query.buildings.findMany();
    console.log("Success! Found", res.length, "buildings");
    console.log(res);
  } catch (e) {
    console.error("FULL ERROR:", e);
  }
  process.exit(0);
}

main();
