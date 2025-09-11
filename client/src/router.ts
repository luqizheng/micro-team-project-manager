import { createRouter, createWebHistory } from 'vue-router';
import Projects from './views/Projects.vue';
import IssueForm from './views/IssueForm.vue';
import IssueDetail from './views/IssueDetail.vue';
import HoursReport from './views/HoursReport.vue';
import Issues from './views/Issues.vue';
import Releases from './views/Releases.vue';
import Login from './views/Login.vue';
import { useAuthStore } from './stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/projects' },
    { path: '/login', component: Login },
    { path: '/projects', component: Projects, meta: { requiresAuth: true } },
    { path: '/projects/:projectId/issues', component: Issues, meta: { requiresAuth: true } },
    { path: '/projects/:projectId/issues/new', component: IssueForm, meta: { requiresAuth: true } },
    { path: '/projects/:projectId/issues/:issueId', component: IssueDetail, meta: { requiresAuth: true } },
    { path: '/projects/:projectId/reports/hours', component: HoursReport, meta: { requiresAuth: true } },
    { path: '/projects/:projectId/releases', component: Releases, meta: { requiresAuth: true } },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!auth.token) auth.loadFromStorage();
  if (to.meta?.requiresAuth && !auth.token) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
});

export default router;


