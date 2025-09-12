import { createRouter, createWebHistory } from "vue-router";
import Projects from "./views/Projects.vue";
import ProjectDetail from "./views/ProjectDetail.vue";
import IssueForm from "./views/IssueForm.vue";
import IssueDetail from "./views/IssueDetail.vue";
import HoursReport from "./views/HoursReport.vue";
import Issues from "./views/Issues.vue";
import Kanban from "./views/Kanban.vue";
import Releases from "./views/Releases.vue";
import Users from "./views/Users.vue";
import Login from "./views/Login.vue";
import JSXTest from "./views/JSXTest.vue";
import MyTasks from "./views/MyTasks.vue";
import { useAuthStore } from "./stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/projects" },
    { path: "/login", component: Login },
    { path: "/projects", component: Projects, meta: { requiresAuth: true } },
    {
      path: "/projects/:projectId",
      component: ProjectDetail,
      meta: { requiresAuth: true },
    },
    {
      path: "/projects/:projectId/issues",
      component: Issues,
      meta: { requiresAuth: true },
    },
    {
      path: "/projects/:projectId/kanban",
      component: Kanban,
      meta: { requiresAuth: true },
    },
    {
      path: "/projects/:projectId/issues/new",
      component: IssueForm,
      meta: { requiresAuth: true /*roles: ['project_admin','member'] */ },
    },
    {
      path: "/projects/:projectId/issues/:issueId",
      component: IssueDetail,
      meta: { requiresAuth: true },
    },
    {
      path: "/projects/:projectId/reports/hours",
      component: HoursReport,
      meta: { requiresAuth: true /*roles: ['project_admin'] */ },
    },
    {
      path: "/projects/:projectId/releases",
      component: Releases,
      meta: { requiresAuth: true, roles: ["project_admin"] },
    },
    {
      path: "/projects/:projectId/issue-states",
      component: () => import("./views/IssueStates.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/profile",
      component: () => import("./views/Profile.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/users",
      component: Users,
      meta: { requiresAuth: true, roles: ["admin", "project_admin"] },
    },
    {
      path: "/jsx-test",
      component: JSXTest,
      meta: { requiresAuth: true },
    },
    {
      path: "/my-tasks",
      component: MyTasks,
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!auth.token) auth.loadFromStorage();

  // 需要登录
  if (to.meta?.requiresAuth && !auth.token) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  // 已登录访问登录页则跳转回首页或 redirect
  if (to.path === "/login" && auth.token) {
    const redirect = (to.query?.redirect as string) || "/projects";
    return { path: redirect };
  }

  // 角色校验
  const roles = (to.meta as any)?.roles as string[] | undefined;
  if (to.meta?.requiresAuth && roles && !auth.hasAnyRole(roles)) {
    return { path: "/projects" };
  }
});

export default router;
