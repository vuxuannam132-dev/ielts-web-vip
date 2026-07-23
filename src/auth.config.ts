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
        async jwt({ token, user, trigger, session }) {
            // On first sign-in, `user` is populated — persist into JWT
            if (user) {
                token.id = user.id;
                token.role = (user as any).role ?? 'USER';
                token.tier = (user as any).tier ?? 'FREE';
                token.isVerified = (user as any).isVerified ?? true;
            }
            // Khi gọi update() từ client để refresh session fields
            if (trigger === 'update' && session) {
                if (session.isVerified !== undefined) token.isVerified = session.isVerified;
                if (session.role !== undefined) token.role = session.role;
                if (session.tier !== undefined) token.tier = session.tier;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role as string;
                (session.user as any).tier = token.tier as string;
                (session.user as any).isVerified = token.isVerified as boolean;
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
                    const { prisma } = await import('@/lib/prisma');
                    const user = await prisma.user.findUnique({ where: { email } });
                    if (!user || !user.password) return null;

                    const valid = await bcrypt.compare(password, user.password);
                    if (!valid) return null;

                    if (user.isLocked) {
                        throw new Error('Tài khoản đã bị khóa - bạn không thể sử dụng được vui lòng liên hệ admin để mở lại');
                    }

                    // Cho phép đăng nhập dù chưa xác thực, nhưng trả về isVerified
                    // để VerifyPromptModal hiện popup yêu cầu xác thực
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        tier: user.tier,
                        isVerified: user.isVerified,
                    } as any;
                } catch (err: any) {
                    console.error('[Auth] Authorization error:', err.message);
                    throw err;
                }
            },
        }),
    ],
};
