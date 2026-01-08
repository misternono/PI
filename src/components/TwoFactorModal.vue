<template>
  <div v-if="show" class="modal-overlay" @click.self="handleOverlayClick">
    <div class="modal-card">
      <!-- Header -->
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button
          v-if="canClose"
          @click="closeModal"
          class="close-button"
          aria-label="Cerrar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Setup Flow -->
      <div v-if="currentView === 'setup'" class="modal-content">
        <div v-if="!setupInitiated" class="loading-state">
          <div class="spinner"></div>
          <p>Iniciando configuración de autenticación...</p>
        </div>

        <div v-else class="setup-content">
          <div class="instruction-section">
            <div class="instruction-step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>Descarga Google Authenticator</h3>
                <p>Instala la aplicación Google Authenticator en tu dispositivo móvil.</p>
              </div>
            </div>

            <div class="instruction-step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>Escanea el código QR</h3>
                <p>Abre Google Authenticator y escanea este código QR:</p>
                <div class="qr-code-container">
                  <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="QR Code" class="qr-code" />
                  <div v-else class="qr-loading">
                    <div class="spinner"></div>
                  </div>
                </div>

                <div class="manual-entry">
                  <p class="manual-label">O ingresa la clave manualmente:</p>
                  <div class="manual-key-container">
                    <code class="manual-key">{{ manualEntryKey }}</code>
                    <button @click="copyManualKey" class="copy-button" type="button">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="5" y="5" width="9" height="9" rx="1"/>
                        <path d="M3 10V3a1 1 0 0 1 1-1h7"/>
                      </svg>
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="instruction-step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>Ingresa el código de verificación</h3>
                <p>Ingresa el código de 6 dígitos que aparece en Google Authenticator:</p>
              </div>
            </div>
          </div>

          <div class="code-input-section">
            <input
              v-model="code"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              placeholder="000000"
              class="code-input"
              :disabled="loading"
              @input="handleCodeInput"
              autofocus
            />

            <div v-if="error" class="error-message">
              {{ error }}
            </div>

            <button
              @click="verifyCode"
              :disabled="code.length !== 6 || loading"
              class="btn-primary"
            >
              {{ loading ? 'Verificando...' : 'Verificar y Activar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Verify Flow -->
      <div v-if="currentView === 'verify'" class="modal-content">
        <div class="verify-content">
          <div class="verify-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" stroke="#2563eb" stroke-width="3"/>
              <path d="M32 16v16M32 40v2" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>

          <h3>Autenticación de Dos Factores</h3>
          <p class="verify-description">
            Ingresa el código de 6 dígitos de Google Authenticator para completar el inicio de sesión.
          </p>

          <div class="code-input-section">
            <input
              v-model="code"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              placeholder="000000"
              class="code-input"
              :disabled="loading"
              @input="handleCodeInput"
              autofocus
            />

            <div v-if="error" class="error-message">
              {{ error }}
            </div>

            <button
              @click="verifyCode"
              :disabled="code.length !== 6 || loading"
              class="btn-primary"
            >
              {{ loading ? 'Verificando...' : 'Verificar Código' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { auth } from '../lib/api';
import QRCode from 'qrcode';

export default {
  name: 'TwoFactorModal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    mode: {
      type: String,
      required: true,
      validator: (value) => ['setup', 'verify'].includes(value)
    },
    email: {
      type: String,
      required: true
    },
    requiresTwoFactorSetup: {
      type: Boolean,
      default: false
    },
    requiresTwoFactorCode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['verify-success', 'close'],
  setup(props, { emit }) {
    const currentView = ref(props.mode);
    const code = ref('');
    const qrCodeDataUrl = ref('');
    const manualEntryKey = ref('');
    const totpUrl = ref('');
    const loading = ref(false);
    const error = ref('');
    const setupInitiated = ref(false);

    // Modal cannot be closed if setup is required
    const canClose = computed(() => {
      return !props.requiresTwoFactorSetup && !props.requiresTwoFactorCode;
    });

    const modalTitle = computed(() => {
      if (currentView.value === 'setup') {
        return 'Configurar Autenticación de Dos Factores';
      }
      return 'Verificación de Dos Factores';
    });

    // Keep currentView in sync with mode prop
    watch(() => props.mode, (newMode) => {
      console.log('TwoFactorModal: mode changed to', newMode);
      currentView.value = newMode;
    });

    // Initiate setup when modal opens in setup mode
    watch(() => props.show, async (newVal) => {
      console.log('TwoFactorModal: show changed to', newVal, 'mode:', props.mode, 'setupInitiated:', setupInitiated.value);
      if (newVal && props.mode === 'setup' && !setupInitiated.value) {
        console.log('TwoFactorModal: calling initiateSetup()');
        await initiateSetup();
      }
    }, { immediate: true });

    const initiateSetup = async () => {
      console.log('initiateSetup: starting with email', props.email);
      loading.value = true;
      error.value = '';

      try {
        const { data, error: apiError } = await auth.initiateTwoFactorSetup(props.email);
        console.log('initiateSetup: API response', { data, error: apiError });

        if (apiError) {
          console.error('initiateSetup: API error', apiError);
          error.value = apiError.message || 'Error al iniciar la configuración. Intente nuevamente.';
          loading.value = false;
          return;
        }

        console.log('initiateSetup: setting up QR code with totpUrl', data.totpUrl);
        totpUrl.value = data.totpUrl;
        manualEntryKey.value = data.manualEntryKey;
        setupInitiated.value = true;

        // Generate QR code
        await generateQRCode(data.totpUrl);

        loading.value = false;
        console.log('initiateSetup: completed successfully');
      } catch (err) {
        console.error('initiateSetup: exception', err);
        error.value = 'Error inesperado al configurar 2FA. Intente nuevamente.';
        loading.value = false;
      }
    };

    const generateQRCode = async (url) => {
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: 256,
          margin: 2,
          color: {
            dark: '#1e293b',
            light: '#ffffff'
          }
        });
        qrCodeDataUrl.value = dataUrl;
      } catch (err) {
        console.error('Failed to generate QR code:', err);
        error.value = 'Error al generar el código QR. Use la clave manual.';
      }
    };

    const handleCodeInput = (event) => {
      // Only allow numeric input
      const value = event.target.value.replace(/[^0-9]/g, '');
      code.value = value;
      error.value = '';
    };

    const verifyCode = async () => {
      if (code.value.length !== 6) {
        error.value = 'El código debe tener 6 dígitos';
        return;
      }

      loading.value = true;
      error.value = '';

      try {
        const { data, error: apiError } = await auth.verifyTwoFactorCode(
          props.email,
          code.value
        );

        if (apiError) {
          error.value = apiError.message || 'Código incorrecto. Intente nuevamente.';
          loading.value = false;
          code.value = '';
          return;
        }

        // Success - emit to parent
        emit('verify-success', {
          token: data.token,
          user: data.user
        });

        loading.value = false;
      } catch (err) {
        error.value = 'Error inesperado. Intente nuevamente.';
        loading.value = false;
        code.value = '';
      }
    };

    const copyManualKey = async () => {
      try {
        await navigator.clipboard.writeText(manualEntryKey.value);
        alert('Clave copiada al portapapeles');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    const closeModal = () => {
      if (canClose.value) {
        emit('close');
      }
    };

    const handleOverlayClick = () => {
      if (canClose.value) {
        closeModal();
      }
    };

    return {
      currentView,
      code,
      qrCodeDataUrl,
      manualEntryKey,
      loading,
      error,
      setupInitiated,
      canClose,
      modalTitle,
      verifyCode,
      handleCodeInput,
      copyManualKey,
      closeModal,
      handleOverlayClick
    };
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modal-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 24px 32px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #64748b;
  transition: color 0.2s;
  border-radius: 6px;
}

.close-button:hover {
  color: #1e293b;
  background: #f1f5f9;
}

.modal-content {
  padding: 32px;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.loading-state p {
  margin-top: 16px;
  color: #64748b;
}

.spinner {
  border: 3px solid #e2e8f0;
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Setup Content */
.setup-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.instruction-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.instruction-step {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.step-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: #2563eb;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.step-content {
  flex: 1;
}

.step-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.step-content p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.qr-code-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
}

.qr-code {
  width: 256px;
  height: 256px;
  border-radius: 8px;
}

.qr-loading {
  width: 256px;
  height: 256px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.manual-entry {
  margin-top: 16px;
  padding: 16px;
  background: #fef3c7;
  border: 2px solid #fde047;
  border-radius: 8px;
}

.manual-label {
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 8px 0;
}

.manual-key-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.manual-key {
  flex: 1;
  padding: 12px;
  background: white;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: 2px;
  word-break: break-all;
}

.copy-button {
  padding: 10px 16px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.copy-button:hover {
  background: #d97706;
}

/* Verify Content */
.verify-content {
  text-align: center;
  padding: 20px 0;
}

.verify-icon {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.verify-content h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.verify-description {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 32px 0;
  line-height: 1.5;
}

/* Code Input Section */
.code-input-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.code-input {
  width: 100%;
  max-width: 240px;
  padding: 16px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 8px;
  font-family: 'Courier New', monospace;
  transition: all 0.2s;
}

.code-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.code-input:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
}

.code-input::placeholder {
  color: #cbd5e1;
}

.error-message {
  width: 100%;
  padding: 12px 16px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  text-align: center;
}

.btn-primary {
  width: 100%;
  max-width: 240px;
  padding: 14px 24px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
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

/* Responsive Design */
@media (max-width: 640px) {
  .modal-card {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-header {
    padding: 20px 24px;
  }

  .modal-header h2 {
    font-size: 20px;
  }

  .modal-content {
    padding: 24px;
  }

  .qr-code-container {
    padding: 16px;
  }

  .qr-code,
  .qr-loading {
    width: 200px;
    height: 200px;
  }

  .code-input {
    font-size: 28px;
    letter-spacing: 6px;
  }

  .manual-key-container {
    flex-direction: column;
  }

  .copy-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
