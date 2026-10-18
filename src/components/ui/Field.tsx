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
  /**
   * Se puede dejar vacío, y la etiqueta lo dice: «Nota (opcional)». Es el único criterio de todos los formularios:
   * lo que no lo lleva hay que rellenarlo (o ya viene con valor, como un selector sin opción vacía).
   */
  optional?: boolean;
  /** Ids de otros textos que describen el control (un aviso de la página), además de su error y su ayuda. */
  describedBy?: string;
  className?: string;
  children: (props: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode;
};

/** Etiqueta + control + ayuda y error, conectados por id para lectores de pantalla. */
export function Field({ label, name, error, hint, optional, describedBy, className = '', children }: FieldProps) {
  // Único por instancia: el mismo campo puede aparecer a la vez en el formulario de alta y en un borrador.
  const id = `f-${name}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  // El error no sustituye a la ayuda («Código de tres letras»): se ven y se anuncian los dos, el error primero.
  const description = [error && `${id}-error`, hint && `${id}-hint`, describedBy].filter(Boolean).join(' ');

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="field-label font-mono text-label uppercase">
        {label}
        {optional ? ' (opcional)' : null}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': description || undefined })}
      {hint ? (
        <p id={`${id}-hint`} className="field-hint text-small">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="field-error text-small">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type WithLabel = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  describedBy?: string;
  className?: string;
};

export function TextField({
  label,
  name,
  error,
  hint,
  optional,
  describedBy,
  className,
  ...input
}: WithLabel & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field
      label={label}
      name={name}
      error={error}
      hint={hint}
      optional={optional}
      describedBy={describedBy}
      className={className}
    >
      {(control) => <input name={name} className={`${CONTROL} h-11`} {...control} {...input} />}
    </Field>
  );
}

export function TextAreaField({
  label,
  name,
  error,
  hint,
  optional,
  describedBy,
  className,
  ...textarea
}: WithLabel & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field
      label={label}
      name={name}
      error={error}
      hint={hint}
      optional={optional}
      describedBy={describedBy}
      className={className}
    >
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
  optional,
  describedBy,
  className,
  options,
  ...select
}: WithLabel & { options: readonly Option[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field
      label={label}
      name={name}
      error={error}
      hint={hint}
      optional={optional}
      describedBy={describedBy}
      className={className}
    >
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
