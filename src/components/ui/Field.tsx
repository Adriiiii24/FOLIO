import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Icon } from './Icon';

// Controles de formulario. El color lo decide la superficie (.control en globals.css): negros en la carpeta,
// blancos en el papel. 44 px de alto, texto de 16 px (por debajo, iOS hace zoom al enfocar) y el anillo de foco global.
export const CONTROL = 'control w-full px-3 text-body';

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
  children: (props: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode;
};

/** Etiqueta + control + ayuda o error, conectados por id para lectores de pantalla. */
export function Field({ label, name, error, hint, className = '', children }: FieldProps) {
  // Único por instancia: el mismo campo puede aparecer a la vez en el formulario de alta y en un borrador.
  const id = `f-${name}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="field-label font-mono text-label uppercase">
        {label}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} className="field-error text-small">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-hint text-small">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type WithLabel = { label: string; name: string; error?: string; hint?: string; className?: string };

export function TextField({
  label,
  name,
  error,
  hint,
  className,
  ...input
}: WithLabel & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} name={name} error={error} hint={hint} className={className}>
      {(control) => <input name={name} className={`${CONTROL} h-11`} {...control} {...input} />}
    </Field>
  );
}

export function TextAreaField({
  label,
  name,
  error,
  hint,
  className,
  ...textarea
}: WithLabel & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} name={name} error={error} hint={hint} className={className}>
      {(control) => (
        <textarea name={name} className={`${CONTROL} min-h-32 py-2.5 leading-normal`} {...control} {...textarea} />
      )}
    </Field>
  );
}

type Option = { value: string; label: string };

export function SelectField({
  label,
  name,
  error,
  hint,
  className,
  options,
  ...select
}: WithLabel & { options: readonly Option[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} name={name} error={error} hint={hint} className={className}>
      {(control) => (
        <div className="relative">
          <select name={name} className={`${CONTROL} h-11 appearance-none pr-10`} {...control} {...select}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="field-label pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
            <Icon name="chevron-down" />
          </span>
        </div>
      )}
    </Field>
  );
}
