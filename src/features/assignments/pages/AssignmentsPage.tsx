import { useAuth } from '@/features/auth/hooks/useAuth';
import { TeacherAssignmentsListPage } from './TeacherAssignmentsListPage';
import { StudentAssignmentsListPage } from './StudentAssignmentsListPage';

export function AssignmentsPage() {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';

  if (role === 'STUDENT') {
    return <StudentAssignmentsListPage />;
  }

  return <TeacherAssignmentsListPage />;
}

export default AssignmentsPage;
