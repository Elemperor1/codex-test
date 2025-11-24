export class Hud {
  constructor(root) {
    this.root = root;
    this.root.innerHTML = '';

    this.topBar = document.createElement('div');
    this.topBar.className = 'hud-top';

    this.scoreDisplay = document.createElement('div');
    this.enemyDisplay = document.createElement('div');
    this.waveDisplay = document.createElement('div');

    this.objectivePanel = document.createElement('div');
    this.objectivePanel.className = 'hud-objective';
    this.objectiveTitle = document.createElement('div');
    this.objectiveTitle.className = 'objective-title';
    this.objectiveDescription = document.createElement('div');
    this.objectiveDescription.className = 'objective-description';
    this.objectiveTimer = document.createElement('div');
    this.objectiveTimer.className = 'objective-timer';
    this.objectivePanel.append(this.objectiveTitle, this.objectiveDescription, this.objectiveTimer);

    this.objectiveBanner = document.createElement('div');
    this.objectiveBanner.className = 'objective-banner';

    this.bottom = document.createElement('div');
    this.bottom.className = 'hud-bottom';
    this.bottom.innerHTML = 'Click to lock the mouse, WASD to move, Left click to shoot, R to reload';

    this.statusGroup = document.createElement('div');
    this.statusGroup.className = 'hud-status-group';
    this.healthBar = this.createBar('Health');
    this.armorBar = this.createBar('Armor', 'armor');
    this.ammoDisplay = document.createElement('div');
    this.ammoDisplay.className = 'hud-ammo';

    this.lowHealthNotice = document.createElement('div');
    this.lowHealthNotice.className = 'hud-warning';
    this.lowHealthNotice.textContent = 'Critical health! Find cover to recover.';

    this.damageIndicator = document.createElement('div');
    this.damageIndicator.className = 'damage-indicator';

    this.restartPanel = document.createElement('div');
    this.restartPanel.className = 'restart-panel';
    this.restartText = document.createElement('div');
    this.restartText.textContent = 'You are down. Restart to re-enter the arena.';
    this.restartButton = document.createElement('button');
    this.restartButton.textContent = 'Restart';
    this.restartPanel.append(this.restartText, this.restartButton);

    this.statusGroup.append(this.healthBar.container, this.armorBar.container, this.ammoDisplay);
    this.topBar.appendChild(this.scoreDisplay);
    this.topBar.appendChild(this.enemyDisplay);
    this.topBar.appendChild(this.waveDisplay);
    this.topBar.appendChild(this.objectivePanel);
    this.topBar.appendChild(this.statusGroup);
    this.root.appendChild(this.topBar);
    this.root.appendChild(this.objectiveBanner);
    this.root.appendChild(this.lowHealthNotice);
    this.root.appendChild(this.bottom);
    this.root.appendChild(this.damageIndicator);
    this.root.appendChild(this.restartPanel);

    this.update({
      score: 0,
      enemiesRemaining: 0,
      health: 0,
      armor: 0,
      ammoInMagazine: 0,
      reserveAmmo: 0,
      waveStatus: 'Awaiting wave data'
    });
  }

  createBar(labelText, modifier) {
    const container = document.createElement('div');
    container.className = `hud-bar ${modifier || ''}`.trim();

    const label = document.createElement('span');
    label.textContent = `${labelText}:`;

    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';

    track.appendChild(fill);
    container.append(label, track);

    return { container, fill, label };
  }

  update({
    score,
    enemiesRemaining,
    health,
    armor,
    maxHealth,
    maxArmor,
    ammoInMagazine,
    magazineSize,
    reserveAmmo,
    waveStatus,
    isReloading,
    lowHealth
  }) {
    this.enemiesRemaining = enemiesRemaining;
    if (score !== undefined) this.scoreDisplay.textContent = `Score: ${score}`;
    if (enemiesRemaining !== undefined) this.enemyDisplay.textContent = `Active enemies: ${enemiesRemaining}`;
    if (waveStatus !== undefined) this.waveDisplay.textContent = waveStatus;

    if (maxHealth !== undefined && health !== undefined) {
      const ratio = maxHealth > 0 ? health / maxHealth : 0;
      this.healthBar.fill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
      this.healthBar.label.textContent = `Health: ${health}/${maxHealth}`;
    }

    if (maxArmor !== undefined && armor !== undefined) {
      const ratio = maxArmor > 0 ? armor / maxArmor : 0;
      this.armorBar.fill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
      this.armorBar.label.textContent = `Armor: ${armor}/${maxArmor}`;
    }

    if (ammoInMagazine !== undefined && reserveAmmo !== undefined) {
      const magText = magazineSize ? `${ammoInMagazine}/${magazineSize}` : ammoInMagazine;
      this.ammoDisplay.textContent = `Ammo: ${magText} | Reserve: ${reserveAmmo}${isReloading ? ' (Reloading...)' : ''}`;
    }

    if (typeof lowHealth === 'boolean') {
      this.lowHealthNotice.classList.toggle('visible', lowHealth);
    }
  }

  showDamageIndicator() {
    this.damageIndicator.classList.add('active');
    clearTimeout(this.damageTimeout);
    this.damageTimeout = setTimeout(() => this.damageIndicator.classList.remove('active'), 220);
  }

  setWaveStatus(text) {
    this.waveDisplay.textContent = text;
  }

  showIntermission(nextWaveNumber, totalWaves, timeRemaining) {
    const formatted = timeRemaining.toFixed(1);
    this.setWaveStatus(`Next wave (${nextWaveNumber}/${totalWaves}) in ${formatted}s`);
  }

  setObjective({ title, description }) {
    this.objectiveTitle.textContent = title || 'Objective incoming';
    this.objectiveDescription.textContent = description || '';
  }

  updateObjectiveTimer(value, total) {
    if (value == null) {
      this.objectiveTimer.textContent = '';
      this.objectiveTimer.classList.remove('visible');
      return;
    }

    this.objectiveTimer.textContent = total ? `Timer: ${value} / ${total}` : `Timer: ${value}`;
    this.objectiveTimer.classList.add('visible');
  }

  showObjectiveBanner(state, text) {
    this.objectiveBanner.textContent = text;
    this.objectiveBanner.classList.remove('complete', 'failed');
    if (state === 'complete') {
      this.objectiveBanner.classList.add('complete');
    } else if (state === 'failed') {
      this.objectiveBanner.classList.add('failed');
    }
    this.objectiveBanner.classList.add('visible');
  }

  clearObjectiveBanner() {
    this.objectiveBanner.classList.remove('visible', 'complete', 'failed');
    this.objectiveBanner.textContent = '';
  }

  showRestart(onRestart) {
    this.restartPanel.classList.add('visible');
    this.restartButton.onclick = () => {
      if (typeof onRestart === 'function') {
        onRestart();
      }
    };
  }
}
