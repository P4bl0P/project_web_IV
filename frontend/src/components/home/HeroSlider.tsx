import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Heart, Pause, Play } from 'lucide-react';
import type { HomeHeroImages } from '../../config/images/homeImages';

interface HeroSliderProps {
  images: HomeHeroImages;
}

export default function HeroSlider({ images }: HeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [failedSources, setFailedSources] = useState<Record<string, boolean>>({});
  const interactionTimeout = useRef<number | undefined>(undefined);

  const resolvedSlides = useMemo(() => {
    const availableSlides = images.slides
      .filter((slide) => !failedSources[slide.src])
      .map((slide) => ({ ...slide, isFallback: false }));

    return availableSlides.length > 0
      ? availableSlides
      : [{ ...images.fallback, isFallback: true }];
  }, [failedSources, images.fallback, images.slides]);

  const safeActiveIndex = activeIndex < resolvedSlides.length ? activeIndex : 0;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || resolvedSlides.length < 2) return;
    const timer = window.setInterval(
      () => setActiveIndex((index) => (index + 1) % resolvedSlides.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, resolvedSlides.length]);

  useEffect(
    () => () => {
      if (interactionTimeout.current) window.clearTimeout(interactionTimeout.current);
    },
    [],
  );

  const interact = (nextIndex?: number) => {
    if (nextIndex !== undefined) setActiveIndex(nextIndex);
    setPaused(true);
    if (interactionTimeout.current) window.clearTimeout(interactionTimeout.current);
    interactionTimeout.current = window.setTimeout(() => setPaused(false), 9000);
  };

  const move = (direction: 1 | -1) => {
    interact((safeActiveIndex + direction + resolvedSlides.length) % resolvedSlides.length);
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute h-[390px] w-[390px] rounded-full bg-[radial-gradient(circle,rgba(1,49,123,0.15),rgba(226,35,40,0.05)_55%,transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative grid aspect-[1/1.08] w-[min(340px,92%)] place-items-center overflow-visible rounded-[42%_42%_30%_30%] bg-[linear-gradient(145deg,#f1f5fb,#e5ecf7)] shadow-[25px_32px_65px_rgba(0,5,84,0.13)] min-[801px]:w-[min(430px,92%)] after:pointer-events-none after:absolute after:inset-0 after:z-[1] after:rounded-[inherit] after:bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_50%)] after:content-['']">
        {resolvedSlides.map((slide, index) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            onError={() => setFailedSources((prev) => ({ ...prev, [slide.src]: true }))}
            className={`absolute rounded-[inherit] transition-opacity duration-[800ms] ease-in-out ${
              slide.isFallback
                ? 'inset-[14%] h-[72%] w-[72%] object-contain drop-shadow-[0_18px_18px_rgba(0,5,84,0.13)]'
                : 'inset-0 h-full w-full object-cover'
            } ${index === safeActiveIndex ? 'opacity-100' : 'opacity-0'}`}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        ))}
        <div
          className="pointer-events-none absolute inset-0 z-[2] rounded-[inherit] bg-[linear-gradient(180deg,transparent_35%,rgba(0,2,84,0.7))]"
          aria-hidden="true"
        />
        <div className="absolute bottom-[17px] left-[17px] z-[4] flex max-w-[62%] items-baseline gap-3 text-[13px] text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.25)]">
          <strong className="overflow-hidden text-ellipsis whitespace-nowrap">
            {resolvedSlides[safeActiveIndex].caption}
          </strong>
        </div>
        <div className="absolute right-[14px] bottom-[14px] z-[5] inline-flex items-center gap-[7px] rounded-full border border-white/75 bg-[#000254]/[0.42] px-3 py-[9px] text-[11px] font-extrabold text-white shadow-[0_8px_20px_rgba(0,5,84,0.14)] backdrop-blur-[8px] min-[801px]:right-[17px] min-[801px]:bottom-[16px]">
          <Heart size={16} fill="currentColor" aria-hidden="true" /> Siempre listos
        </div>
      </div>

      <div className="relative right-[40px] mt-[13px] flex items-center justify-center">
        <div className="absolute right-0 flex items-center gap-1.5">
          <button
            type="button"
            className="grid h-7 w-7 flex-none cursor-pointer place-items-center rounded-full border border-[#e4e9f1] bg-white text-[#01317b] transition-all duration-200 hover:-translate-y-px hover:border-[#b7c8e0] hover:bg-[#f5f8fc]"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? 'Reanudar carrusel' : 'Pausar carrusel'}
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
          </button>
          <button
            type="button"
            className="grid h-8 w-8 flex-none cursor-pointer place-items-center rounded-full border border-[#e4e9f1] bg-white text-[#01317b] shadow-[0_4px_12px_rgba(0,5,84,0.06)] transition-all duration-200 hover:-translate-y-px hover:border-[#b7c8e0] hover:bg-[#f5f8fc]"
            onClick={() => move(-1)}
            aria-label="Fotografía anterior"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            type="button"
            className="grid h-8 w-8 flex-none cursor-pointer place-items-center rounded-full border border-[#e4e9f1] bg-white text-[#01317b] shadow-[0_4px_12px_rgba(0,5,84,0.06)] transition-all duration-200 hover:-translate-y-px hover:border-[#b7c8e0] hover:bg-[#f5f8fc]"
            onClick={() => move(1)}
            aria-label="Fotografía siguiente"
          >
            <ArrowRight size={15} />
          </button>
          <span className="ml-1 text-[10px] font-bold tracking-[0.08em] text-[#627089]">
            {safeActiveIndex + 1} / {resolvedSlides.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5" role="tablist" aria-label="Fotografías del hero">
          {resolvedSlides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={index === safeActiveIndex}
              aria-label={`Mostrar ${slide.caption}`}
              className={`h-[5px] cursor-pointer rounded-full border-0 p-0 transition-all duration-250 hover:scale-y-[1.45] hover:bg-[#01317b] ${
                index === safeActiveIndex ? 'w-[34px] bg-[#e22328]' : 'w-[22px] bg-[#c9d4e4]'
              }`}
              onClick={() => interact(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
