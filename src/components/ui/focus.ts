// Foco que no se pierde (WCAG 2.4.3). React desmonta la fila que se edita, el botón que borra o el formulario que
// se acaba de guardar, y el foco cae en <body>: con el teclado hay que volver a empezar desde arriba y el lector de
// pantalla pierde el sitio. Aquí el destino se pide ANTES del cambio (al pulsar Guardar, Cancelar o Borrar) y se
// aplica cuando lo enfocado ya ha desaparecido y el destino existe.
//
// Sin directiva a propósito: las láminas (componentes de servidor) usan editButtonId. Lo demás toca el DOM y solo
// se llama desde el navegador (manejadores y efectos).

/** Id estable del «Editar» de una fila: a él vuelve el foco al guardar o cancelar la edición. */
export const editButtonId = (rowId: string) => `editar-${rowId}`;

/** Un destino: un id, un elemento o nada (los que no existan se saltan). */
export type FocusTarget = string | HTMLElement | null | undefined | false;

// Lo que ya recibe el foco por sí mismo, y lo que además está en el orden de tabulación.
const FOCUSABLE =
  'a[href], button:not(:disabled), input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]';
const TABBABLE = FOCUSABLE.replace('[tabindex]', '[tabindex]:not([tabindex="-1"])');

/** Lo que tarda, como mucho, una acción de servidor en volver con la lámina nueva. */
const WAIT_MS = 15_000;

let cancelPending: (() => void) | null = null;

function resolve(target: FocusTarget): HTMLElement | null {
  const element = typeof target === 'string' ? document.getElementById(target) : target;
  return element && element.isConnected ? element : null;
}

/** Enfoca un elemento. Si no es enfocable (un título), lo es solo mientras tenga el foco: no entra en el orden de Tab. */
export function focusElement(element: HTMLElement) {
  if (!element.matches(FOCUSABLE)) {
    element.setAttribute('tabindex', '-1');
    element.addEventListener('blur', () => element.removeAttribute('tabindex'), { once: true });
  }
  element.focus();
}

/**
 * Cuando `from` salga del DOM con el foco dentro, lleva el foco al primer destino que exista, esperando a que React
 * lo pinte. Si para entonces la persona ya está en otro sitio, no lo toca. Una petición nueva sustituye a la anterior.
 */
export function keepFocus(from: Element | null | undefined, targets: FocusTarget[]): void {
  cancelPending?.();
  if (!from) return;
  const source = from;

  const observer = new MutationObserver(check);
  const timer = setTimeout(stop, WAIT_MS);
  function stop() {
    observer.disconnect();
    clearTimeout(timer);
    if (cancelPending === stop) cancelPending = null;
  }
  function check() {
    if (source.isConnected) return;
    const active = document.activeElement;
    if (active && active !== document.body) return stop();
    for (const target of targets) {
      const element = resolve(target);
      if (element) {
        stop();
        focusElement(element);
        return;
      }
    }
  }

  observer.observe(document.body, { childList: true, subtree: true });
  cancelPending = stop;
}

/** El título de la ficha que contiene `element`: el destino cuando en ella ya no queda nada que enfocar. */
export function cardHeading(element: Element): HTMLElement | null {
  return element.closest('section')?.querySelector<HTMLElement>('h2') ?? null;
}

/** Lo que se enfoca de una fila: su «Editar» o, si no tiene, su primer control. */
function rowControl(row: Element | null): HTMLElement | null {
  return row?.querySelector<HTMLElement>('[id^="editar-"]') ?? row?.querySelector<HTMLElement>(TABBABLE) ?? null;
}

/**
 * Destinos si desaparece la fila de `element` (borrada, terminada): la siguiente, la anterior, las de la lista que
 * la contiene (una serie dentro de su ejercicio) y, si no queda ninguna, el título de la ficha.
 */
export function rowTargets(element: Element): FocusTarget[] {
  const targets: FocusTarget[] = [];
  for (let row = element.closest('li'); row; row = row.parentElement?.closest('li') ?? null) {
    targets.push(rowControl(row.nextElementSibling), rowControl(row.previousElementSibling));
  }
  targets.push(cardHeading(element));
  return targets;
}
