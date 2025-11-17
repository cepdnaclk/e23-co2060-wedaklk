// ============================================
// FILE 7: next-auth.d.ts (Root directory)
// NextAuth Type Declarations
// ============================================

import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      mobilePhone: string;
      emailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    firstName: string;
    lastName: string;
    mobilePhone: string;
    emailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName: string;
    lastName: string;
    mobilePhone: string;
    emailVerified: boolean;
  }
}