"use server";

import { db } from "@/db";
import { units } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getUnits(propertyId: string) {
  try {
    const propertyUnits = await db
      .select({ 
        id: units.id, 
        name: units.label, 
        description: units.label // Fallback description
      })
      .from(units)
      .where(eq(units.buildingId, propertyId)) // Ensure propertyId is correct type (UUID vs String handled by Drizzle usually, but schema has uuid)
      .orderBy(asc(units.label));
    
    return propertyUnits;
  } catch (error) {
    console.error("Failed to fetch units:", error);
    return [];
  }
}
