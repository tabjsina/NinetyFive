// CircleState class definition
class CircleState {
    constructor(index) {
        this.index = index;
        this.radius = baseRadius;
        this.targetRadius = baseRadius;
        this.isAnimating = false;
        this.animationStartTime = null;
        this.rotation = 0; // Random initial rotation
        this.rotationSpeed = 0;
        this.lastRotationFrameTime = null;
    }

    updateTargetRadius(currentTime, newTargetRadius) {
        if (this.targetRadius !== newTargetRadius) {
            this.targetRadius = newTargetRadius;
            this.animationStartTime = currentTime;
            this.isAnimating = true;
        }
    }

    startRotation(currentTime) {
        this.lastRotationFrameTime = currentTime;
        this.rotationSpeed = 0.075;
    }

    updatePosition(currentTime) {
        if (this.isAnimating) {
            const progress = Math.min((currentTime - this.animationStartTime) / radiusExpandDuration, 1);
            if (progress >= 1) {
                this.isAnimating = false;
                this.radius = this.targetRadius;
            }
            else {
                const bounceProgress = 1 + Math.sin(progress * Math.PI) * Math.exp(-progress * 3) * 5;
                const oldRadius = this.radius;
                this.radius = oldRadius + ((this.targetRadius - oldRadius) * progress * bounceProgress);
            }
        }

        if (this.rotationSpeed != 0) {
            const deltaTime = (currentTime - this.lastRotationFrameTime) / 1000; // Convert to seconds
            this.rotation += this.rotationSpeed * deltaTime;
            // Keep rotation between 0 and 2π
            this.rotation = this.rotation % (Math.PI * 2);
            this.lastRotationFrameTime = currentTime;
        }

        return this.rotation;
    }
}
