// Geometry constants
const BASE_RADIUS = 80;
const RADIUS_INCREMENT = 20;
const TOTAL_ARCS = 95;
const TOTAL_DIVISIONS = 19;
const MAX_CIRCLES = TOTAL_ARCS / TOTAL_DIVISIONS;
const FINAL_CIRCLE_INDEX = MAX_CIRCLES - 1;
const TWO_PI = Math.PI * 2;
const ARC_LENGTH = TWO_PI / TOTAL_DIVISIONS;
const ARC_SEGMENT_LENGTH = ARC_LENGTH / 3;
const ARC_GAP = ARC_LENGTH - ARC_SEGMENT_LENGTH;
const ARC_LENGTH_MIDPOINT = ARC_LENGTH / 2;
const STARTING_ARC_POSITION = - Math.PI / 2; // Start with the first arc at the top
const MAX_ROTATIONAL_OFFSET = ARC_LENGTH_MIDPOINT / 2;
const ARC_WIDTH = 10;
const DOT_RADIUS = ARC_WIDTH / 2;

class Colors {
    static PALETTE = {
        CORAL_THEME: "#ff7954",
        WHITE: "#FFF",
        DARK_BLUE: "#093148"
    }

    static LIGHT_MODE = {
        ARCS: Colors.PALETTE.CORAL_THEME,
        TEXT: Colors.PALETTE.DARK_BLUE,
        BACKGROUND: Colors.PALETTE.WHITE
    }

    static DARK_MODE = {
        ARCS: Colors.PALETTE.CORAL_THEME,
        TEXT: Colors.PALETTE.WHITE,
        BACKGROUND: Colors.PALETTE.DARK_BLUE
    }
}

class CounterState {
    static TEXT_TAP_ANIM_DURATION = 400;
    static BASE_FONT_SIZE = 60;
    static MAX_FONT_SIZE = 70;

    constructor() {
        this.textBobbleStartTime = null;
        this.isTextCached = false;
    }

    getFontSize(currentTime) {
        if (!this.textBobbleStartTime) {
            return CounterState.BASE_FONT_SIZE;
        }

        const progress = Math.min((currentTime - this.textBobbleStartTime) / CounterState.TEXT_TAP_ANIM_DURATION, 1);
        if (progress >= 1) {
            this.textBobbleStartTime = null;
            return CounterState.BASE_FONT_SIZE;
        }

        return Math.floor(MathUtils.getPulseScale(progress, CounterState.BASE_FONT_SIZE, CounterState.MAX_FONT_SIZE));
    }

    startIncrementAnimation(currentTime) {
        this.textBobbleStartTime = currentTime;
        this.isTextCached = false;
    }

    isAnimating() {
        return this.textBobbleStartTime;
    }
}

class AudioManager {
    static ClickSound = new Audio('short.mp3');

    static playTap() {
        this.ClickSound.currentTime = 0;
        this.ClickSound.play();
    }

    static playDoubleTap() {
        this.ClickSound.currentTime = 0;
        const playSecondTap = () => {
            this.ClickSound.removeEventListener('ended', playSecondTap);
            setTimeout(() => {
                this.ClickSound.currentTime = 0;
                this.ClickSound.play();
            }, 100);
        };
        this.ClickSound.addEventListener('ended', playSecondTap);
        this.ClickSound.play();
    }
}

class StateManager {
    constructor(canvasHelper) {
        this.canvasHelper = canvasHelper;
        this.circles = [];
        this.arcs = [];
        this.completedCirclesOnLastUpdate = 0;
        this.activeCircleIndex = 0;
        this.counterState = new CounterState();
        this.baseRotation = 0;
        this.lastRotationFrameTime = null;
        this.rotationSpeed = 0;
        this.cachedArcs = new Set();
        this.animationLoopRunning = false;
    }

    reset() {
        // Reset all state
        this.canvasHelper.reset();
        this.circles = [];
        this.arcs = [];
        this.completedCirclesOnLastUpdate = 0;
        this.activeCircleIndex = 0;
        this.counterState = new CounterState();
        this.baseRotation = 0;
        this.lastRotationFrameTime = null;
        this.rotationSpeed = 0;
        this.cachedArcs.clear();

        // Run animation if it isn't already to draw the reset state
        this.tryStartAnimation();
    }

    resetCache() {
        this.counterState.isTextCached = false;
        this.cachedArcs.clear();
    }

    tryStartAnimation() {
        let animate = (currentTime) => {
            // Update circle states
            this.updateAndDrawCircles(currentTime);

            // Draw completion text on top
            this.canvasHelper.drawCounterText(currentTime, this.counterState, TOTAL_ARCS - this.arcs.length);

            // Continue animation if any arc is bobbling or any circle is expanding
            if (this.isAnimating()) {
                requestAnimationFrame(animate);
            } else {
                this.animationLoopRunning = false;
            }
        }

        if (!this.animationLoopRunning) {
            this.animationLoopRunning = true;
            requestAnimationFrame(animate);
        }
    }

