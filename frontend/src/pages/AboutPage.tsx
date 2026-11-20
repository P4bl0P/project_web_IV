import AboutChapterNav from '../components/conocenos/AboutChapterNav';
import AboutCtaSection from '../components/conocenos/AboutCtaSection';
import AboutHero from '../components/conocenos/AboutHero';
import ConsejoSection from '../components/conocenos/ConsejoSection';
import HistoriaSection from '../components/conocenos/HistoriaSection';
import MetodologiaSection from '../components/conocenos/MetodologiaSection';
import QuienesSomosSection from '../components/conocenos/QuienesSomosSection';
import SeccionesSection from '../components/conocenos/SeccionesSection';
import ValoresSection from '../components/conocenos/ValoresSection';

export default function AboutPage() {
  return (
    <div className="bg-white text-[#0c1933]">
      <AboutHero />
      <AboutChapterNav />
      <QuienesSomosSection />
      <HistoriaSection />
      <ValoresSection />
      <MetodologiaSection />
      <SeccionesSection />
      <ConsejoSection />
      <AboutCtaSection />
    </div>
  );
}
