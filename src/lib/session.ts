import { NextRequest } from "next/server";
import { compactDecrypt } from "jose";
import { hkdfSync } from "crypto";

export interface SessionUser {
    id: string;
    email: string;
    name?: string;
    role: string;
    tier: string;
}

/**
 * Auth.js v5 (NextAuth v5) encrypts session tokens as JWE (alg=dir, enc=A256GCM).
 * Key derivation uses HKDF (RFC 5869):
 *   - hash  = sha256
 *   - salt  = cookie name (e.g. "__Secure-authjs.session-token")
 *   - info  = "Auth.js Generated Encryption Key (<cookieName>)"
 *   - keylen = 32 bytes (256-bit for AES-256-GCM)
 * 
 * Source: nextauthjs/next-auth packages/core/src/jwt.ts
 */
function deriveEncryptionKey(secret: string, cookieName: string): Uint8Array {
    const info = Buffer.from(`Auth.js Generated Encryption Key (${cookieName})`);
    const salt = Buffer.from(cookieName);
    const key = hkdfSync("sha256", secret, salt, info, 32);
    return new Uint8Array(key);
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
    try {
        const rawSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
        if (!rawSecret) return null;

        // Determine which cookie is present (production vs dev)
        const candidates = [
            "__Secure-authjs.session-token",
            "authjs.session-token",
            "__Secure-next-auth.session-token",
            "next-auth.session-token",
        ];

        let cookieToken: string | undefined;
        let cookieName = "";

        for (const name of candidates) {
            const val = req.cookies.get(name)?.value;
            if (val) {
                cookieToken = val;
                cookieName = name;
                break;
            }
        }

        if (!cookieToken || !cookieName) return null;

        // Derive AES-256-GCM key using HKDF exactly as Auth.js v5 does
        const encKey = deriveEncryptionKey(rawSecret, cookieName);

        // Decrypt JWE compact token
        const { plaintext } = await compactDecrypt(cookieToken, encKey);
        const payload = JSON.parse(new TextDecoder().decode(plaintext));

        // Auth.js v5: user id is in payload.id, falling back to standard JWT sub
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
