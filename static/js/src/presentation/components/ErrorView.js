// ErrorView.ts
// Handles displaying error messages to the user
export class ErrorView {
    static showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #e74c3c;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      font-weight: bold;
      z-index: 10000;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
        errorDiv.textContent = message;
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      font-weight: bold;
      margin-left: 10px;
      cursor: pointer;
      padding: 0;
    `;
        closeBtn.onclick = () => errorDiv.remove();
        errorDiv.appendChild(closeBtn);
        document.body.appendChild(errorDiv);
        setTimeout(() => {
            if (errorDiv.parentNode)
                errorDiv.remove();
        }, 5000);
        console.log('Error message displayed:', message);
    }
}
