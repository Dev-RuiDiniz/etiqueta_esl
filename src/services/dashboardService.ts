import { dashboardSummaryMock, SHOULD_FAIL_DASHBOARD_REQUEST, type DashboardSummary } from '../mocks/dashboard';

const DASHBOARD_MIN_DELAY_MS = 400;
const DASHBOARD_MAX_DELAY_MS = 800;

function getRandomDelay() {
  return Math.floor(Math.random() * (DASHBOARD_MAX_DELAY_MS - DASHBOARD_MIN_DELAY_MS + 1)) + DASHBOARD_MIN_DELAY_MS;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, getRandomDelay());
  });

  if (SHOULD_FAIL_DASHBOARD_REQUEST) {
    throw new Error('Erro ao carregar dashboard');
  }

  return dashboardSummaryMock;
}
