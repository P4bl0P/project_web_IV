import { Layers } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getRegisteredModules, ModuleRoute, useAuth } from '../auth';
import AccessDeniedView from '../components/shared/AccessDeniedView';
import ModuleInDevelopmentCard from '../components/shared/ModuleInDevelopmentCard';

export default function DynamicModulePage() {
  const { moduleKey = '' } = useParams<{ moduleKey: string }>();
  const { user } = useAuth();
  const registered = getRegisteredModules(user).find((mod) => mod.key === moduleKey);

  if (!registered) {
    return (
      <AccessDeniedView
        moduleName="este módulo"
        reason="El módulo solicitado no está registrado o no está disponible."
      />
    );
  }

  return (
    <ModuleRoute moduleKey={registered.key} moduleLabel={registered.name} action="canRead">
      <ModuleInDevelopmentCard
        title={registered.name}
        description={
          registered.description ||
          'Este módulo ya está registrado en el sistema de permisos y se encuentra pendiente de implementación funcional.'
        }
        icon={Layers}
        iconWrapperClass="bg-[#edf3fb] text-[#01317b]"
      />
    </ModuleRoute>
  );
}
