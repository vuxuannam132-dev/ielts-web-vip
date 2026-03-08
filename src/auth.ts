import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// NOTE: We do NOT use PrismaAdapter here because it conflicts with CredentialsProvider + JWT strategy.
// JWT sessions are stored in cookies, not the database. User data is fetched on each request.
export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    session: { strategy: 'jwt' },
    secret: process.env.AUTH_SECRET,
});
