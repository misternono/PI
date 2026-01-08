<template>
  <div class="dashboard">
    <Header />

    <div class="container">
      <div class="welcome-section">
        <h1>Bienvenido, {{ patientName }}</h1>
        <p class="subtitle">Accede a tu información médica y recetas</p>
      </div>

      <div v-if="loading" class="loading">Cargando información...</div>

      <div v-else class="content-grid">
        <section class="card">
          <div class="card-header">
            <h2>Expedientes Médicos</h2>
            <span class="badge">{{ medicalRecords.length }}</span>
          </div>

          <div v-if="medicalRecords.length === 0" class="empty-state">
            <p>No hay expedientes médicos registrados</p>
          </div>

          <div v-else class="records-list">
            <div
              v-for="record in medicalRecords"
              :key="record.id"
              class="record-item"
              @click="selectedRecord = selectedRecord?.id === record.id ? null : record"
            >
              <div class="record-summary">
                <div class="record-info">
                  <div class="record-date">
                    {{ formatDate(record.visit_date) }}
                  </div>
                  <div class="record-doctor">
                    Dr. {{ record.doctor?.profiles?.full_name || 'No especificado' }}
                  </div>
                  <div class="record-specialty">
                    {{ record.doctor?.specialty || '' }}
                  </div>
                </div>
                <div class="record-diagnosis">
                  {{ record.diagnosis }}
                </div>
              </div>

              <div v-if="selectedRecord?.id === record.id" class="record-details">
                <div class="detail-row">
                  <strong>Síntomas:</strong>
                  <p>{{ record.symptoms || 'No especificados' }}</p>
                </div>
                <div class="detail-row">
                  <strong>Tratamiento:</strong>
                  <p>{{ record.treatment || 'No especificado' }}</p>
                </div>
                <div v-if="record.notes" class="detail-row">
                  <strong>Notas adicionales:</strong>
                  <p>{{ record.notes }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <h2>Recetas Médicas</h2>
            <span class="badge">{{ prescriptions.length }}</span>
          </div>

          <div v-if="prescriptions.length === 0" class="empty-state">
            <p>No hay recetas médicas registradas</p>
          </div>

          <div v-else class="prescriptions-list">
            <div
              v-for="prescription in prescriptions"
              :key="prescription.id"
              class="prescription-item"
              @click="selectedPrescription = selectedPrescription?.id === prescription.id ? null : prescription"
            >
              <div class="prescription-summary">
                <div class="prescription-info">
                  <div class="prescription-date">
                    {{ formatDate(prescription.prescription_date) }}
                  </div>
                  <div class="prescription-doctor">
                    Dr. {{ prescription.doctor?.profiles?.full_name || 'No especificado' }}
                  </div>
                </div>
                <div class="medication-count">
                  {{ prescription.medications?.length || 0 }} medicamento(s)
                </div>
              </div>

              <div v-if="selectedPrescription?.id === prescription.id" class="prescription-details">
                <div v-if="prescription.notes" class="detail-row">
                  <strong>Notas:</strong>
                  <p>{{ prescription.notes }}</p>
                </div>

                <div class="medications-section">
                  <h3>Medicamentos</h3>
                  <div
                    v-for="medication in prescription.medications"
                    :key="medication.id"
                    class="medication-card"
                  >
                    <div class="medication-name">{{ medication.medication_name }}</div>
                    <div class="medication-details">
                      <div class="medication-field">
                        <span class="field-label">Dosis:</span>
                        <span>{{ medication.dosage }}</span>
                      </div>
                      <div class="medication-field">
                        <span class="field-label">Frecuencia:</span>
                        <span>{{ medication.frequency }}</span>
                      </div>
                      <div class="medication-field">
                        <span class="field-label">Duración:</span>
                        <span>{{ medication.duration }}</span>
                      </div>
                      <div v-if="medication.instructions" class="medication-field">
                        <span class="field-label">Instrucciones:</span>
                        <span>{{ medication.instructions }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <h2>Historial de Visitas</h2>
            <span class="badge">{{ visitHistory.length }}</span>
          </div>

          <div v-if="visitHistory.length === 0" class="empty-state">
            <p>No hay visitas registradas</p>
          </div>

          <div v-else class="visits-list">
            <div
              v-for="visit in visitHistory"
              :key="visit.id"
              class="visit-item"
            >
              <div class="visit-date">{{ formatDate(visit.visit_date) }}</div>
              <div class="visit-info">
                <div class="visit-doctor">
                  Dr. {{ visit.doctor?.profiles?.full_name || 'No especificado' }}
                </div>
                <div class="visit-specialty">
                  {{ visit.doctor?.specialty || '' }}
                </div>
              </div>
              <div class="visit-reason">{{ visit.reason }}</div>
              <div class="visit-status" :class="'status-' + visit.status">
                {{ visit.status === 'completed' ? 'Completada' : 'Cancelada' }}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import Header from '../components/Header.vue';
import { db } from '../lib/api';

export default {
  name: 'PatientDashboard',
  components: {
    Header,
  },
  setup() {
    const loading = ref(true);
    const patientName = ref('');
    const patientId = ref(null);
    const medicalRecords = ref([]);
    const prescriptions = ref([]);
    const visitHistory = ref([]);
    const selectedRecord = ref(null);
    const selectedPrescription = ref(null);

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const loadPatientData = async () => {
      loading.value = true;

      const userDataStr = localStorage.getItem('userData');
      if (!userDataStr) return;

      const userData = JSON.parse(userDataStr);
      patientName.value = userData.fullName;

      const { data: patient } = await db.getPatientByUserId(userData.id);

      if (patient) {
        patientId.value = patient.id;

        const [recordsResult, prescriptionsResult, visitsResult] = await Promise.all([
          db.getPatientMedicalRecords(patient.id),
          db.getPatientPrescriptions(patient.id),
          db.getPatientVisitHistory(patient.id),
        ]);

        medicalRecords.value = recordsResult.data || [];
        prescriptions.value = prescriptionsResult.data || [];
        visitHistory.value = visitsResult.data || [];
      }

      loading.value = false;
    };

    onMounted(() => {
      loadPatientData();
    });

    return {
      loading,
      patientName,
      medicalRecords,
      prescriptions,
      visitHistory,
      selectedRecord,
      selectedPrescription,
      formatDate,
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

.loading {
  text-align: center;
  padding: 48px;
  color: #64748b;
  font-size: 16px;
}

.content-grid {
  display: grid;
  gap: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 24px;
  border-bottom: 2px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.badge {
  background: #2563eb;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}

.empty-state {
  padding: 48px 24px;
  text-align: center;
  color: #94a3b8;
}

.records-list,
.prescriptions-list {
  display: flex;
  flex-direction: column;
}

.record-item,
.prescription-item {
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.2s;
}

.record-item:hover,
.prescription-item:hover {
  background: #f8fafc;
}

.record-item:last-child,
.prescription-item:last-child {
  border-bottom: none;
}

.record-summary,
.prescription-summary {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.record-info,
.prescription-info {
  flex: 1;
}

.record-date,
.prescription-date {
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 4px;
}

.record-doctor,
.prescription-doctor {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.record-specialty {
  font-size: 13px;
  color: #64748b;
}

.record-diagnosis {
  font-size: 15px;
  color: #475569;
  font-weight: 500;
}

.medication-count {
  background: #eff6ff;
  color: #2563eb;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.record-details,
.prescription-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.detail-row {
  margin-bottom: 12px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row strong {
  display: block;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-row p {
  margin: 0;
  color: #1e293b;
  line-height: 1.6;
}

.medications-section {
  margin-top: 16px;
}

.medications-section h3 {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.medication-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.medication-card:last-child {
  margin-bottom: 0;
}

.medication-name {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
}

.medication-details {
  display: grid;
  gap: 8px;
}

.medication-field {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.field-label {
  font-weight: 600;
  color: #64748b;
  min-width: 100px;
}

.visits-list {
  display: flex;
  flex-direction: column;
}

.visit-item {
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 16px;
  align-items: center;
}

.visit-item:last-child {
  border-bottom: none;
}

.visit-date {
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
  white-space: nowrap;
}

.visit-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.visit-doctor {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.visit-specialty {
  font-size: 12px;
  color: #64748b;
}

.visit-reason {
  font-size: 14px;
  color: #475569;
}

.visit-status {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

@media (max-width: 768px) {
  .welcome-section h1 {
    font-size: 24px;
  }

  .record-summary,
  .prescription-summary {
    flex-direction: column;
  }

  .visit-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .visit-status {
    justify-self: start;
  }
}
</style>