    updateRotation(currentTime) {
        if (this.rotationSpeed !== 0) {
            if (this.lastRotationFrameTime === null) {
                this.lastRotationFrameTime = currentTime;
                return;
            }
            const deltaTime = (currentTime - this.lastRotationFrameTime) / 1000;
            this.baseRotation += this.rotationSpeed * deltaTime;
            this.baseRotation = this.baseRotation % TWO_PI;
            this.lastRotationFrameTime = currentTime;
        }
    }

    tryStartRotation(currentTime) {
        if (this.lastRotationFrameTime === null) {
            this.lastRotationFrameTime = currentTime;
            this.rotationSpeed = 0.075;
        }
    }

    getCircleState(index) {
        // Grow array if needed
        while (this.circles.length <= index) {
            this.circles.push(new CircleState(this.circles.length));
        }
        return this.circles[index];
    }    playSoundIfNeeded() {
        if (this.arcs.length === TOTAL_ARCS && SoundSettings.loadSettings().finalTap) {
            // double tap sound on final tap
            AudioManager.playDoubleTap();
        } else if (this.arcs.length === 1 && SoundSettings.loadSettings().firstTap) {
            // play sound on first tap
            AudioManager.playTap();
        } else if (this.arcs.length % TOTAL_DIVISIONS === 0 && SoundSettings.loadSettings().interval19) {
            // play sound on circle intervals if enabled
            AudioManager.playTap();
        }
    }

    addArc(currentTime) {
        if (this.arcs.length < TOTAL_ARCS) {
            const nextArcIndex = this.arcs.length;
            this.arcs.push(new ArcState(nextArcIndex, currentTime, this));
            this.counterState.startIncrementAnimation(currentTime);
            this.playSoundIfNeeded();
            this.tryStartAnimation();

            return true;
        }
        return false;
    }

    updateAndDrawCircles(currentTime) {
        if (this.arcs.length === 0) {
            return;
        }

        const completedCircles = Math.floor(this.arcs.length / TOTAL_DIVISIONS);
        // Don't want to push the last circle.
        const completedCirclesToBePushed = Math.min(completedCircles, FINAL_CIRCLE_INDEX);

        // Update rotation of overall rotating circles
        this.updateRotation(currentTime);

        var circleWasJustCompleted = this.completedCirclesOnLastUpdate < completedCircles;
        this.completedCirclesOnLastUpdate = completedCircles;
        if (circleWasJustCompleted) {
            this.tryStartRotation(currentTime);

            // Update each circle's radius and rotation
            for (let i = 0; i < completedCirclesToBePushed; i++) {
                const circle = this.getCircleState(i);
                // Update radius
                circle.updateTargetRadius(currentTime, completedCirclesToBePushed - circle.index);
                if (circle.index == completedCircles - 1) {
                    var previousCircleOffset = circle.index > 0 ? this.getCircleState(circle.index - 1).rotationOffset : 0;
                    circle.setRotationOffset(this.baseRotation, previousCircleOffset);
                }
            }
        }

        // Update and draw all circles
        for (let i = 0; i < this.circles.length; i++) {
            // Update rotation
            this.getCircleState(i).updatePosition(currentTime);
        }
        // Draw and update all arcs
        let cachedArcsToDraw = [];

        this.canvasHelper.clipToUncachedArcs(this.cachedArcs.size, completedCirclesToBePushed);

        this.arcs.forEach(arc => {
            if (circleWasJustCompleted && arc.circle.index !== FINAL_CIRCLE_INDEX) {
                // Remove from cache if a circle was just completed
                this.cachedArcs.delete(arc.index);
                arc.startDotTransition(currentTime);
            }

            arc.updateStates(currentTime);
            if (arc.isAnimating()) {
                // Always draw animating arcs to main canvas
                this.canvasHelper.drawArc(arc);
            } else if (!arc.isDot()) {
                // For static arcs in the latest circle, cache them in inner circle canvas if caching is enabled
                if (!this.cachedArcs.has(arc.index)) {
                    cachedArcsToDraw.push(arc);
                }
            } else {
                // All other arcs go to main canvas
                this.canvasHelper.drawArc(arc);
            }
        });

        // Restore the canvas state to remove clipping
        this.canvasHelper.restoreFromClipState();

        // arcs that are about to be cached need to be drawn after the clipping is removed.
        cachedArcsToDraw && cachedArcsToDraw.forEach(arc => {
            this.canvasHelper.drawArc(arc);
            this.cachedArcs.add(arc.index); // Mark as cached
        });
    }

