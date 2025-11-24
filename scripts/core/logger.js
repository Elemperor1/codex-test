const LEVELS = ['debug', 'info', 'warn', 'error'];

class Logger {
  constructor() {
    this.sinks = [];
    this.handlersAttached = false;
    this.consoleSink = this.createConsoleSink();
    this.overlaySink = null;
    this.registerSink(this.consoleSink);
  }

  createConsoleSink() {
    const consoleMap = {
      debug: console.debug || console.log,
      info: console.info || console.log,
      warn: console.warn || console.log,
      error: console.error || console.log
    };

    return ({ level, message, timestamp, context }) => {
      const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      const writer = consoleMap[level] || console.log;
      if (context) {
        writer(formatted, context);
      } else {
        writer(formatted);
      }
    };
  }

  createOverlaySink(options = {}) {
    const maxEntries = options.maxEntries || 5;
    const overlay = document.createElement('div');
    overlay.className = 'logger-overlay';
    overlay.style.position = 'fixed';
    overlay.style.right = '16px';
    overlay.style.bottom = '16px';
    overlay.style.maxWidth = '420px';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.gap = '8px';
    overlay.style.pointerEvents = 'none';
    document.body.appendChild(overlay);

    const entries = [];

    return ({ level, message, timestamp }) => {
      const entry = document.createElement('div');
      entry.className = `logger-overlay__entry logger-overlay__entry--${level}`;
      entry.textContent = `[${timestamp}] ${message}`;
      entry.style.padding = '8px 12px';
      entry.style.borderRadius = '6px';
      entry.style.color = '#ffffff';
      entry.style.fontSize = '12px';
      entry.style.fontFamily = 'monospace';
      entry.style.background =
        level === 'error'
          ? 'rgba(220, 38, 38, 0.85)'
          : level === 'warn'
            ? 'rgba(234, 179, 8, 0.9)'
            : 'rgba(30, 41, 59, 0.9)';

      entries.push(entry);
      overlay.appendChild(entry);

      if (entries.length > maxEntries) {
        const oldEntry = entries.shift();
        if (oldEntry && oldEntry.parentNode) {
          oldEntry.parentNode.removeChild(oldEntry);
        }
      }

      setTimeout(() => {
        entry.style.opacity = '0';
        entry.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
          const index = entries.indexOf(entry);
          if (index !== -1) entries.splice(index, 1);
          if (entry.parentNode) entry.parentNode.removeChild(entry);
        }, 500);
      }, options.ttl || 6000);
    };
  }

  createNetworkSink(endpoint, fetchOptions = {}) {
    return async (entry) => {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(fetchOptions.headers || {}) },
          body: JSON.stringify(entry),
          keepalive: true,
          ...fetchOptions
        });
      } catch (err) {
        // Fallback to console to avoid silent failures
        this.consoleSink({
          level: 'warn',
          message: `Logger network sink failed: ${err?.message || err}`,
          timestamp: new Date().toISOString(),
          context: { entry, endpoint }
        });
      }
    };
  }

  registerSink(sink) {
    if (typeof sink === 'function') {
      this.sinks.push(sink);
    }
  }

  enableOverlaySink(options) {
    if (!this.overlaySink) {
      this.overlaySink = this.createOverlaySink(options);
      this.registerSink(this.overlaySink);
    }
    return this.overlaySink;
  }

  registerNetworkSink(endpoint, fetchOptions) {
    const sink = this.createNetworkSink(endpoint, fetchOptions);
    this.registerSink(sink);
    return sink;
  }

  log(level, message, context) {
    if (!LEVELS.includes(level)) {
      throw new Error(`Unknown log level: ${level}`);
    }

    const entry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context && Object.keys(context).length > 0 ? context : undefined
    };

    this.sinks.forEach((sink) => {
      try {
        sink(entry);
      } catch (err) {
        // Prevent sink failures from stopping logging entirely
        this.consoleSink({
          level: 'warn',
          message: `Logger sink error: ${err?.message || err}`,
          timestamp: new Date().toISOString(),
          context: { failedEntry: entry }
        });
      }
    });
  }

  debug(message, context) {
    this.log('debug', message, context);
  }

  info(message, context) {
    this.log('info', message, context);
  }

  warn(message, context) {
    this.log('warn', message, context);
  }

  error(message, context) {
    this.log('error', message, context);
  }

  attachGlobalErrorHandlers() {
    if (this.handlersAttached) return;

    window.addEventListener('error', (event) => {
      this.error('An unexpected error interrupted the game.', {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
        nextSteps: 'Reload the page. If the issue persists, clear your cache or report the error.'
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error('An unhandled promise rejection occurred.', {
        reason: event.reason,
        nextSteps: 'Retry the last action or reload the page to continue playing.'
      });
    });

    this.handlersAttached = true;
  }
}

export const logger = new Logger();

// Attach global handlers by default for safety.
logger.attachGlobalErrorHandlers();

export function enableHudLogging(options) {
  return logger.enableOverlaySink(options);
}

export function registerNetworkLogger(endpoint, fetchOptions) {
  return logger.registerNetworkSink(endpoint, fetchOptions);
}
