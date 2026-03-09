import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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

        // Calculate estimated band if not already computed
        if (user && !user.estimatedBand) {
            const skills = ["LISTENING", "READING", "WRITING", "SPEAKING"];
            const submissions = await prisma.submission.findMany({
                where: { userId: session.id, bandScore: { not: null } },
                select: { skill: true, bandScore: true },
                orderBy: { createdAt: "asc" },
            });

            const firstBySkill: Record<string, number> = {};
            for (const sub of submissions) {
                if (!firstBySkill[sub.skill] && sub.bandScore !== null) {
                    firstBySkill[sub.skill] = sub.bandScore!;
                }
            }

            const coveredSkills = Object.keys(firstBySkill);
            if (coveredSkills.length === 4) {
                const avg = skills.reduce((sum, s) => sum + (firstBySkill[s] || 0), 0) / 4;
                const band = Math.round(avg * 2) / 2;
                await prisma.user.update({
                    where: { id: session.id },
                    data: { estimatedBand: band }
                });
                return NextResponse.json({ ...user, estimatedBand: band, completedSkills: coveredSkills });
            }

            return NextResponse.json({ ...user, completedSkills: coveredSkills });
        }

        return NextResponse.json(user || {});
    } catch (e) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const data: any = {};

        if (body.targetBand != null) {
            const b = parseFloat(body.targetBand);
            if (b >= 0.5 && b <= 9.5) data.targetBand = b;
        }
        if (body.currentBand !== undefined) data.currentBand = body.currentBand !== null ? parseFloat(body.currentBand) : null;
        if (body.weakestSkill != null) data.weakestSkill = body.weakestSkill;
        if (body.onboardingDone != null) data.onboardingDone = Boolean(body.onboardingDone);
        if (body.bandReminderShown != null) data.bandReminderShown = Boolean(body.bandReminderShown);
        if (body.school != null) data.school = body.school;
        if (body.occupation != null) data.occupation = body.occupation;
        if (body.referralSource != null) data.referralSource = body.referralSource;

        const user = await prisma.user.update({ where: { id: session.id }, data });
        return NextResponse.json({ success: true, user });
    } catch (e) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
