import type { Metadata } from 'next';
import { EditHeading } from '@/components/ui/EditHeading';
import { NoteForm } from '@/components/modules/brain/NoteForm';
import { Sheet } from '@/components/os/Sheet';
import { SheetHeader } from '@/components/os/SheetHeader';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { ButtonLink, buttonClass } from '@/components/ui/Button';
import { DisplayNumeral } from '@/components/ui/DisplayNumeral';
import { EmptyState } from '@/components/ui/EmptyState';
import { TextField } from '@/components/ui/Field';
import { DeleteForm, PrefillButton } from '@/components/ui/RowActions';
import { plural, shortDate } from '@/lib/format';
import { deleteNote } from '@/modules/brain/actions';
import { MOOD_LABEL } from '@/modules/brain/form';
import { getBrainSheet } from '@/modules/brain/queries';

export const metadata: Metadata = { title: 'BRAIN · Diario' };

export default async function BrainPage({ searchParams }: PageProps<'/brain'>) {
  const params = await searchParams;
  const brain = await getBrainSheet(typeof params.q === 'string' ? params.q : undefined);
  const editId = typeof params.edit === 'string' ? params.edit : undefined;
  const baseHref = brain.query ? `/brain?q=${encodeURIComponent(brain.query)}` : '/brain';

  return (
    <Sheet>
      <SheetHeader tab="brain" meta={brain.writtenToday ? 'Hoy ya has escrito' : 'Hoy aún no has escrito'} />
      <DisplayNumeral
        value={brain.streak}
        display={plural(brain.streak, 'día', 'días')}
        label="Racha de escritura"
        caption={`Días seguidos escribiendo · ${plural(brain.total, 'entrada', 'entradas')} en total`}
        lastSeenKey="brain.streak"
        upIsGood
      />

      <BrutalistCard title="Nueva entrada" className="col-span-full lg:col-span-6">
        <NoteForm defaultEntryDate={brain.today} />
      </BrutalistCard>

      <BrutalistCard
        title={brain.query ? 'Resultados' : 'Entradas'}
        eyebrow={brain.query ? plural(brain.notes.length, 'resultado', 'resultados') : 'Las más recientes'}
        className="col-span-full lg:col-span-6"
      >
        <search className="mb-5">
          <form action="/brain" className="flex items-end gap-3">
            <TextField
              label="Buscar en el diario"
              name="q"
              type="search"
              defaultValue={brain.query}
              placeholder="rodilla, camion…"
              hint="Sin tildes también encuentra: «camion» encuentra «camión»."
              className="flex-1"
            />
            <button type="submit" className={buttonClass({ tone: 'secondary', className: 'mb-[1.625rem]' })}>
              Buscar
            </button>
          </form>
          {brain.query ? (
            <ButtonLink href="/brain" tone="quiet" className="mt-2 h-8 px-0">
              Quitar la búsqueda
            </ButtonLink>
          ) : null}
        </search>

        {brain.notes.length > 0 ? (
          <ol className="divide-y-2 divide-line border-y-2 border-line">
            {brain.notes.map((note) =>
              note.id === editId ? (
                <li key={note.id} className="flex flex-col gap-4 py-4">
                  <EditHeading className="">
                    {note.title ?? 'Entrada'} · {shortDate(note.entry_date)}
                  </EditHeading>
                  <NoteForm
                    defaultEntryDate={brain.today}
                    initial={{
                      id: note.id,
                      entryDate: note.entry_date,
                      title: note.title ?? '',
                      content: note.content,
                      mood: note.mood ? String(note.mood) : '',
                      tags: note.tags.join(', '),
                    }}
                    doneHref={baseHref}
                    secondaryAction={
                      <ButtonLink href={baseHref} scroll={false} tone="quiet">
                        Cancelar
                      </ButtonLink>
                    }
                  />
                  <DeleteForm action={deleteNote.bind(null, note.id)} label="Borrar entrada" />
                </li>
              ) : (
                <li key={note.id} className="py-4">
                  <article>
                    <header className="flex items-baseline justify-between gap-4">
                      <h3 className="min-w-0 truncate text-body font-semibold">
                        {note.title ?? shortDate(note.entry_date)}
                      </h3>
                      <ButtonLink
                        href={`${baseHref}${baseHref.includes('?') ? '&' : '?'}edit=${note.id}`}
                        scroll={false}
                        tone="quiet"
                        className="h-8 min-w-0 shrink-0 px-0"
                        aria-label={`Editar la entrada del ${shortDate(note.entry_date)}`}
                      >
                        Editar
                      </ButtonLink>
                    </header>
                    <p className="mt-1 line-clamp-3 max-w-[65ch] text-body whitespace-pre-line text-ash">
                      {note.content}
                    </p>
                    <p className="mt-2 font-mono text-label text-ash uppercase">
                      {shortDate(note.entry_date)}
                      {note.mood ? ` · Ánimo ${note.mood}/5, ${MOOD_LABEL[note.mood]?.toLowerCase()}` : ''}
                      {note.tags.length > 0 ? ` · ${note.tags.map((tag) => `#${tag}`).join(' ')}` : ''}
                    </p>
                  </article>
                </li>
              ),
            )}
          </ol>
        ) : brain.query ? (
          <EmptyState>
            Nada coincide con «{brain.query}». Prueba con otra palabra; la búsqueda por significado llegará con la IA.
          </EmptyState>
        ) : (
          <EmptyState actions={<PrefillButton text="Hoy he dormido fatal y me duele la rodilla" label="Probar" />}>
            Tu diario está vacío. Escribe aquí al lado o en la barra de abajo: en esta pestaña, lo que escribas se
            convierte en una entrada.
          </EmptyState>
        )}
      </BrutalistCard>
    </Sheet>
  );
}
