export function applyMovementWithCollisions(currentPosition, moveVector, obstacles = [], radius = 1) {
  const resolved = currentPosition.clone();
  const blockedAxes = [];

  if (moveVector.x !== 0) {
    const next = resolved.clone();
    next.x += moveVector.x;
    if (positionIntersectsObstacles(next, obstacles, radius)) {
      blockedAxes.push('x');
    } else {
      resolved.x = next.x;
    }
  }

  if (moveVector.z !== 0) {
    const next = resolved.clone();
    next.z += moveVector.z;
    if (positionIntersectsObstacles(next, obstacles, radius)) {
      blockedAxes.push('z');
    } else {
      resolved.z = next.z;
    }
  }

  resolved.y = currentPosition.y;

  return { position: resolved, blockedAxes };
}

function positionIntersectsObstacles(position, obstacles, radius) {
  return obstacles.some(({ box }) => {
    if (!box) return false;
    const paddedMinX = box.min.x - radius;
    const paddedMaxX = box.max.x + radius;
    const paddedMinZ = box.min.z - radius;
    const paddedMaxZ = box.max.z + radius;

    const withinX = position.x >= paddedMinX && position.x <= paddedMaxX;
    const withinZ = position.z >= paddedMinZ && position.z <= paddedMaxZ;
    return withinX && withinZ;
  });
}
