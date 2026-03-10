export enum PlanTier {
    FREE = 'FREE',
    PRO = 'PRO',
    PREMIUM = 'PREMIUM',
    EDU = 'EDU',
    TEACHER = 'TEACHER',
}

export type FeatureKey =
    | 'MOCK_TESTS'
    | 'DETAILED_AI_FEEDBACK'
    | 'AUDIO_RECORDING'
    | 'ADVANCED_ANALYTICS';

type FeatureRoles = Record<PlanTier, boolean>;

const FEATURES: Record<FeatureKey, FeatureRoles> = {
    MOCK_TESTS: {
        [PlanTier.FREE]: false,
        [PlanTier.PRO]: true,
        [PlanTier.PREMIUM]: true,
        [PlanTier.EDU]: true,
        [PlanTier.TEACHER]: true,
    },
    DETAILED_AI_FEEDBACK: {
        [PlanTier.FREE]: false,
        [PlanTier.PRO]: true,
        [PlanTier.PREMIUM]: true,
        [PlanTier.EDU]: true,
        [PlanTier.TEACHER]: true,
    },
    AUDIO_RECORDING: {
        [PlanTier.FREE]: true,
        [PlanTier.PRO]: true,
        [PlanTier.PREMIUM]: true,
        [PlanTier.EDU]: true,
        [PlanTier.TEACHER]: true,
    },
    ADVANCED_ANALYTICS: {
        [PlanTier.FREE]: false,
        [PlanTier.PRO]: false,
        [PlanTier.PREMIUM]: true,
        [PlanTier.EDU]: true,
        [PlanTier.TEACHER]: true,
    }
};

export const canAccessFeature = (tier: PlanTier, feature: FeatureKey): boolean => {
    // TEACHER and PREMIUM/EDU tiers always have full access
    if (tier === PlanTier.TEACHER || tier === PlanTier.EDU) return true;
    return FEATURES[feature]?.[tier] === true;
};
