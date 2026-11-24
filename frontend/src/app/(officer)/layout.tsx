import OfficerLayout from '@/components/layouts/OfficerLayout';

export default function OfficerRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OfficerLayout>{children}</OfficerLayout>;
}
