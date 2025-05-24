// Get the canvas element
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

let centerX = canvas.width / 2;  // Will be updated by resizeCanvas
let centerY = canvas.height / 2; // Will be updated by resizeCanvas

// Set canvas size to window size accounting for device pixel ratio
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set the canvas size in actual pixels
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale all drawing operations by the dpr
    ctx.scale(dpr, dpr);

    // Update center coordinates (using CSS pixels)
    centerX = rect.width / 2;
    centerY = rect.height / 2;

    requestAnimationFrame && requestAnimationFrame(animate);
}

// Handle window resizing
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Helper function for bobble animation
function getBobbleScale(progress, maxScale = 1.0) {
    // Maximum scale --> 1.0 == +100% scale (i.e. double)
    return 1 + Math.sin(progress * Math.PI) * Math.exp(-progress * 3) * maxScale;
}

// Set up arc properties
const baseRadius = 85;
const radiusIncrement = 20;
const totalDivisions = 19;
const maxCircles = 5;
const arcLength = (2 * Math.PI) / totalDivisions;
const arcSegmentLength = arcLength / 2;

// Animation properties
const textTapAnimDuration = 400;
const arcEntryAnimDuration = 700;
const radiusExpandDuration = 3000;
const dotTransitionDuration = 400;

class StateManager {
    constructor() {
        this.circles = [];
        this.arcs = [];
        this.activeCircleIndex = 0;
        this.lastClickCount = totalDivisions * maxCircles;
        this.textBobbleStartTime = null;
        this.lastFrameTime = null;
    }

    getCircleState(index) {
        // Grow array if needed
        while (this.circles.length <= index) {
            this.circles.push(new CircleState(this.circles.length));
        }
        return this.circles[index];
    }
    
    addArc(currentTime) {
        if (this.arcs.length < totalDivisions * maxCircles) {
            const nextArcIndex = this.arcs.length;
            this.arcs.push(new ArcState(nextArcIndex, currentTime, this));
            this.textBobbleStartTime = currentTime;
            return true;
        }
        return false;
    }
    
    updateAndDrawCircles(currentTime) {
        const completedCircles = Math.floor(this.arcs.length / totalDivisions);

        // Don't want to push the last circle.
        const completedCirclesToBePushed = Math.min(completedCircles, maxCircles - 1);
        // Update each circle's radius and rotation
        for (let i = 0; i < completedCirclesToBePushed; i++) {
            const circle = this.circles[i];
            // Update radius
            const distanceFromNewest = completedCirclesToBePushed - circle.index - 1;
            const newTargetRadius = baseRadius + (radiusIncrement * (distanceFromNewest + 1));
            circle.updateRadius(currentTime, newTargetRadius);

            // Update rotation
            circle.updateRotation(currentTime, this.lastFrameTime);
        }

        
      // Draw and update all arcs
            this.arcs.forEach(arc => {
                if (arc.circle < completedCirclesToBePushed) {
                    arc.startDotTransition(currentTime);
                }

                arc.updateStates(currentTime);
                drawArc(arc, currentTime);
            });
        
        this.lastFrameTime = currentTime;
    }
      isAnimating() {
        // Always animate if we have any circles to rotate
        const completedCircles = Math.floor(this.arcs.length / totalDivisions)
        return completedCircles > 0 || 
               this.arcs.some(arc => arc.isAnimating);
    }
}

const stateManager = new StateManager();

// Draw initial completion text
drawCompletionText(performance.now());

function drawArc(arcState, currentTime) {
    const scale = arcState.getScale(currentTime);
    const circle = stateManager.getCircleState(arcState.circle);
    const { segmentLength, offset } = arcState.getArcProperties();
    
    const baseStartAngle = arcState.positionInCircle * (arcLength) - Math.PI / 2;
    const startAngle = baseStartAngle + circle.rotation + offset;
    const endAngle = startAngle + segmentLength;
    
    ctx.beginPath();
    ctx.lineWidth = 10 * scale;
    ctx.arc(centerX, centerY, arcState.getRadius(currentTime), startAngle, endAngle);
    ctx.stroke();
}

function drawCompletionText(currentTime) {
    const totalClicks = totalDivisions * maxCircles;
    const remainingClicks = totalClicks - stateManager.arcs.length;

    if (remainingClicks <= 0) {
        // don't need to display anything when no clicks are remaining
        return;
    }
    
    let scale = 1;
    if (stateManager.textBobbleStartTime) {
        const progress = Math.min((currentTime - stateManager.textBobbleStartTime) / textTapAnimDuration, 1);
        if (progress >= 1) {
            stateManager.textBobbleStartTime = null;
        } else {
            scale = getBobbleScale(progress, 0.7);
        }
    }
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.floor(40 * scale);
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = '#666666';
    ctx.fillText(`${remainingClicks}`, centerX, centerY);
    ctx.restore();
}

function animate(currentTime) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Style settings
    ctx.strokeStyle = '#ff7954';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    
    // Update circle states
    stateManager.updateAndDrawCircles(currentTime);

      // Draw completion text on top
    drawCompletionText(currentTime);
    
    // Continue animation if any arc is bobbling or any circle is expanding
    if (stateManager.isAnimating()) {
        requestAnimationFrame(animate);
    }
}

// Handle clicks
canvas.addEventListener('click', () => {
    if (stateManager.addArc(performance.now())) {
        requestAnimationFrame(animate);
    }
});
