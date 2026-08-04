import { createRouter, createWebHistory } from 'vue-router';
import ReactWrapper from '../shared/components/ReactWrapper.vue';
import { InsightsPage } from '../modules/insights/InsightsPage';
import { ExpensesPage } from '../modules/expenses/ExpensesPage';
import { ExpenseDetailPage } from '../modules/expenses/ExpenseDetailPage';
import { PartyPage } from '../modules/parties/PartyPage';

const routes = [
  { path: '/', redirect: '/insights' },
  { path: '/insights', component: ReactWrapper, props: { component: InsightsPage } },
  { path: '/expenses', component: ReactWrapper, props: { component: ExpensesPage } },
  { path: '/expenses/:id', component: ReactWrapper, props: { component: ExpenseDetailPage } },
  { path: '/parties/:id', component: ReactWrapper, props: { component: PartyPage } },
  { path: '/analytics', redirect: '/insights' },
  { path: '/reports', redirect: '/insights' },
  { path: '/dashboard-insights', redirect: '/insights' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
