import { Compass } from 'lucide-react';
import ModuleInDevelopmentCard from '../components/shared/ModuleInDevelopmentCard';

export default function JefaturaPage() {
  return (
    <ModuleInDevelopmentCard
      title="Jefatura de Grupo"
      description="Próximamente aquí podrás gestionar la coordinación de ramas, el Kraal de responsables y la programación de la Ronda Solar."
      icon={Compass}
      iconWrapperClass="bg-indigo-100 text-indigo-600"
    />
  );
}
