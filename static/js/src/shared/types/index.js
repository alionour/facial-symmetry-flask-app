// ============================================================================
// UNIFIED TYPE DEFINITIONS FOR FACIAL SYMMETRY APPLICATION
// ============================================================================
// All interfaces, types, and enums consolidated from across the codebase
// Facial action types and enums
export var FacialActions;
(function (FacialActions) {
    FacialActions["neutral"] = "neutral";
    FacialActions["EyebrowRaise"] = "eyebrow_raise";
    FacialActions["EyeClosure"] = "eye_close";
    FacialActions["Smile"] = "smile";
})(FacialActions || (FacialActions = {}));
export const FacialActionInstructions = {
    [FacialActions.neutral]: "Please relax your face and maintain a neutral expression",
    [FacialActions.EyebrowRaise]: "Please raise your eyebrows as high as possible.",
    [FacialActions.EyeClosure]: "Please close your eyes tightly.",
    [FacialActions.Smile]: "Please smile broadly showing your teeth.",
};
export const FacialActionMetrics = {
    [FacialActions.neutral]: [0, 0, 0],
    [FacialActions.EyebrowRaise]: [21, 251, 9, 10],
    [FacialActions.EyeClosure]: [159, 145386, 374],
    [FacialActions.Smile]: [61, 291, 13, 14],
};
