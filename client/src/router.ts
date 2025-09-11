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
    { path: '/projects/:projectId/issues/new', component: IssueForm, meta: { requiresAuth: true, roles: ['admin','manager','member'] } },
    { path: '/projects/:projectId/issues/:issueId', component: IssueDetail, meta: { requiresAuth: true } },
    { path: '/projects/:projectId/reports/hours', component: HoursReport, meta: { requiresAuth: true, roles: ['admin','manager'] } },
    { path: '/projects/:projectId/releases', component: Releases, meta: { requiresAuth: true, roles: ['admin','manager'] } },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!auth.token) auth.loadFromStorage();

  // 需要登录
  if (to.meta?.requiresAuth && !auth.token) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  // 已登录访问登录页则跳转回首页或 redirect
  if (to.path === '/login' && auth.token) {
    const redirect = (to.query?.redirect as string) || '/projects';
    return { path: redirect };
  }

  // 角色校验
  const roles = (to.meta as any)?.roles as string[] | undefined;
  if (to.meta?.requiresAuth && roles && !auth.hasAnyRole(roles)) {
    return { path: '/projects' };
  }
});

export default router;


