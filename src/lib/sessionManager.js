/**
 * Session Manager - Handles automatic logout after inactivity
 */
export class SessionManager {
  constructor(timeoutMinutes = 30) {
    this.timeout = timeoutMinutes * 60 * 1000; // Convert to milliseconds
    this.warningTime = 2 * 60 * 1000; // Show warning 2 minutes before timeout
    this.lastActivity = Date.now();
    this.checkInterval = null;
    this.onTimeout = null;
    this.onWarning = null;
    this.warningShown = false;
  }

  /**
   * Start monitoring user activity
   * @param {Function} onTimeout - Callback when session expires
   * @param {Function} onWarning - Optional callback for timeout warning
   */
  start(onTimeout, onWarning = null) {
    this.onTimeout = onTimeout;
    this.onWarning = onWarning;
    this.lastActivity = Date.now();
    this.warningShown = false;

    console.log('[SessionManager] Started with timeout:', this.timeout / 60000, 'minutes');

    // Check session status every minute
    this.checkInterval = setInterval(() => {
      this.checkSession();
    }, 60000); // Check every 60 seconds

    // Track user activity events
    this.activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    this.activityHandler = () => this.updateActivity();

    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.activityHandler, { passive: true });
    });

    console.log('[SessionManager] Activity tracking started');
  }

  /**
   * Check if session has timed out
   */
  checkSession() {
    const now = Date.now();
    const inactiveTime = now - this.lastActivity;
    const remainingTime = this.timeout - inactiveTime;

    console.log('[SessionManager] Inactive for:', Math.floor(inactiveTime / 60000), 'minutes');

    // Show warning if approaching timeout
    if (remainingTime <= this.warningTime && !this.warningShown && this.onWarning) {
      this.warningShown = true;
      const minutesRemaining = Math.ceil(remainingTime / 60000);
      console.log('[SessionManager] Warning: Session expires in', minutesRemaining, 'minutes');
      this.onWarning(minutesRemaining);
    }

    // Timeout reached
    if (inactiveTime >= this.timeout) {
      console.log('[SessionManager] Session timed out');
      this.stop();
      if (this.onTimeout) {
        this.onTimeout();
      }
    }
  }

  /**
   * Update last activity timestamp
   */
  updateActivity() {
    const now = Date.now();
    // Throttle updates to once per second to avoid excessive calls
    if (now - this.lastActivity > 1000) {
      this.lastActivity = now;
      this.warningShown = false; // Reset warning when user is active again
    }
  }

  /**
   * Extend the session (reset timer)
   */
  extend() {
    console.log('[SessionManager] Session extended');
    this.lastActivity = Date.now();
    this.warningShown = false;
  }

  /**
   * Stop session monitoring
   */
  stop() {
    console.log('[SessionManager] Stopping session monitoring');

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Remove activity listeners
    if (this.activityHandler && this.activityEvents) {
      this.activityEvents.forEach(event => {
        document.removeEventListener(event, this.activityHandler);
      });
    }

    this.activityHandler = null;
  }

  /**
   * Get remaining time until timeout (in milliseconds)
   */
  getRemainingTime() {
    const now = Date.now();
    const inactiveTime = now - this.lastActivity;
    const remainingTime = this.timeout - inactiveTime;
    return Math.max(0, remainingTime);
  }

  /**
   * Get remaining time formatted as minutes
   */
  getRemainingMinutes() {
    return Math.ceil(this.getRemainingTime() / 60000);
  }
}

// Singleton instance
let sessionManagerInstance = null;

/**
 * Get or create session manager instance
 * @param {number} timeoutMinutes - Timeout in minutes (default: 30)
 */
export function getSessionManager(timeoutMinutes = 30) {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager(timeoutMinutes);
  }
  return sessionManagerInstance;
}

/**
 * Reset session manager instance (useful for testing)
 */
export function resetSessionManager() {
  if (sessionManagerInstance) {
    sessionManagerInstance.stop();
    sessionManagerInstance = null;
  }
}
