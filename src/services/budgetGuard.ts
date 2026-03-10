import { prisma } from '@/lib/prisma';
import { PlanTier } from './entitlements';

export const AI_LIMITS: Record<string, { tokensPerMonth: number; requestsPerMonth: number }> = {
    [PlanTier.FREE]: {
        tokensPerMonth: 50000,
        requestsPerMonth: 20,
    },
    [PlanTier.PRO]: {
        tokensPerMonth: 500000,
        requestsPerMonth: 100,
    },
    [PlanTier.PREMIUM]: {
        tokensPerMonth: 2000000,
        requestsPerMonth: -1, // Unlimited
    },
    [PlanTier.EDU]: {
        tokensPerMonth: 2000000,
        requestsPerMonth: -1, // Unlimited
    },
    [PlanTier.TEACHER]: {
        tokensPerMonth: 5000000, // Extra high for teachers
        requestsPerMonth: -1, // Unlimited
    },
}

export class BudgetGuardError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BudgetGuardError";
    }
}

export const checkAIBudget = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true, tokenUsage: true, aiUsedCount: true }
    });

    if (!user) {
        throw new BudgetGuardError("User not found");
    }

    // TEACHER and EDU tiers: never blocked
    if (user.tier === PlanTier.TEACHER || user.tier === PlanTier.EDU) return true;

    const limits = AI_LIMITS[user.tier] || AI_LIMITS[PlanTier.FREE];

    if (user.tokenUsage >= limits.tokensPerMonth) {
        throw new BudgetGuardError(`You have exceeded your monthly token budget for the ${user.tier} plan.`);
    }

    if (limits.requestsPerMonth !== -1 && user.aiUsedCount >= limits.requestsPerMonth) {
        throw new BudgetGuardError(`You have exceeded your monthly AI request limit for the ${user.tier} plan.`);
    }

    return true;
}

export const recordAIUsage = async (userId: string, tokensUsed: number) => {
    await prisma.user.update({
        where: { id: userId },
        data: {
            tokenUsage: { increment: tokensUsed },
            aiUsedCount: { increment: 1 }
        }
    });
}
