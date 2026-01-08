<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-section">
        <div class="logo-placeholder">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="60" height="60" rx="12" fill="#2563eb"/>
            <path d="M30 15v30M15 30h30" stroke="white" stroke-width="4" stroke-linecap="round"/>
          </svg>
        </div>
        <h1>Clínicas UA</h1>
        <p class="subtitle">Sistema de Gestión Médica</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="usuario@ejemplo.com"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            :disabled="loading"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>

        <div class="register-link">
          ¿Eres paciente y no tienes cuenta? <router-link to="/register">Regístrate aquí</router-link>
        </div>
      </form>
    </div>

    <TwoFactorModal
      :show="showTwoFactorModal"
      :mode="twoFactorMode"
      :email="userEmail"
      :requiresTwoFactorSetup="requiresTwoFactorSetup"
      :requiresTwoFactorCode="requiresTwoFactorCode"
      @verify-success="handleTwoFactorSuccess"
      @close="handleTwoFactorClose"
    />
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '../lib/api';
import TwoFactorModal from '../components/TwoFactorModal.vue';

export default {
  name: 'Login',
  components: {
    TwoFactorModal
  },
  setup() {
    const router = useRouter();
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const errorMessage = ref('');
    const showTwoFactorModal = ref(false);
    const twoFactorMode = ref('');
    const requiresTwoFactorSetup = ref(false);
    const requiresTwoFactorCode = ref(false);
    const userEmail = ref('');

    const handleSuccessfulLogin = (user) => {
      localStorage.setItem('userData', JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role.toLowerCase(),
        fullName: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt
      }));

      // Route based on role
      const role = user.role.toLowerCase();
      if (role === 'patient') {
        router.push('/patient');
      } else if (role === 'doctor' || role === 'nurse') {
        router.push('/staff');
      }
    };

    const handleLogin = async () => {
      loading.value = true;
      errorMessage.value = '';

      try {
        const { data, error } = await auth.signIn(email.value, password.value);

        if (error) {
          if (error.message.includes('Invalid')) {
            errorMessage.value = 'Correo o contraseña incorrectos';
          } else {
            errorMessage.value = 'Error al iniciar sesión. Intente nuevamente.';
          }
          loading.value = false;
          return;
        }

        // Check if 2FA is required
        console.log('Login response:', data);
        if (data.requiresTwoFactorSetup) {
          // User needs to set up 2FA
          console.log('Setting up 2FA - showing setup modal');
          userEmail.value = email.value;
          twoFactorMode.value = 'setup';
          requiresTwoFactorSetup.value = true;
          requiresTwoFactorCode.value = false;
          showTwoFactorModal.value = true;
          loading.value = false;
          return;
        }

        if (data.requiresTwoFactorCode) {
          // User needs to provide 2FA code
          console.log('2FA code required - showing verify modal');
          userEmail.value = email.value;
          twoFactorMode.value = 'verify';
          requiresTwoFactorSetup.value = false;
          requiresTwoFactorCode.value = true;
          showTwoFactorModal.value = true;
          loading.value = false;
          return;
        }

        // Normal login without 2FA (legacy users)
        if (data.user) {
          handleSuccessfulLogin(data.user);
        }
      } catch (err) {
        errorMessage.value = 'Error inesperado. Intente nuevamente.';
        loading.value = false;
      }
    };

    const handleTwoFactorSuccess = ({ token, user }) => {
      showTwoFactorModal.value = false;

      // Store session data
      localStorage.setItem('session', JSON.stringify({
        token,
        user
      }));

      // Handle successful login
      handleSuccessfulLogin(user);
    };

    const handleTwoFactorClose = () => {
      // Only allow close if not mandatory
      if (!requiresTwoFactorSetup.value && !requiresTwoFactorCode.value) {
        showTwoFactorModal.value = false;
      }
    };

    return {
      email,
      password,
      loading,
      errorMessage,
      handleLogin,
      showTwoFactorModal,
      twoFactorMode,
      requiresTwoFactorSetup,
      requiresTwoFactorCode,
      userEmail,
      handleTwoFactorSuccess,
      handleTwoFactorClose,
    };
  },
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #2563eb 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 48px;
  width: 100%;
  max-width: 440px;
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-placeholder {
  display: inline-flex;
  margin-bottom: 16px;
}

h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

input {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s;
  font-family: inherit;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
}

.btn-primary {
  padding: 14px 24px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  padding: 12px 16px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  text-align: center;
}

.register-link {
  text-align: center;
  font-size: 14px;
  color: #64748b;
  margin-top: 16px;
}

.register-link a {
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
}

.register-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }

  h1 {
    font-size: 28px;
  }
}
</style>
