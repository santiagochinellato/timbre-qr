import { auth } from "@/lib/auth";
import { db } from "@/db";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import Image from "next/image";
import ProfileForm from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Also get fresh user data including phone/username
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user!.id!),
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Mi Perfil
        </h1>
        <Image
          src="/icons/isologoVertical.png"
          alt="Logo"
          width={40}
          height={40}
          className="object-contain"
        />
      </div>

      {/* Helper for user role display */}
      <div className="flex items-center gap-2 mb-4">
        <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-zinc-400 border border-white/5 uppercase tracking-wider font-mono">
          {(session.user as any).role || "Resident"}
        </span>
      </div>

      {/* Editable Profile Form */}
      <ProfileForm user={user} />

      <form
        action={async () => {
          "use server";
          const { signOut } = await import("@/lib/auth");
          await signOut();
        }}
      >
        <button className="w-full py-4 text-rose-500 font-medium hover:bg-rose-500/10 rounded-xl transition-colors flex items-center justify-center gap-2 mt-8">
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </form>
    </div>
  );
}
