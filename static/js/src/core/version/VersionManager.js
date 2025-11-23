/**
 * VersionManager.ts
 * Simplified version management for facial symmetry analysis application
 */
export class VersionManager {
    /**
     * Get current application version
     */
    static getCurrentVersion() {
        return { ...this.CURRENT_VERSION };
    }
    /**
     * Get version string in clinical format
     */
    static getVersionString() {
        const v = this.CURRENT_VERSION;
        return `${v.major}.${v.minor}.${v.patch}-${v.clinical}.${v.build.toString().padStart(3, '0')}`;
    }
    /**
     * Get algorithm version information
     */
    static getAlgorithmVersion() {
        return { ...this.ALGORITHM_VERSION };
    }
}
VersionManager.CURRENT_VERSION = {
    major: 1,
    minor: 0,
    patch: 0,
    clinical: 'beta',
    build: 1,
    releaseDate: '2025-5-28',
};
VersionManager.ALGORITHM_VERSION = {
    version: '1.0.0',
    checksum: 'sha256:placeholder',
    validationStatus: 'pending',
};
