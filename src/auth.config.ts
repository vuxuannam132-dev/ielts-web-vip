import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const authConfig: NextAuthConfig = {
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: { strategy: 'jwt' },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isProtected = nextUrl.pathname.startsWith('/admin') || nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/teacher') || nextUrl.pathname.startsWith('/student');
            if (isProtected) {
                if (isLoggedIn) return true;
                return false;
            }
            if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
        async jwt({ token, user }) {
            // On first sign-in, `user` is populated — persist role/tier into JWT
            if (user) {
                token.id = user.id;
                token.role = (user as { role?: string }).role ?? 'USER';
                token.tier = (user as { tier?: string }).tier ?? 'FREE';
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                (session.user as { role?: string }).role = token.role as string;
                (session.user as { tier?: string }).tier = token.tier as string;
            }
            return session;
        },
    },
    providers: [
        CredentialsProvider({
            credentials: {
                email: { type: 'email' },
                password: { type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                const email = (credentials.email as string).toLowerCase().trim();
                const password = credentials.password as string;

                try {
                    // Dynamic import to avoid edge runtime issues
                    const { prisma } = await import('@/lib/prisma');
                    const user = await prisma.user.findUnique({ where: { email } });
                    if (!user || !user.password) return null;

                    const valid = await bcrypt.compare(password, user.password);
                    if (!valid) return null;

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        tier: user.tier,
                    };
                } catch (err) {
                    console.error('[Auth] Authorization error:', err);
                    return null;
                }
            },
        }),
    ],
};
