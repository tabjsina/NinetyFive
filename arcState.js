// ArcState class definition
class ArcState {
    constructor(index, startTime, circleManager) {
        this.index = index;
        this.startTime = startTime;
        const circleIndex = Math.floor(index / totalDivisions);
        this.circle = circleManager.getCircleState(circleIndex);
        this.isCached = false;
        this.positionInCircle = index % totalDivisions;
        this.isEntryAnimating = this.positionInCircle !== (totalDivisions - 1) || circleIndex === (maxCircles - 1);
        this.circleManager = circleManager;
        this.isDotTransitionAnimating = false;
        this.dotTransitionStartTime = null;
        this.dotTransitionProgress = 0;
        this.baseCenterOffset = arcSegmentLength / 2;
    }

    getScale(currentTime) {
        if (this.isEntryAnimating) {
            const progress = Math.min((currentTime - this.startTime) / arcEntryAnimDuration, 1);
            if (progress < 1) {
                return getPulseScale(progress, 1, 1.3);
            }

            this.isEntryAnimating = false;
        }

        return 1;
    }

    getRadius() {
        return this.circle.radius;
    }

    getArcProperties() {
        if (this.dotTransitionProgress == 0) {
            return {
                // Don't let the portion get to 0, otherwise the dot will disappear.
                segmentLength: arcSegmentLength,
                offset: 0
            };
        }
        else if (this.dotTransitionProgress >= 1) {
            return {
                segmentLength: 0,
                offset: this.baseCenterOffset
            };
        }

        // Smooth transition from arc to dot
        const arcPortion = 1 - this.dotTransitionProgress;
        const centerOffset = this.baseCenterOffset * this.dotTransitionProgress;
        return {
            // Don't let the portion get to 0, otherwise the dot will disappear.
            segmentLength: arcSegmentLength * arcPortion,
            offset: centerOffset // Offset to make arc shrink towards center
        };
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
        }
    }

    updateStates(currentTime) {
        this.updateDotTransition(currentTime);
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
        return this.dotTransitionProgress > 0;
    }
}
