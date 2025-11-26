
import { SunnybrookScoringService } from './static/js/src/domain/services/SunnybrookScoringService.js';

// Mock Landmark Data Generator
function createLandmarks(count = 468) {
    return Array(count).fill(0).map(() => ({ x: 0.5, y: 0.5, z: 0 }));
}

function setPoint(landmarks, index, x, y) {
    if (landmarks[index]) {
        landmarks[index] = { x, y, z: 0 };
    }
}

// Test Runner
async function runTests() {
    console.log('🧪 Starting Sunnybrook Scoring Tests...');
    const service = new SunnybrookScoringService();

    // Test Case 1: Perfect Symmetry (No Movement)
    console.log('\nTest 1: Zero Movement (Paralysis Simulation)');
    const baseline1 = createLandmarks();
    const movement1 = {
        eyebrow_raise: createLandmarks(),
        eye_close: createLandmarks(),
        smile: createLandmarks(),
        snarl: createLandmarks(),
        lip_pucker: createLandmarks()
    };

    const result1 = service.calculateScore(movement1, baseline1);
    console.log('Result 1 Score:', result1.compositeScore);

    if (result1.compositeScore === 20) {
        console.log('✅ Test 1 Passed: Score is 20 (Base for no movement)');
    } else {
        console.error('❌ Test 1 Failed: Expected 20, got', result1.compositeScore);
    }

    // Test Case 2: Normal Movement (Bilateral)
    console.log('\nTest 2: Normal Movement (Bilateral)');
    const baseline2 = createLandmarks();
    const movement2 = {
        eyebrow_raise: createLandmarks(),
        eye_close: createLandmarks(),
        smile: createLandmarks(),
        snarl: createLandmarks(),
        lip_pucker: createLandmarks()
    };

    // Set IPD for normalization (0.1 normalized units = 63mm)
    setPoint(baseline2, 454, 0.6, 0.5);
    setPoint(baseline2, 234, 0.5, 0.5);
    Object.values(movement2).forEach(m => {
        setPoint(m, 454, 0.6, 0.5);
        setPoint(m, 234, 0.5, 0.5);
    });

    // Move BOTH sides (Normal)
    // Left (61) and Right (291) Smile
    setPoint(baseline2, 61, 0.55, 0.6);
    setPoint(baseline2, 291, 0.45, 0.6);
    setPoint(movement2.smile, 61, 0.55 - 0.024, 0.6 - 0.024);
    setPoint(movement2.smile, 291, 0.45 + 0.024, 0.6 - 0.024);

    // Eyebrow Raise (105 Left, 334 Right)
    setPoint(baseline2, 105, 0.55, 0.4);
    setPoint(baseline2, 334, 0.45, 0.4);
    setPoint(movement2.eyebrow_raise, 105, 0.55, 0.4 - 0.02);
    setPoint(movement2.eyebrow_raise, 334, 0.45, 0.4 - 0.02);

    // Eye Close (159 Left, 386 Right)
    setPoint(baseline2, 159, 0.55, 0.45);
    setPoint(baseline2, 386, 0.45, 0.45);
    setPoint(movement2.eye_close, 159, 0.55, 0.45 + 0.016);
    setPoint(movement2.eye_close, 386, 0.45, 0.45 + 0.016);

    // Snarl (98 Left, 327 Right)
    setPoint(baseline2, 98, 0.55, 0.55);
    setPoint(baseline2, 327, 0.45, 0.55);
    setPoint(movement2.snarl, 98, 0.55, 0.55 - 0.01);
    setPoint(movement2.snarl, 327, 0.45, 0.55 - 0.01);

    // Pucker (61 Left, 291 Right)
    setPoint(movement2.lip_pucker, 61, 0.55 + 0.013, 0.6);
    setPoint(movement2.lip_pucker, 291, 0.45 - 0.013, 0.6);

    const result2 = service.calculateScore(movement2, baseline2);
    console.log('Result 2 Score:', result2.voluntaryScore.value);

    if (result2.voluntaryScore.value >= 80) {
        console.log('✅ Test 2 Passed: High voluntary score detected');
    } else {
        console.error('❌ Test 2 Failed: Expected >80, got', result2.voluntaryScore.value);
    }

    // Test Case 3: Synkinesis (Right Side Affected)
    console.log('\nTest 3: Synkinesis (Right Side Affected)');
    const baseline3 = JSON.parse(JSON.stringify(baseline2));
    const movement3 = JSON.parse(JSON.stringify(movement2));

    // 1. Make Right side WEAK (Palsy) to ensure it's selected as affected
    // Reset Right Smile movement to near zero
    setPoint(movement3.smile, 291, 0.45 + 0.001, 0.6 - 0.001);
    // Reset Right Eyebrow
    setPoint(movement3.eyebrow_raise, 334, 0.45, 0.4 - 0.001);

    // 2. Add Synkinesis to RIGHT side
    // Eye Closure (386) during Smile
    // Move Right Eye (386) down by 5mm during smile
    // 5mm = 5 * (0.1/63) = 0.008
    setPoint(movement3.smile, 386, 0.45, 0.45 + 0.008);

    const result3 = service.calculateScore(movement3, baseline3);
    console.log('Result 3 Affected Side:', result3.affectedSide);
    console.log('Result 3 Synkinesis:', JSON.stringify(result3.synkinesisScore, null, 2));

    if (result3.affectedSide === 'Right' && result3.synkinesisScore.value > 0) {
        console.log('✅ Test 3 Passed: Synkinesis detected on affected side');
    } else {
        console.error('❌ Test 3 Failed: Synkinesis not detected or wrong side');
    }
}

runTests().catch(console.error);
