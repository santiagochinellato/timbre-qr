"use server";

import { db } from "@/db";
import { units } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function getUnits() {
  try {
    const allUnits = await db.select({ label: units.label }).from(units).orderBy(asc(units.label));
    return allUnits.map((u) => u.label);
  } catch (error) {
    console.error("Failed to fetch units:", error);
    return [];
  }
}
