import type { ZodError } from 'zod';

/** Estado de un formulario conectado a una Server Action con useActionState. */
export type FormState =
  | { status: 'idle' }
  | { status: 'success'; message: string; id?: string }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> };

export const IDLE: FormState = { status: 'idle' };

export function success(message: string, id?: string): FormState {
  return { status: 'success', message, id };
}

export function failure(message: string, fieldErrors?: Record<string, string>): FormState {
  return { status: 'error', message, fieldErrors };
}

/** Primer error de cada campo, con el nombre del campo del formulario como clave. */
export function fromZod(error: ZodError, message = 'Revisa los campos marcados.'): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    fieldErrors[key] ??= issue.message;
  }
  return failure(message, fieldErrors);
}

/** Errores de Postgres traducidos a lo que la persona puede hacer. Nunca se muestra el SQL. */
export function fromDb(error: { code?: string; message: string }): FormState {
  switch (error.code) {
    case '23505':
      return failure('Ya existe un registro igual. Cambia algún dato o edita el existente.');
    case '23514':
      return failure('Algún valor está fuera de rango. Revisa las cifras.');
    case '23503':
      return failure('El registro al que apunta ya no existe. Recarga la página.');
    case '42501':
      return failure('Tu sesión no permite este cambio. Vuelve a entrar.');
    default:
      return failure('No se ha podido guardar. Inténtalo de nuevo.');
  }
}

/** Campos de un FormData como objeto plano de cadenas, para validarlos con Zod. */
export function formFields(formData: FormData): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && !key.startsWith('$ACTION')) fields[key] = value;
  }
  return fields;
}
