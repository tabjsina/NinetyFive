// CircleState class definition
class CircleState {
    static RADIUS_EXPAND_DURATION = 400;

    constructor(index) {
        this.index = index;
        this.radius = BASE_RADIUS;
        this.oldRadius = BASE_RADIUS;
        this.targetRadius = BASE_RADIUS;
        this.isAnimating = false;
        this.animationStartTime = null;
        this.rotationOffset = 0; // Current offset from base rotation
        this.targetOffset = 0; // Target offset for rotation
        this.startingRotationOffset = 0; // Initial offset when set
        this.isRotating = false;
    }
    
    updateTargetRadius(currentTime, distanceFromInnerRing) {
        const newTargetRadius = BASE_RADIUS + (RADIUS_INCREMENT * distanceFromInnerRing);

        if (this.targetRadius !== newTargetRadius) {
            this.targetRadius = newTargetRadius;
            this.oldRadius = this.radius;
            this.animationStartTime = currentTime;
            this.isAnimating = true;
        }
    }

    setRotationOffset(startingOffset, offsetToApproach) {
        if (this.isRotating) {
            // If already rotating, no need to set again
            return;
        }

        this.isRotating = true;        // Normalize starting offset to be within one arc length
        this.startingRotationOffset = startingOffset % ARC_LENGTH;
        if (this.startingRotationOffset > ARC_GAP) {
            this.startingRotationOffset -= ARC_LENGTH;
        }

        // Calculate the shortest path to the previous circle's offset
        var shortestDistance = MathUtils.getShortestDistance(offsetToApproach, this.startingRotationOffset, -ARC_LENGTH_MIDPOINT, ARC_LENGTH_MIDPOINT);
        this.targetOffset = this.startingRotationOffset;

        // If distance is too large, limit the rotation to MAX_ROTATIONAL_OFFSET from the previous circles offset.
        if (shortestDistance > MAX_ROTATIONAL_OFFSET) {
            this.targetOffset = offsetToApproach + MAX_ROTATIONAL_OFFSET * ((this.startingRotationOffset < offsetToApproach ? -1 : 1));
        }
        else if (shortestDistance < -MAX_ROTATIONAL_OFFSET) {
            this.targetOffset = offsetToApproach - MAX_ROTATIONAL_OFFSET * (this.startingRotationOffset > offsetToApproach ? -1 : 1);
        }

        // Initialize the current rotation to the starting position
        this.rotationOffset = this.startingRotationOffset;
    }

    updatePosition(currentTime) {
        if (this.isAnimating) {
            const progress = Math.min((currentTime - this.animationStartTime) / CircleState.RADIUS_EXPAND_DURATION, 1);
            if (progress >= 1) {
                this.isAnimating = false;
                this.radius = this.targetRadius;
                this.oldRadius = this.targetRadius;
                this.rotationOffset = this.targetOffset;
            }
            else {
                this.radius = MathUtils.easeOutBack(this.oldRadius, this.targetRadius, progress);
                if (this.rotationOffset !== this.targetOffset) {
                    this.rotationOffset = MathUtils.easeOutBack(this.startingRotationOffset, this.targetOffset, progress);
                }
            }
        }
    }
}
