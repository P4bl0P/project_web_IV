import { useEffect } from 'react';

let activeLocks = 0;
let previousBodyOverflow = '';
let previousHtmlOverflow = '';
let previousBodyOverscrollBehavior = '';

/**
 * Bloquea el scroll del documento mientras el modal permanezca montado y activo.
 * Usa un contador global para mantener el bloqueo cuando hay varios modales apilados.
 */
export function useLockBodyScroll(locked = true): void {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') {
      return;
    }

    const { body, documentElement } = document;

    if (activeLocks === 0) {
      previousBodyOverflow = body.style.overflow;
      previousHtmlOverflow = documentElement.style.overflow;
      previousBodyOverscrollBehavior = body.style.overscrollBehavior;

      body.style.overflow = 'hidden';
      documentElement.style.overflow = 'hidden';
      body.style.overscrollBehavior = 'none';
    }

    activeLocks += 1;

    return () => {
      activeLocks = Math.max(0, activeLocks - 1);
      if (activeLocks === 0) {
        body.style.overflow = previousBodyOverflow;
        documentElement.style.overflow = previousHtmlOverflow;
        body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      }
    };
  }, [locked]);
}
