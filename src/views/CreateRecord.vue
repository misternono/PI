<template>
  <div class="dashboard">
    <Header />

    <div class="container">
      <div class="page-header">
        <button @click="goBack" class="btn-back">
          ← Volver
        </button>
        <h1>Crear Expediente Médico</h1>
      </div>

      <div v-if="loading" class="loading">Cargando información del paciente...</div>

      <div v-else-if="patient" class="form-container">
        <div class="patient-summary card">
          <div class="patient-avatar-small">
            {{ getInitials(patient.profiles?.full_name) }}
          </div>
          <div class="patient-info">
            <div class="patient-name">{{ patient.profiles?.full_name || 'Sin nombre' }}</div>
            <div class="patient-phone">{{ patient.phone || 'Sin teléfono' }}</div>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="record-form card">
          <h2>Información de la Visita</h2>

          <div class="form-group">
            <label for="reason">Motivo de la Visita *</label>
            <input
              id="reason"
              v-model="formData.reason"
              type="text"
              required
              placeholder="Ej: Consulta general, dolor abdominal, etc."
              :disabled="submitting"
            />
          </div>

          <div class="form-group">
            <label for="symptoms">Síntomas</label>
            <textarea
              id="symptoms"
              v-model="formData.symptoms"
              rows="3"
              placeholder="Describa los síntomas del paciente..."
              :disabled="submitting"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="diagnosis">Diagnóstico *</label>
            <textarea
              id="diagnosis"
              v-model="formData.diagnosis"
              rows="3"
              required
              placeholder="Diagnóstico médico..."
              :disabled="submitting"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="treatment">Tratamiento</label>
            <textarea
              id="treatment"
              v-model="formData.treatment"
              rows="3"
              placeholder="Plan de tratamiento..."
              :disabled="submitting"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="notes">Notas Adicionales</label>
            <textarea
              id="notes"
              v-model="formData.notes"
              rows="2"
              placeholder="Observaciones adicionales..."
              :disabled="submitting"
            ></textarea>
          </div>

          <div class="form-divider"></div>

          <div class="prescription-section">
            <div class="section-header">
              <h2>Receta Médica</h2>
              <label class="checkbox-label">
                <input
                  v-model="includePrescription"
                  type="checkbox"
                  :disabled="submitting"
                />
                <span>Incluir receta</span>
              </label>
            </div>

            <div v-if="includePrescription" class="prescription-form">
              <div class="form-group">
                <label for="prescriptionNotes">Notas de la Receta</label>
                <textarea
                  id="prescriptionNotes"
                  v-model="prescriptionData.notes"
                  rows="2"
                  placeholder="Instrucciones generales de la receta..."
                  :disabled="submitting"
                ></textarea>
              </div>

              <div class="medications-section">
                <h3>Medicamentos</h3>
                <div
                  v-for="(medication, index) in medications"
                  :key="index"
                  class="medication-form"
                >
                  <div class="medication-header">
                    <span>Medicamento {{ index + 1 }}</span>
                    <button
                      v-if="medications.length > 1"
                      type="button"
                      @click="removeMedication(index)"
                      class="btn-remove"
                      :disabled="submitting"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label :for="'medName' + index">Nombre del Medicamento *</label>
                      <input
                        :id="'medName' + index"
                        v-model="medication.name"
                        type="text"
                        required
                        placeholder="Ej: Paracetamol"
                        :disabled="submitting"
                      />
                    </div>

                    <div class="form-group">
                      <label :for="'medDosage' + index">Dosis *</label>
                      <input
                        :id="'medDosage' + index"
                        v-model="medication.dosage"
                        type="text"
                        required
                        placeholder="Ej: 500mg"
                        :disabled="submitting"
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label :for="'medFrequency' + index">Frecuencia *</label>
                      <input
                        :id="'medFrequency' + index"
                        v-model="medication.frequency"
                        type="text"
                        required
                        placeholder="Ej: Cada 8 horas"
                        :disabled="submitting"
                      />
                    </div>

                    <div class="form-group">
                      <label :for="'medDuration' + index">Duración *</label>
                      <input
                        :id="'medDuration' + index"
                        v-model="medication.duration"
                        type="text"
                        required
                        placeholder="Ej: 7 días"
                        :disabled="submitting"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label :for="'medInstructions' + index">Instrucciones</label>
                    <input
                      :id="'medInstructions' + index"
                      v-model="medication.instructions"
                      type="text"
                      placeholder="Ej: Tomar con alimentos"
                      :disabled="submitting"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  @click="addMedication"
                  class="btn-add"
                  :disabled="submitting"
                >
                  + Agregar Medicamento
                </button>
              </div>
            </div>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <div class="form-actions">
            <button
              type="button"
              @click="goBack"
              class="btn-cancel"
              :disabled="submitting"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-submit"
              :disabled="submitting"
            >
              {{ submitting ? 'Guardando...' : 'Guardar Expediente' }}
            </button>
          </div>
        </form>
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
  name: 'CreateRecord',
  components: {
    Header,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const loading = ref(true);
    const submitting = ref(false);
    const patient = ref(null);
    const doctorId = ref(null);
    const errorMessage = ref('');
    const includePrescription = ref(false);

    const formData = ref({
      reason: '',
      symptoms: '',
      diagnosis: '',
      treatment: '',
      notes: '',
    });

    const prescriptionData = ref({
      notes: '',
    });

    const medications = ref([
      {
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      },
    ]);

    const getInitials = (name) => {
      if (!name) return '?';
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    const addMedication = () => {
      medications.value.push({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      });
    };

    const removeMedication = (index) => {
      medications.value.splice(index, 1);
    };

    const loadData = async () => {
      loading.value = true;
      const patientId = route.params.id;

      const { data: patientData } = await db.getPatientWithProfile(patientId);

      if (patientData) {
        patient.value = patientData;
      }

      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const { data: doctorData } = await db.getDoctorByUserId(userData.id);
        if (doctorData) {
          doctorId.value = doctorData.id;
        }
      }

      loading.value = false;
    };

    const handleSubmit = async () => {
      submitting.value = true;
      errorMessage.value = '';

      try {
        const recordData = {
          patient_id: patient.value.id,
          patient_user_id: patient.value.user_id,
          doctor_id: doctorId.value,
          visit_date: new Date().toISOString(),
          diagnosis: formData.value.diagnosis,
          symptoms: formData.value.symptoms,
          treatment: formData.value.treatment,
          notes: formData.value.notes,
          reason: formData.value.reason,
        };

        const { data: medicalRecord, error: recordError } = await db.createMedicalRecord(recordData);

        if (recordError) {
          errorMessage.value = 'Error al crear el expediente médico';
          submitting.value = false;
          return;
        }

        // Skip visit history and prescriptions for now
        // TODO: Implement prescriptions separately in the future

        router.push(`/staff/patient/${patient.value.id}`);
      } catch (err) {
        console.error('Error creating medical record:', err);
        errorMessage.value = 'Error inesperado al guardar';
        submitting.value = false;
      }
    };

    const goBack = () => {
      router.push(`/staff/patient/${route.params.id}`);
    };

    onMounted(() => {
      loadData();
    });

    return {
      loading,
      submitting,
      patient,
      formData,
      prescriptionData,
      medications,
      includePrescription,
      errorMessage,
      getInitials,
      addMedication,
      removeMedication,
      handleSubmit,
      goBack,
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
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 16px 0 0 0;
}

.btn-back {
  padding: 8px 16px;
  background: white;
  color: #64748b;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.loading {
  text-align: center;
  padding: 48px;
  color: #64748b;
  font-size: 16px;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.patient-summary {
  display: flex;
  align-items: center;
  gap: 16px;
}

.patient-avatar-small {
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
}

.patient-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.patient-phone {
  font-size: 14px;
  color: #64748b;
}

.record-form h2 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 24px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-group input:disabled,
.form-group textarea:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-divider {
  height: 2px;
  background: #f1f5f9;
  margin: 32px 0;
}

.prescription-section {
  margin-top: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.prescription-form {
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
}

.medications-section h3 {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 24px 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.medication-form {
  padding: 20px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 16px;
}

.medication-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f5f9;
}

.medication-header span {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.btn-remove {
  padding: 6px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover:not(:disabled) {
  background: #dc2626;
}

.btn-remove:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-add {
  width: 100%;
  padding: 12px 24px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-add:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.error-message {
  padding: 12px 16px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  text-align: center;
  margin-top: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #f1f5f9;
}

.btn-cancel {
  flex: 1;
  padding: 14px 24px;
  background: white;
  color: #64748b;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-submit {
  flex: 2;
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

.btn-submit:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-submit:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
