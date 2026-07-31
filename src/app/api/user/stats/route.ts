import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calculateIELTSOverallBand } from "@/lib/utils/ieltsBand";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: {
                targetBand: true,
                currentBand: true,
                weakestSkill: true,
                onboardingDone: true,
                lifetimePracticeCount: true,
                currentStreak: true,
                highestStreak: true,
                estimatedBand: true,
                bandReminderShown: true,
                tier: true,
                createdAt: true,
            }
        });

        // Always compute latest scores per skill
        const submissions = await prisma.submission.findMany({
            where: { userId: session.id, bandScore: { not: null } },
            select: { skill: true, bandScore: true, createdAt: true },
            orderBy: { createdAt: "desc" },
        });

        const latestBySkill: Record<string, number> = {};
        for (const sub of submissions) {
            if (latestBySkill[sub.skill] === undefined && sub.bandScore !== null) {
                latestBySkill[sub.skill] = sub.bandScore;
            }
        }

        const coveredSkills = Object.keys(latestBySkill);
        let updatedEstimatedBand = user?.estimatedBand || null;

        if (coveredSkills.length === 4) {
            const band = calculateIELTSOverallBand(
                latestBySkill["READING"] || 0,
                latestBySkill["LISTENING"] || 0,
                latestBySkill["WRITING"] || 0,
                latestBySkill["SPEAKING"] || 0
            );
            updatedEstimatedBand = band;
            await prisma.user.update({
                where: { id: session.id },
                data: { estimatedBand: band }
            });
        }

        return NextResponse.json({
            ...user,
            estimatedBand: updatedEstimatedBand,
            completedSkills: coveredSkills,
            skillScores: {
                reading: latestBySkill["READING"] ?? null,
                listening: latestBySkill["LISTENING"] ?? null,
                writing: latestBySkill["WRITING"] ?? null,
                speaking: latestBySkill["SPEAKING"] ?? null,
            }
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { targetBand, currentBand, weakestSkill, onboardingDone, bandReminderShown, school, occupation, referralSource } = body;

        const updated = await prisma.user.update({
            where: { id: session.id },
            data: {
                ...(targetBand !== undefined ? { targetBand: targetBand !== null ? parseFloat(targetBand) : null } : {}),
                ...(currentBand !== undefined ? { currentBand: currentBand !== null ? parseFloat(currentBand) : null } : {}),
                ...(weakestSkill !== undefined ? { weakestSkill } : {}),
                ...(onboardingDone !== undefined ? { onboardingDone } : {}),
                ...(bandReminderShown !== undefined ? { bandReminderShown } : {}),
                ...(school !== undefined ? { school } : {}),
                ...(occupation !== undefined ? { occupation } : {}),
                ...(referralSource !== undefined ? { referralSource } : {}),
            }
        });

        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ error: "Failed to update user stats" }, { status: 500 });
    }
}
