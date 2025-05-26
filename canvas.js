// Get the canvas element
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

let centerX = canvas.width / 2;  // Will be updated by resizeCanvas
let centerY = canvas.height / 2; // Will be updated by resizeCanvas

// Set up arc properties
const baseRadius = 85;
const radiusIncrement = 20;
const totalDivisions = 19;
const maxCircles = 5;
const arcLength = (2 * Math.PI) / totalDivisions;
const arcSegmentLength = arcLength / 2;

let clipRegion;

// Animation properties
const textTapAnimDuration = 400;
const arcEntryAnimDuration = 700;
const radiusExpandDuration = 3000;
const dotTransitionDuration = 400;

class StateManager {
    constructor() {
        this.circles = [];
        this.arcs = [];
        this.completedCirclesOnLastUpdate = 0;
        this.activeCircleIndex = 0;
        this.lastClickCount = totalDivisions * maxCircles;
        this.textBobbleStartTime = null;
        this.isTextCached = false;
        this.arcsSinceLastClip = 0;
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
            this.isTextCached = false;

            return true;
        }
        return false;
    }

    updateAndDrawCircles(currentTime) {
        if (this.arcs.length === 0) {
            return;
        }

        const completedCircles = Math.floor(this.arcs.length / totalDivisions);
        // Don't want to push the last circle.
        const completedCirclesToBePushed = Math.min(completedCircles, maxCircles - 1);

        // get clip region for non-cached arcs (i.e. the parts that may be moving).
        var numArcsCached = this.arcs.filter(arc => arc.isCached).length;
        if (this.arcsOnLastUpdate !== numArcsCached) {
            this.arcsOnLastUpdate = numArcsCached;
            const donutPath = new Path2D();
            donutPath.arc(centerX, centerY, baseRadius + radiusIncrement * completedCirclesToBePushed + 15, 0, Math.PI * 2); // Partial arc
            donutPath.arc(centerX, centerY, baseRadius + 15, Math.PI * 2, 0, true); // Inner boundary

            // Clip padding for rounded edges
            const clipArcPadding = (arcLength - arcSegmentLength) / 2;
            // Clip from radius 2 to 3 (partial circle)

            var numArcsCached = this.arcs.filter(arc => arc.isCached).length;
            const innerRingPath = new Path2D();

            if (numArcsCached !== 0) {
                innerRingPath.moveTo(centerX + 30 * Math.cos(startingArcPosition - clipArcPadding), centerY + 30 * Math.sin(startingArcPosition - clipArcPadding));
                var lastCachedArcEnd = startingArcPosition + this.arcs.filter(arc => arc.isCached).length * arcLength;
                innerRingPath.arc(centerX, centerY, baseRadius + 15, startingArcPosition - clipArcPadding, lastCachedArcEnd - clipArcPadding, true); // Partial arc
                innerRingPath.arc(centerX, centerY, baseRadius - 15, lastCachedArcEnd - clipArcPadding, startingArcPosition - clipArcPadding, false); // Inner boundary
            }
            else {
                innerRingPath.moveTo(centerX + (baseRadius + 15) * Math.cos(Math.PI * 2), centerY + (baseRadius + 15) * Math.sin(Math.PI * 2));
                innerRingPath.arc(centerX, centerY, baseRadius + 15, 0, Math.PI * 2); // Partial arc
                innerRingPath.arc(centerX, centerY, baseRadius - 15, Math.PI * 2, 0, true); // Inner boundary
            }

            const combinedPath = new Path2D();
            combinedPath.addPath(donutPath);
            combinedPath.addPath(innerRingPath);
            clipRegion = combinedPath;
        }

        ctx.save();
        ctx.clip(clipRegion);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var circleWasJustCompleted = this.completedCirclesOnLastUpdate < completedCircles;
        this.completedCirclesOnLastUpdate = completedCircles;
        if (circleWasJustCompleted) {
            // Update each circle's radius and rotation
            for (let i = 0; i < completedCirclesToBePushed; i++) {
                const circle = this.getCircleState(i);
                // Update radius
                const distanceFromNewest = completedCirclesToBePushed - circle.index - 1;
                const newTargetRadius = baseRadius + (radiusIncrement * (distanceFromNewest + 1));
                circle.updateTargetRadius(currentTime, newTargetRadius);
                circle.startRotation(currentTime);

                // Start dot transition for the arcs in the latest completed circle
                this.arcs.filter(arc => arc.circle == completedCirclesToBePushed - 1).forEach(arc => {
                });
            }
        }

        // Update and draw all circles
        for (let i = 0; i < this.circles.length; i++) {
            // Update rotation
            this.getCircleState(i).updatePosition(currentTime);
        }
        // Draw and update all arcs
        const latestCircleIndex = Math.floor((this.arcs.length - 1) / totalDivisions);
        var cachedArcsToDraw = [];

        this.arcs.forEach(arc => {
            if (circleWasJustCompleted && arc.circle !== 4) {
                arc.isCached = false;
                arc.startDotTransition(currentTime);
            }

            arc.updateStates(currentTime);
            if (arc.isAnimating()) {
                // Always draw animating arcs to main canvas
                drawArc(arc, currentTime, ctx);
            } else if (arc.circle === latestCircleIndex) {
                // For static arcs in the latest circle, cache them in inner circle canvas if caching is enabled
                if (!arc.isCached) {
                    cachedArcsToDraw.push(arc);
                }
            } else {
                // All other arcs go to main canvas
                drawArc(arc, currentTime, ctx);
            }
        });

        // Restore the canvas state to remove clipping
        ctx.restore();

        cachedArcsToDraw && cachedArcsToDraw.forEach(arc => {
            drawArc(arc, currentTime, ctx);
            arc.isCached = true; // Mark as cached
        });
    }

    isAnimating() {
        // Always animate if we have any circles to rotate
        const completedCircles = Math.floor(this.arcs.length / totalDivisions)
        return completedCircles > 0 ||
            this.arcs.some(arc => arc.isAnimating());
    }
}

