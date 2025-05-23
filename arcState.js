// ArcState class definition
class ArcState {
    constructor(index, startTime, circleManager) {
        this.index = index;
        this.startTime = startTime;
        this.isAnimating = true;
        this.circle = Math.floor(index / totalDivisions);
        this.positionInCircle = index % totalDivisions;
        this.circleManager = circleManager;
    }

    getScale(currentTime) {
        const progress = Math.min((currentTime - this.startTime) / arcEntryAnimDuration, 1);
        if (progress >= 1) {
            this.isAnimating = false;
            return 1;
        }
        return getBobbleScale(progress);
    }

    getRadius(currentTime) {
        return this.circleManager.getCircleState(this.circle).radius;
    }
}

// ArcState will be available globally
