import { NextRequest, NextResponse } from "next/server";
import { evaluateWriting } from "@/lib/ai/writingReview";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { taskNumber, prompt, userText, practiceSetId } = body;

        if (![1, 2].includes(taskNumber) || !prompt || !userText) {
            return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Save submission BEFORE evaluating (processing state)
        const submission = await prisma.submission.create({
            data: {
                userId: user.id,
                practiceSetId: practiceSetId || null,
                skill: "WRITING",
                answers: JSON.stringify({ prompt, userText }),
            }
        });

        // Determine if they can use advanced model (PRO/PREMIUM + budget guard handles limits)
        const useAdvancedModel = user.tier !== "FREE";

        // Call AI
        const evaluation = await evaluateWriting(user.id, { taskNumber, prompt, userText }, useAdvancedModel);

        // Update submission with score
        await prisma.submission.update({
            where: { id: submission.id },
            data: {
                bandScore: evaluation.bandScore,
                feedback: JSON.stringify(evaluation)
            }
        });

        // Increment AI counter
        await prisma.user.update({
            where: { id: user.id },
            data: { aiUsedCount: { increment: 1 } }
        });

        return NextResponse.json({ success: true, evaluation });
    } catch (error: any) {
        console.error("[AI Writing Route Error]:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
