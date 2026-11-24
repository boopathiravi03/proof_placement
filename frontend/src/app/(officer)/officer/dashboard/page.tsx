import { redirect } from 'next/navigation';

export default function OfficerDashboardRedirect() {
  redirect('/officer/cohort-insights');
}
