<template>
  <div class="dashboard">
    <Header />

    <div class="container">
      <div v-if="loading" class="loading">Cargando información del paciente...</div>

      <div v-else-if="patient">
        <div class="patient-header">
          <div class="patient-avatar-large">
            {{ getInitials(patient.profiles?.full_name) }}
          </div>
          <div class="patient-header-info">
            <h1>{{ patient.profiles?.full_name || 'Sin nombre' }}</h1>
            <div class="patient-meta">
              <span>{{ patient.phone || 'Sin teléfono' }}</span>
              <span v-if="patient.blood_type">Tipo de sangre: {{ patient.blood_type }}</span>
            </div>
          </div>
          <button @click="goToCreateRecord" class="btn-primary">
            Crear Expediente
          </button>
        </div>

        <div class="patient-info-card card">
          <h2>Información del Paciente</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Fecha de Nacimiento</span>
              <span class="info-value">{{ patient.date_of_birth ? formatDate(patient.date_of_birth) : 'No especificada' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Tipo de Sangre</span>
              <span class="info-value">{{ patient.blood_type || 'No especificado' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Teléfono</span>
              <span class="info-value">{{ patient.phone || 'No especificado' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Contacto de Emergencia</span>
              <span class="info-value">{{ patient.emergency_contact || 'No especificado' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="info-label">Dirección</span>
              <span class="info-value">{{ patient.address || 'No especificada' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="info-label">Alergias</span>
              <span class="info-value">{{ patient.allergies || 'Ninguna' }}</span>
            </div>
          </div>
        </div>

        <div class="tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'records' }"
            @click="activeTab = 'records'"
          >
            Expedientes Médicos ({{ medicalRecords.length }})
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'prescriptions' }"
            @click="activeTab = 'prescriptions'"
          >
            Recetas ({{ prescriptions.length }})
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'history' }"
            @click="activeTab = 'history'"
          >
            Historial ({{ visitHistory.length }})
          </button>
        </div>

        <div v-if="activeTab === 'records'" class="tab-content">
          <div v-if="medicalRecords.length === 0" class="empty-state">
            <p>No hay expedientes médicos registrados</p>
          </div>
          <div v-else class="records-list">
            <div
              v-for="record in medicalRecords"
              :key="record.id"
              class="record-card card"
            >
              <div class="record-header-line">
                <div class="record-date">{{ formatDate(record.visit_date) }}</div>
                <div class="record-doctor">
                  Dr. {{ record.doctor?.profiles?.full_name || 'No especificado' }}
                  <span class="doctor-specialty">{{ record.doctor?.specialty }}</span>
                </div>
              </div>
              <button @click="openShareModal(record)" class="btn-share">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
                Compartir con Especialista
              </button>
              <div class="record-content">
                <div class="record-field">
                  <strong>Diagnóstico:</strong>
                  <p>{{ record.diagnosis }}</p>
                </div>
                <div class="record-field">
                  <strong>Síntomas:</strong>
                  <p>{{ record.symptoms || 'No especificados' }}</p>
                </div>
                <div class="record-field">
                  <strong>Tratamiento:</strong>
                  <p>{{ record.treatment || 'No especificado' }}</p>
                </div>
                <div v-if="record.notes" class="record-field">
                  <strong>Notas:</strong>
                  <p>{{ record.notes }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'prescriptions'" class="tab-content">
          <div v-if="prescriptions.length === 0" class="empty-state">
            <p>No hay recetas registradas</p>
          </div>
          <div v-else class="prescriptions-list">
            <div
              v-for="prescription in prescriptions"
              :key="prescription.id"
              class="prescription-card card"
            >
              <div class="prescription-header-line">
                <div class="prescription-date">{{ formatDate(prescription.prescription_date) }}</div>
                <div class="prescription-doctor">
                  Dr. {{ prescription.doctor?.profiles?.full_name || 'No especificado' }}
                </div>
              </div>
              <div v-if="prescription.notes" class="prescription-notes">
                {{ prescription.notes }}
              </div>
              <div class="medications-list">
                <h3>Medicamentos</h3>
                <div
                  v-for="medication in prescription.medications"
                  :key="medication.id"
                  class="medication-item"
                >
                  <div class="medication-name">{{ medication.medication_name }}</div>
                  <div class="medication-info">
                    <span><strong>Dosis:</strong> {{ medication.dosage }}</span>
                    <span><strong>Frecuencia:</strong> {{ medication.frequency }}</span>
                    <span><strong>Duración:</strong> {{ medication.duration }}</span>
                    <span v-if="medication.instructions"><strong>Instrucciones:</strong> {{ medication.instructions }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'history'" class="tab-content">
          <div v-if="visitHistory.length === 0" class="empty-state">
            <p>No hay historial de visitas</p>
          </div>
          <div v-else class="history-list">
            <div
              v-for="visit in visitHistory"
              :key="visit.id"
              class="visit-card card"
            >
              <div class="visit-header-line">
                <div class="visit-date">{{ formatDate(visit.visit_date) }}</div>
                <div class="visit-status" :class="'status-' + visit.status">
                  {{ visit.status === 'completed' ? 'Completada' : 'Cancelada' }}
                </div>
              </div>
              <div class="visit-content">
                <div class="visit-doctor">
                  <strong>Doctor:</strong> Dr. {{ visit.doctor?.profiles?.full_name || 'No especificado' }}
                </div>
                <div class="visit-specialty">
                  <strong>Especialidad:</strong> {{ visit.doctor?.specialty || 'No especificada' }}
                </div>
                <div class="visit-reason">
                  <strong>Motivo:</strong> {{ visit.reason }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Share Modal -->
    <div v-if="showShareModal" class="modal-overlay" @click="closeShareModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Compartir Expediente Médico</h2>
          <button @click="closeShareModal" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">
            Seleccione el doctor o especialista con quien desea compartir este expediente médico.
          </p>
          <div class="form-group">
            <label for="doctor-select">Doctor/Especialista</label>
            <select v-model="selectedDoctorId" id="doctor-select" class="form-select">
              <option value="">Seleccionar doctor...</option>
              <option v-for="doctor in availableDoctors" :key="doctor.id" :value="doctor.id">
                Dr. {{ doctor.full_name }} - {{ doctor.specialty }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="share-notes">Notas adicionales (opcional)</label>
            <textarea
              v-model="shareNotes"
              id="share-notes"
              class="form-textarea"
              placeholder="Agregar notas sobre por qué está compartiendo este expediente..."
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeShareModal" class="btn-cancel">
            Cancelar
          </button>
          <button @click="shareRecord" class="btn-share-modal" :disabled="!selectedDoctorId">
            Compartir
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Header from '../components/Header.vue';
import { db } from '../lib/api';

export default {
  name: 'PatientRecords',
  components: {
    Header,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const loading = ref(true);
    const patient = ref(null);
    const medicalRecords = ref([]);
    const prescriptions = ref([]);
    const visitHistory = ref([]);
    const activeTab = ref('records');
    const showShareModal = ref(false);
    const selectedRecord = ref(null);
    const selectedDoctorId = ref('');
    const shareNotes = ref('');
    const availableDoctors = ref([
      { id: 'd1', full_name: 'María García', specialty: 'Medicina General' },
      { id: 'd2', full_name: 'Carlos Rodríguez', specialty: 'Cardiología' },
      { id: 'd3', full_name: 'Ana Martínez', specialty: 'Pediatría' },
      { id: 'd4', full_name: 'Luis Hernández', specialty: 'Neurología' },
    ]);

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

    const loadPatientData = async () => {
      loading.value = true;
      const patientId = route.params.id;

      const { data: patientData } = await db.getPatientWithProfile(patientId);

      if (patientData) {
        patient.value = patientData;

        const [recordsResult, prescriptionsResult, visitsResult] = await Promise.all([
          db.getPatientMedicalRecords(patientId),
          db.getPatientPrescriptions(patientId),
          db.getPatientVisitHistory(patientId),
        ]);

        medicalRecords.value = recordsResult.data || [];
        prescriptions.value = prescriptionsResult.data || [];
        visitHistory.value = visitsResult.data || [];
      }

      loading.value = false;
    };

    const goToCreateRecord = () => {
      router.push(`/staff/patient/${route.params.id}/create-record`);
    };

    const openShareModal = (record) => {
      selectedRecord.value = record;
      showShareModal.value = true;
    };

    const closeShareModal = () => {
      showShareModal.value = false;
      selectedRecord.value = null;
      selectedDoctorId.value = '';
      shareNotes.value = '';
    };

    const shareRecord = async () => {
      if (!selectedDoctorId.value) return;

      const doctor = availableDoctors.value.find(d => d.id === selectedDoctorId.value);

      // Here you would make an API call to share the record
      // For now, we'll just simulate it
      alert(`Expediente compartido exitosamente con Dr. ${doctor.full_name} (${doctor.specialty})`);

      closeShareModal();
    };

    onMounted(() => {
      loadPatientData();
    });

    return {
      loading,
      patient,
      medicalRecords,
      prescriptions,
      visitHistory,
      activeTab,
      showShareModal,
      selectedDoctorId,
      shareNotes,
      availableDoctors,
      formatDate,
      getInitials,
      goToCreateRecord,
      openShareModal,
      closeShareModal,
      shareRecord,
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

.loading {
  text-align: center;
  padding: 48px;
  color: #64748b;
  font-size: 16px;
}

.patient-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  padding: 32px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.patient-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #2563eb 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  flex-shrink: 0;
}

.patient-header-info {
  flex: 1;
}

.patient-header-info h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.patient-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #64748b;
}

.btn-primary {
  padding: 12px 24px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-primary:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.patient-info-card {
  margin-bottom: 32px;
}

.patient-info-card h2 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 20px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 15px;
  color: #1e293b;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e2e8f0;
}

.tab-btn {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: #2563eb;
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: #94a3b8;
  background: white;
  border-radius: 12px;
}

.records-list,
.prescriptions-list,
.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-card,
.prescription-card,
.visit-card {
  padding: 24px;
}

.record-header-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f5f9;
}

.prescription-header-line,
.visit-header-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f5f9;
}

.record-date,
.prescription-date,
.visit-date {
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
}

.record-doctor,
.prescription-doctor {
  text-align: right;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.doctor-specialty {
  display: block;
  font-size: 13px;
  font-weight: 400;
  color: #64748b;
}

.record-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.record-field strong {
  font-size: 13px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.record-field p {
  margin: 0;
  color: #1e293b;
  line-height: 1.6;
}

.prescription-notes {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  color: #475569;
  font-size: 14px;
}

.medications-list h3 {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.medication-item {
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
}

.medication-item:last-child {
  margin-bottom: 0;
}

.medication-name {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
}

.medication-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #475569;
}

.visit-status {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.visit-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}

.visit-content strong {
  color: #64748b;
}

.btn-share {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  margin-bottom: 16px;
  width: fit-content;
}

.btn-share svg {
  flex-shrink: 0;
}

.btn-share:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 2px solid #f1f5f9;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-body {
  padding: 24px;
}

.modal-description {
  color: #64748b;
  margin: 0 0 20px 0;
  font-size: 15px;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.form-select,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 2px solid #f1f5f9;
}

.btn-cancel {
  padding: 12px 24px;
  background: white;
  color: #64748b;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}

.btn-share-modal {
  padding: 12px 24px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-share-modal:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-share-modal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-share-modal:disabled:hover {
  background: #10b981;
  box-shadow: none;
}

@media (max-width: 768px) {
  .patient-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-primary {
    width: 100%;
  }

  .tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab-btn {
    white-space: nowrap;
  }

  .btn-share {
    width: 100%;
    justify-content: center;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .modal-footer button {
    width: 100%;
  }
}
</style>
