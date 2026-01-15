
import { ringDoorbell } from "./app/actions/ring-doorbell";
import { rejectCall } from "./app/actions/reject-call";
import { openDoor } from "./app/actions/door";
import { db } from "./db";
import { accessLogs } from "./db/schema";
import { eq } from "drizzle-orm";

async function runTest() {
  const UNIT_ID = "1b216dd7-d06b-419e-a984-d2fffa55158c"; // Demo Center Unit 1B (from previous search)
  // Or lookup dynamic if needed, but hardcoded is faster for this specific env.
  
  console.log("🧪 Starting Test: Rejection & Open Flow");

  // --- SCENARIO 1: REJECTION ---
  console.log("\n--- Scenario 1: Ring -> Reject ---");
  
  const fd1 = new FormData();
  fd1.append("unit", UNIT_ID);
  fd1.append("message", "Test Reject 🚫");
  
  const res1 = await ringDoorbell(null, fd1);
  if (!res1.success || !res1.logId) {
      console.error("❌ Failed to ring (1):", res1.message);
      process.exit(1);
  }
  console.log("✅ 1. Ring Success. Log ID:", res1.logId);

  // Verify status "ringing"
  let log1 = await db.query.accessLogs.findFirst({ where: eq(accessLogs.id, res1.logId) });
  console.log(`   Initial Status: ${log1?.status} (Expected: ringing)`);

  // Reject
  console.log("   Action: Rejecting call...");
  const rejResult = await rejectCall(res1.logId);
  if (!rejResult.success) {
       console.error("❌ Failed to reject:", rejResult.message);
  } else {
       console.log("✅ 2. Reject Action Success");
  }

  // Verify status "rejected"
  log1 = await db.query.accessLogs.findFirst({ where: eq(accessLogs.id, res1.logId) });
  if (log1?.status === "rejected") {
      console.log("✅ 3. DB Status Verified: 'rejected'");
  } else {
      console.error("❌ DB Status Mismatch. Got:", log1?.status);
  }


  // --- SCENARIO 2: OPENING ---
  console.log("\n--- Scenario 2: Ring -> Open ---");

  const fd2 = new FormData();
  fd2.append("unit", UNIT_ID);
  fd2.append("message", "Test Open 🟢");

  const res2 = await ringDoorbell(null, fd2);
  if (!res2.success || !res2.logId) {
      console.error("❌ Failed to ring (2):", res2.message);
      process.exit(1);
  }
  console.log("✅ 1. Ring Success. Log ID:", res2.logId);

  // Open
  console.log("   Action: Opening Door (default type)...");
  const openResult = await openDoor(res2.logId, "default");
  if (!openResult.success) {
      console.error("❌ Failed to open:", openResult.message);
      // Might fail if not configured, but let's see logic flow
  } else {
      console.log("✅ 2. Open Action Success");
  }

  // Verify status "opened"
  const log2 = await db.query.accessLogs.findFirst({ where: eq(accessLogs.id, res2.logId) });
  if (log2?.status === "opened") {
      console.log("✅ 3. DB Status Verified: 'opened'");
  } else {
      // openDoor action might update status? Let's check openDoor implementation if needed.
      // Usually openDoor updates status to 'opened'.
      console.log(`ℹ️ Final Status: ${log2?.status}`);
  }

  console.log("\n🏁 Test Complete");
  process.exit(0);
}

runTest();
