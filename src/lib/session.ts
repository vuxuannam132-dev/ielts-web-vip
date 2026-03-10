import { NextRequest } from "next/server";
import { compactDecrypt } from "jose";
import { createHash } from "crypto";

export interface SessionUser {
    id: string;
    email: string;
    name?: string;
    role: string;
    tier: string;
}

/**
 * NextAuth v5 encrypts session tokens as JWE (alg=dir, enc=A256GCM).
 * The encryption key is derived from AUTH_SECRET via SHA-256.
 * We must use jose compactDecrypt to decode it.
 */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
    try {
        const rawSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
        if (!rawSecret) return null;

        // NextAuth v5 derives the JWE key by hashing the secret with SHA-256
        const keyBytes = createHash("sha256").update(rawSecret).digest();
        const encKey = new Uint8Array(keyBytes);

        // Try all NextAuth v5 cookie names
        const cookieToken =
            req.cookies.get("__Secure-authjs.session-token")?.value ||
            req.cookies.get("authjs.session-token")?.value ||
            req.cookies.get("__Secure-next-auth.session-token")?.value ||
            req.cookies.get("next-auth.session-token")?.value;

        if (!cookieToken) return null;

        // Decrypt JWE
        const { plaintext } = await compactDecrypt(cookieToken, encKey);
        const payload = JSON.parse(new TextDecoder().decode(plaintext));

        const userId = (payload.id as string) || (payload.sub as string);
        if (!userId) return null;

        return {
            id: userId,
            email: (payload.email as string) || "",
            name: payload.name as string | undefined,
            role: (payload.role as string) || "USER",
            tier: (payload.tier as string) || "FREE",
        };
    } catch (err) {
        console.error("[session] JWE decrypt failed:", err instanceof Error ? err.message : String(err));
        return null;
    }
}
