import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Support both AUTH_SECRET and NEXTAUTH_SECRET for compatibility
const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret"
);

export interface SessionUser {
    id: string;
    email: string;
    name?: string;
    role: string;
    tier: string;
}

/**
 * Decodes the NextAuth JWT from request cookies.
 * Works on both Edge and Node runtimes.
 * NextAuth v5 stores user ID in token.id (not sub), so we read both.
 */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
    try {
        // Try all known cookie names for NextAuth v5 / v4
        const token =
            req.cookies.get("__Secure-authjs.session-token")?.value ||
            req.cookies.get("authjs.session-token")?.value ||
            req.cookies.get("__Secure-next-auth.session-token")?.value ||
            req.cookies.get("next-auth.session-token")?.value;

        if (!token) {
            console.log("[session] No auth cookie found. Available cookies:", req.cookies.getAll().map(c => c.name).join(", "));
            return null;
        }

        const { payload } = await jwtVerify(token, secret, {
            algorithms: ["HS256"],
        });

        // NextAuth v5 JWT: user id is stored in payload.id (from jwt callback token.id = user.id)
        // Also sometimes in payload.sub as fallback
        const userId = (payload.id as string) || (payload.sub as string);

        if (!userId) {
            console.log("[session] JWT missing user id. Payload keys:", Object.keys(payload).join(", "));
            return null;
        }

        return {
            id: userId,
            email: (payload.email as string) || "",
            name: payload.name as string | undefined,
            role: (payload.role as string) || "USER",
            tier: (payload.tier as string) || "FREE",
        };
    } catch (err) {
        console.log("[session] JWT decode failed:", err instanceof Error ? err.message : String(err));
        return null;
    }
}
