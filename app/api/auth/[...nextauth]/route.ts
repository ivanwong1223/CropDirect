import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import prisma from '@/lib/prisma'
import type { JWT } from 'next-auth/jwt'
import type { Account, Session } from 'next-auth'
import type { GoogleProfile } from 'next-auth/providers/google'

// Augmented token fields we store in JWT
type AppToken = JWT & {
  userId: string | null
  role: string | null
  name: string | null
  requiresOnboarding: boolean
  email: string | null
  isActive: boolean | null
  createdAt: string | null
  updatedAt: string | null
}

/**
 * NextAuth route handler for App Router (Next.js 13+).
 * Exposes GET and POST handlers at /api/auth/[...nextauth].
 *
 * - Uses JWT session strategy (no database sessions required).
 * - Google OAuth provider is configured via environment variables.
 * - jwt callback: enriches the token with app-specific fields and determines if onboarding is required.
 * - session callback: exposes custom fields on session.user for client-side usage (e.g., role, requiresOnboarding).
 */
const handler = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    /**
     * JWT callback runs whenever a JWT is created/updated.
     *
     * - On Google sign-in, we check if the user (by email) exists in our DB.
     *   - If user exists: attach id, role, and name; no onboarding required.
     *   - If not: mark requiresOnboarding = true so the UI can prompt role selection and registration.
     */
    async jwt({ token, account, profile }: { token: JWT; account?: Account | null; profile?: GoogleProfile | null }) {
      try {
        if (account?.provider === 'google') {
          const email = token.email ?? profile?.email ?? null
          if (email) {
            const user = await prisma.user.findUnique({ where: { email } })
            const t = token as AppToken
            if (user) {
              t.userId = user.id
              t.role = (user as { role?: string | null }).role ?? null
              t.name = user.name ?? null
              t.requiresOnboarding = false
              t.email = user.email ?? email
              t.isActive = user.isActive ?? null
              t.createdAt = user.createdAt ? user.createdAt.toISOString() : null
              t.updatedAt = user.updatedAt ? user.updatedAt.toISOString() : null
            } else {
              t.userId = null
              t.role = null
              t.name = token.name ?? null
              t.requiresOnboarding = true
              t.email = email
              t.isActive = null
              t.createdAt = null
              t.updatedAt = null
            }
          }
        }
      } catch (e) {
        console.error('JWT callback error:', e)
      }
      return token
    },

    /**
     * Session callback maps fields from the JWT onto the session object returned to the client.
     * Exposes:
     * - session.user.id
     * - session.user.role
     * - session.user.name
     * - session.user.requiresOnboarding
     */
    async session({ session, token }: { session: Session; token: JWT }) {
      const t = token as AppToken
      const user = {
        ...(session.user ?? {}),
        id: t.userId ?? null,
        role: t.role ?? null,
        name: (t.name as string | null | undefined) ?? session.user?.name ?? null,
        requiresOnboarding: Boolean(t.requiresOnboarding),
        email: (t.email as string | null | undefined) ?? session.user?.email ?? null,
        isActive: (t.isActive as boolean | null) ?? null,
        createdAt: (t.createdAt as string | null) ?? null,
        updatedAt: (t.updatedAt as string | null) ?? null,
      }
      return { ...session, user }
    },
  },
  pages: {
    signIn: '/sign-in',
  },
})

export { handler as GET, handler as POST }