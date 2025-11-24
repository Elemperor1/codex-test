import * as THREE from 'three';
import { Enemy } from './enemy.js';

export class EnemySpawner {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.enemies = [];
    this.spawnTimer = 0;
    this.spawnPoints = [];
    this.obstacles = [];
    this.allowedEnemyTypes = [];
    this.waves = [];
    this.currentWaveIndex = -1;
    this.spawnedThisWave = 0;
    this.intermissionTimer = 0;
    this.scheduleComplete = false;
    this.callbacks = {
      onWaveStart: () => {},
      onWaveComplete: () => {},
      onIntermission: () => {},
      onScheduleComplete: () => {}
    };
  }

  loadSpawnPoints(points) {
    this.spawnPoints = points.map(([x, y, z]) => ({ x, y, z }));
  }

  setObstacles(obstacles) {
    this.obstacles = obstacles.map((obstacle) => {
      const [width, height, depth] = obstacle.size;
      const half = new THREE.Vector3(width / 2, height / 2, depth / 2);
      const [x, y, z] = obstacle.position;
      const center = new THREE.Vector3(x, y, z);
      const box = new THREE.Box3(center.clone().sub(half), center.clone().add(half));
      return { box };
    });
  }

  setAllowedTypes(types = []) {
    this.allowedEnemyTypes = types;
  }

  setCallbacks(callbacks = {}) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  configureWaves(waves = []) {
    this.waves = waves.length > 0 ? waves : this.config.enemies.waves || [];
    this.currentWaveIndex = -1;
    this.spawnedThisWave = 0;
    this.scheduleComplete = false;
    this.intermissionTimer = 0;
  }

  update(delta, player) {
    this.spawnTimer -= delta;

    if (!this.scheduleComplete && this.waves.length > 0 && this.currentWaveIndex === -1) {
      this.startNextWave();
    }

    if (this.intermissionTimer > 0) {
      this.intermissionTimer -= delta;
      this.callbacks.onIntermission(
        this.currentWaveIndex + 2,
        this.waves.length,
        Math.max(this.intermissionTimer, 0)
      );
      if (this.intermissionTimer <= 0) {
        this.startNextWave();
      }
    }

    const wave = this.waves[this.currentWaveIndex];
    if (!this.scheduleComplete && wave) {
      const spawnInterval = wave.spawnInterval || this.config.enemies.spawnInterval;
      if (
        this.spawnTimer <= 0 &&
        this.spawnedThisWave < wave.count &&
        this.enemies.length < this.config.enemies.maxSimultaneous
      ) {
        this.spawnEnemy(this.pickEnemyType(wave));
        this.spawnTimer = spawnInterval;
        this.spawnedThisWave += 1;
      }

      if (this.spawnedThisWave >= wave.count && this.enemies.length === 0) {
        this.finishWave();
      }
    }

    this.enemies.forEach((enemy) => enemy.update(player, delta, this.obstacles));
  }

  spawnEnemy(type) {
    if (this.spawnPoints.length === 0) return;
    const index = Math.floor(Math.random() * this.spawnPoints.length);
    const point = this.spawnPoints[index];
    const enemy = this.createEnemyInstance(type, point);
    if (!enemy) return;
    this.scene.add(enemy.mesh);
    this.enemies.push(enemy);
  }

  createEnemyInstance(type, spawnPoint) {
    return new Enemy(this.scene, spawnPoint, this.config, type || this.config.enemies.defaultType);
  }

  pickEnemyType(wave) {
    const availableTypes = wave.types && wave.types.length > 0 ? wave.types : [this.config.enemies.defaultType];
    const validTypes = availableTypes.filter((type) => this.isTypeAllowed(type));
    const pool = validTypes.length > 0 ? validTypes : [this.config.enemies.defaultType];
    const choice = Math.floor(Math.random() * pool.length);
    return pool[choice];
  }

  isTypeAllowed(type) {
    const archetypeExists = Boolean(this.config.enemies.archetypes[type]);
    if (!archetypeExists) return false;
    if (!this.allowedEnemyTypes || this.allowedEnemyTypes.length === 0) return true;
    return this.allowedEnemyTypes.includes(type);
  }

  startNextWave() {
    this.currentWaveIndex += 1;
    this.spawnedThisWave = 0;
    this.spawnTimer = 0;
    this.intermissionTimer = 0;

    if (this.currentWaveIndex >= this.waves.length) {
      this.scheduleComplete = true;
      this.callbacks.onScheduleComplete();
      return;
    }

    const waveNumber = this.currentWaveIndex + 1;
    this.callbacks.onWaveStart(waveNumber, this.waves.length, this.waves[this.currentWaveIndex]);
  }

  finishWave() {
    const waveNumber = this.currentWaveIndex + 1;
    this.callbacks.onWaveComplete(waveNumber, this.waves.length);

    if (waveNumber >= this.waves.length) {
      this.scheduleComplete = true;
      this.callbacks.onScheduleComplete();
    } else {
      const currentWave = this.waves[this.currentWaveIndex];
      this.intermissionTimer = currentWave.intermission || this.config.enemies.waveIntermission || 0;
    }
  }
}
