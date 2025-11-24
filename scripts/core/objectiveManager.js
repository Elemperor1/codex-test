import { logger } from './logger.js';

function formatTime(seconds) {
  const clamped = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const secs = (clamped % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

export class ObjectiveManager {
  constructor(config, hud) {
    this.config = config;
    this.hud = hud;
    this.objectives = [];
    this.activeObjective = null;
    this.levelName = 'unknown';
    this.totalWaves = 0;
    this.objectiveLogger = logger.withContext({ module: 'objectives', feature: 'tracking' });
  }

  setLevel(levelName, totalWaves) {
    this.levelName = levelName || 'unknown';
    this.totalWaves = totalWaves;
    const levelObjectives = this.config.objectives?.levels?.[levelName] || this.config.objectives?.levels?.default || [];
    this.objectives = levelObjectives.map((entry) => this.normalize(entry));
    this.activeObjective = null;
    if (this.objectives.length === 0) {
      this.objectiveLogger.warn('No objectives defined for level. Falling back to elimination.', {
        level: this.levelName,
        sessionId: logger.sessionId,
        fallbackApplied: true
      });
      this.objectives = [
        this.normalize({ id: `${levelName || 'level'}-elimination`, type: 'elimination', waves: 'all' })
      ];
    }
    this.hud.setObjective({ title: 'Awaiting orders', description: 'Stand by for mission parameters.' });
  }

  normalize(entry) {
    const waves = entry.waves === 'all' ? Array.from({ length: this.totalWaves }, (_, i) => i + 1) : entry.waves || [];
    const startWave = entry.startWave || (waves.length > 0 ? Math.min(...waves) : 1);
    const typeInfo = this.config.objectives?.types?.[entry.type] || {};

    return {
      ...entry,
      description: entry.description || typeInfo.defaultDescription || '',
      label: typeInfo.label || entry.type,
      waves,
      startWave,
      timerRemaining: typeof entry.durationSeconds === 'number' ? entry.durationSeconds : null,
      trackedWaves: new Set(waves),
      state: 'pending'
    };
  }

  update(delta) {
    if (!this.activeObjective || this.activeObjective.state !== 'active') return;

    if (this.activeObjective.timerRemaining !== null) {
      this.activeObjective.timerRemaining -= delta;
      const remaining = Math.max(0, this.activeObjective.timerRemaining);
      this.hud.updateObjectiveTimer(formatTime(remaining), formatTime(this.activeObjective.durationSeconds || remaining));
    }

    this.evaluateObjective();
  }

  onWaveStart(waveNumber, totalWaves, waveData) {
    this.totalWaves = totalWaves;
    this.maybeStartObjective(waveNumber, waveData);
  }

  onWaveComplete(waveNumber) {
    if (this.activeObjective && this.activeObjective.trackedWaves.has(waveNumber)) {
      this.activeObjective.trackedWaves.delete(waveNumber);
    }
    this.evaluateObjective();
  }

  onScheduleComplete() {
    this.evaluateObjective(true);
  }

  onPlayerDown() {
    if (this.activeObjective && this.activeObjective.state === 'active') {
      this.failObjective('player_down');
    }
  }

  maybeStartObjective(waveNumber, waveData) {
    if (this.activeObjective && this.activeObjective.state === 'active') return;
    const nextObjective = this.objectives.find((obj) => obj.state === 'pending' && waveNumber >= obj.startWave);
    if (!nextObjective) return;

    nextObjective.state = 'active';
    nextObjective.timerRemaining = nextObjective.durationSeconds || nextObjective.timerRemaining;
    this.activeObjective = nextObjective;
    this.hud.clearObjectiveBanner();
    this.hud.setObjective({
      title: `${nextObjective.label || 'Objective'}: Wave ${nextObjective.startWave}+`,
      description: nextObjective.description
    });
    if (nextObjective.timerRemaining !== null) {
      this.hud.updateObjectiveTimer(
        formatTime(nextObjective.timerRemaining),
        nextObjective.durationSeconds ? formatTime(nextObjective.durationSeconds) : null
      );
    } else {
      this.hud.updateObjectiveTimer(null, null);
    }

    this.objectiveLogger.info('Objective started.', {
      objectiveId: nextObjective.id,
      type: nextObjective.type,
      level: this.levelName,
      waves: Array.from(nextObjective.trackedWaves),
      durationSeconds: nextObjective.durationSeconds,
      sessionId: logger.sessionId,
      stage: 'start'
    });
  }

  evaluateObjective(forceComplete = false) {
    if (!this.activeObjective || this.activeObjective.state !== 'active') return;

    const timerSatisfied =
      this.activeObjective.timerRemaining === null || this.activeObjective.timerRemaining <= 0 || forceComplete;
    const wavesSatisfied = this.activeObjective.trackedWaves.size === 0 || forceComplete;

    if (this.activeObjective.type === 'elimination' && wavesSatisfied) {
      this.completeObjective('waves_cleared');
      return;
    }

    if (['survival', 'defend'].includes(this.activeObjective.type) && timerSatisfied && wavesSatisfied) {
      this.completeObjective('timer_and_waves_complete');
    }
  }

  completeObjective(reason) {
    if (!this.activeObjective) return;
    this.activeObjective.state = 'completed';
    this.hud.showObjectiveBanner('complete', 'Objective complete');
    this.objectiveLogger.info('Objective completed.', {
      objectiveId: this.activeObjective.id,
      type: this.activeObjective.type,
      level: this.levelName,
      waves: Array.from(this.activeObjective.waves || []),
      sessionId: logger.sessionId,
      reason,
      stage: 'complete'
    });
    this.activeObjective = null;
  }

  failObjective(reason) {
    if (!this.activeObjective) return;
    this.activeObjective.state = 'failed';
    this.hud.showObjectiveBanner('failed', 'Objective failed');
    this.objectiveLogger.error('Objective failed.', {
      objectiveId: this.activeObjective.id,
      type: this.activeObjective.type,
      level: this.levelName,
      sessionId: logger.sessionId,
      reason,
      breadcrumbTrail: logger.getBreadcrumbSummary(),
      stage: 'fail'
    });
    this.activeObjective = null;
  }
}
