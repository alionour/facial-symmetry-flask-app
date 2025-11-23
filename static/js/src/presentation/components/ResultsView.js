// Import removed - export functionality now implemented directly in ResultsView
// ResultsView.ts
// Handles rendering of the results page and exporting results in various formats
import { VersionManager } from '../../core/version/VersionManager.js';
export class ResultsView {
    setResults(results) {
        console.log('ResultsView.setResults - Received results:', results);
        this.examResults = results;
    }
    renderResultsPage() {
        console.log('ResultsView.renderResultsPage - Current examResults:', this.examResults);
        if (!this.examResults) {
            console.warn('ResultsView.renderResultsPage - No exam results available');
            return;
        }
        // Remove existing results page if any
        const existingResults = document.getElementById('resultsPage');
        if (existingResults) {
            console.log('ResultsView.renderResultsPage - Removing existing results page');
            existingResults.remove();
        }
        // Insert results page into document
        const html = this.generateResultsHTML();
        console.log('ResultsView.renderResultsPage - Generated HTML length:', html.length);
        document.body.insertAdjacentHTML('beforeend', html);
        this.setupResultsEventListeners();
    }
    /**
     * Generate results HTML for the dedicated results route
     */
    generateResultsHTML() {
        console.log('ResultsView.generateResultsHTML - Generating HTML with examResults:', this.examResults);
        return this.generateResultsHTMLInternal();
    }
    /**
     * Set up event listeners for the results page
     */
    setupEventListeners() {
        console.log('ResultsView.setupEventListeners - Setting up event listeners');
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            this.setupResultsEventListeners();
        }, 100);
    }
    // --- The following methods are adapted from ExamController ---
    generateResultsHTMLInternal() {
        console.log('ResultsView.generateResultsHTMLInternal - Starting HTML generation');
        console.log('ResultsView.generateResultsHTMLInternal - Using examResults:', this.examResults);
        const results = this.examResults;
        const patient = results.patientData;
        const overallScore = results.analysisResult.symmetryMetrics.overallScore;
        console.log('ResultsView.generateResultsHTMLInternal - Patient info:', patient);
        // --- Peak Frame Images Section ---
        const peakImages = results.peakFrameImages || {};
        // Debug: Log what images we received in ResultsView
        console.log('🖼️ ResultsView - Peak Frame Images Debug:');
        console.log('  Baseline image:', peakImages.baseline ? 'EXISTS' : 'MISSING');
        console.log('  Eyebrow raise image:', peakImages.eyebrowRaise ? 'EXISTS' : 'MISSING');
        console.log('  Eye close image:', peakImages.eyeClose ? 'EXISTS' : 'MISSING');
        console.log('  Smile image:', peakImages.smile ? 'EXISTS' : 'MISSING');
        console.log('  Raw peakFrameImages object:', results.peakFrameImages);
        const imageSection = `
      <div style="padding: 30px; border-bottom: 1px solid #e1e8ed; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
        <div style="display: flex; align-items: center; margin-bottom: 25px;" title="Optimal facial expressions captured during peak movement for each action">
          <div style="
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2em;
            margin-right: 15px;
            box-shadow: 0 3px 10px rgba(231, 76, 60, 0.3);
          ">
            📸
          </div>
          <h2 style="color: #2c3e50; margin: 0; font-size: 1.4em; font-weight: 600;">
            Peak Frame Images
          </h2>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 25px; justify-items: center;">

          <!-- Neutral/Baseline Image -->
          ${peakImages.baseline ? `
            <div style="
              background: white;
              border-radius: 16px;
              padding: 20px;
              box-shadow: 0 6px 20px rgba(0,0,0,0.1);
              transition: all 0.3s ease;
              border: 1px solid #e1e8ed;
              text-align: center;
            " onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'">
              <div style="
                background: linear-gradient(135deg, #3498db, #2980b9);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                margin-bottom: 15px;
                font-size: 0.9em;
                display: inline-block;
                box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
              ">
                😐 Neutral Expression
              </div>
              <img src="${peakImages.baseline}" alt="Neutral peak frame" style="
                width: 240px;
                height: 240px;
                object-fit: cover;
                border-radius: 12px;
                border: 3px solid #f8f9fa;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                background: #fafbfc;
                transition: all 0.3s ease;
              " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'"
                 onerror="this.style.opacity='0.3'; this.src=''; this.parentNode.querySelector('.img-error-msg').style.display='block';" />
              <div class="img-error-msg" style="display: none; color: #e74c3c; font-size: 0.9em; margin-top: 8px;">Image failed to load</div>
            </div>
          ` : `
            <div style="
              background: white;
              border-radius: 16px;
              padding: 20px;
              box-shadow: 0 6px 20px rgba(0,0,0,0.1);
              border: 1px solid #e1e8ed;
              text-align: center;
              opacity: 0.7;
            ">
              <div style="
                background: #6c757d;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                margin-bottom: 15px;
                font-size: 0.9em;
                display: inline-block;
              ">
                😐 Neutral Expression
              </div>
              <div style="
                width: 240px;
                height: 240px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
                border: 2px dashed #ccc;
                background: #f8f9fa;
                color: #aaa;
                font-size: 1em;
                flex-direction: column;
                gap: 10px;
                margin: 0 auto;
              ">
                <div style="font-size: 2em;">📷</div>
                <div style="font-weight: 500;">No Image Available</div>
              </div>
            </div>
          `}

          <!-- Eyebrow Raise Image -->
          ${peakImages.eyebrowRaise ? `
            <div style="
              background: white;
              border-radius: 16px;
              padding: 20px;
              box-shadow: 0 6px 20px rgba(0,0,0,0.1);
              transition: all 0.3s ease;
              border: 1px solid #e1e8ed;
              text-align: center;
            " onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'">
              <div style="
                background: linear-gradient(135deg, #f39c12, #e67e22);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                margin-bottom: 15px;
                font-size: 0.9em;
                display: inline-block;
                box-shadow: 0 2px 8px rgba(243, 156, 18, 0.3);
              ">
                🤨 Eyebrow Raise
              </div>
              <img src="${peakImages.eyebrowRaise}" alt="Eyebrow raise peak frame" style="
                width: 240px;
                height: 240px;
                object-fit: cover;
                border-radius: 12px;
                border: 3px solid #f8f9fa;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                background: #fafbfc;
                transition: all 0.3s ease;
              " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'"
                 onerror="this.style.opacity='0.3'; this.src=''; this.parentNode.querySelector('.img-error-msg').style.display='block';" />
              <div class="img-error-msg" style="display: none; color: #e74c3c; font-size: 0.9em; margin-top: 8px;">Image failed to load</div>
            </div>
          ` : `
            <div style="
              background: white;
              border-radius: 16px;
              padding: 20px;
              box-shadow: 0 6px 20px rgba(0,0,0,0.1);
              border: 1px solid #e1e8ed;
              text-align: center;
              opacity: 0.7;
            ">
              <div style="
                background: #6c757d;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                margin-bottom: 15px;
                font-size: 0.9em;
                display: inline-block;
              ">
                🤨 Eyebrow Raise
              </div>
              <div style="
                width: 240px;
                height: 240px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
                border: 2px dashed #ccc;
                background: #f8f9fa;
                color: #aaa;
                font-size: 1em;
                flex-direction: column;
                gap: 10px;
                margin: 0 auto;
              ">
                <div style="font-size: 2em;">📷</div>
                <div style="font-weight: 500;">No Image Available</div>
              </div>
            </div>
          `}

          <!-- Eye Close Image -->
          ${peakImages.eyeClose ? `
            <div style="
              background: white;
              border-radius: 16px;
              padding: 20px;
              box-shadow: 0 6px 20px rgba(0,0,0,0.1);
              transition: all 0.3s ease;
              border: 1px solid #e1e8ed;
              text-align: center;
            " onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'">
              <div style="
                background: linear-gradient(135deg, #9b59b6, #8e44ad);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                margin-bottom: 15px;
                font-size: 0.9em;
                display: inline-block;
                box-shadow: 0 2px 8px rgba(155, 89, 182, 0.3);
              ">
                😑 Eye Closure
              </div>
              <img src="${peakImages.eyeClose}" alt="Eye close peak frame" style="
                width: 240px;
                height: 240px;
                object-fit: cover;
                border-radius: 12px;
                border: 3px solid #f8f9fa;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                background: #fafbfc;
                transition: all 0.3s ease;
              " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'"
                 onerror="this.style.opacity='0.3'; this.src=''; this.parentNode.querySelector('.img-error-msg').style.display='block';" />
              <div class="img-error-msg" style="display: none; color: #e74c3c; font-size: 0.9em; margin-top: 8px;">Image failed to load</div>
            </div>
          ` : `
            <div style="
              background: white;
              border-radius: 16px;
              padding: 20px;
              box-shadow: 0 6px 20px rgba(0,0,0,0.1);
              border: 1px solid #e1e8ed;
              text-align: center;
              opacity: 0.7;
            ">
              <div style="
                background: #6c757d;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                margin-bottom: 15px;
                font-size: 0.9em;
                display: inline-block;
              ">
                😑 Eye Closure
              </div>
              <div style="
                width: 240px;
                height: 240px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
                border: 2px dashed #ccc;
                background: #f8f9fa;
                color: #aaa;
                font-size: 1em;
                flex-direction: column;
                gap: 10px;
                margin: 0 auto;
              ">
                <div style="font-size: 2em;">📷</div>
                <div style="font-weight: 500;">No Image Available</div>
              </div>
            </div>
          `}

          <!-- Smile Image -->
          ${peakImages.smile ? `
            <div style="
              background: white;
              border-radius: 16px;
              padding: 20px;
              box-shadow: 0 6px 20px rgba(0,0,0,0.1);
              transition: all 0.3s ease;
              border: 1px solid #e1e8ed;
              text-align: center;
            " onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'">
              <div style="
                background: linear-gradient(135deg, #27ae60, #2ecc71);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                margin-bottom: 15px;
                font-size: 0.9em;
                display: inline-block;
                box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
              ">
                😊 Smile
              </div>
              <img src="${peakImages.smile}" alt="Smile peak frame" style="
                width: 240px;
                height: 240px;
                object-fit: cover;
                border-radius: 12px;
                border: 3px solid #f8f9fa;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                background: #fafbfc;
                transition: all 0.3s ease;
              " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'"
                 onerror="this.style.opacity='0.3'; this.src=''; this.parentNode.querySelector('.img-error-msg').style.display='block';" />
              <div class="img-error-msg" style="display: none; color: #e74c3c; font-size: 0.9em; margin-top: 8px;">Image failed to load</div>
            </div>
          ` : `
            <div style="
              background: white;
              border-radius: 16px;
              padding: 20px;
              box-shadow: 0 6px 20px rgba(0,0,0,0.1);
              border: 1px solid #e1e8ed;
              text-align: center;
              opacity: 0.7;
            ">
              <div style="
                background: #6c757d;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                margin-bottom: 15px;
                font-size: 0.9em;
                display: inline-block;
              ">
                😊 Smile
              </div>
              <div style="
                width: 240px;
                height: 240px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
                border: 2px dashed #ccc;
                background: #f8f9fa;
                color: #aaa;
                font-size: 1em;
                flex-direction: column;
                gap: 10px;
                margin: 0 auto;
              ">
                <div style="font-size: 2em;">📷</div>
                <div style="font-weight: 500;">No Image Available</div>
              </div>
            </div>
          `}

        </div>
      </div>
    `;
        return `
      <!-- Print Styles -->
      <style>
        @media print {
          body { margin: 0; padding: 0; background: white !important; }
          #resultsPage {
            background: white !important;
            padding: 10px !important;
            min-height: auto !important;
          }
          .print-hide { display: none !important; }
          .print-break { page-break-after: always; }
          h1, h2, h3 { color: #000 !important; }
          .gradient-bg { background: #f8f9fa !important; color: #000 !important; }
          .card-shadow { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      </style>
      <div id="resultsPage" style="
        background: #f6f8fa;
        min-height: 100vh;
        padding: 20px;
        font-family: 'Segoe UI', Arial, sans-serif;
      ">
        <div style="
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(44,62,80,0.12);
          overflow: hidden;
        ">
          <!-- Header -->
          <div style="
            background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
            color: white;
            padding: 30px;
            text-align: center;
          ">
            <h1 style="margin: 0; font-size: 2.2em; font-weight: 300;">
              Facial Symmetry Analysis Results
            </h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 1.1em;">
              Complete Examination Report
            </p>
          </div>

          <!-- Data Storage Alert -->
          <div class="print-hide" style="
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
            border-radius: 0;
            padding: 20px 30px;
            margin: 0;
            font-size: 1.1em;
            display: flex;
            align-items: center;
            gap: 15px;
            border-bottom: 1px solid #e1e8ed;
          ">
            <span style="font-size: 1.8em;">⚠️</span>
            <div>
              <strong>Important Notice:</strong> Your examination results are <u>not stored</u> in this system.
              <br><strong>Please download your report now</strong> if you wish to keep a copy for your records.
            </div>
          </div>

          <!-- Patient Information -->
          <div style="padding: 25px; border-bottom: 1px solid #e1e8ed; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <div style="
                background: linear-gradient(135deg, #3498db, #2c3e50);
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2em;
                margin-right: 15px;
                box-shadow: 0 3px 10px rgba(52, 152, 219, 0.3);
              ">
                👤
              </div>
              <h2 style="color: #2c3e50; margin: 0; font-size: 1.5em; font-weight: 600;">
                Patient Information
              </h2>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px;">
              <div style="
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                border-left: 3px solid #3498db;
                transition: transform 0.2s ease;
              " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="color: #6c757d; font-size: 0.8em; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Patient ID</div>
                <div style="color: #2c3e50; font-size: 1.1em; font-weight: 600;">${patient.id || 'N/A'}</div>
              </div>

              <div style="
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                border-left: 3px solid #27ae60;
                transition: transform 0.2s ease;
              " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="color: #6c757d; font-size: 0.8em; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Patient Name</div>
                <div style="color: #2c3e50; font-size: 1.1em; font-weight: 600;">${patient.name || 'N/A'}</div>
              </div>

              <div style="
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                border-left: 3px solid #f39c12;
                transition: transform 0.2s ease;
              " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="color: #6c757d; font-size: 0.8em; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Age</div>
                <div style="color: #2c3e50; font-size: 1.1em; font-weight: 600;">${patient.age || 'N/A'} years</div>
              </div>

              <div style="
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                border-left: 3px solid #9b59b6;
                transition: transform 0.2s ease;
              " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="color: #6c757d; font-size: 0.8em; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Exam Date</div>
                <div style="color: #2c3e50; font-size: 1.1em; font-weight: 600;">${new Date(results.timestamp).toLocaleDateString()}</div>
              </div>

              <div style="
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                border-left: 3px solid #e74c3c;
                transition: transform 0.2s ease;
              " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="color: #6c757d; font-size: 0.8em; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Exam Time</div>
                <div style="color: #2c3e50; font-size: 1.1em; font-weight: 600;">${new Date(results.timestamp).toLocaleTimeString()}</div>
              </div>

              <div style="
                background: linear-gradient(135deg, ${0 >= 85 ? '#27ae60' : 0 >= 70 ? '#f39c12' : '#e74c3c'}, ${0 >= 85 ? '#2ecc71' : 0 >= 70 ? '#f1c40f' : '#e67e22'});
                color: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 3px 12px rgba(${0 >= 85 ? '39, 174, 96' : 0 >= 70 ? '243, 156, 18' : '231, 76, 60'}, 0.3);
                transition: transform 0.2s ease;
                text-align: center;
              " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="color: rgba(255,255,255,0.9); font-size: 0.8em; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Overall Score</div>
                <div style="color: white; font-size: 1.6em; font-weight: 700;">${overallScore}%</div>
              </div>
            </div>
          </div>


          <!-- Peak Frame Images Section -->
          ${imageSection}

          <!-- Symmetry Metrics -->
          <div style="padding: 30px; border-bottom: 1px solid #e1e8ed;">
            <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 1.5em;">
              Symmetry Measurements
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
              ${this.generateDetailedMetricCard('Eyebrow Analysis', results)}
              ${this.generateDetailedMetricCard('Eye Analysis', results)}
              ${this.generateDetailedMetricCard('Mouth Analysis', results)}
            </div>
          </div>

          <!-- Overall Facial Symmetry Score -->
          <div style="padding: 30px; border-bottom: 1px solid #e1e8ed;">
            <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 1.5em;">
              Overall Facial Symmetry Score
            </h2>
            ${this.generateOverallSymmetryScoreDisplay(results.analysisResult.symmetryMetrics)}
          </div>



          <!-- Action Controls -->
          <div class="print-hide" style="padding: 30px; text-align: center;">
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
              <button id="exportPdfBtn" style="
                padding: 12px 24px;
                background: linear-gradient(135deg, #dc3545, #e74c3c);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
              " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(220, 53, 69, 0.4)'"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(220, 53, 69, 0.3)'">
                📄 Download PDF Report
              </button>

              <button id="printResultsBtn" style="
                padding: 12px 24px;
                background: #34495e;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 1em;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
              ">Print Results</button>

              <button id="backToHome" style="
                padding: 12px 24px;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 1em;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
              ">Back to Home</button>
            </div>
          </div>
        </div>

        <!-- Simplified Version Information Footer -->
        ${this.generateSimpleVersionFooter()}

      </div>
    `;
    }
    /**
     * Generate simplified version footer for the results page
     */
    generateSimpleVersionFooter() {
        try {
            const versionMetadata = VersionManager.getCurrentVersion();
            const versionString = VersionManager.getVersionString();
            // Get release date from version metadata or use current date as fallback
            const releaseDate = versionMetadata.releaseDate || new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            return `
        <div style="
          margin-top: 40px;
          padding: 20px 30px;
          border-top: 1px solid #e1e8ed;
          background: #f8f9fa;
          text-align: center;
        ">
          <div style="
            color: #6c757d;
            font-size: 0.9em;
            line-height: 1.5;
          ">
            <div style="margin-bottom: 5px;">
              Facial Symmetry Analysis Application
            </div>
            <div style="display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap;">
              <span>Version ${versionString}</span>
              <span>•</span>
              <span>Released: ${releaseDate}</span>
            </div>
          </div>
        </div>
      `;
        }
        catch (error) {
            console.warn('Failed to load version information:', error);
            return `
        <div style="
          margin-top: 40px;
          padding: 20px 30px;
          border-top: 1px solid #e1e8ed;
          background: #f8f9fa;
          text-align: center;
        ">
          <div style="
            color: #6c757d;
            font-size: 0.9em;
            line-height: 1.5;
          ">
            <div style="margin-bottom: 5px;">
              Facial Symmetry Analysis Application
            </div>
            <div>
              ${new Date().getFullYear()}
            </div>
          </div>
        </div>
      `;
        }
    }
    getSeverityColor(severity) {
        switch (severity.toLowerCase()) {
            case 'mild':
                return '#f39c12'; // Orange
            case 'moderate':
                return '#e67e22'; // Dark orange
            case 'severe':
                return '#e74c3c'; // Red
            case 'critical':
                return '#c0392b'; // Dark red
            default:
                return '#7f8c8d'; // Gray
        }
    }
    /**
     * Generate detailed metric card showing individual measurements
     */
    generateDetailedMetricCard(title, metrics) {
        let content = '';
        let overallScore = 0;
        let overallStatus = '';
        let statusColor = '#7f8c8d';
        switch (title) {
            case 'Eyebrow Analysis':
                const leftEyebrow = metrics.analysisResult.eyebrow_raise.left_eyebrow_displacement || 0;
                const rightEyebrow = metrics.analysisResult.eyebrow_raise.right_eyebrow_displacement || 0;
                overallScore = metrics.analysisResult.symmetryMetrics.eyebrowRaiseOverallScore;
                content = `
          <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Left Eyebrow Elevation:</span>
              <span style="font-weight: bold;">${leftEyebrow.toFixed(2)}°</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Right Eyebrow Elevation:</span>
              <span style="font-weight: bold;">${rightEyebrow.toFixed(2)}°</span>
            </div>
          </div>
        `;
                break;
            case 'Eye Analysis':
                const leftEye = metrics.analysisResult.eye_close.left_eye_closure || 0;
                const rightEye = metrics.analysisResult.eye_close.right_eye_closure || 0;
                overallScore = metrics.analysisResult.symmetryMetrics.eyeClosureOverallScore;
                content = `
          <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Left Eye Closure:</span>
              <span style="font-weight: bold;">${leftEye.toFixed(1)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Right Eye Closure:</span>
              <span style="font-weight: bold;">${rightEye.toFixed(1)}%</span>
            </div>
          </div>
        `;
                break;
            case 'Mouth Analysis':
                const leftMouth = metrics.analysisResult.smile.left_mouth_movement || 0;
                const rightMouth = metrics.analysisResult.smile.right_mouth_movement || 0;
                // Enhanced measurements with horizontal and vertical distances
                const leftHorizontalDistance = metrics.analysisResult.smile.horizontalDistances.left || 0;
                const rightHorizontalDistance = metrics.analysisResult.smile.horizontalDistances.right || 0;
                const leftVerticalDistance = metrics.analysisResult.smile.verticalDistances.left || 0;
                const rightVerticalDistance = metrics.analysisResult.smile.verticalDistances.right || 0;
                overallScore = metrics.analysisResult.symmetryMetrics.smileOverallScore;
                content = `
          <div style="margin-bottom: 15px;">
            <!-- Basic Movement Measurements -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Left Corner Movement:</span>
              <span style="font-weight: bold;">${leftMouth.toFixed(2)}mm</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Right Corner Movement:</span>
              <span style="font-weight: bold;">${rightMouth.toFixed(2)}mm</span>
            </div>

            <!-- Horizontal Distance Measurements -->
            <div style="border-top: 1px solid #e1e8ed; padding-top: 8px; margin-top: 12px; margin-bottom: 8px;">
              <div style="font-weight: 600; color: #2c3e50; margin-bottom: 8px; font-size: 0.95em;">
                📏 Horizontal Distances (to tilted reference line)
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding-left: 10px;">
                <span style="color: #6c757d;">Left Corner:</span>
                <span style="font-weight: bold;">${leftHorizontalDistance.toFixed(2)}mm</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding-left: 10px;">
                <span style="color: #6c757d;">Right Corner:</span>
                <span style="font-weight: bold;">${rightHorizontalDistance.toFixed(2)}mm</span>
              </div>
            </div>

            <!-- Vertical Distance Measurements -->
            <div style="border-top: 1px solid #e1e8ed; padding-top: 8px; margin-bottom: 8px;">
              <div style="font-weight: 600; color: #2c3e50; margin-bottom: 8px; font-size: 0.95em;">
                📐 Vertical Distances (to vertical reference line)
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding-left: 10px;">
                <span style="color: #6c757d;">Left Corner:</span>
                <span style="font-weight: bold;">${leftVerticalDistance.toFixed(2)}mm</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding-left: 10px;">
                <span style="color: #6c757d;">Right Corner:</span>
                <span style="font-weight: bold;">${rightVerticalDistance.toFixed(2)}mm</span>
              </div>
            </div>

          </div>
        `;
                break;
        }
        overallStatus = overallScore >= 85 ? 'Excellent' : overallScore >= 70 ? 'Good' : 'Needs Attention';
        statusColor = overallScore >= 85 ? '#27ae60' : overallScore >= 70 ? '#f39c12' : '#e74c3c';
        return `
      <div style="
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-left: 4px solid ${statusColor};
      ">
        <h4 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 1.1em;">${title}</h4>
        ${content}
        <div style="border-top: 1px solid #e1e8ed; padding-top: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600;">Overall Score:</span>
            <div style="text-align: right;">
              <div style="font-size: 1.5em; font-weight: bold; color: ${statusColor};">
                ${overallScore.toFixed(1)}%
              </div>
              <div style="color: #7f8c8d; font-size: 0.9em;">
                ${overallStatus}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    }
    /**
     * Generate Overall Facial Symmetry Score display
     */
    generateOverallSymmetryScoreDisplay(metrics) {
        // Add mobile-specific CSS override
        const mobileCSS = `
      <style>
        /* Mobile-specific override for overall symmetry score */
        @media (max-width: 768px) {
          .overall-symmetry-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 20px !important;
          }

          .score-display-card,
          .clinical-interpretation-card {
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-sizing: border-box !important;
          }

          .score-display-card h3 {
            font-size: 1.2em !important;
          }

          .score-display-card div[style*="font-size: 4em"] {
            font-size: 2.5em !important;
          }
        }
      </style>
    `;
        const eyebrowSymmetry = metrics.eyebrowRaiseSymmetry || 0;
        const eyeSymmetry = metrics.eyeClosureSymmetry || 0;
        const mouthSymmetry = metrics.smileSymmetry || 0;
        // FIXED: Standardized weighting system consistent across application
        const overallScore = ((eyeSymmetry * 0.40) + // 40% weight for eye (most clinically important)
            (eyebrowSymmetry * 0.30) + // 30% weight for eyebrow
            (mouthSymmetry * 0.30) // 30% weight for mouth (standardized from 20% to 30%)
        );
        const finalScore = overallScore;
        // Determine score color and status
        const scoreColor = finalScore >= 85 ? '#27ae60' : finalScore >= 70 ? '#f39c12' : '#e74c3c';
        const scoreStatus = finalScore >= 85 ? 'Excellent' : finalScore >= 70 ? 'Good' : 'Needs Attention';
        return `
      ${mobileCSS}
      <div class="overall-symmetry-container" style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-bottom: 30px;
      ">
        <!-- Primary Score Display -->
        <div class="score-display-card" style="
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border-left: 6px solid ${scoreColor};
          text-align: center;
        ">
          <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 1.3em;">
            Overall Symmetry Score
          </h3>
          <div style="
            font-size: 4em;
            font-weight: bold;
            color: ${scoreColor};
            margin: 20px 0;
            line-height: 1;
          ">
            ${finalScore.toFixed(1)}
          </div>
          <div style="
            font-size: 1.2em;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 10px;
          ">
            ${scoreStatus}
          </div>
          <div style="
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
          ">
            <div style="color: #6c757d; font-size: 0.9em; margin-bottom: 8px;">
              Score Range: 0-100
            </div>
            <div style="color: #6c757d; font-size: 0.9em;">
              Based on facial symmetry analysis
            </div>
          </div>
        </div>

        <!-- Clinical Interpretation -->
        <div class="clinical-interpretation-card" style="
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        ">
          <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 1.3em;">
            Clinical Interpretation
          </h3>
          <div style="
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid ${scoreColor};
            margin-bottom: 20px;
          ">
            <p style="margin: 0; color: #2c3e50; line-height: 1.6;">
              ${this.getOverallScoreInterpretation(finalScore)}
            </p>
          </div>

          <!-- Calculation Breakdown -->
          <div style="margin-top: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 1.1em;">
              Calculation Method
            </h4>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 0.9em; color: #6c757d;">
              <div style="margin-bottom: 8px;">• Eye function (40%): ${eyeSymmetry.toFixed(1)}%</div>
              <div style="margin-bottom: 8px;">• Eyebrow function (30%): ${eyebrowSymmetry.toFixed(1)}%</div>
              <div style="margin-bottom: 8px;">• Mouth function (30%): ${mouthSymmetry.toFixed(1)}%</div>
              <div style="border-top: 1px solid #dee2e6; padding-top: 8px; margin-top: 8px; font-weight: 600;">
                Final Score: ${finalScore.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Explanatory Text -->
      <div style="
        background: #e8f4fd;
        border: 1px solid #bee5eb;
        border-radius: 8px;
        padding: 20px;
        margin-top: 20px;
      ">
        <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 1.1em;">
          About This Score
        </h4>
        <p style="margin: 0; color: #0c5460; line-height: 1.6; font-size: 0.95em;">
          This overall score is calculated based on eye function (40%), eyebrow function (30%), and mouth function (30%).
          The weighting reflects the clinical importance of each facial region in assessing facial nerve function.
        </p>
      </div>
    `;
    }
    /**
     * Get clinical interpretation based on overall score
     */
    getOverallScoreInterpretation(score) {
        if (score >= 90) {
            return 'Excellent facial function. No significant deficits detected.';
        }
        else if (score >= 80) {
            return 'Good facial function. Minor variations may be present but do not significantly affect facial function.';
        }
        else if (score >= 70) {
            return 'Moderate facial function with some noticeable deficits detected.';
        }
        else if (score >= 60) {
            return 'Fair facial function with moderate deficits present.';
        }
        else {
            return 'Poor facial function with significant deficits detected.';
        }
    }
    /**
     * Generate enhanced House-Brackmann display with full clinical context
     * NOTE: This method is kept for backward compatibility but no longer used in the main display
     */
    generateEnhancedHouseBrackmannDisplay(metrics) {
        // This display is deprecated and now returns an empty string (asymmetry removed)
        return '';
    }
    /**
     * Get House-Brackmann grade color
     */
    getHouseBrackmannGradeColor(grade) {
        switch (grade) {
            case 1:
                return '#27ae60'; // Green - Normal
            case 2:
                return '#f39c12'; // Orange - Mild
            case 3:
                return '#e67e22'; // Dark orange - Moderate
            case 4:
                return '#e74c3c'; // Red - Moderately severe
            case 5:
                return '#c0392b'; // Dark red - Severe
            case 6:
                return '#8e44ad'; // Purple - Total paralysis
            default:
                return '#7f8c8d'; // Gray - Unknown
        }
    }
    setupResultsEventListeners() {
        console.log('ResultsView: Setting up event listeners...');
        // Export PDF button (replacing CSV and Markdown)
        const pdfButton = document.getElementById('exportPdfBtn');
        const printButton = document.getElementById('printResultsBtn');
        const backButton = document.getElementById('backToHome');
        console.log('ResultsView: Button elements found:', {
            pdfButton: !!pdfButton,
            printButton: !!printButton,
            backButton: !!backButton
        });
        if (pdfButton) {
            console.log('ResultsView: Adding PDF button listener');
            pdfButton.addEventListener('click', () => {
                console.log('Export PDF button clicked from ResultsView');
                this.exportToPDF();
            });
        }
        else {
            console.warn('ResultsView: PDF button not found with ID: exportPdfBtn');
        }
        if (printButton) {
            console.log('ResultsView: Adding Print button listener');
            printButton.addEventListener('click', () => {
                console.log('Print button clicked from ResultsView');
                this.printResults();
            });
        }
        else {
            console.warn('ResultsView: Print button not found with ID: printResultsBtn');
        }
        if (backButton) {
            console.log('ResultsView: Adding Back button listener');
            backButton.addEventListener('click', () => {
                console.log('Back to home button clicked from ResultsView');
                // Use proper SPA navigation instead of reload
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new Event('popstate'));
            });
        }
        else {
            console.warn('ResultsView: Back button not found with ID: backToHome');
        }
    }
    async exportToPDF() {
        console.log('Exporting to PDF via backend...');
        if (!this.examResults) {
            console.error('No exam results available for PDF export');
            alert('No examination results available. Please complete an examination first.');
            return;
        }
        try {
            const response = await fetch('/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.examResults),
            });
            if (!response.ok) {
                throw new Error(`Backend PDF generation failed: ${response.statusText}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `facial-symmetry-report-${this.examResults.patientData.id || 'unknown'}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        }
        catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Could not export PDF. Please try again.');
        }
    }
    printResults() { window.print(); }
    // CSV/Markdown generation moved to ResultsExportUtils
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
