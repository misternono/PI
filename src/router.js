import { createRouter, createWebHistory } from 'vue-router';
import { auth } from './lib/api';
import Login from './views/Login.vue';
import Register from './views/Register.vue';
import PatientDashboard from './views/PatientDashboard.vue';
import StaffDashboard from './views/StaffDashboard.vue';
import PatientRecords from './views/PatientRecords.vue';
import CreateRecord from './views/CreateRecord.vue';

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false },
  },
  {
    path: '/patient',
    name: 'PatientDashboard',
    component: PatientDashboard,
    meta: { requiresAuth: true, role: 'patient' },
  },
  {
    path: '/staff',
    name: 'StaffDashboard',
    component: StaffDashboard,
    meta: { requiresAuth: true, role: ['doctor', 'nurse'] },
  },
  {
    path: '/staff/patient/:id',
    name: 'PatientRecords',
    component: PatientRecords,
    meta: { requiresAuth: true, role: ['doctor', 'nurse'] },
  },
  {
    path: '/staff/patient/:id/create-record',
    name: 'CreateRecord',
    component: CreateRecord,
    meta: { requiresAuth: true, role: ['doctor', 'nurse'] },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const { session } = await auth.getSession();

  if (to.meta.requiresAuth && !session) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && session) {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      if (userData.role === 'patient') {
        next('/patient');
      } else {
        next('/staff');
      }
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
