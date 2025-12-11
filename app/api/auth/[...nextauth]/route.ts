// ============================================
// FILE 6: app/api/auth/[...nextauth]/route.ts
// NextAuth Configuration (TypeScript)
// ============================================

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import UnverifiedUser from '@/models/UnverifiedUser';
import VerifiedUser from '@/models/VerifiedUser';
import { verifyPassword } from '@/lib/auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        emailOrPhone: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.emailOrPhone || !credentials?.password) {
          throw new Error('Please enter email/phone and password');
        }

        await connectDB();

        // Check both collections for user
        let user = await VerifiedUser.findOne({
          $or: [
            { email: credentials.emailOrPhone },
            { mobilePhone: credentials.emailOrPhone }
          ]
        });
        let isVerified = true;

        // If not found in verified, check unverified
        if (!user) {
          user = await UnverifiedUser.findOne({
            $or: [
              { email: credentials.emailOrPhone },
              { mobilePhone: credentials.emailOrPhone }
            ]
          });
          isVerified = false;
        }

        if (!user) {
          throw new Error('No user found with this email or phone');
        }

        const isValid = await verifyPassword(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid password');
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          nicNumber: user.nicNumber,
          mobilePhone: user.mobilePhone,
          emailVerified: user.emailVerified,
          isVerified
        };
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.nicNumber = (user as any).nicNumber;
        token.mobilePhone = (user as any).mobilePhone;
        token.emailVerified = (user as any).emailVerified;
        token.isVerified = (user as any).isVerified;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).firstName = token.firstName;
        (session.user as any).lastName = token.lastName;
        (session.user as any).nicNumber = token.nicNumber;
        (session.user as any).mobilePhone = token.mobilePhone;
        (session.user as any).emailVerified = token.emailVerified;
        (session.user as any).isVerified = token.isVerified;
      }
      return session;
    }
  },

  pages: {
    signIn: '/auth',
    error: '/auth',
  },

  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, //1 hour validity
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
