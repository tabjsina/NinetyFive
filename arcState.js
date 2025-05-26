// ArcState class definition
class ArcState {
    constructor(index, startTime, circleManager) {
        this.index = index;
        this.startTime = startTime;
        this.isEntryAnimating = true;
        this.circle = Math.floor(index / totalDivisions);
        this.isCached = false;
        this.positionInCircle = index % totalDivisions;
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
                return getBobbleScale(progress);
            }

            this.isEntryAnimating = false;
        }

        return 1;
    }

    getRadius(currentTime) {
        return this.circleManager.getCircleState(this.circle).radius;
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
                segmentLength: 0.001,
                offset: this.baseCenterOffset
            };
        }

        // Smooth transition from arc to dot
        const arcPortion = 1 - this.dotTransitionProgress;
        const centerOffset = this.baseCenterOffset * this.dotTransitionProgress;
        return {
            // Don't let the portion get to 0, otherwise the dot will disappear.
            segmentLength: Math.max(arcSegmentLength * arcPortion, 0.001),
            offset: centerOffset // Offset to make arc shrink towards center
        };
    }

    updateDotTransition(currentTime) {
        if (this.isDotTransitionAnimating) {
            if (this.dotTransitionProgress < 1) {
                this.dotTransitionProgress = Math.min(
                    (currentTime - this.dotTransitionStartTime) / dotTransitionDuration,
                    1
                );
            }
            else {
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
}
