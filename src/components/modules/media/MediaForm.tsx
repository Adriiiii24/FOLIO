'use client';

import type { ReactNode } from 'react';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { FormShell, type Saved } from '@/components/ui/FormShell';
import { saveMediaItem } from '@/modules/media/actions';
import { MEDIA_KIND_OPTIONS, MEDIA_STATUS_OPTIONS } from '@/modules/media/form';

const RATING_OPTIONS = [
  { value: '', label: 'Sin nota' },
  ...Array.from({ length: 10 }, (_, i) => ({ value: String(10 - i), label: `${10 - i} / 10` })),
];

export type MediaValues = {
  id?: string;
  kind: string;
  title: string;
  creator: string;
  status: string;
  rating: string;
  progressPct: string;
  startedOn: string;
  finishedOn: string;
  review: string;
};

type MediaFormProps = {
  initial?: Partial<MediaValues>;
  surface?: 'folder' | 'paper';
  submitLabel?: string;
  doneHref?: string;
  onSaved?: (state: Saved) => void;
  secondaryAction?: ReactNode;
  /** El borrador de la barra solo necesita lo esencial; el resto se completa luego en 06 // MEDIA. */
  compact?: boolean;
};

export function MediaForm({
  initial,
  surface,
  submitLabel,
  doneHref,
  onSaved,
  secondaryAction,
  compact,
}: MediaFormProps) {
  const editing = Boolean(initial?.id);
  return (
    <FormShell
      action={saveMediaItem}
      submitLabel={submitLabel ?? (editing ? 'Guardar cambios' : 'Guardar ficha')}
      surface={surface}
      resetOnSuccess={!editing && !onSaved}
      doneHref={doneHref}
      onSaved={onSaved}
      secondaryAction={secondaryAction}
    >
      {(errors) => (
        <>
          {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
          <TextField
            label="Título"
            name="title"
            autoComplete="off"
            defaultValue={initial?.title ?? ''}
            error={errors.title}
            className="@md:col-span-2"
            required
          />
          <SelectField
            label="Tipo"
            name="kind"
            options={MEDIA_KIND_OPTIONS}
            defaultValue={initial?.kind ?? 'book'}
            error={errors.kind}
          />
          <SelectField
            label="Estado"
            name="status"
            options={MEDIA_STATUS_OPTIONS}
            defaultValue={initial?.status ?? 'backlog'}
            error={errors.status}
          />
          <SelectField
            label="Nota"
            name="rating"
            options={RATING_OPTIONS}
            defaultValue={initial?.rating ?? ''}
            error={errors.rating}
          />
          <TextField
            label="Autoría"
            name="creator"
            autoComplete="off"
            placeholder="Autor, directora, estudio…"
            defaultValue={initial?.creator ?? ''}
            error={errors.creator}
          />
          {compact ? null : (
            <>
              <TextField
                label="Progreso (%)"
                name="progressPct"
                inputMode="numeric"
                autoComplete="off"
                defaultValue={initial?.progressPct ?? ''}
                error={errors.progressPct}
              />
              <TextField
                label="Empezado"
                name="startedOn"
                type="date"
                defaultValue={initial?.startedOn ?? ''}
                error={errors.startedOn}
              />
              <TextField
                label="Terminado"
                name="finishedOn"
                type="date"
                defaultValue={initial?.finishedOn ?? ''}
                error={errors.finishedOn}
                hint="Si lo marcas terminado sin fecha, cuenta hoy."
              />
              <TextAreaField
                label="Reseña"
                name="review"
                defaultValue={initial?.review ?? ''}
                error={errors.review}
                rows={4}
                className="@md:col-span-2"
              />
            </>
          )}
        </>
      )}
    </FormShell>
  );
}
