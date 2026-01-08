<template>
  <div id="app">
    <router-view></router-view>

    <!-- Session timeout warning notification -->
    <div v-if="showTimeoutWarning" class="timeout-warning">
      <div class="timeout-warning-content">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#f59e0b" stroke-width="2"/>
          <path d="M12 6v6l4 2" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <div class="timeout-warning-text">
          <strong>Sesión por expirar</strong>
          <p>Tu sesión expirará en {{ warningMinutes }} {{ warningMinutes === 1 ? 'minuto' : 'minutos' }} por inactividad.</p>
        </div>
        <button @click="extendSession" class="extend-button">
          Continuar sesión
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { getSessionManager, resetSessionManager } from './lib/sessionManager';
import { auth } from './lib/api';

export default {
  name: 'App',
  setup() {
    const router = useRouter();
    const sessionManager = getSessionManager(30); // 30 minutes timeout
    const showTimeoutWarning = ref(false);
    const warningMinutes = ref(2);

    const handleSessionTimeout = () => {
      console.log('[App] Session timed out - logging out');
      showTimeoutWarning.value = false;

      // Clear all session data
      localStorage.removeItem('session');
      localStorage.removeItem('userData');

      // Stop session manager
      sessionManager.stop();

      // Redirect to login
      router.push('/login');

      // Show a message (optional)
      alert('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');
    };

    const handleSessionWarning = (minutesRemaining) => {
      console.log('[App] Session warning -', minutesRemaining, 'minutes remaining');
      warningMinutes.value = minutesRemaining;
      showTimeoutWarning.value = true;
    };

    const extendSession = () => {
      console.log('[App] User extended session');
      sessionManager.extend();
      showTimeoutWarning.value = false;
    };

    const initializeSessionManager = () => {
      // Check if user is logged in
      const session = localStorage.getItem('session');
      const userData = localStorage.getItem('userData');

      if (session && userData) {
        console.log('[App] User is logged in - starting session manager');
        sessionManager.start(handleSessionTimeout, handleSessionWarning);
      } else {
        console.log('[App] No active session - session manager not started');
      }
    };

    onMounted(() => {
      console.log('[App] Component mounted');
      initializeSessionManager();

      // Re-initialize on route changes (in case of login)
      router.afterEach((to) => {
        // Start session manager after successful login
        if (to.path !== '/login' && to.path !== '/register') {
          const session = localStorage.getItem('session');
          const userData = localStorage.getItem('userData');

          if (session && userData && !sessionManager.checkInterval) {
            console.log('[App] Starting session manager after navigation');
            sessionManager.start(handleSessionTimeout, handleSessionWarning);
          }
        }

        // Stop session manager on login/register pages
        if (to.path === '/login' || to.path === '/register') {
          sessionManager.stop();
          showTimeoutWarning.value = false;
        }
      });
    });

    onUnmounted(() => {
      console.log('[App] Component unmounted - stopping session manager');
      sessionManager.stop();
    });

    return {
      showTimeoutWarning,
      warningMinutes,
      extendSession
    };
  }
};
</script>

<style>
#app {
  min-height: 100vh;
}

/* Session timeout warning notification */
.timeout-warning {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.timeout-warning-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 400px;
  border-left: 4px solid #f59e0b;
}

.timeout-warning-content svg {
  flex-shrink: 0;
}

.timeout-warning-text {
  flex: 1;
}

.timeout-warning-text strong {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.timeout-warning-text p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.extend-button {
  padding: 10px 20px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.extend-button:hover {
  background: #d97706;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.extend-button:active {
  transform: translateY(0);
}

/* Responsive design */
@media (max-width: 640px) {
  .timeout-warning {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .timeout-warning-content {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }

  .extend-button {
    width: 100%;
  }
}
</style>
