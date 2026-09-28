import { ButtonLink } from '@/components/ui/Button';
import { DeleteForm } from '@/components/ui/RowActions';
import { localTime, utcIsoToZonedInput } from '@/lib/dates';
import { money, shortDate } from '@/lib/format';
import type { Database } from '@/lib/supabase/database.types';
import { deleteTransaction } from '@/modules/vault/actions';
import { CATEGORY_LABEL, PAYMENT_LABEL } from '@/modules/vault/labels';
import { TransactionForm } from './TransactionForm';

type Row = Pick<
  Database['public']['Tables']['financial_transactions']['Row'],
  'id' | 'kind' | 'amount' | 'currency' | 'category' | 'merchant' | 'description' | 'payment_method' | 'occurred_at'
>;

type TransactionListProps = {
  transactions: readonly Row[];
  timeZone: string;
  editId?: string;
  /** URL de la lámina sin `?edit`, para volver al guardar o cancelar. */
  baseHref: string;
  defaultOccurredAt: string;
  currency: string;
};

export function TransactionList({
  transactions,
  timeZone,
  editId,
  baseHref,
  defaultOccurredAt,
  currency,
}: TransactionListProps) {
  const separator = baseHref.includes('?') ? '&' : '?';

  return (
    <ol className="divide-y-2 divide-line border-y-2 border-line">
      {transactions.map((tx) => {
        const localDateIso = utcIsoToZonedInput(tx.occurred_at, timeZone).slice(0, 10);
        const title = tx.merchant ?? tx.description ?? CATEGORY_LABEL[tx.category];

        if (tx.id === editId) {
          return (
            <li key={tx.id} className="py-5" aria-label={`Editando ${title}`}>
              <TransactionForm
                initial={{
                  id: tx.id,
                  kind: tx.kind,
                  amount: String(tx.amount).replace('.', ','),
                  category: tx.category,
                  merchant: tx.merchant ?? '',
                  description: tx.description ?? '',
                  paymentMethod: tx.payment_method ?? '',
                  occurredAt: utcIsoToZonedInput(tx.occurred_at, timeZone),
                }}
                defaultOccurredAt={defaultOccurredAt}
                currency={currency}
                doneHref={baseHref}
                secondaryAction={
                  <ButtonLink href={baseHref} scroll={false} tone="quiet">
                    Cancelar
                  </ButtonLink>
                }
              />
              <div className="mt-4 border-t-2 border-line pt-4">
                <DeleteForm action={deleteTransaction.bind(null, tx.id)} label="Borrar movimiento" />
              </div>
            </li>
          );
        }

        const income = tx.kind === 'income';
        return (
          <li
            key={tx.id}
            className="grid grid-cols-[4.5rem_1fr_auto] items-baseline gap-x-4 gap-y-1 py-3 @md:grid-cols-[6rem_1fr_auto_auto]"
          >
            <p className="font-mono text-label text-ash uppercase">
              <span className="block">{shortDate(localDateIso)}</span>
              <span className="block">{localTime(tx.occurred_at, timeZone)}</span>
            </p>
            <div className="min-w-0">
              <p className="truncate text-body">{title}</p>
              <p className="truncate text-small text-ash">
                {CATEGORY_LABEL[tx.category]}
                {tx.payment_method ? ` · ${PAYMENT_LABEL[tx.payment_method]}` : ''}
                {tx.merchant && tx.description ? ` · ${tx.description}` : ''}
              </p>
            </div>
            <p className={`text-right font-mono text-label ${income ? 'text-signal-up' : 'text-white'}`}>
              {income ? '+' : '−'}
              {money(Number(tx.amount), tx.currency)}
              {income ? <span className="sr-only"> (ingreso)</span> : null}
            </p>
            <div className="col-start-2 @md:col-start-auto">
              <ButtonLink
                href={`${baseHref}${separator}edit=${tx.id}`}
                scroll={false}
                tone="quiet"
                className="h-8 min-w-0 px-0"
                aria-label={`Editar ${title}`}
              >
                Editar
              </ButtonLink>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
