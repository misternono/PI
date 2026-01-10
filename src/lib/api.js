// Import API service
import { post, get, put } from './apiService';
// Import encryption utilities
import { generateAESKey, encryptData, decryptData } from './encryption';
// Import WebSocket decryption service
import { wsDecryptionService } from './wsDecryptionService';
// Import 2FA API methods
import { initiateTwoFactorSetup, verifyTwoFactorCode } from './twoFactorApi';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Mock data store (will be replaced by backend)
const mockStore = {
  users: [
    {
      id: '1',
      email: 'patient@test.com',
      password: 'password123',
      full_name: 'Juan Pérez',
      role: 'patient'
    },
    {
      id: '2',
      email: 'doctor@test.com',
      password: 'password123',
      full_name: 'Dra. María García',
      role: 'doctor'
    },
    {
      id: '3',
      email: 'nurse@test.com',
      password: 'password123',
      full_name: 'Enf. Carlos López',
      role: 'nurse'
    }
  ],
  patients: [
    {
      id: 'p1',
      user_id: '1',
      phone: '555-0101',
      date_of_birth: '1990-05-15',
      blood_type: 'O+',
      address: 'Calle Principal 123, Ciudad',
      allergies: 'Penicilina',
      emergency_contact: 'María Pérez - 555-0102',
      created_at: new Date().toISOString()
    }
  ],
  doctors: [
    {
      id: 'd1',
      user_id: '2',
      specialty: 'Medicina General',
      license_number: 'MED-12345',
      created_at: new Date().toISOString()
    }
  ],
  medicalRecords: [
    {
      id: 'mr1',
      patient_id: 'p1',
      doctor_id: 'd1',
      visit_date: '2024-10-01T10:00:00Z',
      diagnosis: 'Gripe común',
      symptoms: 'Fiebre, dolor de cabeza, congestión nasal',
      treatment: 'Reposo, hidratación y antipiréticos',
      notes: 'Control en 7 días si no mejora',
      created_at: new Date().toISOString()
    }
  ],
  prescriptions: [
    {
      id: 'pr1',
      medical_record_id: 'mr1',
      patient_id: 'p1',
      doctor_id: 'd1',
      prescription_date: '2024-10-01T10:00:00Z',
      notes: 'Tomar con alimentos',
      created_at: new Date().toISOString()
    }
  ],
  medications: [
    {
      id: 'med1',
      prescription_id: 'pr1',
      medication_name: 'Paracetamol',
      dosage: '500mg',
      frequency: 'Cada 8 horas',
      duration: '5 días',
      instructions: 'Tomar después de las comidas'
    }
  ],
  visitHistory: [
    {
      id: 'vh1',
      patient_id: 'p1',
      doctor_id: 'd1',
      visit_date: '2024-10-01T10:00:00Z',
      reason: 'Consulta por gripe',
      status: 'completed',
      created_at: new Date().toISOString()
    }
  ],
  session: null
};

// Helper function to simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to simulate API calls
const mockApiCall = async (endpoint, options = {}) => {
  await delay();

  // This is where you would make real API calls
  // For now, we'll use the mock store
  console.log(`[MOCK API] ${options.method || 'GET'} ${endpoint}`, options.body ? JSON.parse(options.body) : '');

  // In production, this would be:
  // const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  // return await response.json();

  return { success: true };
};

