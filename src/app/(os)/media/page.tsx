import type { Metadata } from 'next';
import { EditHeading } from '@/components/ui/EditHeading';
import Link from 'next/link';
import { ActionButton } from '@/components/modules/gym/GymForms';
import { MediaForm } from '@/components/modules/media/MediaForm';
import { Sheet } from '@/components/os/Sheet';
import { SheetHeader } from '@/components/os/SheetHeader';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { ButtonLink } from '@/components/ui/Button';
import { DisplayNumeral } from '@/components/ui/DisplayNumeral';
import { EmptyState } from '@/components/ui/EmptyState';
import { DeleteForm, PrefillButton } from '@/components/ui/RowActions';
import { plural, shortDate } from '@/lib/format';
import { deleteMediaItem, finishMediaItem } from '@/modules/media/actions';
import { MEDIA_KIND_LABEL } from '@/modules/media/form';
import { getMediaSheet, MEDIA_VIEWS, resolveMediaView, type MediaView } from '@/modules/media/queries';

export const metadata: Metadata = { title: 'MEDIA · Consumo cultural' };

const EMPTY: Record<MediaView, { text: string; example: string }> = {
  'en-curso': {
    text: 'Nada en curso. Apunta lo que estás leyendo, viendo o jugando.',
    example: 'leyendo: El infinito en un junco',
  },
  pendientes: { text: 'Sin pendientes. Guarda aquí lo que quieres leer o ver.', example: 'pendiente: Perfect Days' },
  terminados: {
    text: 'Todavía no has terminado nada. Al terminar algo, dale una nota del 1 al 10.',
    example: 'terminado: Dune, 9',
  },
  abandonados: { text: 'Nada abandonado. Abandonar también es decidir.', example: 'abandonado: Ulises' },
};

export default async function MediaPage({ searchParams }: PageProps<'/media'>) {
  const params = await searchParams;
  const view = resolveMediaView(typeof params.ver === 'string' ? params.ver : undefined);
  const media = await getMediaSheet(view);
  const editId = typeof params.edit === 'string' ? params.edit : undefined;
  const baseHref = view === 'en-curso' ? '/media' : `/media?ver=${view}`;

  return (
    <Sheet>
      <SheetHeader tab="media" meta={`Año ${media.year}`} />
      <DisplayNumeral
        value={media.finishedThisYear}
        label={`Terminados en ${media.year}`}
        caption={`Terminados en ${media.year} · ${plural(media.total, 'ficha', 'fichas')} en total`}
        lastSeenKey="media.finished_year"
        upIsGood
      />

      <BrutalistCard title="Nueva ficha" className="col-span-full lg:col-span-5">
        <MediaForm />
      </BrutalistCard>

      <BrutalistCard
        title={MEDIA_VIEWS[view].label}
        eyebrow={plural(media.items.length, 'ficha', 'fichas')}
        className="col-span-full lg:col-span-7"
      >
        <nav aria-label="Filtrar por estado" className="mb-5 flex flex-wrap gap-2">
          {(Object.keys(MEDIA_VIEWS) as MediaView[]).map((key) => (
            <Link
              key={key}
              href={key === 'en-curso' ? '/media' : `/media?ver=${key}`}
              scroll={false}
              aria-current={key === view ? 'page' : undefined}
              className="inline-flex h-11 items-center gap-2 border-2 border-steel px-3 font-mono text-label uppercase hover:border-white aria-[current=page]:border-white aria-[current=page]:bg-white aria-[current=page]:text-black"
            >
              {MEDIA_VIEWS[key].label}
              <span className={key === view ? 'text-steel' : 'text-ash'}>
                {media.byStatus[MEDIA_VIEWS[key].status] ?? 0}
              </span>
            </Link>
          ))}
        </nav>

        {media.items.length > 0 ? (
          <ol className="divide-y-2 divide-line border-y-2 border-line">
            {media.items.map((item) =>
              item.id === editId ? (
                <li key={item.id} className="flex flex-col gap-4 py-4">
                  <EditHeading className="">{item.title}</EditHeading>
                  <MediaForm
                    initial={{
                      id: item.id,
                      kind: item.kind,
                      title: item.title,
                      creator: item.creator ?? '',
                      status: item.status,
                      rating: item.rating ? String(item.rating) : '',
                      progressPct: item.progress_pct === null ? '' : String(item.progress_pct),
                      startedOn: item.started_on ?? '',
                      finishedOn: item.finished_on ?? '',
                      review: item.review ?? '',
                    }}
                    doneHref={baseHref}
                    secondaryAction={
                      <ButtonLink href={baseHref} scroll={false} tone="quiet">
                        Cancelar
                      </ButtonLink>
                    }
                  />
                  <DeleteForm action={deleteMediaItem.bind(null, item.id)} label="Borrar ficha" />
                </li>
              ) : (
                <li key={item.id} className="grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-2 py-4">
                  <div className="min-w-0">
                    <p className="text-body font-semibold">{item.title}</p>
                    <p className="font-mono text-label text-ash uppercase">
                      {MEDIA_KIND_LABEL[item.kind]}
                      {item.creator ? ` · ${item.creator}` : ''}
                      {item.status === 'in_progress' && item.progress_pct !== null ? ` · ${item.progress_pct} %` : ''}
                      {item.finished_on ? ` · ${shortDate(item.finished_on)}` : ''}
                    </p>
                    {item.review ? (
                      <p className="mt-2 line-clamp-2 max-w-[65ch] text-small text-ash">{item.review}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {item.rating ? (
                      <p className="font-display text-[2.25rem] leading-none font-bold tracking-[-0.03em]">
                        {item.rating}
                        <span className="font-mono text-label text-ash"> /10</span>
                      </p>
                    ) : null}
                    <ButtonLink
                      href={`${baseHref}${baseHref.includes('?') ? '&' : '?'}edit=${item.id}`}
                      scroll={false}
                      tone="quiet"
                      className="h-8 min-w-0 px-0"
                      aria-label={`Editar ${item.title}`}
                    >
                      Editar
                    </ButtonLink>
                  </div>
                  {item.status === 'in_progress' ? (
                    <div className="col-span-2">
                      <ActionButton action={finishMediaItem.bind(null, item.id)} pendingLabel="Guardando…">
                        Marcar terminado
                      </ActionButton>
                    </div>
                  ) : null}
                </li>
              ),
            )}
          </ol>
        ) : (
          <EmptyState actions={<PrefillButton text={EMPTY[view].example} />}>{EMPTY[view].text}</EmptyState>
        )}
      </BrutalistCard>
    </Sheet>
  );
}
