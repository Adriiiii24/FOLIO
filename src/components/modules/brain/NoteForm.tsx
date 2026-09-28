'use client';

import type { ReactNode } from 'react';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { FormShell, type Saved } from '@/components/ui/FormShell';
import { saveNote } from '@/modules/brain/actions';
import { MOOD_LABEL } from '@/modules/brain/form';

const MOOD_OPTIONS = [
  { value: '', label: 'Sin indicar' },
  ...[5, 4, 3, 2, 1].map((value) => ({ value: String(value), label: `${value} · ${MOOD_LABEL[value]}` })),
];

export type NoteValues = { id?: string; entryDate: string; title: string; content: string; mood: string; tags: string };

type NoteFormProps = {
  initial?: Partial<NoteValues>;
  defaultEntryDate: string;
  surface?: 'folder' | 'paper';
  submitLabel?: string;
  doneHref?: string;
  onSaved?: (state: Saved) => void;
  secondaryAction?: ReactNode;
  /** Metadato del borrador de IA (origen, archivo, confianza), en JSON. */
  aiMeta?: string;
};

export function NoteForm({
  initial,
  defaultEntryDate,
  surface,
  submitLabel,
  doneHref,
  onSaved,
  secondaryAction,
  aiMeta,
}: NoteFormProps) {
  const editing = Boolean(initial?.id);
  return (
    <FormShell
      action={saveNote}
      submitLabel={submitLabel ?? (editing ? 'Guardar cambios' : 'Guardar entrada')}
      surface={surface}
      resetOnSuccess={!editing && !onSaved}
      doneHref={doneHref}
      onSaved={onSaved}
      secondaryAction={secondaryAction}
      aiMeta={aiMeta}
    >
      {(errors) => (
        <>
          {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
          <TextField
            label="Fecha"
            name="entryDate"
            type="date"
            defaultValue={initial?.entryDate ?? defaultEntryDate}
            error={errors.entryDate}
            required
          />
          <SelectField
            label="Ánimo"
            name="mood"
            options={MOOD_OPTIONS}
            defaultValue={initial?.mood ?? ''}
            error={errors.mood}
          />
          <TextField
            label="Título (opcional)"
            name="title"
            autoComplete="off"
            defaultValue={initial?.title ?? ''}
            error={errors.title}
            className="@md:col-span-2"
          />
          <TextAreaField
            label="Entrada"
            name="content"
            defaultValue={initial?.content ?? ''}
            error={errors.content}
            rows={6}
            className="@md:col-span-2"
            required
          />
          <TextField
            label="Etiquetas"
            name="tags"
            autoComplete="off"
            placeholder="trabajo, rodilla"
            hint="Separadas por comas."
            defaultValue={initial?.tags ?? ''}
            error={errors.tags}
            className="@md:col-span-2"
          />
        </>
      )}
    </FormShell>
  );
}
