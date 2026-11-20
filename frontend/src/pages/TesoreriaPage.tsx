import { Wallet } from 'lucide-react';
import ModuleInDevelopmentCard from '../components/shared/ModuleInDevelopmentCard';

export default function TesoreriaPage() {
  return (
    <ModuleInDevelopmentCard
      title="Tesorería"
      description="Próximamente aquí podrás gestionar las remesas bancarias SEPA, el control de cuotas trimestrales y los presupuestos de acampadas."
      icon={Wallet}
      iconWrapperClass="bg-amber-100 text-amber-600"
    />
  );
}
