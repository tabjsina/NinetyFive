// ArcState class definition
class ArcState {
    constructor(index, startTime, stateManager) {
        this.index = index;
        this.startTime = startTime;
        const circleIndex = Math.floor(index / totalDivisions);
        this.circle = stateManager.getCircleState(circleIndex);
        this.isCached = false;
        this.positionInCircle = index % totalDivisions;
        this.isEntryAnimating = this.positionInCircle !== (totalDivisions - 1) || circleIndex === finalCircleIndex;
        this.stateManager = stateManager;
        this.isDotTransitionAnimating = false;
        this.dotTransitionStartTime = null;
        this.dotTransitionProgress = 0;
        this.scale = 1;
        this.startAngleCenteringOffset = 0;
        this.segmentLength = arcSegmentLength;
    }

    getScale() {
        return this.scale;
    }

    updateScale(currentTime) {
        if (this.isEntryAnimating) {
            const progress = Math.min((currentTime - this.startTime) / arcEntryAnimDuration, 1);
            if (progress < 1) {
                this.scale = getPulseScale(progress, 1, 1.3);
                return;
            }

            this.isEntryAnimating = false;
        }

        this.scale = 1;
    }

    getRadius() {
        return this.circle.radius;
    }

    updateDotTransition(currentTime) {
        if (this.isDotTransitionAnimating) {
            this.dotTransitionProgress = Math.min(
                (currentTime - this.dotTransitionStartTime) / dotTransitionDuration,
                1
            );

            if (this.dotTransitionProgress >= 1) {
                this.isDotTransitionAnimating = false;
            }

            // Smooth transition from arc to dot
            this.segmentLength = arcSegmentLength * (1 - this.dotTransitionProgress);
             // Offset arc start position towards the middle of the segment (so the shrink effect is towards center)
            const arcSegmentMidpoint = arcSegmentLength / 2;
            this.startAngleCenteringOffset = arcSegmentMidpoint * this.dotTransitionProgress;
        }
    }

    updateStates(currentTime) {
        this.updateDotTransition(currentTime);
        this.updateScale(currentTime);
    }

    startDotTransition(currentTime) {
        if (!this.dotTransitionStartTime) {
            this.isDotTransitionAnimating = true;
            this.dotTransitionStartTime = currentTime;
        }
    }

    isAnimating() {
        return this.isEntryAnimating || this.isDotTransitionAnimating;
    }

    isDot() {
        return this.dotTransitionProgress >= 1;
    }

    getStartAngle() {
        const baseStartAngle = this.positionInCircle * arcLength + startingArcPosition;
        const rotation = this.circle.isRotating ? (this.stateManager.baseRotation - this.circle.rotationOffset) : 0;
        return baseStartAngle + rotation + this.startAngleCenteringOffset;
    }
}
