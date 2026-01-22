import { users, buildings, units, accessLogs, userUnits } from "@/db/schema";

// Users
export type DbUser = typeof users.$inferSelect;
export type DbNewUser = typeof users.$inferInsert;

// Buildings & Units
export type DbBuilding = typeof buildings.$inferSelect;
export type DbUnit = typeof units.$inferSelect;

// Access Logs
export type DbAccessLog = typeof accessLogs.$inferSelect;
export type DbNewAccessLog = typeof accessLogs.$inferInsert;

// Relations / Joins
export type DbUserUnit = typeof userUnits.$inferSelect;
