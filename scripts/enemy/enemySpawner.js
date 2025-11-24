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

  update(delta, player) {
    const targetPosition = player.controls.getObject().position;
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0 && this.enemies.length < this.config.enemies.maxSimultaneous) {
      this.spawnEnemy();
      this.spawnTimer = this.config.enemies.spawnInterval;
    }

    this.enemies.forEach((enemy) => enemy.update(player, delta, this.obstacles));
  }

  spawnEnemy() {
    if (this.spawnPoints.length === 0) return;
    const index = Math.floor(Math.random() * this.spawnPoints.length);
    const point = this.spawnPoints[index];
    const enemy = new Enemy(this.scene, point, this.config, this.config.enemies.defaultType);
    this.scene.add(enemy.mesh);
    this.enemies.push(enemy);
  }
}
