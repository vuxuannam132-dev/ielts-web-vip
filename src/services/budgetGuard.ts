import { prisma } from '@/lib/prisma';
import { PlanTier } from './entitlements';

export const AI_LIMITS: Record<string, { tokensPerMonth: number; requestsPerMonth: number }> = {
    [PlanTier.FREE]: {
        tokensPerMonth: 50000,
        requestsPerMonth: 20, // High-quality AI evaluations (speaking/writing)
    },
    [PlanTier.PRO]: {
        tokensPerMonth: 500000,
        requestsPerMonth: 100,
    },
    [PlanTier.PREMIUM]: {
        tokensPerMonth: 2000000,
        requestsPerMonth: -1, // Unlimited requests (within token budget)
    }
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

    const limits = AI_LIMITS[user.tier];

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
