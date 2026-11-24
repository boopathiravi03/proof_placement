import StudentLayout from '@/components/layouts/StudentLayout';

export default function StudentRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentLayout>{children}</StudentLayout>;
}
