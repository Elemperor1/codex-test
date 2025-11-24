import * as THREE from 'three';
import gameConfig from '../config/gameConfig.js';
import { createCamera, createRenderer, createScene, buildLevelGeometry, setupResizing } from './core/engine.js';
import { loadLevel } from './core/levelLoader.js';
import { PlayerController } from './player/playerController.js';
import { EnemySpawner } from './enemy/enemySpawner.js';
import { Hud } from './hud/hud.js';

const container = document.getElementById('app');
const hud = new Hud(document.getElementById('hud-root'));

const scene = createScene(gameConfig);
const renderer = createRenderer(container);
const camera = createCamera(container);
setupResizing(camera, renderer, container);

const player = new PlayerController(camera, renderer, scene, hud, gameConfig);
const spawner = new EnemySpawner(scene, gameConfig);

player.onDeath = () => {
  hud.showRestart(restartGame);
};

spawner.setCallbacks({
  onWaveStart: (waveNumber, totalWaves, wave) => {
    const types = wave.types && wave.types.length > 0 ? wave.types.join(', ') : gameConfig.enemies.defaultType;
    hud.setWaveStatus(`Wave ${waveNumber}/${totalWaves}: ${types}`);
  },
  onWaveComplete: (waveNumber, totalWaves) => {
    hud.setWaveStatus(`Wave ${waveNumber}/${totalWaves} cleared`);
  },
  onIntermission: (nextWave, totalWaves, timeRemaining) => {
    hud.showIntermission(nextWave, totalWaves, timeRemaining);
  },
  onScheduleComplete: () => {
    hud.setWaveStatus('All waves defeated!');
    player.bottomMessage('All enemy waves cleared!');
  }
});

const clock = new THREE.Clock();

async function start() {
  try {
    const level = await loadLevel('/scenes/trainingGround.json');
    buildLevelGeometry(scene, level, gameConfig);
    player.setPosition(new THREE.Vector3(...level.playerStart));
    spawner.loadSpawnPoints(level.enemySpawnPoints);
    spawner.setObstacles(level.obstacles);
    spawner.setAllowedTypes(level.enemyTypes || []);
    spawner.configureWaves(level.waves || gameConfig.enemies.waves);
  } catch (error) {
    console.error(error);
  }

  animate();
}

function restartGame() {
  window.location.reload();
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  spawner.update(delta, player);
  player.update(delta, spawner.enemies);

  renderer.render(scene, camera);
}

start();
