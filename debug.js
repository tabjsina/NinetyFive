function initializeDebugTools(stateManager, canvasHelper) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === '1') {
        const debugTools = document.getElementById('debugTools');
        const debugArcsInput = document.getElementById('debugArcsInput');
        const debugSetArcs = document.getElementById('debugSetArcs');
        
        debugTools.style.display = 'block';

        const startClickSimulation = (targetRemaining) => {
            const simulateClick = () => {
                if (targetRemaining < TOTAL_ARCS - stateManager.arcs.length) {
                    // Create and dispatch a click event on the canvas
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    canvasHelper.canvas.dispatchEvent(clickEvent);
                    setTimeout(simulateClick, 50 + Math.random() * 40);
                }
            };
            simulateClick();
        };

        // Handle the main set button
        debugSetArcs.addEventListener('click', () => {
            const targetRemaining = parseInt(debugArcsInput.value, 10);
            startClickSimulation(targetRemaining);
        });

        // Handle the quick jump buttons
        document.querySelectorAll('.debugJump').forEach(button => {
            button.addEventListener('click', () => {
                const targetRemaining = parseInt(button.dataset.value, 10);
                debugArcsInput.value = targetRemaining; // Update the input value
                startClickSimulation(targetRemaining);
            });
        });
    }
}
