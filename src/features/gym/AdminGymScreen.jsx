import { SectionTitle, Toast } from '../../ui';
import { useToast } from '../../lib/useToast';
import { AdminRoutines } from './AdminRoutines';

export function AdminGymScreen() {
  const [toast, showToast] = useToast();
  return (
    <div style={{ padding: '4px 16px 20px' }}>
      <SectionTitle icon="weight">Gimnasio</SectionTitle>
      <AdminRoutines toast={showToast} />
      <Toast msg={toast} />
    </div>
  );
}
