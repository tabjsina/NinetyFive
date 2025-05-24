// ArcState class definition
class ArcState {
    constructor(index, startTime, circleManager) {
        this.index = index;
        this.startTime = startTime;
        this.isAnimating = true;
        this.circle = Math.floor(index / totalDivisions);
        this.positionInCircle = index % totalDivisions;
        this.circleManager = circleManager;
        this.dotTransitionStartTime = null;
        this.dotTransitionProgress = 0;
    }    getScale(currentTime) {
        const progress = Math.min((currentTime - this.startTime) / arcEntryAnimDuration, 1);
        if (progress >= 1) {
            // Keep animating if we're still in dot transition
            this.isAnimating = this.dotTransitionProgress > 0 && this.dotTransitionProgress < 1;
            return 1;
        }
        return getBobbleScale(progress);
    }

    getRadius(currentTime) {
        return this.circleManager.getCircleState(this.circle).radius;
    }

    getArcProperties() {
        // Smooth transition from arc to dot
        const arcPortion = 1 - this.dotTransitionProgress;
        const centerOffset = (arcSegmentLength / 2) * this.dotTransitionProgress;
        return {
            // Don't let the portion get to 0, otherwise the dot will disappear.
            segmentLength: Math.max(arcSegmentLength * arcPortion, 0.001),
            offset: centerOffset // Offset to make arc shrink towards center
        };
    }

    updateDotTransition(currentTime) {
        if (this.dotTransitionStartTime && this.dotTransitionProgress < 1) {
            this.dotTransitionProgress = Math.min(
                (currentTime - this.dotTransitionStartTime) / dotTransitionDuration,
                1
            );
        }
    }

    updateStates(currentTime) {
        this.updateDotTransition(currentTime);
    }

    startDotTransition(currentTime) {
        if (!this.dotTransitionStartTime) {
            this.dotTransitionStartTime = currentTime;
        }
    }
}
