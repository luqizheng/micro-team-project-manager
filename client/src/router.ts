import { createRouter, createWebHistory } from 'vue-router';
import Projects from './views/Projects.vue';
import IssueForm from './views/IssueForm.vue';
import HoursReport from './views/HoursReport.vue';
import Issues from './views/Issues.vue';

const routes = [
  { path: '/', redirect: '/projects' },
  { path: '/projects', component: Projects },
  { path: '/projects/:projectId/issues', component: Issues },
  { path: '/projects/:projectId/issues/new', component: IssueForm },
  { path: '/projects/:projectId/reports/hours', component: HoursReport },
];

export default createRouter({ history: createWebHistory(), routes });


