<template>
  <div class="dashboard">
    <Header />

    <div class="container">
      <div class="welcome-section">
        <h1>Portal Médico</h1>
        <p class="subtitle">Gestiona pacientes y expedientes médicos</p>
      </div>

      <div class="search-section card">
        <h2>Buscar Paciente</h2>
        <div class="search-bar">
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar..."
            @input="handleSearch"
          />
          <button @click="loadAllPatients" class="btn-secondary">
            Ver Todos
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading">Cargando pacientes...</div>

      <div v-else-if="patients.length === 0" class="empty-state card">
        <p>No se encontraron pacientes</p>
      </div>

      <div v-else class="patients-grid">
        <div
          v-for="patient in patients"
          :key="patient.id"
          class="patient-card"
          @click="viewPatient(patient.id)"
        >
          <div class="patient-header">
            <div class="patient-avatar">
              {{ getInitials(patient.profiles?.full_name) }}
            </div>
            <div class="patient-info">
              <div class="patient-name">{{ patient.profiles?.full_name || 'Sin nombre' }}</div>
              <div class="patient-phone">{{ patient.phone || 'Sin teléfono' }}</div>
            </div>
          </div>

          <div class="patient-details">
            <div class="detail-item">
              <span class="detail-label">Fecha de Nacimiento:</span>
              <span>{{ patient.date_of_birth ? formatDate(patient.date_of_birth) : 'No especificada' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Tipo de Sangre:</span>
              <span>{{ patient.blood_type || 'No especificado' }}</span>
            </div>
            <div v-if="patient.allergies" class="detail-item">
              <span class="detail-label">Alergias:</span>
              <span>{{ patient.allergies }}</span>
            </div>
          </div>

          <button class="btn-view" @click.stop="viewPatient(patient.id)">
            Ver Expediente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Header from '../components/Header.vue';
import { db } from '../lib/api';

export default {
  name: 'StaffDashboard',
  components: {
    Header,
  },
  setup() {
    const router = useRouter();
    const loading = ref(true);
    const patients = ref([]);
    const searchTerm = ref('');

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const getInitials = (name) => {
      if (!name) return '?';
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    const loadAllPatients = async () => {
      loading.value = true;
      searchTerm.value = '';
      const { data } = await db.getAllPatients();
      patients.value = data || [];
      loading.value = false;
    };

    const handleSearch = async () => {
      if (searchTerm.value.trim().length < 1) {
        await loadAllPatients();
        return;
      }

      loading.value = true;
      const { data } = await db.searchPatients(searchTerm.value.trim());
      patients.value = data || [];
      loading.value = false;
    };

    const viewPatient = (patientId) => {
      console.log('Viewing patient:', patientId);
      router.push(`/staff/patient/${patientId}`);
    };

    onMounted(() => {
      loadAllPatients();
    });

    return {
      loading,
      patients,
      searchTerm,
      formatDate,
      getInitials,
      loadAllPatients,
      handleSearch,
      viewPatient,
    };
  },
};
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f8fafc;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
}

.welcome-section {
  margin-bottom: 32px;
}

.welcome-section h1 {
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

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.search-section {
  margin-bottom: 32px;
}

.search-section h2 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
}

.search-bar {
  display: flex;
  gap: 12px;
}

.search-bar input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s;
}

.search-bar input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.btn-secondary {
  padding: 12px 24px;
  background: #64748b;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-secondary:hover {
  background: #475569;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3);
}

.loading {
  text-align: center;
  padding: 48px;
  color: #64748b;
  font-size: 16px;
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: #94a3b8;
}

.patients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.patient-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.patient-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.patient-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
}

.patient-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #2563eb 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
}

.patient-info {
  flex: 1;
  min-width: 0;
}

.patient-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.patient-phone {
  font-size: 14px;
  color: #64748b;
}

.patient-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
}

.detail-label {
  font-weight: 600;
  color: #64748b;
}

.btn-view {
  width: 100%;
  padding: 12px 24px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view:hover {
  background: #1d4ed8;
}

@media (max-width: 768px) {
  .patients-grid {
    grid-template-columns: 1fr;
  }

  .search-bar {
    flex-direction: column;
  }

  .btn-secondary {
    width: 100%;
  }
}
</style>