    isAnimating() {
        // Always animate if we have any circles to rotate
        const completedCircles = Math.floor(this.arcs.length / TOTAL_DIVISIONS)
        return completedCircles > 0 ||
            this.arcs.some(arc => arc.isAnimating() ||
            this.counterState.isAnimating());
    }
}

class MathUtils {
    // Helper function for pulsing animation
    static getPulseScale(progress, startingSize, maxSize) {
        var maxScale = maxSize / startingSize;
        // Maximum scale --> 2.0 == the object will reach ~2x scale (i.e. double size)
        return startingSize + Math.sin(progress * Math.PI) * Math.exp(-progress * 3.01) * 3 * (maxSize - startingSize);
    }

    static easeOutBack(originalValue, finalValue, progress) {
        const c1 = 1.70158;
        const c3 = c1 + 1;

        return originalValue + (finalValue - originalValue) * (1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2));
    }

    static getShortestDistance(a, b, minValue, maxValue) {
        const range = maxValue - minValue;

        // Normalize both values to [0, range] first
        let normA = ((a - minValue) % range + range) % range;
        let normB = ((b - minValue) % range + range) % range;

        // Direct distance in normalized space
        let directDist = normB - normA;

        // Wrapping distances
        let wrapForward = range - normA + normB;  // Going forward through max
        let wrapBackward = -normA - (range - normB);  // Going backward through min

        // Return the smallest absolute distance, preserving sign
        if (Math.abs(directDist) <= Math.abs(wrapForward) && Math.abs(directDist) <= Math.abs(wrapBackward)) {
            return directDist;
        } else if (Math.abs(wrapForward) <= Math.abs(wrapBackward)) {
            return wrapForward;
        } else {
            return wrapBackward;
        }
    }
}

class CanvasHelper {
    constructor(stateManager) {
        this.stateManager = stateManager;

        // Get the canvas element
        this.canvas = document.getElementById('myCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.colors = null;
        this.setTheme();

        // For clipping uncached arc region
        this.cachedArcsOnLastUpdate = -1;
        this.clipRegion = null;
    }

    reset() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.resetCache();
    }

    resetCache() {
        this.cachedArcsOnLastUpdate = -1;
        this.clipRegion = null;
    }

    setTheme(toggleTheme = false) {
        let isDark = localStorage.getItem('theme') === 'dark';
        if (toggleTheme) {
            isDark = !isDark;
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }

        this.colors = isDark ? Colors.DARK_MODE : Colors.LIGHT_MODE;
        this.canvas.style.background = this.colors.BACKGROUND;
        document.body.classList.toggle('dark-mode', isDark);
        this.resetCache();
    }

    // Set canvas size to window size accounting for device pixel ratio
    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();    // Set the canvas size in actual pixels
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        // Scale all drawing operations by the dpr
        this.ctx.scale(dpr, dpr);

        // Update center coordinates (using CSS pixels)
        this.centerX = rect.width / 2;
        this.centerY = rect.height / 2;

