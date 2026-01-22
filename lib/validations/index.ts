import { z } from "zod";

// Schema specifically for the 'ringDoorbell' action payload
// Note: We often validate the parsed data, not the raw FormData directly, 
// but this schema defines what we expect to extract.
export const RingDoorbellSchema = z.object({
  unitId: z.string().min(1, "Unit ID is required"),
  message: z.string().optional(),
  // We don't validate File strictly here because it comes from FormData, 
  // but we can check if we handled it in the action.
});

export type RingDoorbellInput = z.infer<typeof RingDoorbellSchema>;
