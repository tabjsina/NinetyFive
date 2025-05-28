// CircleState class definition
class CircleState {
    constructor(index) {
        this.index = index;
        this.radius = baseRadius;
        this.oldRadius = baseRadius;
        this.targetRadius = baseRadius;
        this.isAnimating = false;
        this.animationStartTime = null;
        this.rotationOffset = 0; // Current offset from base rotation
        this.targetOffset = 0; // Target offset for rotation
        this.startingRotationOffset = 0; // Initial offset when set
        this.isRotating = false;
    }

    updateTargetRadius(currentTime, distanceFromInnerRing) {
        const newTargetRadius = baseRadius + (radiusIncrement * distanceFromInnerRing);

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

        this.isRotating = true;
        // Normalize starting offset to be within one arc length
        this.startingRotationOffset = startingOffset % arcLength;
        if (this.startingRotationOffset > arcGap) {
            this.startingRotationOffset -= arcLength;
        }

        // Calculate the shortest path to the previous circle's offset
        var shortestDistance = this.getShortestDistance(offsetToApproach, this.startingRotationOffset, -ARC_LENGTH_MIDPOINT, ARC_LENGTH_MIDPOINT);
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
            const progress = Math.min((currentTime - this.animationStartTime) / radiusExpandDuration, 1);
            if (progress >= 1) {
                this.isAnimating = false;
                this.radius = this.targetRadius;
                this.oldRadius = this.targetRadius;
                this.rotationOffset = this.targetOffset;
            }
            else {
                this.radius = easeOutBack(this.oldRadius, this.targetRadius, progress);
                if (this.rotationOffset !== this.targetOffset) {
                    this.rotationOffset = easeOutBack(this.startingRotationOffset, this.targetOffset, progress);
                }
            }
        }
    }

    getShortestDistance(a, b, minValue, maxValue) {
        const range = maxValue - minValue;
        
        // Normalize both values to [0, range] first
        let normA = ((a - minValue) % range + range) % range;
        let normB = ((b - minValue) % range + range) % range;
        
        // Direct distance in normalized space
        let directDist = normB - normA;
        
        // Wrapping distances
        let wrapForward = range - normA + normB;  // Going forward through max
        let wrapBackward = -normA - (range - normB);  // Going backward through min
        
        // Return the smallest absolute distance, preserving sign
        if (Math.abs(directDist) <= Math.abs(wrapForward) && Math.abs(directDist) <= Math.abs(wrapBackward)) {
            return directDist;
        } else if (Math.abs(wrapForward) <= Math.abs(wrapBackward)) {
            return wrapForward;
        } else {
            return wrapBackward;
        }
    }
}
