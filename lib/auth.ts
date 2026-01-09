import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          // @ts-ignore
          const user = await db.query.users.findFirst({
              where: eq(users.email, email)
          });

          if (!user) return null;
          
          const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
          if (passwordsMatch) return user;
        }

        return null;
      },
    }),
  ],
  callbacks: {
      async jwt({ token, user }) {
          if (user) {
              token.id = user.id;
              // @ts-ignore
              token.role = user.role;
          }
          return token;
      },
      async session({ session, token }) {
          if (token && session.user) {
              session.user.id = token.id as string;
              // @ts-ignore
              session.user.role = token.role as "admin" | "user";
          }
          return session;
      }
  }
});
