"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "No autorizado" };

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const photoUrl = formData.get("photoUrl") as string; // From client-side upload or separate field

  // Optional: Handle file upload on server if passed as file? 
  // For now assuming the client handles upload and sends URL, OR user passes file here.
  // Let's support direct file upload here to be robust.
  const imageFile = formData.get("image") as File;
  
  let finalPhotoUrl = photoUrl;

  if (imageFile && imageFile.size > 0) {
      try {
          const { uploadFile } = await import("@/lib/storage");
          finalPhotoUrl = await uploadFile(imageFile);
      } catch (error) {
          console.error("Upload error", error);
          return { success: false, message: "Error subiendo imagen" };
      }
  }

  try {
    await db.update(users)
        .set({
            name,
            phone,
            ...(finalPhotoUrl ? { image: finalPhotoUrl } : {}),
        })
        .where(eq(users.id, session.user.id));

    revalidatePath("/dashboard/profile");
    return { success: true, message: "Perfil actualizado" };
  } catch (error) {
    console.error("Profile update error:", error);
    return { success: false, message: "Error al actualizar perfil" };
  }
}
