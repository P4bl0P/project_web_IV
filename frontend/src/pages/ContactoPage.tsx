import ContactoConsejoSection from '../components/contacto/ContactoConsejoSection';
import ContactoCorreosSection from '../components/contacto/ContactoCorreosSection';
import ContactoHeader from '../components/contacto/ContactoHeader';
import ContactoRedesSection from '../components/contacto/ContactoRedesSection';
import ContactoUbicacionSection from '../components/contacto/ContactoUbicacionSection';
import { contactoImages } from '../config/images/contactoImages';

export default function ContactoPage() {
  return (
    <div className="overflow-hidden">
      <ContactoHeader image={contactoImages.hero} />
      <ContactoRedesSection />
      <ContactoCorreosSection />
      <ContactoUbicacionSection image={contactoImages.ubicacion} />
      <ContactoConsejoSection image={contactoImages.consejo} />
    </div>
  );
}
