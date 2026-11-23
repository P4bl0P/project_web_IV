import { Layers } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { getRegisteredModules, ModuleRoute, useAuth } from '../auth';
import ModuleInDevelopmentCard from '../components/shared/ModuleInDevelopmentCard';

export default function DynamicModulePage() {
  const { moduleKey = '' } = useParams<{ moduleKey: string }>();
  const { user } = useAuth();
  const registered = getRegisteredModules(user).find((mod) => mod.key === moduleKey);

  if (!registered) {
    return <Navigate to="/gestion" replace />;
  }

  return (
    <ModuleRoute moduleKey={registered.key} moduleLabel={registered.name}>
      <ModuleInDevelopmentCard
        title={registered.name}
        description={
          registered.description ||
          'Este módulo ya está registrado en el sistema y se encuentra pendiente de implementación funcional.'
        }
        icon={Layers}
        iconWrapperClass="bg-[#edf3fb] text-[#01317b]"
      />
    </ModuleRoute>
  );
}