const stateManager = new StateManager();

// Set canvas size to window size accounting for device pixel ratio
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();    // Set the canvas size in actual pixels
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


// Draw initial completion text
drawCompletionText(performance.now());

const startingArcPosition = - Math.PI / 2; // Start with the first arc at the top

function drawArc(arcState, currentTime, canvasCtx) {
    const scale = arcState.getScale(currentTime);
    const circle = stateManager.getCircleState(arcState.circle);
    const { segmentLength, offset } = arcState.getArcProperties();

    const baseStartAngle = arcState.positionInCircle * (arcLength) + startingArcPosition;
    const startAngle = baseStartAngle + circle.rotation + offset;
    const endAngle = startAngle + segmentLength;

    canvasCtx.beginPath();
    canvasCtx.strokeStyle = '#ff7954';
    canvasCtx.lineCap = 'round';
    canvasCtx.lineWidth = 10 * scale;
    canvasCtx.arc(centerX, centerY, arcState.getRadius(currentTime), startAngle, endAngle);
    canvasCtx.stroke();
}

function drawCompletionText(currentTime) {
    const totalClicks = totalDivisions * maxCircles;
    const remainingClicks = totalClicks - stateManager.arcs.length;

    if (!stateManager.isTextCached) {
        // only clear the text area.
        ctx.clearRect(centerX - 40, centerY - 40, 80, 80);

        if (remainingClicks <= 0) {
            // don't need to display anything when no clicks are remaining
            stateManager.isTextCached = true;
            return;
        }

        var shouldCacheText = true;
        let scale = 1;
        if (stateManager.textBobbleStartTime) {
            shouldCacheText = false;
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

        stateManager.isTextCached = shouldCacheText;
    }
}

function animate(currentTime) {
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
