import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Mail } from 'lucide-react';
import { EMAIL_CHANNELS } from '../../data/contactoData';

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below when Clipboard API is blocked by browser permissions.
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export default function ContactoCorreosSection() {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const copyTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== undefined) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopyEmail = async (address: string) => {
    const copied = await copyTextToClipboard(address);
    if (!copied) return;

    setCopiedEmail(address);
    if (copyTimerRef.current !== undefined) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopiedEmail(null);
    }, 2500);
  };

  return (
    <section
      id="correos-contacto"
      className="scroll-mt-[88px] border-y border-[#e4e9f1] bg-[linear-gradient(180deg,#f5f7fb_0%,#eef3fa_100%)] pt-14 pb-16 min-[801px]:pt-[84px] min-[801px]:pb-[92px]"
    >
      <div className="page-width">
        <div className="section-kicker">Escríbenos directamente</div>
        <div className="mt-[21px] grid grid-cols-1 items-end gap-5 min-[801px]:grid-cols-2 min-[801px]:gap-[60px]">
          <h2 className="m-0 text-[clamp(37px,4vw,57px)] leading-[0.98] tracking-[-0.06em] text-[#000254]">
            Un correo para
            <br />
            <span className="text-[#01317b]">cada consulta.</span>
          </h2>
          <p className="m-0 mb-[3px] max-w-[450px] text-[16px] leading-[1.7] text-[#627089]">
            Elige el buzón adecuado según lo que necesites para que podamos responderte de la forma más ágil posible.
          </p>
        </div>

        <div className="mt-11 grid grid-cols-1 gap-[22px] min-[801px]:grid-cols-2">
          {EMAIL_CHANNELS.map(({ id, badge, title, description, address, actionLabel }) => {
            const isCopied = copiedEmail === address;

            return (
              <article
                key={id}
                className="flex flex-col gap-4 rounded-[24px] border border-[#e4e9f1] bg-white p-6 shadow-[0_10px_30px_rgba(0,5,84,0.05)] transition-all duration-250 hover:-translate-y-[3px] hover:border-[#c9d6e8] hover:shadow-[0_18px_50px_rgba(0,5,84,0.09)] min-[801px]:p-8"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className="grid h-12 w-12 place-items-center rounded-[15px] bg-[#edf3fb] text-[#01317b]"
                    aria-hidden="true"
                  >
                    <Mail size={22} />
                  </span>
                  <span className="role-pill">{badge}</span>
                </div>

                <h3 className="m-0 mt-1 text-[22px] tracking-[-0.03em] text-[#000254]">{title}</h3>
                <p className="m-0 text-[14px] leading-[1.65] text-[#627089]">{description}</p>

                <div className="rounded-[14px] border border-[#e4e9f1] bg-[#f5f7fb] px-4 py-[14px]">
                  <code className="block select-all break-all font-mono text-[14px] font-bold leading-[1.5] text-[#000254]">
                    {address}
                  </code>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-1.5">
                  <a href={`mailto:${address}`} className="button button-primary w-full min-[801px]:w-auto">
                    <Mail size={16} /> {actionLabel}
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleCopyEmail(address)}
                    className={`button w-full min-[801px]:w-auto cursor-pointer transition-all duration-200 active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-[#e22328]/45 focus-visible:outline-offset-[3px] ${
                      isCopied
                        ? 'border border-[#b7dfc9] bg-[#ebf8f0] text-[#17653b]'
                        : 'button-ghost hover:border-[#b7c8e0] hover:bg-[#f5f7fb]'
                    }`}
                    aria-label={`Copiar dirección ${address}`}
                  >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                    <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                <span className="sr-only" aria-live="polite">
                  {isCopied ? `Dirección ${address} copiada al portapapeles.` : ''}
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
