import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret");

interface SessionUser {
    id: string;
    email: string;
    name?: string;
    role: string;
    tier: string;
}

/**
 * Decodes the NextAuth JWT from request cookies.
 * Works on both Edge and Node runtimes, unlike auth() which can fail in server components/API routes on Vercel.
 */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
    try {
        // NextAuth v5 uses __Secure-authjs.session-token in production, authjs.session-token in dev
        const cookieName = process.env.NODE_ENV === "production"
            ? "__Secure-authjs.session-token"
            : "authjs.session-token";

        const token = req.cookies.get(cookieName)?.value
            || req.cookies.get("next-auth.session-token")?.value
            || req.cookies.get("__Secure-next-auth.session-token")?.value;

        if (!token) return null;

        const { payload } = await jwtVerify(token, secret, {
            algorithms: ["HS256"],
        });

        if (!payload?.sub) return null;

        return {
            id: payload.sub as string,
            email: payload.email as string,
            name: payload.name as string | undefined,
            role: (payload.role as string) || "USER",
            tier: (payload.tier as string) || "FREE",
        };
    } catch (err) {
        // Token invalid or expired
        return null;
    }
}
