"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function toggleEmailDigest(currentState: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Unauthorized" };

  try {
    await db
      .update(users)
      .set({ emailDigest: !currentState })
      .where(eq(users.id, session.user.id));
    
    revalidatePath("/dashboard/profile/notifications");
    return { success: true, message: "Preferencia actualizada" };
  } catch (error) {
    return { success: false, message: "Error al actualizar" };
  }
}

export async function changePassword(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "No autorizado" };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!currentPassword || !newPassword) {
      return { success: false, message: "Faltan campos" };
  }

  // 1. Verify current password
  const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id)
  });

  if (!user) return { success: false, message: "Usuario no encontrado" };

  const passwordsMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordsMatch) {
      return { success: false, message: "La contraseña actual es incorrecta" };
  }

  // 2. Hash new password
  const newHash = await bcrypt.hash(newPassword, 10);

  // 3. Update db
  await db.update(users)
          .set({ passwordHash: newHash })
          .where(eq(users.id, session.user.id));

  return { success: true, message: "Contraseña actualizada correctamente" };
}

export async function getEmailDigestStatus() {
    const session = await auth();
    if (!session?.user?.id) return false;

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { emailDigest: true }
    });

    return user?.emailDigest ?? false;
}
