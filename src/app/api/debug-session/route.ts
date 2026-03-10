import { NextRequest, NextResponse } from "next/server";
import { compactDecrypt } from "jose";
import { hkdfSync } from "crypto";

async function tryDecrypt(token: string, secret: string, cookieName: string): Promise<{ payload: any; method: string; error?: string } | null> {
    // Method 1: HKDF with Auth.js v5 style (salt=cookieName, info=full string)
    try {
        const info = Buffer.from(`Auth.js Generated Encryption Key (${cookieName})`);
        const salt = Buffer.from(cookieName);
        const key1 = new Uint8Array(hkdfSync("sha256", secret, salt, info, 32));
        const { plaintext } = await compactDecrypt(token, key1);
        return { payload: JSON.parse(new TextDecoder().decode(plaintext)), method: "hkdf_authjs_v5" };
    } catch (e1: any) {
        // Method 2: HKDF with empty salt (NextAuth v4 style)
        try {
            const info2 = Buffer.from(`Auth.js Generated Encryption Key (${cookieName})`);
            const key2 = new Uint8Array(hkdfSync("sha256", secret, "", info2, 32));
            const { plaintext } = await compactDecrypt(token, key2);
            return { payload: JSON.parse(new TextDecoder().decode(plaintext)), method: "hkdf_empty_salt" };
        } catch (e2: any) {
            // Method 3: SHA-256 of secret raw bytes
            try {
                const { createHash } = await import("crypto");
                const key3 = new Uint8Array(createHash("sha256").update(secret).digest());
                const { plaintext } = await compactDecrypt(token, key3);
                return { payload: JSON.parse(new TextDecoder().decode(plaintext)), method: "sha256_raw" };
            } catch (e3: any) {
                // Method 4: Raw secret padded/truncated to 32 bytes
                try {
                    const rawBytes = Buffer.from(secret, "utf8");
                    const key4 = new Uint8Array(32);
                    rawBytes.copy(Buffer.from(key4.buffer), 0, 0, Math.min(rawBytes.length, 32));
                    const { plaintext } = await compactDecrypt(token, key4);
                    return { payload: JSON.parse(new TextDecoder().decode(plaintext)), method: "raw_padded_32" };
                } catch (e4: any) {
                    return { payload: null, method: "all_failed", error: `e1=${e1.message}|e2=${e2.message}|e3=${e3.message}|e4=${e4.message}` };
                }
            }
        }
    }
}

export async function GET(req: NextRequest) {
    const cookies = req.cookies.getAll().map(c => ({
        name: c.name,
        valueLength: c.value.length,
        preview: c.value.substring(0, 40),
    }));

    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";

    const candidates = [
        "__Secure-authjs.session-token",
        "authjs.session-token",
    ];

    let decryptResult: any = null;
    for (const name of candidates) {
        const val = req.cookies.get(name)?.value;
        if (val) {
            decryptResult = await tryDecrypt(val, secret, name);
            decryptResult.cookieName = name;
            break;
        }
    }

    return NextResponse.json({
        cookies,
        decryptResult,
        secretLength: secret.length,
        secretPreview: secret.substring(0, 8),
        env: {
            hasAuthSecret: !!process.env.AUTH_SECRET,
            hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
            nodeEnv: process.env.NODE_ENV,
        }
    });
}
