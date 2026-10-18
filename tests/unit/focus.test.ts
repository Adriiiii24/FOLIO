import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { editButtonId, keepFocus } from '@/components/ui/focus';

// keepFocus solo necesita esto del DOM: un document con body, activeElement y getElementById, MutationObserver y
// elementos que saben si siguen conectados y recibir el foco. Sin jsdom: lo justo, falso y explícito.

type Fake = {
  id: string;
  isConnected: boolean;
  focusable: boolean;
  attributes: Map<string, string>;
  blur: (() => void) | null;
  focus: () => void;
  matches: () => boolean;
  hasAttribute: (name: string) => boolean;
  setAttribute: (name: string, value: string) => void;
  removeAttribute: (name: string) => void;
  addEventListener: (type: string, listener: () => void) => void;
};

const body = { tagName: 'BODY' };
const doc = {
  body,
  activeElement: body as unknown,
  elements: [] as Fake[],
  getElementById(id: string) {
    return this.elements.find((element) => element.id === id && element.isConnected) ?? null;
  },
};

let observers: { callback: () => void; active: boolean }[] = [];
class FakeObserver {
  entry: { callback: () => void; active: boolean };
  constructor(callback: () => void) {
    this.entry = { callback, active: false };
    observers.push(this.entry);
  }
  observe() {
    this.entry.active = true;
  }
  disconnect() {
    this.entry.active = false;
  }
}

/** React acaba de cambiar el DOM: avisa a los observadores activos. */
const mutate = () => observers.filter((entry) => entry.active).forEach((entry) => entry.callback());
const watching = () => observers.some((entry) => entry.active);

function element(id = '', { focusable = true, connected = true } = {}): Fake {
  const fake: Fake = {
    id,
    isConnected: connected,
    focusable,
    attributes: new Map(),
    blur: null,
    focus: () => {
      doc.activeElement = fake;
    },
    matches: () => fake.focusable || fake.attributes.has('tabindex'),
    hasAttribute: (name) => fake.attributes.has(name),
    setAttribute: (name, value) => void fake.attributes.set(name, value),
    removeAttribute: (name) => void fake.attributes.delete(name),
    addEventListener: (type, listener) => {
      if (type === 'blur') fake.blur = listener;
    },
  };
  doc.elements.push(fake);
  return fake;
}

/** Desmonta `fake` como lo haría React: si tenía el foco, el foco cae en <body>. */
function remove(fake: Fake) {
  fake.isConnected = false;
  if (doc.activeElement === fake) doc.activeElement = body;
}

const el = (fake: Fake) => fake as unknown as HTMLElement;

beforeEach(() => {
  doc.activeElement = body;
  doc.elements = [];
  observers = [];
  vi.stubGlobal('document', doc);
  vi.stubGlobal('MutationObserver', FakeObserver);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('editButtonId', () => {
  it('es estable y no depende de la lámina', () => {
    expect(editButtonId('3f2a')).toBe('editar-3f2a');
  });
});

describe('keepFocus', () => {
  it('espera a que desaparezca lo enfocado y lleva el foco al primer destino que exista', () => {
    const submit = element();
    const editLink = element('editar-1');
    submit.focus();

    keepFocus(el(submit), ['editar-0', 'editar-1']);
    mutate();
    expect(doc.activeElement).toBe(submit); // el formulario sigue: nada que rescatar

    remove(submit);
    mutate();
    expect(doc.activeElement).toBe(editLink);
    expect(watching()).toBe(false);
  });

  it('no quita el foco si la persona ya está en otro sitio', () => {
    const submit = element();
    const elsewhere = element('otro');
    const editLink = element('editar-1');
    submit.focus();

    keepFocus(el(submit), ['editar-1']);
    elsewhere.focus();
    remove(submit);
    mutate();

    expect(doc.activeElement).toBe(elsewhere);
    expect(editLink.attributes.size).toBe(0);
    expect(watching()).toBe(false);
  });

  it('espera al destino si React aún no lo ha pintado', () => {
    const cancel = element();
    cancel.focus();

    keepFocus(el(cancel), ['editar-7']);
    remove(cancel);
    mutate();
    expect(doc.activeElement).toBe(body);
    expect(watching()).toBe(true);

    const editLink = element('editar-7');
    mutate();
    expect(doc.activeElement).toBe(editLink);
  });

  it('salta los destinos vacíos o desconectados y acepta elementos', () => {
    const confirm = element();
    const gone = element('', { connected: false });
    const next = element();
    confirm.focus();

    keepFocus(el(confirm), [null, false, undefined, el(gone), el(next)]);
    remove(confirm);
    mutate();

    expect(doc.activeElement).toBe(next);
  });

  it('a un título lo hace enfocable solo mientras tiene el foco', () => {
    const button = element();
    const heading = element('', { focusable: false });
    button.focus();

    keepFocus(el(button), [el(heading)]);
    remove(button);
    mutate();

    expect(doc.activeElement).toBe(heading);
    expect(heading.attributes.get('tabindex')).toBe('-1');
    heading.blur?.();
    expect(heading.hasAttribute('tabindex')).toBe(false);
  });

  it('una petición nueva sustituye a la anterior', () => {
    const first = element();
    const second = element();
    const firstTarget = element('a');
    const secondTarget = element('b');
    first.focus();

    keepFocus(el(first), ['a']);
    keepFocus(el(second), ['b']);
    remove(first);
    mutate();
    expect(doc.activeElement).toBe(body); // la primera ya no vigila

    remove(second);
    mutate();
    expect(doc.activeElement).toBe(secondTarget);
    expect(firstTarget.attributes.size).toBe(0);
  });

  it('se rinde si la acción no vuelve en 15 s', () => {
    vi.useFakeTimers();
    const submit = element();
    element('editar-1');
    submit.focus();

    keepFocus(el(submit), ['editar-1']);
    vi.advanceTimersByTime(15_000);
    remove(submit);
    mutate();

    expect(doc.activeElement).toBe(body);
    expect(watching()).toBe(false);
  });
});
