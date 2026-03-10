import { NextRequest } from "next/server";
import { hkdf } from "@panva/hkdf";
import { jwtDecrypt } from "jose";

export interface SessionUser {
    id: string;
    email: string;
    name?: string;
    role: string;
    tier: string;
}

/**
 * Auth.js v5 (next-auth v5) session JWT decoding.
 * 
 * From Auth.js source (packages/core/src/jwt.ts):
 * - enc = "A256CBC-HS512" (NOT A256GCM!)
 * - Key derivation: HKDF(sha256, secret, salt=cookieName, 
 *     info="Auth.js Generated Encryption Key (<salt>)", keylen=64)
 * - Uses @panva/hkdf + jwtDecrypt from jose
 */
async function getDerivedEncryptionKey(secret: string, salt: string): Promise<Uint8Array> {
    const info = `Auth.js Generated Encryption Key (${salt})`;
    // A256CBC-HS512 needs 64 bytes (512 bits)
    return hkdf("sha256", secret, salt, info, 64);
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
    try {
        const rawSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
        if (!rawSecret) return null;

        // Auth.js v5 cookie names in production vs dev
        const cookieCandidates = [
            "__Secure-authjs.session-token",
            "authjs.session-token",
            "__Secure-next-auth.session-token",
            "next-auth.session-token",
        ];

        let cookieToken: string | undefined;
        let cookieName = "";

        for (const name of cookieCandidates) {
            const val = req.cookies.get(name)?.value;
            if (val) {
                cookieToken = val;
                cookieName = name;
                break;
            }
        }

        if (!cookieToken || !cookieName) return null;

        // Derive 64-byte key for A256CBC-HS512
        const encryptionKey = await getDerivedEncryptionKey(rawSecret, cookieName);

        // Decrypt using jose jwtDecrypt (handles JWE)
        const { payload } = await jwtDecrypt(cookieToken, encryptionKey, {
            clockTolerance: 15,
            keyManagementAlgorithms: ["dir"],
            contentEncryptionAlgorithms: ["A256CBC-HS512", "A256GCM"],
        });

        // Auth.js v5 stores user.id in token.id (from jwt callback: token.id = user.id)
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
