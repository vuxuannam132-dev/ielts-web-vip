import { NextRequest, NextResponse } from "next/server";
import { evaluateSpeaking } from "@/lib/ai/speakingReview";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
    let tmpPath = "";
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;
        const partNumber = Number(formData.get("partNumber"));
        const prompt = formData.get("prompt") as string;
        const practiceSetId = formData.get("practiceSetId") as string | null;

        if (!audioFile || ![1, 2, 3].includes(partNumber) || !prompt) {
            return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Save audio to temp file for Whisper
        const buffer = Buffer.from(await audioFile.arrayBuffer());
        tmpPath = path.join(os.tmpdir(), `speaking-${Date.now()}-${user.id}.webm`);
        fs.writeFileSync(tmpPath, buffer);

        const submission = await prisma.submission.create({
            data: {
                userId: user.id,
                practiceSetId: practiceSetId || undefined,
                skill: "SPEAKING",
                answers: JSON.stringify({ prompt, audioSize: audioFile.size }),
            }
        });

        const useAdvancedModel = user.tier !== "FREE";

        // Call AI 
        const evaluation = await evaluateSpeaking(user.id, { partNumber: partNumber as 1 | 2 | 3, prompt, audioFilePath: tmpPath }, useAdvancedModel);

        // Update DB
        await prisma.submission.update({
            where: { id: submission.id },
            data: {
                bandScore: evaluation.bandScore,
                transcript: evaluation.transcript,
                feedback: JSON.stringify(evaluation)
            }
        });

        // Increment counter
        await prisma.user.update({
            where: { id: user.id },
            data: { aiUsedCount: { increment: 1 } }
        });

        return NextResponse.json({ success: true, evaluation });

    } catch (error: any) {
        console.error("[AI Speaking Route Error]:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    } finally {
        if (tmpPath && fs.existsSync(tmpPath)) {
            fs.unlinkSync(tmpPath);
        }
    }
}


