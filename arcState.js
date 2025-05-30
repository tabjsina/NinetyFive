class ArcState {
    static ArcAnimationState = {
        ENTRY_ANIMATING: 0,
        ARC: 1,
        ARC_TO_DOT_ANIMATING: 2,
        DOT: 3
    };

    static ARC_ENTRY_ANIM_DURATION = 700;
    static DOT_TRANSITION_DURATION = 400;

    constructor(index, creationTime, stateManager) {
        this.index = index;
        this.creationTime = creationTime;
        const circleIndex = Math.floor(index / TOTAL_DIVISIONS);
        this.circle = stateManager.getCircleState(circleIndex);
        this.positionInCircle = index % TOTAL_DIVISIONS;
        this.stateManager = stateManager;
        this.dotTransitionStartTime = null;
        this.dotTransitionProgress = 0;
        this.scale = 1;
        this.startAngleCenteringOffset = 0;
        this.segmentLength = ARC_SEGMENT_LENGTH;
        
        // Initialize state based on position
        if (this.positionInCircle === (TOTAL_DIVISIONS - 1) && circleIndex !== FINAL_CIRCLE_INDEX) {
            this.currentState = ArcState.ArcAnimationState.ARC;
        } else {
            this.currentState = ArcState.ArcAnimationState.ENTRY_ANIMATING;
        }
    }

    getScale() {
        return this.scale;
    }

    updateScale(currentTime) {
        if (this.currentState === ArcState.ArcAnimationState.ENTRY_ANIMATING) {
            const progress = Math.min((currentTime - this.creationTime) / ArcState.ARC_ENTRY_ANIM_DURATION, 1);
            if (progress < 1) {
                this.scale = MathUtils.getPulseScale(progress, 1, 1.3);
                return;
            }

            this.currentState = ArcState.ArcAnimationState.ARC;
        }

        this.scale = 1;
    }

    getRadius() {
        return this.circle.radius;
    }

    updateDotTransition(currentTime) {
        if (this.currentState === ArcState.ArcAnimationState.ARC_TO_DOT_ANIMATING) {
            this.dotTransitionProgress = Math.min(
                (currentTime - this.dotTransitionStartTime) / ArcState.DOT_TRANSITION_DURATION,
                1
            );

            if (this.dotTransitionProgress >= 1) {
                this.currentState = ArcState.ArcAnimationState.DOT;
            }

            // Smooth transition from arc to dot
            this.segmentLength = ARC_SEGMENT_LENGTH * (1 - this.dotTransitionProgress);
            // Offset arc start position towards the middle of the segment (so the shrink effect is towards center)
            const arcSegmentMidpoint = ARC_SEGMENT_LENGTH / 2;
            this.startAngleCenteringOffset = arcSegmentMidpoint * this.dotTransitionProgress;
        }
    }

    updateStates(currentTime) {
        this.updateScale(currentTime);
        this.updateDotTransition(currentTime);
    }

    startDotTransition(currentTime) {
        if (this.currentState <= ArcState.ArcAnimationState.ARC) {
            this.currentState = ArcState.ArcAnimationState.ARC_TO_DOT_ANIMATING;
            this.dotTransitionStartTime = currentTime;
        }
    }

    isAnimating() {
        return this.currentState === ArcState.ArcAnimationState.ENTRY_ANIMATING || 
               this.currentState === ArcState.ArcAnimationState.ARC_TO_DOT_ANIMATING;
    }

    isDot() {
        return this.currentState >= ArcState.ArcAnimationState.DOT;
    }

    getStartAngle() {
        const baseStartAngle = this.positionInCircle * ARC_LENGTH + STARTING_ARC_POSITION;
        const rotation = this.circle.isRotating ? (this.stateManager.baseRotation - this.circle.rotationOffset) : 0;
        return baseStartAngle + rotation + this.startAngleCenteringOffset;
    }
}
