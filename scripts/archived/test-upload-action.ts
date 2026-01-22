import "dotenv/config";
import { ringDoorbell } from "../../app/actions/ring-doorbell";
import { db } from "../../db";
import { buildings } from "../../db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function testAction() {
  console.log("🧪 Testing ringDoorbell action...");

  // 1. Get Cabañas Unit ID
  const cabanas = await db.query.buildings.findFirst({
      where: eq(buildings.slug, "demo-center"),
      with: { units: true }
  });

  if (!cabanas || cabanas.units.length === 0) {
      console.error("❌ Cabañas not found.");
      return;
  }
  const unitId = cabanas.units[0].id; // Use first unit
  console.log(`🎯 Using Unit: ${unitId} (${cabanas.units[0].label})`);

  // 2. Create Mock File
  // Navigate to project root -> public -> some image or create a dummy buffer
  const buffer = Buffer.from("fake image content", "utf-8");
  const file = new File([buffer], "test-photo.jpg", { type: "image/jpeg" });
  
  // 3. Create FormData
  const formData = new FormData();
  formData.append("unit", unitId);
  formData.append("message", "Test from Script");
  formData.append("image", file);

  console.log("🚀 Invoking ringDoorbell...");
  
  // Call action
  const result = await ringDoorbell(null, formData);
  
  console.log("🏁 Result:", result);
}

testAction().catch(console.error).finally(() => process.exit(0));
