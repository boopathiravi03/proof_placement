import UniversityLayout from '@/components/layouts/UniversityLayout';

export default function UniversityRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UniversityLayout>{children}</UniversityLayout>;
}
