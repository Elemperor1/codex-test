export class Hud {
  constructor(root) {
    this.root = root;
    this.root.innerHTML = '';

    this.topBar = document.createElement('div');
    this.topBar.className = 'hud-top';

    this.scoreDisplay = document.createElement('div');
    this.enemyDisplay = document.createElement('div');
    this.waveDisplay = document.createElement('div');
    this.healthDisplay = document.createElement('div');

    this.bottom = document.createElement('div');
    this.bottom.className = 'hud-bottom';
    this.bottom.innerHTML = 'Click to lock the mouse, WASD to move, Left click to shoot';

    this.topBar.appendChild(this.scoreDisplay);
    this.topBar.appendChild(this.enemyDisplay);
    this.topBar.appendChild(this.waveDisplay);
    this.topBar.appendChild(this.healthDisplay);
    this.root.appendChild(this.topBar);
    this.root.appendChild(this.bottom);

    this.update({ score: 0, enemiesRemaining: 0, health: 0, waveStatus: 'Awaiting wave data' });
  }

  update({ score, enemiesRemaining, health, waveStatus }) {
    this.enemiesRemaining = enemiesRemaining;
    this.scoreDisplay.textContent = `Score: ${score}`;
    this.enemyDisplay.textContent = `Active enemies: ${enemiesRemaining}`;
    this.healthDisplay.textContent = `Health: ${health}`;
    if (waveStatus !== undefined) {
      this.waveDisplay.textContent = waveStatus;
    }
  }

  setWaveStatus(text) {
    this.waveDisplay.textContent = text;
  }

  showIntermission(nextWaveNumber, totalWaves, timeRemaining) {
    const formatted = timeRemaining.toFixed(1);
    this.setWaveStatus(`Next wave (${nextWaveNumber}/${totalWaves}) in ${formatted}s`);
  }
}
