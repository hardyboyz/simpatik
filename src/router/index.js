import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { layout: 'blank' }
  },
  {
    path: '/',
    component: () => import('../components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      //{ path: '', name: 'Dashboard', component: () => import('../views/dashboard/DashboardView.vue') },

      // ── E-KOHORT ──
      { path: 'ekohort', name: 'Dashboard', component: () => import('../views/eKohort/EKohortDashboard.vue') },
      { path: 'ekohort/kms', name: 'KmsDigital', component: () => import('../views/eKohort/KmsDigitalView.vue') },
      { path: 'ekohort/kms/:id', name: 'KmsDetail', component: () => import('../views/eKohort/KmsDigitalView.vue') },
      { path: 'ekohort/pelayanan', name: 'PelayananHariIni', component: () => import('../views/eKohort/PelayananHariIniView.vue') },
      { path: 'ekohort/imunisasi-kejar', name: 'ImunisasiKejar', component: () => import('../views/eKohort/ImunisasiKejarView.vue') },
      { path: 'ekohort/mikroplanning', name: 'Mikroplanning', component: () => import('../views/eKohort/MikroplanningView.vue') },
      { path: 'kids', name: 'Kids', component: () => import('../views/kids/KidsListView.vue') },
      { path: 'kids/new', name: 'KidsCreate', component: () => import('../views/kids/KidsFormView.vue') },
      { path: 'kids/:id', name: 'KidsDetail', component: () => import('../views/kids/KidsDetailView.vue') },
      { path: 'kids/:id/edit', name: 'KidsEdit', component: () => import('../views/kids/KidsFormView.vue') },
      { path: 'vaccines', name: 'Vaccines', component: () => import('../views/vaccines/VaccinesView.vue') },

      { path: 'villages', name: 'Villages', component: () => import('../views/villages/VillageListView.vue') },
      { path: 'puskesmas', name: 'Puskesmas', component: () => import('../views/puskesmas/PuskesmasListView.vue') },
      { path: 'puskesmas/new', name: 'PuskesmasCreate', component: () => import('../views/puskesmas/PuskesmasFormView.vue') },
      { path: 'puskesmas/:id/edit', name: 'PuskesmasEdit', component: () => import('../views/puskesmas/PuskesmasFormView.vue') },
      { path: 'polindes', name: 'Polindes', component: () => import('../views/polindes/PolindesListView.vue') },
      { path: 'polindes/new', name: 'PolindesCreate', component: () => import('../views/polindes/PolindesFormView.vue') },
      { path: 'polindes/:id/edit', name: 'PolindesEdit', component: () => import('../views/polindes/PolindesFormView.vue') },
      { path: 'kebutuhan-vaksin', name: 'KebutuhanVaksin', component: () => import('../views/imunisasi/KebutuhanVaksinView.vue') },

      { path: 'targets', name: 'Targets', component: () => import('../views/targets/TargetView.vue') },
      { path: 'targets/tahunan', name: 'AnnualTarget', component: () => import('../views/targets/AnnualTargetView.vue') },
      { path: 'demographics', name: 'Demographics', component: () => import('../views/demographics/DemographicsView.vue') },
      { path: 'users', name: 'Users', component: () => import('../views/users/UsersView.vue') },
      { path: 'users/new', name: 'UsersCreate', component: () => import('../views/users/UserFormView.vue') },
      { path: 'users/:id/edit', name: 'UsersEdit', component: () => import('../views/users/UserFormView.vue') },
      { path: 'profile', name: 'Profile', component: () => import('../views/profile/ProfileView.vue') },

      { path: 'laporan/bulanan-bayi', name: 'Laporan1', component: () => import('../views/laporan/Laporan1BulananBayi.vue') },
      { path: 'laporan/luar-wilayah-bayi', name: 'Laporan2', component: () => import('../views/laporan/Laporan2LuarWilayahBayi.vue') },
      { path: 'laporan/analisa-pws', name: 'Laporan3', component: () => import('../views/laporan/Laporan3AnalisaPWS.vue') },
      { path: 'laporan/kumulatif-bayi', name: 'Laporan4', component: () => import('../views/laporan/Laporan4KumulatifBayi.vue') },
      { path: 'laporan/rencana-tindak-lanjut', name: 'Laporan5', component: () => import('../views/laporan/Laporan5RencanaTindakLanjut.vue') },
      { path: 'laporan/pemantauan-uci', name: 'Laporan6', component: () => import('../views/laporan/Laporan6PemantauanUCI.vue') },
      { path: 'laporan/monitoring-uci', name: 'Laporan7', component: () => import('../views/laporan/Laporan7MonitoringUCI.vue') },
      { path: 'laporan/rekapitulasi-ibu-hamil', name: 'Laporan8', component: () => import('../views/laporan/Laporan8RekapitulasiIbuHamil.vue') },
      { path: 'laporan/bulanan-ibu-hamil', name: 'Laporan9', component: () => import('../views/laporan/Laporan9BulananIbuHamil.vue') },
      { path: 'laporan/kumulatif-ibu-hamil', name: 'Laporan10', component: () => import('../views/laporan/Laporan10KumulatifIbuHamil.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth) {
    const hasToken = !!localStorage.getItem('token')
    if (!hasToken) {
      return next('/login')
    }
    const valid = await authStore.checkAuth()
    if (!valid) {
      return next('/login')
    }
  } else if (to.path === '/login' && localStorage.getItem('token')) {
    return next('/')
  }
  next()
})

export default router
