const gameConfig = {
  movement: {
    acceleration: 80,
    deceleration: 12,
    maxSpeed: 24
  },
  player: {
    health: 120
  },
  combat: {
    fireRate: 6,
    projectileSpeed: 120,
    projectileLifetime: 2.5,
    damage: 1
  },
  enemies: {
    spawnInterval: 4,
    maxSimultaneous: 10,
    defaultType: 'grunt',
    archetypes: {
      grunt: {
        speed: 6,
        health: 6,
        aggroRange: 28,
        attackRange: 3.5,
        attackDamage: 10,
        attackCooldown: 1.25,
        patrolRadius: 10,
        strafeAmplitude: 0.8,
        attackType: 'melee'
      },
      ranger: {
        speed: 5,
        health: 4,
        aggroRange: 34,
        attackRange: 16,
        attackDamage: 6,
        attackCooldown: 1.5,
        patrolRadius: 12,
        strafeAmplitude: 1.2,
        projectileSpeed: 72,
        projectileLifetime: 3,
        attackType: 'ranged'
      }
    },
    avoidance: {
      radius: 3.5,
      strength: 12
    }
  },
  scene: {
    fogNear: 20,
    fogFar: 140,
    floorSize: 120
  }
};

export default gameConfig;
