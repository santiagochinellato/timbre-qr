"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { buildings, units, users, userUnits } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Helper to verify admin
async function checkAdmin() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") throw new Error("Unauthorized");
  return session;
}

export async function createBuilding(formData: FormData) {
  try {
    await checkAdmin();
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const mqttTopic = formData.get("mqttTopic") as string;

    await db.insert(buildings).values({
      name,
      slug,
      mqttTopic: mqttTopic || null,
    });
    revalidatePath("/dashboard/profile");
    return { success: true, message: "Edificio creado" };
  } catch (error) {
    return { success: false, message: "Error creando edificio" };
  }
}

export async function createUnit(formData: FormData) {
  try {
    await checkAdmin();
    const buildingId = formData.get("buildingId") as string;
    const label = formData.get("label") as string;
    const mqttTopic = formData.get("mqttTopic") as string;

    await db.insert(units).values({
      buildingId,
      label,
      mqttTopic: mqttTopic || null,
    });
    revalidatePath("/dashboard/profile");
    return { success: true, message: "Unidad creada" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function createGuestUser(formData: FormData) {
    try {
        await checkAdmin();
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;
        const unitId = formData.get("unitId") as string;
        const expiryMinutes = parseInt(formData.get("expiryMinutes") as string) || 0;

        // 1. Create or Find User
        // Check if username exists
        let user = await db.query.users.findFirst({
            where: eq(users.username, username)
        });

        if (!user) {
             const hashedPassword = await bcrypt.hash(password, 10);
             // Create unique fake email
             const fakeEmail = `${username}@guest.local`;
             
             [user] = await db.insert(users).values({
                 name: `Guest ${username}`,
                 username,
                 email: fakeEmail,
                 passwordHash: hashedPassword,
                 role: "user"
             }).returning();
        } else {
            // Update password if exists? Or separate action?
            // For now, let's update password and name
             const hashedPassword = await bcrypt.hash(password, 10);
             await db.update(users).set({
                 passwordHash: hashedPassword,
             }).where(eq(users.id, user.id));
        }

        // 2. Assign to Unit with Expiry
        // Calculate expiry date
        const expiresAt = expiryMinutes > 0 
            ? new Date(Date.now() + expiryMinutes * 60 * 1000) 
            : null;

        // Check if already assigned
        const existingAssignment = await db.query.userUnits.findFirst({
             where: and(
                 eq(userUnits.userId, user.id),
                 eq(userUnits.unitId, unitId)
             )
        });

        if (existingAssignment) {
            await db.update(userUnits).set({
                role: "guest",
                active: true,
                expiresAt
            }).where(and(
                 eq(userUnits.userId, user.id),
                 eq(userUnits.unitId, unitId)
             ));
        } else {
            await db.insert(userUnits).values({
                userId: user.id,
                unitId: unitId,
                role: "guest",
                active: true,
                expiresAt
            });
        }

        revalidatePath("/dashboard/profile");
        return { success: true, message: "Usuario invitado configurado" };

    } catch (error: any) {
        console.error(error);
        return { success: false, message: "Error creando invitado" };
    }
}

// Update Actions

export async function updateBuilding(formData: FormData) {
  try {
    await checkAdmin();
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const mqttTopic = formData.get("mqttTopic") as string;

    await db.update(buildings)
      .set({
        name,
        slug,
        mqttTopic: mqttTopic || null,
      })
      .where(eq(buildings.id, id));

    revalidatePath("/dashboard/settings");
    return { success: true, message: "Edificio actualizado" };
  } catch (error) {
    console.error("Update building error:", error);
    return { success: false, message: "Error al actualizar edificio" };
  }
}

export async function updateUnit(formData: FormData) {
  try {
    await checkAdmin();
    const id = formData.get("id") as string;
    const label = formData.get("label") as string;
    const buildingId = formData.get("buildingId") as string;
    const mqttTopic = formData.get("mqttTopic") as string;
  
    await db.update(units)
      .set({
        label,
        buildingId,
        mqttTopic: mqttTopic || null,
      })
      .where(eq(units.id, id));
  
    revalidatePath("/dashboard/settings");
    return { success: true, message: "Unidad actualizada" };
  } catch (error) {
    console.error("Update unit error:", error);
    return { success: false, message: "Error al actualizar unidad" };
  }
}
  
export async function updateUser(formData: FormData) {
  try {
    await checkAdmin();
    const id = formData.get("id") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as "admin" | "user";

    const updateData: any = { username, role };
        
    if (password && password.length > 0) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    await db.update(users)
        .set(updateData)
        .where(eq(users.id, id));
        
    revalidatePath("/dashboard/settings");
    return { success: true, message: "Usuario actualizado" };
  } catch (error) {
    console.error("Update user error:", error);
    return { success: false, message: "Error al actualizar usuario" };
  }
}
