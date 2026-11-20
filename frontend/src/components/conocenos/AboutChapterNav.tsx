import { ABOUT_CHAPTERS } from '../../data/conocenosData';

export default function AboutChapterNav() {
  return (
    <nav
      aria-label="Secciones de Conócenos"
      className="sticky top-[68px] md:top-[76px] z-30 border-y border-[#e4e9f1] bg-white/90 backdrop-blur-xl"
    >
      <div className="page-width">
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="mr-2 hidden shrink-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#e22328] sm:inline">
            Capítulos
          </span>
          {ABOUT_CHAPTERS.map((chapter) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              className="shrink-0 rounded-full border border-transparent px-3.5 py-1.5 text-xs font-semibold text-[#53617a] transition-colors duration-150 hover:border-[#d9e2ef] hover:bg-[#f5f7fb] hover:text-[#000254] focus-visible:outline-3 focus-visible:outline-[#e22328]/40 focus-visible:outline-offset-2"
            >
              {chapter.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
