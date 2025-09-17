import { createRouter, createWebHistory } from "vue-router";
import Projects from "./views/Projects/Projects.vue";
import ProjectDetail from "./views/ProjectDetail.vue";
import HoursReport from "./views/HoursReport.vue";
import Kanban from "./views/Kanban.vue";
import Releases from "./views/Releases.vue";
import Users from "./views/Users.vue";
import Login from "./views/Login.vue";
import MyTasks from "./views/MyTasks.vue";
import GitLabIntegration from "./views/GitLabIntegration.vue";
import Requirements from "./views/Requirements.vue";
import FeatureModules from "./views/FeatureModules.vue";
import Hierarchy from "./views/Hierarchy.vue";
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
      path: "/projects/:projectId/kanban",
      component: Kanban,
      meta: { requiresAuth: true },
    },
    // 新工作项与层级视图
    {
      path: "/projects/:projectId/requirements",
      component: Requirements,
      meta: { requiresAuth: true },
      props: (route) => ({ projectId: route.params.projectId as string }),
    },
    
    {
      path: "/projects/:projectId/feature-modules",
      component: FeatureModules,
      meta: { requiresAuth: true },
      props: (route) => ({ projectId: route.params.projectId as string }),
    },
    
    {
      path: "/projects/:projectId/hierarchy",
      component: Hierarchy,
      meta: { requiresAuth: true },
      props: (route) => ({ projectId: route.params.projectId as string }),
    },
    {
      path: "/projects/:projectId/reports/hours",
      component: HoursReport,
      meta: { requiresAuth: true /*roles: ['project_manager'] */ },
    },
    {
      path: "/projects/:projectId/releases",
      component: Releases,
      meta: { requiresAuth: true, roles: ["project_manager"] },
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
      meta: { requiresAuth: true, roles: ["admin", "project_manager"] },
    },
    {
      path: "/my-tasks",
      component: MyTasks,
      meta: { requiresAuth: true },
    },
    {
      path: "/gitlab",
      component: GitLabIntegration,
      meta: { requiresAuth: true, roles: ["admin", "project_manager"] },
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
