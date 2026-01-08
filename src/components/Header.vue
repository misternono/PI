<template>
  <header class="header">
    <div class="header-content">
      <div class="header-left">
        <div class="logo">
          <svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="60" height="60" rx="12" fill="#2563eb"/>
            <path d="M30 15v30M15 30h30" stroke="white" stroke-width="4" stroke-linecap="round"/>
          </svg>
          <span class="clinic-name">Clínicas UA</span>
        </div>
      </div>

      <button class="mobile-menu-btn" @click="toggleMenu" :aria-label="menuOpen ? 'Cerrar menú' : 'Abrir menú'">
        <svg v-if="!menuOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <nav class="nav" :class="{ 'nav-open': menuOpen }">
        <router-link
          v-if="userRole === 'patient'"
          to="/patient"
          class="nav-link"
          @click="closeMenu"
        >
          Mi Portal
        </router-link>
        <router-link
          v-if="userRole === 'doctor' || userRole === 'nurse'"
          to="/staff"
          class="nav-link"
          @click="closeMenu"
        >
          Portal Médico
        </router-link>

        <div class="user-section">
          <div class="user-menu">
            <button @click="toggleUserDropdown" class="user-info-button">
              <div class="user-info">
                <span class="user-name">{{ userName }}</span>
                <span class="user-role">{{ roleLabel }}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <div v-if="userDropdownOpen" class="user-dropdown">
              <button @click="handleRegisterPublicKey" class="dropdown-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="7" width="10" height="7" rx="1"/>
                  <path d="M5 7V5a3 3 0 0 1 6 0v2"/>
                </svg>
                Registrar Clave Pública
              </button>
              <button @click="handleLogout" class="dropdown-item logout">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6"/>
                </svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '../lib/api';
import { wsDecryptionService } from '../lib/wsDecryptionService';
import { getSessionManager } from '../lib/sessionManager';

export default {
  name: 'Header',
  setup() {
    const router = useRouter();
    const menuOpen = ref(false);
    const userName = ref('');
    const userRole = ref('');
    const userDropdownOpen = ref(false);
    const userId = ref(null);

    const roleLabel = computed(() => {
      const labels = {
        patient: 'Paciente',
        doctor: 'Doctor',
        nurse: 'Enfermera',
      };
      return labels[userRole.value] || '';
    });

    const toggleMenu = () => {
      menuOpen.value = !menuOpen.value;
    };

    const closeMenu = () => {
      menuOpen.value = false;
    };

    const toggleUserDropdown = () => {
      userDropdownOpen.value = !userDropdownOpen.value;
    };

    const handleRegisterPublicKey = async () => {
      userDropdownOpen.value = false;

      try {
        // Request public key from WSS (sends "GETPUBLICKEY", waits for "CERT:..." response)
        console.log('Requesting public key from certificate...');
        const publicKey = await wsDecryptionService.requestPublicKey();

        if (!publicKey) {
          alert('No se pudo obtener la clave pública del certificado');
          return;
        }

        console.log('Public key received, registering with server...');

        // Send to API
        const { data, error } = await db.registerPublicKey(userId.value, publicKey);

        if (error) {
          console.error('Error registering public key:', error);
          alert('Error al registrar la clave pública: ' + (error.message || 'Error desconocido'));
        } else {
          console.log('Public key registered successfully');
          alert('Clave pública registrada correctamente');
        }
      } catch (error) {
        console.error('Failed to register public key:', error);
        alert('Error al registrar la clave pública. Asegúrese de que el servicio de descifrado esté en ejecución.');
      }
    };

    const handleLogout = async () => {
      userDropdownOpen.value = false;

      // Stop session manager
      const sessionManager = getSessionManager();
      sessionManager.stop();

      // Clear session data
      await auth.signOut();
      localStorage.removeItem('userData');

      // Redirect to login
      router.push('/login');
    };

    onMounted(() => {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userName.value = userData.fullName;
        userRole.value = userData.role;
        userId.value = userData.id;
      }
    });

    return {
      menuOpen,
      userName,
      userRole,
      roleLabel,
      userDropdownOpen,
      toggleMenu,
      closeMenu,
      toggleUserDropdown,
      handleRegisterPublicKey,
      handleLogout,
    };
  },
};
</script>

<style scoped>
.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo svg {
  width: 40px;
  height: 40px;
}

.clinic-name {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #1e293b;
  transition: color 0.2s;
}

.mobile-menu-btn:hover {
  color: #2563eb;
}

.nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  text-decoration: none;
  color: #475569;
  font-weight: 600;
  font-size: 15px;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #2563eb;
  background: #eff6ff;
}

.nav-link.router-link-active {
  color: #2563eb;
  background: #eff6ff;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-left: 24px;
  border-left: 2px solid #e2e8f0;
}

.user-menu {
  position: relative;
}

.user-info-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-info-button:hover {
  background: #f8fafc;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.user-role {
  font-size: 12px;
  color: #64748b;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  z-index: 1000;
  overflow: hidden;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f8fafc;
}

.dropdown-item.logout {
  color: #ef4444;
  border-top: 1px solid #e2e8f0;
}

.dropdown-item.logout:hover {
  background: #fef2f2;
}

.dropdown-item svg {
  flex-shrink: 0;
}

.btn-logout {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.btn-logout:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: block;
  }

  .nav {
    position: fixed;
    top: 72px;
    left: 0;
    right: 0;
    background: white;
    flex-direction: column;
    align-items: stretch;
    padding: 16px 24px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-100%);
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s ease;
  }

  .nav-open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: all;
  }

  .nav-link {
    width: 100%;
    padding: 12px 16px;
  }

  .user-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 16px 0 0 0;
    border-left: none;
    border-top: 2px solid #e2e8f0;
    margin-top: 12px;
  }

  .user-info {
    align-items: flex-start;
  }

  .btn-logout {
    width: 100%;
    padding: 12px 16px;
  }
}
</style>
