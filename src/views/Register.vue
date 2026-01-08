<template>
  <div class="register-container">
    <div class="register-card">
      <div class="logo-section">
        <div class="logo-placeholder">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="60" height="60" rx="12" fill="#2563eb"/>
            <path d="M30 15v30M15 30h30" stroke="white" stroke-width="4" stroke-linecap="round"/>
          </svg>
        </div>
        <h1>Crear Cuenta</h1>
        <p class="subtitle">Registro de Paciente</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">Nombre</label>
            <input
              id="firstName"
              v-model="formData.firstName"
              type="text"
              required
              placeholder="Juan"
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="lastName">Apellido</label>
            <input
              id="lastName"
              v-model="formData.lastName"
              type="text"
              required
              placeholder="Pérez"
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            placeholder="usuario@ejemplo.com"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="phoneNumber">Teléfono</label>
          <input
            id="phoneNumber"
            v-model="formData.phoneNumber"
            type="tel"
            required
            placeholder=""
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            required
            placeholder="••••••••"
            :disabled="loading"
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label for="dateOfBirth">Fecha de Nacimiento</label>
          <input
            id="dateOfBirth"
            v-model="formData.dateOfBirth"
            type="date"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="gender">Género</label>
          <select
            id="gender"
            v-model="formData.gender"
            required
            :disabled="loading"
          >
            <option value="">Seleccionar...</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div class="form-group">
          <label for="address">Dirección</label>
          <input
            id="address"
            v-model="formData.address"
            type="text"
            required
            placeholder=""
            :disabled="loading"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Registrando...' : 'Registrar' }}
        </button>

        <div class="login-link">
          ¿Ya tienes cuenta? <router-link to="/login">Inicia sesión aquí</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { registerPatient } from '../lib/api';

export default {
  name: 'Register',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const errorMessage = ref('');
    const successMessage = ref('');

    const formData = ref({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      dateOfBirth: '',
      gender: '',
      address: ''
    });

    const handleRegister = async () => {
      loading.value = true;
      errorMessage.value = '';
      successMessage.value = '';

      try {
        // Convert dateOfBirth to ISO format
        const dateOfBirth = new Date(formData.value.dateOfBirth).toISOString();

        const payload = {
          firstName: formData.value.firstName,
          lastName: formData.value.lastName,
          email: formData.value.email,
          phoneNumber: formData.value.phoneNumber,
          password: formData.value.password,
          dateOfBirth: dateOfBirth,
          gender: formData.value.gender,
          address: formData.value.address
        };

        const { data, error } = await registerPatient(payload);

        if (error) {
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            errorMessage.value = 'El correo electrónico ya está registrado';
          } else {
            errorMessage.value = error.message || 'Error al registrar. Intente nuevamente.';
          }
          loading.value = false;
          return;
        }

        successMessage.value = 'Registro exitoso. Redirigiendo al inicio de sesión...';

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);

      } catch (err) {
        errorMessage.value = 'Error inesperado. Intente nuevamente.';
        loading.value = false;
      }
    };

    return {
      formData,
      loading,
      errorMessage,
      successMessage,
      handleRegister,
    };
  },
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #2563eb 100%);
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 48px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
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

.register-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

input,
select {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s;
  font-family: inherit;
}

input:focus,
select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input:disabled,
select:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
}

select {
  cursor: pointer;
}

select:disabled {
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

.success-message {
  padding: 12px 16px;
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  color: #059669;
  font-size: 14px;
  text-align: center;
}

.login-link {
  text-align: center;
  font-size: 14px;
  color: #64748b;
}

.login-link a {
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .register-card {
    padding: 32px 24px;
  }

  h1 {
    font-size: 28px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
