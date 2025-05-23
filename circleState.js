// CircleState class definition
class CircleState {
    constructor(index) {
        this.index = index;
        this.radius = baseRadius;
        this.targetRadius = baseRadius;
        this.isAnimating = false;
        this.animationStartTime = null;
    }

    updateRadius(currentTime, newTargetRadius) {
        if (this.targetRadius !== newTargetRadius) {
            this.targetRadius = newTargetRadius;
            this.animationStartTime = currentTime;
            this.isAnimating = true;
        }

        if (this.isAnimating) {
            const progress = Math.min((currentTime - this.animationStartTime) / radiusExpandDuration, 1);
            if (progress >= 1) {
                this.isAnimating = false;
                this.radius = this.targetRadius;
                return this.radius;
            }
            
            const bounceProgress = 1 + Math.sin(progress * Math.PI) * Math.exp(-progress * 3) * 5;
            const oldRadius = this.radius;
            this.radius = oldRadius + ((this.targetRadius - oldRadius) * progress * bounceProgress);
        }
        
        return this.radius;
    }
}

// CircleState will be available globally
