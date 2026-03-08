export enum PlanTier {
    FREE = 'FREE',
    PRO = 'PRO',
    PREMIUM = 'PREMIUM'
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
    },
    DETAILED_AI_FEEDBACK: {
        [PlanTier.FREE]: false,
        [PlanTier.PRO]: true,
        [PlanTier.PREMIUM]: true,
    },
    AUDIO_RECORDING: { // Ability to record speaking answers rather than just text
        [PlanTier.FREE]: true, // basic transcription available to all, capped by budget
        [PlanTier.PRO]: true,
        [PlanTier.PREMIUM]: true,
    },
    ADVANCED_ANALYTICS: {
        [PlanTier.FREE]: false,
        [PlanTier.PRO]: false,
        [PlanTier.PREMIUM]: true,
    }
};

export const canAccessFeature = (tier: PlanTier, feature: FeatureKey): boolean => {
    return FEATURES[feature][tier] === true;
};

export const requireFeature = (tier: PlanTier, feature: FeatureKey) => {
    if (!canAccessFeature(tier, feature)) {
        throw new Error(`Your current plan (${tier}) does not include access to ${feature}. Please upgrade.`);
    }
}
