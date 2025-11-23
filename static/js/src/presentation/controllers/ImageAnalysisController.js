import { calculateEnhancedMouthAnalysis, calculateOverallSymmetryScore, calculateRealTimeFacialAsymmetryGrade } from './ImageAnalysisHelpers.js';
/**
 * ImageAnalysisController - Processes uploaded images for facial symmetry analysis
 * Uses the exact same analysis methods as live camera preview for consistency
 */
export class ImageAnalysisController {
    constructor() {
        this.isModelLoading = false;
        this.modelsLoaded = false;
        this.landmarkStorage = new Map();
        this.initializeFaceDetection();
    }
    /**
     * Initialize MediaPipe FaceMesh for image analysis
     */
    async initializeFaceDetection() {
        console.log('ImageAnalysisController: Initializing face detection models...');
        this.isModelLoading = true;
        try {
            // Wait for MediaPipe to be available
            await this.waitForMediaPipe();
            if (typeof window.FaceMesh !== 'undefined') {
                this.faceMesh = new window.FaceMesh({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
                    }
                });
                this.faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });
                // Set up results handler
                this.faceMesh.onResults((results) => {
                    this.lastFaceMeshResults = results;
                    console.log('ImageAnalysisController: FaceMesh results received:', results);
                });
                this.modelsLoaded = true;
                this.isModelLoading = false;
                console.log('ImageAnalysisController: FaceMesh initialized successfully');
            }
            else {
                throw new Error('MediaPipe FaceMesh not available');
            }
        }
        catch (error) {
            console.error('ImageAnalysisController: Failed to initialize face detection:', error);
            this.isModelLoading = false;
            throw error;
        }
    }
    /**
     * Wait for MediaPipe to be available
     */
    async waitForMediaPipe() {
        let attempts = 0;
        const maxAttempts = 50;
        while (attempts < maxAttempts) {
            if (typeof window.FaceMesh !== 'undefined') {
                console.log('ImageAnalysisController: MediaPipe FaceMesh is available');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        throw new Error('MediaPipe FaceMesh not available after waiting');
    }
    /**
     * Process uploaded images and generate real facial symmetry analysis
     */
    async processUploadedImages() {
        console.log('ImageAnalysisController: Processing uploaded images...');
        // Check if models are loaded
        if (!this.modelsLoaded || !this.faceMesh) {
            throw new Error('Face detection models not loaded. Cannot process images.');
        }
        // Get uploaded images from localStorage
        const uploadedImagesData = localStorage.getItem('uploadedImages');
        if (!uploadedImagesData) {
            throw new Error('No uploaded images found. Please upload images first.');
        }
        const imageData = JSON.parse(uploadedImagesData);
        const requiredActions = ['baseline', 'eyebrow_raise', 'eye_close', 'smile'];
        // Validate all required images are present
        for (const action of requiredActions) {
            if (!imageData[action]) {
                throw new Error(`Missing required image: ${action}`);
            }
        }
        console.log('ImageAnalysisController: All required images found, starting analysis...');
        // Process each image and extract landmarks
        for (const action of requiredActions) {
            console.log(`ImageAnalysisController: Processing ${action} image...`);
            const landmarks = await this.extractLandmarksFromImage(imageData[action], action);
            if (!landmarks || landmarks.length < 468) {
                throw new Error(`Failed to extract sufficient landmarks from ${action} image. Expected 468, got ${landmarks ? landmarks.length : 0}`);
            }
            this.landmarkStorage.set(action, landmarks);
            console.log(`ImageAnalysisController: Successfully extracted ${landmarks.length} landmarks from ${action} image`);
        }
        // Generate analysis results using real landmark data
        const analysisResults = await this.generateAnalysisResults();
        console.log('ImageAnalysisController: Analysis completed successfully');
        return analysisResults;
    }
    /**
     * Extract facial landmarks from a single image
     */
    async extractLandmarksFromImage(dataUrl, action) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    console.log(`ImageAnalysisController: Image loaded for ${action}, extracting landmarks...`);
                    // Reset results
                    this.lastFaceMeshResults = undefined;
                    // Send image to FaceMesh
                    await this.faceMesh.send({ image: img });
                    // Wait for results
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    if (this.lastFaceMeshResults && this.lastFaceMeshResults.multiFaceLandmarks) {
                        const faces = this.lastFaceMeshResults.multiFaceLandmarks;
                        if (faces && faces.length > 0) {
                            const landmarks = faces[0];
                            console.log(`ImageAnalysisController: Extracted ${landmarks.length} landmarks from ${action} image`);
                            resolve(landmarks);
                        }
                        else {
                            reject(new Error(`No face detected in ${action} image`));
                        }
                    }
                    else {
                        reject(new Error(`Failed to process ${action} image - no landmark results`));
                    }
                }
                catch (error) {
                    console.error(`ImageAnalysisController: Error processing ${action} image:`, error);
                    reject(error);
                }
            };
            img.onerror = () => {
                reject(new Error(`Failed to load ${action} image`));
            };
            img.src = dataUrl;
        });
    }
    /**
     * Generate analysis results using robust multi-run analysis with outlier filtering
     */
    async generateAnalysisResults() {
        console.log('ImageAnalysisController: Generating robust analysis results with multi-run outlier filtering...');
        const baseline = this.landmarkStorage.get('baseline');
        const eyebrowRaise = this.landmarkStorage.get('eyebrow_raise');
        const eyeClose = this.landmarkStorage.get('eye_close');
        const smile = this.landmarkStorage.get('smile');
        if (!baseline || !eyebrowRaise || !eyeClose || !smile) {
            throw new Error('Missing landmark data for analysis');
        }
        // Run robust multi-analysis with fresh landmark extraction for each iteration
        console.log('Running robust multi-analysis with fresh landmark extraction and outlier detection...');
        const eyebrowAnalysis = await this.runRobustAnalysisWithFreshLandmarks('eyebrow', 'baseline', 'eyebrow_raise');
        const eyeAnalysis = await this.runRobustAnalysisWithFreshLandmarks('eye', 'baseline', 'eye_close');
        const mouthAnalysis = await this.runRobustAnalysisWithFreshLandmarks('mouth', 'baseline', 'smile');
        // Calculate overall symmetry score using the median results
        const overallSymmetry = calculateOverallSymmetryScore(eyebrowAnalysis, eyeAnalysis, mouthAnalysis);
        // Calculate facial asymmetry grade using the median results
        const facialAsymmetryGrade = calculateRealTimeFacialAsymmetryGrade(eyebrowAnalysis.asymmetryPercentage || 0, eyeAnalysis.asymmetryPercentage || 0, (mouthAnalysis.asymmetryIndex || 0) * 100 // Convert to percentage
        );
        // Format results to match live camera analysis structure
        const results = {
            patientInfo: this.getPatientInfo(),
            timestamp: new Date().toISOString(),
            analysisMode: 'images',
            actions: ['baseline', 'eyebrow_raise', 'eye_close', 'smile'],
            symmetryMetrics: {
                // Individual measurements (same format as live preview)
                leftEyebrowElevation: eyebrowAnalysis.leftElevation,
                rightEyebrowElevation: eyebrowAnalysis.rightElevation,
                eyebrowAsymmetry: eyebrowAnalysis.asymmetryPercentage || 0,
                eyebrowSymmetry: Math.max(0, 100 - (eyebrowAnalysis.asymmetryPercentage || 0)),
                leftEyeClosure: eyeAnalysis.leftClosurePercentage,
                rightEyeClosure: eyeAnalysis.rightClosurePercentage,
                eyeAsymmetry: eyeAnalysis.asymmetryPercentage || 0,
                eyeSymmetry: Math.max(0, 100 - (eyeAnalysis.asymmetryPercentage || 0)),
                leftMouthMovement: mouthAnalysis.leftMovement,
                rightMouthMovement: mouthAnalysis.rightMovement,
                mouthAsymmetry: (mouthAnalysis.asymmetryIndex || 0) * 100, // Convert to percentage
                mouthSymmetry: Math.max(0, 100 - ((mouthAnalysis.asymmetryIndex || 0) * 100)),
                // Overall metrics (same calculation as live preview)
                overallSymmetry: overallSymmetry,
                facialAsymmetryGrade: facialAsymmetryGrade,
                // Additional compatibility fields
                cheekSymmetry: 90.0 // Not calculated in image mode
            },
            detailedAnalysis: {
                eyebrow: eyebrowAnalysis,
                eye: eyeAnalysis,
                mouth: mouthAnalysis
            },
            asymmetries: this.generateAsymmetryList(eyebrowAnalysis, eyeAnalysis, mouthAnalysis),
            overallScore: this.calculateOverallScore(eyebrowAnalysis, eyeAnalysis, mouthAnalysis),
            landmarkCounts: {
                baseline: baseline.length,
                eyebrowRaise: eyebrowRaise.length,
                eyeClose: eyeClose.length,
                smile: smile.length
            }
        };
        console.log('ImageAnalysisController: Generated results:', results);
        return results;
    }
    /**
     * Run robust analysis with fresh landmark extraction for each iteration
     */
    async runRobustAnalysisWithFreshLandmarks(analysisType, baselineAction, actionType) {
        console.log(`🔬 ROBUST ANALYSIS WITH FRESH LANDMARK EXTRACTION`);
        console.log(`Analysis Type: ${analysisType}`);
        console.log(`Baseline Action: ${baselineAction}, Action Type: ${actionType}`);
        const iterations = 10;
        const results = [];
        // Get image data from localStorage for fresh extraction
        const uploadedImagesData = localStorage.getItem('uploadedImages');
        if (!uploadedImagesData) {
            throw new Error('No uploaded images found for robust analysis');
        }
        const imageData = JSON.parse(uploadedImagesData);
        const baselineImageData = imageData[baselineAction];
        const actionImageData = imageData[actionType];
        if (!baselineImageData || !actionImageData) {
            throw new Error(`Missing image data for ${baselineAction} or ${actionType}`);
        }
        console.log(`Running ${iterations} iterations with fresh landmark extraction...`);
        // Run analysis multiple times with fresh landmark extraction each time
        for (let i = 0; i < iterations; i++) {
            try {
                console.log(`🔄 Iteration ${i + 1}/${iterations}: Extracting fresh landmarks...`);
                // Extract fresh landmarks for this iteration
                const baselineLandmarks = await this.extractLandmarksFromImage(baselineImageData, `${baselineAction}-iter${i + 1}`);
                const actionLandmarks = await this.extractLandmarksFromImage(actionImageData, `${actionType}-iter${i + 1}`);
                // Validate landmark extraction
                if (!baselineLandmarks || baselineLandmarks.length < 468 || !actionLandmarks || actionLandmarks.length < 468) {
                    console.warn(`Iteration ${i + 1}: Insufficient landmarks extracted`);
                    continue;
                }
                // Run analysis with fresh landmarks
                let result;
                switch (analysisType) {
                    case 'eyebrow':
                        result = this.calculateEnhancedEyebrowAnalysis(baselineLandmarks, actionLandmarks);
                        break;
                    case 'eye':
                        result = this.calculateEnhancedEyeAnalysis(baselineLandmarks, actionLandmarks);
                        break;
                    case 'mouth':
                        result = calculateEnhancedMouthAnalysis(baselineLandmarks, actionLandmarks);
                        break;
                    default:
                        throw new Error(`Unknown analysis type: ${analysisType}`);
                }
                // Store result with iteration number and landmark info
                results.push({
                    iteration: i + 1,
                    result: result,
                    landmarkCounts: {
                        baseline: baselineLandmarks.length,
                        action: actionLandmarks.length
                    }
                });
                const leftValue = result.leftMovement || result.leftElevation || result.leftClosurePercentage;
                const rightValue = result.rightMovement || result.rightElevation || result.rightClosurePercentage;
                const asymmetryValue = result.asymmetryPercentage || (result.asymmetryIndex * 100);
                console.log(`✅ Iteration ${i + 1}: Left=${leftValue?.toFixed(4)}, Right=${rightValue?.toFixed(4)}, Asymmetry=${asymmetryValue?.toFixed(2)}%`);
            }
            catch (error) {
                console.warn(`❌ Iteration ${i + 1} failed:`, error);
            }
        }
        if (results.length === 0) {
            throw new Error(`All ${analysisType} analysis iterations failed`);
        }
        console.log(`📊 ${analysisType} analysis: ${results.length}/${iterations} iterations successful`);
        // Filter outliers and calculate median
        return this.calculateRobustMedianWithDetails(results, analysisType);
    }
    /**
     * Run robust analysis with multiple iterations, outlier filtering, and median calculation
     */
    runRobustAnalysis(analysisType, baseline, action) {
        console.log(`Running robust ${analysisType} analysis with 10 iterations...`);
        const iterations = 10;
        const results = [];
        // Run analysis multiple times
        for (let i = 0; i < iterations; i++) {
            try {
                let result;
                switch (analysisType) {
                    case 'eyebrow':
                        result = this.calculateEnhancedEyebrowAnalysis(baseline, action);
                        break;
                    case 'eye':
                        result = this.calculateEnhancedEyeAnalysis(baseline, action);
                        break;
                    case 'mouth':
                        result = calculateEnhancedMouthAnalysis(baseline, action);
                        break;
                    default:
                        throw new Error(`Unknown analysis type: ${analysisType}`);
                }
                // Store result with iteration number
                results.push({
                    iteration: i + 1,
                    result: result
                });
                console.log(`${analysisType} iteration ${i + 1}: Left=${result.leftMovement || result.leftElevation || result.leftClosurePercentage}, Right=${result.rightMovement || result.rightElevation || result.rightClosurePercentage}, Asymmetry=${result.asymmetryPercentage || (result.asymmetryIndex * 100)}`);
            }
            catch (error) {
                console.warn(`${analysisType} iteration ${i + 1} failed:`, error);
            }
        }
        if (results.length === 0) {
            throw new Error(`All ${analysisType} analysis iterations failed`);
        }
        console.log(`${analysisType} analysis: ${results.length}/${iterations} iterations successful`);
        // Filter outliers and calculate median
        return this.calculateRobustMedian(results, analysisType);
    }
    /**
     * Filter outliers using IQR method and calculate median with detailed outlier reporting
     */
    calculateRobustMedianWithDetails(results, analysisType) {
        console.log(`🔍 DETAILED OUTLIER ANALYSIS FOR ${analysisType.toUpperCase()}`);
        console.log(`Total iterations: ${results.length}`);
        // Extract key metrics based on analysis type
        let leftValues = [];
        let rightValues = [];
        let asymmetryValues = [];
        results.forEach((r, index) => {
            const result = r.result;
            if (analysisType === 'mouth') {
                if (typeof result.leftMovement === 'number') {
                    leftValues.push(result.leftMovement);
                    console.log(`Iteration ${index + 1}: Left=${result.leftMovement.toFixed(4)}mm`);
                }
                if (typeof result.rightMovement === 'number') {
                    rightValues.push(result.rightMovement);
                    console.log(`Iteration ${index + 1}: Right=${result.rightMovement.toFixed(4)}mm`);
                }
                if (typeof result.asymmetryIndex === 'number') {
                    asymmetryValues.push(result.asymmetryIndex * 100);
                    console.log(`Iteration ${index + 1}: Asymmetry=${(result.asymmetryIndex * 100).toFixed(2)}%`);
                }
            }
            else if (analysisType === 'eyebrow') {
                if (typeof result.leftElevation === 'number')
                    leftValues.push(result.leftElevation);
                if (typeof result.rightElevation === 'number')
                    rightValues.push(result.rightElevation);
                if (typeof result.asymmetryPercentage === 'number')
                    asymmetryValues.push(result.asymmetryPercentage);
            }
            else if (analysisType === 'eye') {
                if (typeof result.leftClosurePercentage === 'number')
                    leftValues.push(result.leftClosurePercentage);
                if (typeof result.rightClosurePercentage === 'number')
                    rightValues.push(result.rightClosurePercentage);
                if (typeof result.asymmetryPercentage === 'number')
                    asymmetryValues.push(result.asymmetryPercentage);
            }
        });
        console.log(`\n📊 RAW VALUES SUMMARY:`);
        console.log(`Left values: [${leftValues.map(v => v.toFixed(4)).join(', ')}]`);
        console.log(`Right values: [${rightValues.map(v => v.toFixed(4)).join(', ')}]`);
        console.log(`Asymmetry values: [${asymmetryValues.map(v => v.toFixed(2)).join(', ')}]`);
        // Filter outliers and calculate medians with detailed reporting
        const leftOutlierAnalysis = this.filterOutliersWithDetails(leftValues, 'Left Movement');
        const rightOutlierAnalysis = this.filterOutliersWithDetails(rightValues, 'Right Movement');
        const asymmetryOutlierAnalysis = this.filterOutliersWithDetails(asymmetryValues, 'Asymmetry');
        const medianLeft = this.calculateMedian(leftOutlierAnalysis.filtered);
        const medianRight = this.calculateMedian(rightOutlierAnalysis.filtered);
        const medianAsymmetry = this.calculateMedian(asymmetryOutlierAnalysis.filtered);
        console.log(`\n🎯 FINAL MEDIAN RESULTS:`);
        console.log(`Left median: ${medianLeft?.toFixed(4) || 'N/A'}`);
        console.log(`Right median: ${medianRight?.toFixed(4) || 'N/A'}`);
        console.log(`Asymmetry median: ${medianAsymmetry?.toFixed(2) || 'N/A'}%`);
        // Use the first successful result as template and update with median values
        const template = results[0].result;
        if (analysisType === 'mouth') {
            return {
                ...template,
                leftMovement: medianLeft || 0,
                rightMovement: medianRight || 0,
                asymmetryIndex: (medianAsymmetry || 0) / 100,
                severity: this.calculateSeverity((medianAsymmetry || 0) / 100),
                affectedSide: (medianLeft || 0) < (medianRight || 0) ? 'Left' : 'Right',
                robustAnalysis: {
                    iterations: results.length,
                    outlierAnalysis: {
                        left: leftOutlierAnalysis,
                        right: rightOutlierAnalysis,
                        asymmetry: asymmetryOutlierAnalysis
                    },
                    medianValues: {
                        left: medianLeft,
                        right: medianRight,
                        asymmetry: medianAsymmetry
                    },
                    rawIterationData: results.map(r => ({
                        iteration: r.iteration,
                        leftMovement: r.result.leftMovement,
                        rightMovement: r.result.rightMovement,
                        asymmetryIndex: r.result.asymmetryIndex
                    }))
                }
            };
        }
        else if (analysisType === 'eyebrow') {
            return {
                ...template,
                leftElevation: medianLeft || 0,
                rightElevation: medianRight || 0,
                asymmetryPercentage: medianAsymmetry || 0,
                robustAnalysis: {
                    iterations: results.length,
                    outlierAnalysis: {
                        left: leftOutlierAnalysis,
                        right: rightOutlierAnalysis,
                        asymmetry: asymmetryOutlierAnalysis
                    }
                }
            };
        }
        else if (analysisType === 'eye') {
            return {
                ...template,
                leftClosurePercentage: medianLeft || 0,
                rightClosurePercentage: medianRight || 0,
                asymmetryPercentage: medianAsymmetry || 0,
                robustAnalysis: {
                    iterations: results.length,
                    outlierAnalysis: {
                        left: leftOutlierAnalysis,
                        right: rightOutlierAnalysis,
                        asymmetry: asymmetryOutlierAnalysis
                    }
                }
            };
        }
        return template;
    }
    /**
     * Filter outliers using IQR method and calculate median of remaining values
     */
    calculateRobustMedian(results, analysisType) {
        console.log(`Calculating robust median for ${analysisType} analysis...`);
        // Extract key metrics based on analysis type
        let leftValues = [];
        let rightValues = [];
        let asymmetryValues = [];
        results.forEach(r => {
            const result = r.result;
            if (analysisType === 'mouth') {
                if (typeof result.leftMovement === 'number')
                    leftValues.push(result.leftMovement);
                if (typeof result.rightMovement === 'number')
                    rightValues.push(result.rightMovement);
                if (typeof result.asymmetryIndex === 'number')
                    asymmetryValues.push(result.asymmetryIndex * 100);
            }
            else if (analysisType === 'eyebrow') {
                if (typeof result.leftElevation === 'number')
                    leftValues.push(result.leftElevation);
                if (typeof result.rightElevation === 'number')
                    rightValues.push(result.rightElevation);
                if (typeof result.asymmetryPercentage === 'number')
                    asymmetryValues.push(result.asymmetryPercentage);
            }
            else if (analysisType === 'eye') {
                if (typeof result.leftClosurePercentage === 'number')
                    leftValues.push(result.leftClosurePercentage);
                if (typeof result.rightClosurePercentage === 'number')
                    rightValues.push(result.rightClosurePercentage);
                if (typeof result.asymmetryPercentage === 'number')
                    asymmetryValues.push(result.asymmetryPercentage);
            }
        });
        // Filter outliers and calculate medians
        const filteredLeft = this.filterOutliers(leftValues);
        const filteredRight = this.filterOutliers(rightValues);
        const filteredAsymmetry = this.filterOutliers(asymmetryValues);
        const medianLeft = this.calculateMedian(filteredLeft);
        const medianRight = this.calculateMedian(filteredRight);
        const medianAsymmetry = this.calculateMedian(filteredAsymmetry);
        console.log(`${analysisType} robust results: Left=${medianLeft?.toFixed(4)}, Right=${medianRight?.toFixed(4)}, Asymmetry=${medianAsymmetry?.toFixed(2)}%`);
        console.log(`${analysisType} outliers removed: Left=${leftValues.length - filteredLeft.length}, Right=${rightValues.length - filteredRight.length}, Asymmetry=${asymmetryValues.length - filteredAsymmetry.length}`);
        // Use the first successful result as template and update with median values
        const template = results[0].result;
        if (analysisType === 'mouth') {
            return {
                ...template,
                leftMovement: medianLeft || 0,
                rightMovement: medianRight || 0,
                asymmetryIndex: (medianAsymmetry || 0) / 100,
                severity: this.calculateSeverity((medianAsymmetry || 0) / 100),
                affectedSide: (medianLeft || 0) < (medianRight || 0) ? 'Left' : 'Right',
                robustAnalysis: {
                    iterations: results.length,
                    outliersRemoved: {
                        left: leftValues.length - filteredLeft.length,
                        right: rightValues.length - filteredRight.length,
                        asymmetry: asymmetryValues.length - filteredAsymmetry.length
                    },
                    rawValues: {
                        left: leftValues,
                        right: rightValues,
                        asymmetry: asymmetryValues
                    },
                    filteredValues: {
                        left: filteredLeft,
                        right: filteredRight,
                        asymmetry: filteredAsymmetry
                    }
                }
            };
        }
        else if (analysisType === 'eyebrow') {
            return {
                ...template,
                leftElevation: medianLeft || 0,
                rightElevation: medianRight || 0,
                asymmetryPercentage: medianAsymmetry || 0,
                robustAnalysis: {
                    iterations: results.length,
                    outliersRemoved: {
                        left: leftValues.length - filteredLeft.length,
                        right: rightValues.length - filteredRight.length,
                        asymmetry: asymmetryValues.length - filteredAsymmetry.length
                    }
                }
            };
        }
        else if (analysisType === 'eye') {
            return {
                ...template,
                leftClosurePercentage: medianLeft || 0,
                rightClosurePercentage: medianRight || 0,
                asymmetryPercentage: medianAsymmetry || 0,
                robustAnalysis: {
                    iterations: results.length,
                    outliersRemoved: {
                        left: leftValues.length - filteredLeft.length,
                        right: rightValues.length - filteredRight.length,
                        asymmetry: asymmetryValues.length - filteredAsymmetry.length
                    }
                }
            };
        }
        return template;
    }
    /**
     * Filter outliers using IQR method with detailed reporting
     */
    filterOutliersWithDetails(values, metricName) {
        console.log(`\n🔍 OUTLIER DETECTION FOR ${metricName}:`);
        console.log(`Input values: [${values.map(v => v.toFixed(4)).join(', ')}]`);
        if (values.length < 4) {
            console.log(`⚠️  Insufficient data for outlier detection (need ≥4 values, got ${values.length})`);
            return {
                original: values,
                filtered: values,
                outliers: [],
                statistics: {
                    q1: null,
                    q3: null,
                    iqr: null,
                    lowerBound: null,
                    upperBound: null
                },
                summary: `No outlier filtering applied (insufficient data)`
            };
        }
        const sorted = [...values].sort((a, b) => a - b);
        const q1Index = Math.floor(sorted.length * 0.25);
        const q3Index = Math.floor(sorted.length * 0.75);
        const q1 = sorted[q1Index];
        const q3 = sorted[q3Index];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        console.log(`📊 IQR Statistics:`);
        console.log(`   Q1 (25th percentile): ${q1.toFixed(4)}`);
        console.log(`   Q3 (75th percentile): ${q3.toFixed(4)}`);
        console.log(`   IQR (Q3 - Q1): ${iqr.toFixed(4)}`);
        console.log(`   Lower bound (Q1 - 1.5×IQR): ${lowerBound.toFixed(4)}`);
        console.log(`   Upper bound (Q3 + 1.5×IQR): ${upperBound.toFixed(4)}`);
        const filtered = [];
        const outliers = [];
        values.forEach((value, index) => {
            if (value >= lowerBound && value <= upperBound) {
                filtered.push(value);
                console.log(`   ✅ Value ${index + 1}: ${value.toFixed(4)} (within bounds)`);
            }
            else {
                outliers.push({ value, index: index + 1 });
                console.log(`   ❌ Value ${index + 1}: ${value.toFixed(4)} (OUTLIER - ${value < lowerBound ? 'below lower' : 'above upper'} bound)`);
            }
        });
        console.log(`🎯 Outlier Detection Summary:`);
        console.log(`   Original values: ${values.length}`);
        console.log(`   Filtered values: ${filtered.length}`);
        console.log(`   Outliers removed: ${outliers.length}`);
        console.log(`   Outlier percentage: ${((outliers.length / values.length) * 100).toFixed(1)}%`);
        if (outliers.length > 0) {
            console.log(`   Outlier details: ${outliers.map(o => `${o.value.toFixed(4)} (iteration ${o.index})`).join(', ')}`);
        }
        return {
            original: values,
            filtered: filtered,
            outliers: outliers,
            statistics: {
                q1: q1,
                q3: q3,
                iqr: iqr,
                lowerBound: lowerBound,
                upperBound: upperBound
            },
            summary: `Removed ${outliers.length}/${values.length} outliers using IQR method`
        };
    }
    /**
     * Filter outliers using Interquartile Range (IQR) method
     */
    filterOutliers(values) {
        if (values.length < 4)
            return values; // Need at least 4 values for IQR
        const sorted = [...values].sort((a, b) => a - b);
        const q1Index = Math.floor(sorted.length * 0.25);
        const q3Index = Math.floor(sorted.length * 0.75);
        const q1 = sorted[q1Index];
        const q3 = sorted[q3Index];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        const filtered = values.filter(value => value >= lowerBound && value <= upperBound);
        console.log(`Outlier filtering: ${values.length} -> ${filtered.length} values (removed ${values.length - filtered.length} outliers)`);
        console.log(`IQR bounds: [${lowerBound.toFixed(4)}, ${upperBound.toFixed(4)}]`);
        return filtered;
    }
    /**
     * Calculate median of an array of numbers
     */
    calculateMedian(values) {
        if (values.length === 0)
            return null;
        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        else {
            return sorted[middle];
        }
    }
    /**
     * Calculate severity based on asymmetry index
     */
    calculateSeverity(asymmetryIndex) {
        if (asymmetryIndex <= 0.05)
            return 'Normal';
        else if (asymmetryIndex <= 0.15)
            return 'Mild';
        else if (asymmetryIndex <= 0.30)
            return 'Moderate';
        else
            return 'Severe';
    }
    /**
     * Calculate enhanced eyebrow elevation analysis using five-point measurement system
     * EXACT SAME METHOD as used in live camera preview (ExamController)
     */
    calculateEnhancedEyebrowAnalysis(baseline, eyebrowRaise) {
        console.log('ImageAnalysisController: Calculating enhanced eyebrow analysis using landmarks 70,63,105,66,107 (left) and 300,293,334,296,336 (right)');
        if (baseline.length < 468 || eyebrowRaise.length < 468) {
            console.warn('Insufficient landmark data for eyebrow analysis');
            return {
                leftElevation: 0,
                rightElevation: 0,
                asymmetryPercentage: 0,
                dataQuality: 'insufficient',
                landmarksUsed: { left: [70, 63, 105, 66, 107], right: [300, 293, 334, 296, 336], reference: [33, 263] }
            };
        }
        try {
            // Define specific eyebrow landmarks as requested
            const leftEyebrowLandmarks = [70, 63, 105, 66, 107];
            const rightEyebrowLandmarks = [300, 293, 334, 296, 336];
            // Extract landmark points for baseline and raised positions
            const baselineLeftEyebrow = leftEyebrowLandmarks.map(idx => baseline[idx]);
            const baselineRightEyebrow = rightEyebrowLandmarks.map(idx => baseline[idx]);
            const raisedLeftEyebrow = leftEyebrowLandmarks.map(idx => eyebrowRaise[idx]);
            const raisedRightEyebrow = rightEyebrowLandmarks.map(idx => eyebrowRaise[idx]);
            // Validate all landmarks are available
            const missingLeftBaseline = baselineLeftEyebrow.some(point => !point);
            const missingRightBaseline = baselineRightEyebrow.some(point => !point);
            const missingLeftRaised = raisedLeftEyebrow.some(point => !point);
            const missingRightRaised = raisedRightEyebrow.some(point => !point);
            if (missingLeftBaseline || missingRightBaseline || missingLeftRaised || missingRightRaised) {
                console.warn('Missing eyebrow landmark points:', {
                    missingLeftBaseline, missingRightBaseline, missingLeftRaised, missingRightRaised
                });
                return {
                    leftElevation: 0,
                    rightElevation: 0,
                    asymmetryPercentage: 0,
                    dataQuality: 'incomplete',
                    landmarksUsed: { left: leftEyebrowLandmarks, right: rightEyebrowLandmarks, reference: [33, 263] }
                };
            }
            // Calculate face size for normalization (distance between outer canthi)
            const faceWidth = Math.sqrt(Math.pow(baseline[454].x - baseline[234].x, 2) +
                Math.pow(baseline[454].y - baseline[234].y, 2));
            // Calculate mean elevation for left eyebrow (normalized by face size)
            const leftElevations = baselineLeftEyebrow.map((baselinePoint, i) => {
                const raisedPoint = raisedLeftEyebrow[i];
                const rawElevation = Math.abs(baselinePoint.y - raisedPoint.y);
                return (rawElevation / faceWidth) * 100; // Normalize by face size and convert to percentage
            });
            // Calculate mean elevation for right eyebrow (normalized by face size)
            const rightElevations = baselineRightEyebrow.map((baselinePoint, i) => {
                const raisedPoint = raisedRightEyebrow[i];
                const rawElevation = Math.abs(baselinePoint.y - raisedPoint.y);
                return (rawElevation / faceWidth) * 100; // Normalize by face size and convert to percentage
            });
            const leftMeanElevation = leftElevations.reduce((sum, val) => sum + val, 0) / leftElevations.length;
            const rightMeanElevation = rightElevations.reduce((sum, val) => sum + val, 0) / rightElevations.length;
            // Calculate asymmetry percentage
            const rawAsymmetryPercentage = Math.abs(leftMeanElevation - rightMeanElevation) / Math.max(leftMeanElevation, rightMeanElevation) * 100;
            // Apply baseline correction for natural facial asymmetry (2-3% is normal)
            const baselineAsymmetryCorrection = 2.5; // Normal baseline asymmetry
            // Apply baseline correction - subtract natural asymmetry
            const asymmetryPercentage = Math.max(0, rawAsymmetryPercentage - baselineAsymmetryCorrection);
            console.log(`Eyebrow analysis: Left=${leftMeanElevation.toFixed(2)}mm, Right=${rightMeanElevation.toFixed(2)}mm, Asymmetry=${asymmetryPercentage.toFixed(1)}%`);
            return {
                leftElevation: leftMeanElevation,
                rightElevation: rightMeanElevation,
                asymmetryPercentage: asymmetryPercentage,
                dataQuality: 'excellent',
                landmarksUsed: { left: leftEyebrowLandmarks, right: rightEyebrowLandmarks, reference: [33, 263] },
                individualMeasurements: {
                    left: leftElevations,
                    right: rightElevations
                }
            };
        }
        catch (error) {
            console.error('Error in eyebrow analysis calculation:', error);
            return {
                leftElevation: 0,
                rightElevation: 0,
                asymmetryPercentage: 0,
                dataQuality: 'error',
                error: String(error)
            };
        }
    }
    /**
     * Calculate enhanced eye closure analysis using three-point measurement system
     * EXACT SAME METHOD as used in live camera preview (ExamController)
     */
    calculateEnhancedEyeAnalysis(baseline, eyeClose) {
        console.log('ImageAnalysisController: Calculating enhanced eye closure analysis using landmarks 159-145,158-153,160-144 (left) and 386-374,385-380,387-373 (right)');
        if (baseline.length < 468 || eyeClose.length < 468) {
            console.warn('Insufficient landmark data for eye closure analysis');
            return {
                leftClosurePercentage: 0,
                rightClosurePercentage: 0,
                asymmetryPercentage: 0,
                lagophthalmos: false,
                dataQuality: 'insufficient',
                landmarksUsed: {
                    left: [[159, 145], [158, 153], [160, 144]],
                    right: [[386, 374], [385, 380], [387, 373]]
                }
            };
        }
        try {
            // Define eye landmark pairs for vertical measurements
            const leftEyePairs = [[159, 145], [158, 153], [160, 144]]; // Top-bottom pairs for left eye
            const rightEyePairs = [[386, 374], [385, 380], [387, 373]]; // Top-bottom pairs for right eye
            // Calculate baseline eye opening distances
            const baselineLeftDistances = leftEyePairs.map(([top, bottom]) => {
                if (baseline[top] && baseline[bottom]) {
                    return Math.abs(baseline[top].y - baseline[bottom].y);
                }
                return 0;
            });
            const baselineRightDistances = rightEyePairs.map(([top, bottom]) => {
                if (baseline[top] && baseline[bottom]) {
                    return Math.abs(baseline[top].y - baseline[bottom].y);
                }
                return 0;
            });
            // Calculate eye closure distances
            const closureLeftDistances = leftEyePairs.map(([top, bottom]) => {
                if (eyeClose[top] && eyeClose[bottom]) {
                    return Math.abs(eyeClose[top].y - eyeClose[bottom].y);
                }
                return 0;
            });
            const closureRightDistances = rightEyePairs.map(([top, bottom]) => {
                if (eyeClose[top] && eyeClose[bottom]) {
                    return Math.abs(eyeClose[top].y - eyeClose[bottom].y);
                }
                return 0;
            });
            // Calculate closure percentages
            const leftClosurePercentages = baselineLeftDistances.map((baseline, i) => {
                if (baseline > 0) {
                    const closure = closureLeftDistances[i];
                    return Math.max(0, ((baseline - closure) / baseline) * 100);
                }
                return 0;
            });
            const rightClosurePercentages = baselineRightDistances.map((baseline, i) => {
                if (baseline > 0) {
                    const closure = closureRightDistances[i];
                    return Math.max(0, ((baseline - closure) / baseline) * 100);
                }
                return 0;
            });
            // Average closure percentages
            const leftClosurePercentage = leftClosurePercentages.reduce((sum, val) => sum + val, 0) / leftClosurePercentages.length;
            const rightClosurePercentage = rightClosurePercentages.reduce((sum, val) => sum + val, 0) / rightClosurePercentages.length;
            // Calculate asymmetry
            const asymmetryPercentage = Math.abs(leftClosurePercentage - rightClosurePercentage);
            // Detect lagophthalmos (incomplete eye closure)
            const lagophthalmos = Math.min(leftClosurePercentage, rightClosurePercentage) < 85; // Less than 85% closure indicates lagophthalmos
            console.log(`Eye closure analysis: Left=${leftClosurePercentage.toFixed(1)}%, Right=${rightClosurePercentage.toFixed(1)}%, Asymmetry=${asymmetryPercentage.toFixed(1)}%`);
            return {
                leftClosurePercentage: leftClosurePercentage,
                rightClosurePercentage: rightClosurePercentage,
                asymmetryPercentage: asymmetryPercentage,
                lagophthalmos: lagophthalmos,
                dataQuality: 'excellent',
                landmarksUsed: {
                    left: [[159, 145], [158, 153], [160, 144]],
                    right: [[386, 374], [385, 380], [387, 373]]
                },
                individualMeasurements: {
                    leftBaseline: baselineLeftDistances,
                    rightBaseline: baselineRightDistances,
                    leftClosure: closureLeftDistances,
                    rightClosure: closureRightDistances
                }
            };
        }
        catch (error) {
            console.error('Error in eye closure analysis calculation:', error);
            return {
                leftClosurePercentage: 0,
                rightClosurePercentage: 0,
                asymmetryPercentage: 0,
                lagophthalmos: false,
                dataQuality: 'error',
                error: String(error)
            };
        }
    }
    // Mouth analysis method moved to ImageAnalysisHelpers.ts for consistency
    // House-Brackmann calculation method moved to ImageAnalysisHelpers.ts for consistency
    /**
     * Generate asymmetry list for detailed analysis
     */
    generateAsymmetryList(eyebrowAnalysis, eyeAnalysis, mouthAnalysis) {
        const asymmetries = [];
        // Add eyebrow asymmetries
        if (eyebrowAnalysis.asymmetryPercentage > 10) {
            asymmetries.push({
                feature: 'Eyebrow Elevation',
                severity: eyebrowAnalysis.asymmetryPercentage > 30 ? 'Severe' :
                    eyebrowAnalysis.asymmetryPercentage > 15 ? 'Moderate' : 'Mild',
                measurement: `${eyebrowAnalysis.asymmetryPercentage.toFixed(1)}% asymmetry`
            });
        }
        // Add eye asymmetries
        if (eyeAnalysis.asymmetryPercentage > 10) {
            asymmetries.push({
                feature: 'Eye Closure',
                severity: eyeAnalysis.asymmetryPercentage > 30 ? 'Severe' :
                    eyeAnalysis.asymmetryPercentage > 15 ? 'Moderate' : 'Mild',
                measurement: `${eyeAnalysis.asymmetryPercentage.toFixed(1)}% asymmetry`
            });
        }
        // Add mouth asymmetries
        if (mouthAnalysis.asymmetryIndex > 0.1) {
            asymmetries.push({
                feature: 'Smile Movement',
                severity: mouthAnalysis.severity,
                measurement: `${(mouthAnalysis.asymmetryIndex * 100).toFixed(1)}% asymmetry`
            });
        }
        return asymmetries;
    }
    /**
     * Calculate overall score for compatibility
     */
    calculateOverallScore(eyebrowAnalysis, eyeAnalysis, mouthAnalysis) {
        // Use the same calculation as overall symmetry
        return calculateOverallSymmetryScore(eyebrowAnalysis, eyeAnalysis, mouthAnalysis);
    }
    /**
     * Get patient information from localStorage or defaults
     */
    getPatientInfo() {
        try {
            const stored = localStorage.getItem('currentPatientData');
            if (stored) {
                return JSON.parse(stored);
            }
        }
        catch (error) {
            console.error('Error reading patient data:', error);
        }
        return {
            name: 'Image Assessment Patient',
            age: 'Unknown',
            id: 'IMG-' + Date.now()
        };
    }
}
