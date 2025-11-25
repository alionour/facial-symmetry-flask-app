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
    FacialActions["Snarl"] = "snarl";
    FacialActions["LipPucker"] = "lip_pucker";
})(FacialActions || (FacialActions = {}));

export const FacialActionInstructions = {
    [FacialActions.neutral]: "Please relax your face and maintain a neutral expression",
    [FacialActions.EyebrowRaise]: "Please raise your eyebrows as high as possible.",
    [FacialActions.EyeClosure]: "Please close your eyes tightly.",
    [FacialActions.Smile]: "Please smile broadly showing your teeth.",
    [FacialActions.Snarl]: "Wrinkle your nose upward and show your upper teeth (like smelling something bad).",
    [FacialActions.LipPucker]: "Pucker your lips tightly as if giving a kiss or whistling.",
};

export const FacialActionMetrics = {
    [FacialActions.neutral]: [0, 0, 0],
    [FacialActions.EyebrowRaise]: [21, 251, 9, 10],
    [FacialActions.EyeClosure]: [159, 145, 386, 374],
    [FacialActions.Smile]: [61, 291, 13, 14],
    [FacialActions.Snarl]: [1, 2, 98, 327], // Upper lip and nose landmarks
    [FacialActions.LipPucker]: [0, 17, 61, 291], // Lip corner landmarks
};

