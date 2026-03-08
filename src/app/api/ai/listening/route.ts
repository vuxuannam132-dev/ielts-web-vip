import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { evaluateListening } from "@/lib/ai/listeningReview";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { practiceSetId, questions, userAnswers } = body;

        if (!questions || !userAnswers) {
            return NextResponse.json({ error: "Missing required data" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Save submission before AI call to track processing
        const submission = await prisma.submission.create({
            data: {
                userId: user.id,
                practiceSetId: practiceSetId || null,
                skill: "LISTENING",
                answers: JSON.stringify(userAnswers),
            }
        });

        const useAdvancedModel = user.tier !== "FREE";

        // Call AI Listening Evaluation
        const evaluation = await evaluateListening(user.id, { questions, userAnswers }, useAdvancedModel);

        // Update submission with the score and detailed feedback
        await prisma.submission.update({
            where: { id: submission.id },
            data: {
                bandScore: evaluation.bandScore,
                feedback: JSON.stringify(evaluation)
            }
        });

        // Increment AI usage
        await prisma.user.update({
            where: { id: user.id },
            data: { aiUsedCount: { increment: 1 } }
        });

        return NextResponse.json({ success: true, evaluation, submissionId: submission.id });
    } catch (error: any) {
        console.error("[Listening Submit Error]:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
