// CircleState class definition
class CircleState {
    constructor(index) {
        this.index = index;
        this.radius = baseRadius;
        this.oldRadius = baseRadius;
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
            this.oldRadius = this.radius;
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
                this.oldRadius = this.targetRadius;
            }
            else {
                this.radius = easeOutBack(this.oldRadius, this.targetRadius, progress);
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