        this.resetCache();
    }

    clipToUncachedArcs(numArcsCached, numOuterCircles) {
        // get clip region for non-cached arcs (i.e. the parts that may be moving).
        if (this.cachedArcsOnLastUpdate !== numArcsCached || !this.clipRegion) {
            this.cachedArcsOnLastUpdate = numArcsCached;

            const SAFE_PADDING_AROUND_RADIUS = RADIUS_INCREMENT / 2;
            const INNER_CIRCLE_PADDING_OUTER_RADIUS = BASE_RADIUS + SAFE_PADDING_AROUND_RADIUS;
            const INNER_CIRCLE_PADDING_INNER_RADIUS = BASE_RADIUS - SAFE_PADDING_AROUND_RADIUS;

            const donutPath = new Path2D();
            if (numOuterCircles > 0) {
                donutPath.arc(this.centerX, this.centerY, BASE_RADIUS + RADIUS_INCREMENT * numOuterCircles + SAFE_PADDING_AROUND_RADIUS, 0, TWO_PI); // Outer boundary
                donutPath.arc(this.centerX, this.centerY, INNER_CIRCLE_PADDING_OUTER_RADIUS, TWO_PI, 0, true); // Inner boundary
            }

            const innerRingPath = new Path2D();
            if (numArcsCached !== 0) {
                // If some arcs are cached, draw a partial inner ring excluding the cached arcs.
                // The arcs have rounded edges beyond the arc segment length, so offset the starting arc position to account for that.
                const ROUNDED_END_PADDING = ARC_GAP / 2;
                const FIRST_CACHED_ARC_START = STARTING_ARC_POSITION - ROUNDED_END_PADDING;
                const lastCachedArcEnd = FIRST_CACHED_ARC_START + numArcsCached * ARC_LENGTH;

                innerRingPath.moveTo(this.centerX + INNER_CIRCLE_PADDING_OUTER_RADIUS * Math.cos(FIRST_CACHED_ARC_START), this.centerY + INNER_CIRCLE_PADDING_OUTER_RADIUS * Math.sin(FIRST_CACHED_ARC_START));
                innerRingPath.arc(this.centerX, this.centerY, INNER_CIRCLE_PADDING_OUTER_RADIUS, FIRST_CACHED_ARC_START, lastCachedArcEnd, true); // Outer boundary (partial arc)
                innerRingPath.arc(this.centerX, this.centerY, INNER_CIRCLE_PADDING_INNER_RADIUS, lastCachedArcEnd, FIRST_CACHED_ARC_START, false); // Inner boundary (partial arc)
            } else {
                // If no arcs are cached, draw a full inner ring
                innerRingPath.moveTo(this.centerX + INNER_CIRCLE_PADDING_OUTER_RADIUS, this.centerY);
                innerRingPath.arc(this.centerX, this.centerY, INNER_CIRCLE_PADDING_OUTER_RADIUS, 0, TWO_PI); // Outer boundary
                innerRingPath.arc(this.centerX, this.centerY, INNER_CIRCLE_PADDING_INNER_RADIUS, TWO_PI, 0, true); // Inner boundary
            }

            const combinedPath = new Path2D();
            combinedPath.addPath(donutPath);
            combinedPath.addPath(innerRingPath);
            this.clipRegion = combinedPath;
        }

        this.ctx.save();
        this.ctx.clip(this.clipRegion);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    restoreFromClipState() {
        this.ctx.restore();
    }

    drawArc(arcState) {
        const startAngle = arcState.getStartAngle();
        const radius = arcState.getRadius();
    
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colors.ARCS;
    
        if (arcState.isDot()) {
            // Calculate position along the circle's circumference
            const x = this.centerX + radius * Math.cos(startAngle);
            const y = this.centerY + radius * Math.sin(startAngle);
    
            // Draw a circle at the calculated position
            this.ctx.fillStyle = this.colors.ARCS;
            this.ctx.arc(x, y, DOT_RADIUS, 0, TWO_PI);
            this.ctx.fill();
        }
        else {
            const scale = arcState.getScale();
            const endAngle = startAngle + arcState.segmentLength;
            this.ctx.lineCap = 'round';
            this.ctx.lineWidth = ARC_WIDTH * scale;
            this.ctx.arc(this.centerX, this.centerY, radius, startAngle, endAngle);
            this.ctx.stroke();
        }
    }

    drawCounterText(currentTime, counterState, remainingClicks) {
        if (!counterState.isTextCached) {
            // only clear the text area.
            this.ctx.clearRect(this.centerX - 45, this.centerY - 45, 90, 90);
            if (remainingClicks <= 0) {
                // don't need to display anything when no clicks are remaining
                counterState.isTextCached = true;
                return;
            }
    
            const fontSize = counterState.getFontSize(currentTime);
            this.ctx.save();
            this.ctx.textAlign = 'center';
            this.ctx.font = `500 ${fontSize}px "Helvetica Neue","Segoe UI",Arial,sans-serif`;
            this.ctx.fillStyle = this.colors.TEXT;
            const text = `${remainingClicks}`;
            const textMetrics = this.ctx.measureText(text);
            const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
            this.ctx.fillText(text, this.centerX, this.centerY + textHeight / 2);
            this.ctx.restore();
    
            counterState.isTextCached = !counterState.isAnimating();
        }
    }
}

function init() {
    const canvasHelper = new CanvasHelper();
    const stateManager = new StateManager(canvasHelper);

    const onWindowResize = () => {
        canvasHelper.resizeCanvas();
        stateManager.resetCache();
        stateManager.tryStartAnimation();
    }
    
    // Handle window resizing
    window.addEventListener('resize', onWindowResize);
    const resetButton = document.getElementById('resetButton');

    canvasHelper.canvas.addEventListener('click', () => {
        if (stateManager.addArc(performance.now())) {
            resetButton.style.display = 'block';
        }
    });

    // Handle reset button
    resetButton.addEventListener('click', () => {
        stateManager.reset();
        resetButton.style.display = 'none';
    });

    // Handle theme switching
    const themeButton = document.getElementById('themeButton');
    themeButton.addEventListener('click', () => {
        canvasHelper.setTheme(true);
        stateManager.resetCache();
        stateManager.tryStartAnimation();
    });

    // Initialize debug tools if needed
    initializeDebugTools && initializeDebugTools(stateManager, canvasHelper);

    onWindowResize();
}

init();