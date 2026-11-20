import { ArrowRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutCtaSection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="page-width">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#000254] via-[#01317b] to-[#061844] px-7 py-12 sm:px-14 sm:py-16 text-white shadow-[0_24px_60px_rgba(0,2,84,0.2)]">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#e22328]/25 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#f68a8d]">
                ¿Te animas a caminar con nosotros?
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-white leading-[1.05] sm:text-4xl lg:text-[46px]">
                Forma parte del Grupo IV Scout San José de Calasanz.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80">
                Si quieres que tu hijo o hija descubra el escultismo en Montequinto, o deseas
                iniciar la solicitud de entrada, rellena el formulario inicial y nuestro equipo se
                pondrá en contacto contigo.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
              <Link
                to="/solicitud"
                className="inline-flex min-h-[50px] w-full sm:w-auto lg:w-full items-center justify-center gap-2 rounded-full bg-[#e22328] px-7 text-sm font-bold text-white shadow-[0_12px_28px_rgba(226,35,40,0.34)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c81b20] focus-visible:outline-3 focus-visible:outline-white/70 focus-visible:outline-offset-2"
              >
                Ir a la solicitud inicial
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex min-h-[48px] w-full sm:w-auto lg:w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-3 focus-visible:outline-white/70 focus-visible:outline-offset-2"
              >
                <Mail size={16} aria-hidden="true" />
                Contactar con el grupo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
