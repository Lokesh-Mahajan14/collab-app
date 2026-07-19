import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { loginSchema } from "@/lib/validators/auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // Allows existing email/password users to sign in with Google using the same email.
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }

      if (token.email) {
        const existingUser = await db.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, name: true, image: true },
        });

        if (existingUser) {
          token.id = existingUser.id;
          token.role = existingUser.role;
          token.name = existingUser.name;
          token.picture = existingUser.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
      }

      return session;
    },
  },
  secret: env.NEXTAUTH_SECRET,
  debug: env.NODE_ENV === "development",
};
