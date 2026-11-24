import RecruiterLayout from '@/components/layouts/RecruiterLayout';

export default function RecruiterRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RecruiterLayout>{children}</RecruiterLayout>;
}