// Auth API
export const auth = {
  async signIn(email, password) {
    try {
      // Real API call
      const { data, error } = await post('/api/Auth/login', {
        email,
        password
      });

      if (error) {
        return {
          data: null,
          error: { message: error.message || 'Login failed' }
        };
      }

      // Only store session if 2FA is not required
      if (!data.requiresTwoFactorSetup && !data.requiresTwoFactorCode) {
        localStorage.setItem('session', JSON.stringify(data));
      }

      return {
        data: {
          user: data.user,
          session: data,
          requiresTwoFactorSetup: data.requiresTwoFactorSetup,
          requiresTwoFactorCode: data.requiresTwoFactorCode,
          message: data.message
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  async signUp(email, password, fullName, role) {
    try {
      await mockApiCall('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, role })
      });

      // Mock implementation
      const newUser = {
        id: 'user-' + Date.now(),
        email,
        password,
        full_name: fullName,
        role
      };

      mockStore.users.push(newUser);

      const session = {
        user: {
          id: newUser.id,
          email: newUser.email
        },
        access_token: 'mock-token-' + newUser.id
      };

      mockStore.session = session;
      localStorage.setItem('session', JSON.stringify(session));

      return {
        data: {
          user: session.user,
          session
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  async signOut() {
    try {
      await mockApiCall('/auth/signout', {
        method: 'POST'
      });

      mockStore.session = null;
      localStorage.removeItem('session');

      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async getSession() {
    try {
      // In production, this would validate the token with the backend
      const sessionStr = localStorage.getItem('session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;

      return { session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  },

  async getUser() {
    try {
      const sessionStr = localStorage.getItem('session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;

      return {
        user: session?.user || null,
        error: null
      };
    } catch (error) {
      return { user: null, error };
    }
  },

  onAuthStateChange(callback) {
    // Mock implementation - in production, this would be a WebSocket or polling
    const checkSession = () => {
      const sessionStr = localStorage.getItem('session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;

      callback('SIGNED_IN', session);
    };

    checkSession();

    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => { }
        }
      }
    };
  },

  /**
   * Initiate two-factor authentication setup
   * @param {string} email - User email
   */
  async initiateTwoFactorSetup(email) {
    return await initiateTwoFactorSetup(email);
  },

  /**
   * Verify two-factor authentication code
   * @param {string} email - User email
   * @param {string} code - 6-digit TOTP code
   */
  async verifyTwoFactorCode(email, code) {
    return await verifyTwoFactorCode(email, code);
  }
};

// Database API
export const db = {
  async getProfile(userId) {
    try {
      await mockApiCall(`/users/${userId}/profile`);

      const user = mockStore.users.find(u => u.id === userId);

      if (!user) {
        return { data: null, error: { message: 'User not found' } };
      }

      return {
        data: {
          id: user.id,
          full_name: user.full_name,
          role: user.role
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getPatientByUserId(userId) {
    try {
      // Real API call - get all patients and find by userId
      const { data, error } = await get('/api/Patients');

      if (error) {
        return { data: null, error };
      }

      // Find patient with matching userId
      const patientRecord = data.find(p => p.userId === userId);

      if (!patientRecord) {
        return { data: null, error: null };
      }

      // Transform to expected format
      return {
        data: {
          id: patientRecord.id,
          user_id: patientRecord.userId,
          phone: patientRecord.phoneNumber,
          date_of_birth: patientRecord.dateOfBirth,
          gender: patientRecord.gender,
          address: patientRecord.address,
          blood_type: patientRecord.bloodType,
          allergies: patientRecord.allergies,
          emergency_contact: patientRecord.emergencyContact,
          created_at: patientRecord.createdAt
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getDoctorByUserId(userId) {
    try {
      await mockApiCall(`/users/${userId}/doctor`);

      const doctor = mockStore.doctors.find(d => d.user_id === userId);
      return { data: doctor || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getAllPatients() {
    try {
      // Real API call
      const { data, error } = await get('/api/Patients');

      if (error) {
        return { data: null, error };
      }

      // Transform the response to match the expected format
      const patientsWithProfiles = data.map(patient => ({
        id: patient.id,
        user_id: patient.userId,
        phone: patient.phoneNumber,
        date_of_birth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        created_at: patient.createdAt,
        profiles: {
          full_name: `${patient.firstName} ${patient.lastName}`,
          role: 'patient',
          email: patient.email
        }
      }));

      return { data: patientsWithProfiles, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getPatientMedicalRecords(patientId, userId = null) {
    try {
      // If userId not provided, try to get it from the patient data
      let patientUserId = userId;

      if (!patientUserId) {
        // First try to get from real API
        const patientResult = await this.getPatientWithProfile(patientId);
        if (patientResult.data?.user_id) {
          patientUserId = patientResult.data.user_id;
        } else {
          // Fallback to mock store if needed
          const patient = mockStore.patients.find(p => p.id === patientId);
          patientUserId = patient?.user_id;
        }
      }

      if (!patientUserId) {
        return { data: [], error: null };
      }

      // Get current logged-in user ID for keyUserId
      const currentUserDataStr = localStorage.getItem('userData');
      let keyUserId = null;
      if (currentUserDataStr) {
        const currentUserData = JSON.parse(currentUserDataStr);
        keyUserId = currentUserData.id;
      }

      // Real API call with userId and keyUserId query parameters
      const queryParams = new URLSearchParams({
        userId: patientUserId.toString(),
        ...(keyUserId && { keyUserId: keyUserId.toString() })
      });

      const { data, error } = await get(`/api/MedicalRecords?${queryParams}`);

      if (error) {
        return { data: null, error };
      }

      if (!data || data.length === 0) {
        return { data: [], error: null };
      }

      // Prepare records for WSS decryption
      const encryptedRecords = data.map(record => ({
        id: record.id,
        encryptedAESKey: record.encryptedKey,  // API returns 'encryptedKey'
        encryptedDescription: record.description,  // API returns 'description'
        patientId: record.patientUserId,
        doctorId: record.doctorUserId,
        createdAt: record.createdAt,
        doctor: record.doctor
      }));

      // Send to WSS for full decryption (RSA + AES)
      let decryptedResponse;
      try {
        decryptedResponse = await wsDecryptionService.decryptRecords(encryptedRecords);
      } catch (wssError) {
        console.error('WSS decryption failed:', wssError);
        return {
          data: null,
          error: { message: 'Failed to decrypt medical records. Please ensure decryption service is running.' }
        };
      }

      // Map decrypted medical data and keys to records
      const decryptedDataMap = new Map();
      if (decryptedResponse?.records) {
        decryptedResponse.records.forEach(item => {
          // Parse the description field which contains JSON string
          let medicalData = {};
          try {
            if (item.description && typeof item.description === 'string') {
              medicalData = JSON.parse(item.description);
            } else if (item.medicalData) {
              medicalData = item.medicalData;
            }
          } catch (error) {
            console.error('Failed to parse medical data for record', item.id, error);
          }

          // Store both medical data and the decrypted AES key
          decryptedDataMap.set(item.id, {
            ...medicalData,
            // Capture decrypted AES key if present in the response
            aesKey: item.aesKey || item.decryptedKey || item.key
          });
        });
      }

      // Transform the response with decrypted data
      const records = data.map(record => {
        const decryptedData = decryptedDataMap.get(record.id) || {};

        return {
          id: record.id,
          patient_id: record.patientUserId || patientId,
          doctor_id: record.doctorUserId,
          visit_date: decryptedData.visitDate || record.createdAt,
          diagnosis: decryptedData.diagnosis || '',
          symptoms: decryptedData.symptoms || '',
          treatment: decryptedData.treatment || '',
          notes: decryptedData.notes || '',
          reason: decryptedData.reason || '',
          aesKey: decryptedData.aesKey, // Include the decrypted AES key if available (though unlikely)
          encryptedAESKey: record.encryptedKey, // Include the original encrypted AES key
          created_at: record.createdAt,
          doctor: record.doctor ? {
            id: record.doctor.id,
            user_id: record.doctor.userId,
            specialty: record.doctor.specialty,
            license_number: record.doctor.licenseNumber,
            profiles: {
              full_name: record.doctor.firstName && record.doctor.lastName
                ? `${record.doctor.firstName} ${record.doctor.lastName}`
                : record.doctor.fullName || 'Doctor'
            }
          } : (decryptedData.doctorName ? {
            profiles: {
              full_name: decryptedData.doctorName
            }
          } : null)
        };
      });

      return { data: records, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getPatientPrescriptions(patientId) {
    try {
      await mockApiCall(`/patients/${patientId}/prescriptions`);

      const prescriptions = mockStore.prescriptions
        .filter(p => p.patient_id === patientId)
        .map(prescription => {
          const doctor = mockStore.doctors.find(d => d.id === prescription.doctor_id);
          const doctorUser = doctor ? mockStore.users.find(u => u.id === doctor.user_id) : null;
          const medications = mockStore.medications.filter(m => m.prescription_id === prescription.id);

          return {
            ...prescription,
            doctor: doctor ? {
              ...doctor,
              profiles: doctorUser ? {
                full_name: doctorUser.full_name
              } : null
            } : null,
            medications
          };
        });

      return { data: prescriptions, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getPatientVisitHistory(patientId) {
    try {
      await mockApiCall(`/patients/${patientId}/visit-history`);

      const visits = mockStore.visitHistory
        .filter(v => v.patient_id === patientId)
        .map(visit => {
          const doctor = mockStore.doctors.find(d => d.id === visit.doctor_id);
          const doctorUser = doctor ? mockStore.users.find(u => u.id === doctor.user_id) : null;

          return {
            ...visit,
            doctor: doctor ? {
              ...doctor,
              profiles: doctorUser ? {
                full_name: doctorUser.full_name
              } : null
            } : null
          };
        });

      return { data: visits, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async createMedicalRecord(recordData) {
    try {
      // Get current logged-in user (doctor)
      const userDataStr = localStorage.getItem('userData');
      if (!userDataStr) {
        return { data: null, error: { message: 'User not authenticated' } };
      }
      const userData = JSON.parse(userDataStr);

      // Generate AES key
      const aesKey = generateAESKey();

      // Prepare medical data for encryption (including doctor info)
      const medicalData = {
        visitDate: recordData.visit_date,
        diagnosis: recordData.diagnosis,
        symptoms: recordData.symptoms || '',
        treatment: recordData.treatment || '',
        notes: recordData.notes || '',
        reason: recordData.reason || '',
        doctorName: userData.fullName || 'No especificado',
        doctorRole: userData.role || 'doctor'
      };

      // Encrypt the medical data
      const encryptedDescription = encryptData(medicalData, aesKey);

      // Fetch public keys for patient and doctor
      console.log('[Log] Fetching public keys for patient and doctor...');
      const userIds = [recordData.patient_user_id, userData.id].join(',');
      const { data: publicKeysData, error: publicKeysError } = await get(`/api/Users/publickeys?userIds=${userIds}`);

      if (publicKeysError) {
        console.error('[Error] Failed to fetch public keys:', publicKeysError);
        return { data: null, error: publicKeysError };
      }

      // Encrypt AES key with all public keys locally
      let encryptedKeys = [];

      if (wsDecryptionService.isServiceConnected() && publicKeysData && publicKeysData.length > 0) {
        try {
          console.log(`[Log] Encrypting AES key with ${publicKeysData.length} public keys...`);

          // Extract just the public key strings from the response
          const publicKeyStrings = publicKeysData.map(pk => pk.publicKey);

          // Batch encrypt the AES key with all public keys
          const encryptedAesKeys = await wsDecryptionService.batchEncryptAESKey(aesKey, publicKeyStrings);

          console.log('[Log] AES key encrypted successfully for all users');

          // Map encrypted keys back to user IDs (keep as base64 strings for JSON serialization)
          encryptedKeys = publicKeysData.map((pkData, index) => ({
            userId: pkData.userId,
            encryptedAESKey: encryptedAesKeys[index]  // Send as base64 string, .NET will convert to byte[]
          }));
        } catch (error) {
          console.warn('[Warning] Could not encrypt AES key locally:', error.message);
          console.log('[Log] Falling back to backend encryption');
          // encryptedKeys remains empty, backend will handle encryption
        }
      } else {
        console.log('[Log] Desktop app not connected, backend will handle encryption');
      }

      // Prepare API request payload
      const payload = {
        date: recordData.visit_date,
        encryptedDescription: encryptedDescription,
        encryptedPdfData: '',
        patientUserId: recordData.patient_user_id,
        doctorUserId: userData.id,
        encryptedKeys: encryptedKeys
      };

      console.log('[Log] Enviando al servidor...');

      // Call real API
      const { data, error } = await post('/api/MedicalRecords', payload);

      if (error) {
        return { data: null, error };
      }

      // Return the created record
      return {
        data: {
          id: data.id,
          patient_id: recordData.patient_id,
          doctor_id: recordData.doctor_id,
          visit_date: recordData.visit_date,
          diagnosis: recordData.diagnosis,
          symptoms: recordData.symptoms,
          treatment: recordData.treatment,
          notes: recordData.notes,
          created_at: data.createdAt
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  async createPrescription(prescriptionData) {
    try {
      await mockApiCall('/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionData)
      });

      const newPrescription = {
        id: 'pr-' + Date.now(),
        ...prescriptionData,
        created_at: new Date().toISOString()
      };

      mockStore.prescriptions.push(newPrescription);

      return { data: newPrescription, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async createMedications(medicationsData) {
    try {
      await mockApiCall('/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicationsData)
      });

      const newMedications = medicationsData.map(med => ({
        id: 'med-' + Date.now() + '-' + Math.random(),
        ...med
      }));

      mockStore.medications.push(...newMedications);

      return { data: newMedications, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async createVisitHistory(visitData) {
    try {
      await mockApiCall('/visit-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitData)
      });

      const newVisit = {
        id: 'vh-' + Date.now(),
        ...visitData,
        created_at: new Date().toISOString()
      };

      mockStore.visitHistory.push(newVisit);

      return { data: newVisit, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async createPatient(patientData) {
    try {
      await mockApiCall('/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });

      const newPatient = {
        id: 'p-' + Date.now(),
        ...patientData,
        created_at: new Date().toISOString()
      };

      mockStore.patients.push(newPatient);

      return { data: newPatient, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async updatePatient(patientId, patientData) {
    try {
      await mockApiCall(`/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });

      const index = mockStore.patients.findIndex(p => p.id === patientId);

      if (index === -1) {
        return { data: null, error: { message: 'Patient not found' } };
      }

      mockStore.patients[index] = {
        ...mockStore.patients[index],
        ...patientData
      };

      return { data: mockStore.patients[index], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async searchPatients(searchTerm) {
    try {
      await mockApiCall(`/patients/search?q=${encodeURIComponent(searchTerm)}`);

      const filtered = mockStore.patients.filter(patient =>
        patient.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const patientsWithProfiles = filtered.map(patient => {
        const user = mockStore.users.find(u => u.id === patient.user_id);
        return {
          ...patient,
          profiles: user ? {
            full_name: user.full_name,
            role: user.role
          } : null
        };
      });

      return { data: patientsWithProfiles, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Special method for fetching patient with profile (used in CreateRecord and PatientRecords)
  async getPatientWithProfile(patientId) {
    try {
      // Real API call
      const { data, error } = await get(`/api/Patients/${patientId}`);

      if (error) {
        return { data: null, error };
      }

      // Transform the response to match the expected format
      return {
        data: {
          id: data.id,
          user_id: data.userId,
          phone: data.phoneNumber,
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
          address: data.address,
          blood_type: data.bloodType,
          allergies: data.allergies,
          emergency_contact: data.emergencyContact,
          created_at: data.createdAt,
          profiles: {
            full_name: `${data.firstName} ${data.lastName}`,
            role: 'patient',
            email: data.email
          }
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Register user's public key
   * @param {number} userId - User ID
   * @param {string} publicKey - Base64 encoded public key from certificate
   * @returns {Promise<{data: any, error: any}>}
   */
  async registerPublicKey(userId, publicKey) {
    try {
      const { data, error } = await put(`/api/Users/${userId}/public-key`, {
        publicKey: publicKey
      });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};

/**
 * Register a new patient
 * @param {Object} patientData - Patient registration data
 * @returns {Promise<{data: any, error: any}>}
 */
export const registerPatient = async (patientData) => {
  try {
    const { data, error } = await post('/api/Patients', patientData);

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Export API configuration for external use
export const apiConfig = {
  baseUrl: API_BASE_URL,
  // Add other configuration as needed
};


