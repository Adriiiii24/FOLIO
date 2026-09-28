import type { Metadata } from 'next';
import { TransactionForm } from '@/components/modules/vault/TransactionForm';
import { TransactionList } from '@/components/modules/vault/TransactionList';
import { Sheet } from '@/components/os/Sheet';
import { SheetHeader } from '@/components/os/SheetHeader';
import { BarTable } from '@/components/ui/BarTable';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { DisplayNumeral } from '@/components/ui/DisplayNumeral';
import { EmptyState } from '@/components/ui/EmptyState';
import { MonthNav } from '@/components/ui/MonthNav';
import { PrefillButton } from '@/components/ui/RowActions';
import { Signal } from '@/components/ui/Signal';
import { utcIsoToZonedInput } from '@/lib/dates';
import { money, monthName, plural } from '@/lib/format';
import { getToday } from '@/modules/settings/queries';
import { getVaultMonth } from '@/modules/vault/queries';

export const metadata: Metadata = { title: 'VAULT · Finanzas' };

export default async function VaultPage({ searchParams }: PageProps<'/vault'>) {
  const params = await searchParams;
  const vault = await getVaultMonth(typeof params.mes === 'string' ? params.mes : undefined);
  const { today } = await getToday();
  const editId = typeof params.edit === 'string' ? params.edit : undefined;

  const month = monthName(vault.from);
  const baseHref = vault.isCurrentMonth ? '/vault' : `/vault?mes=${vault.month}`;
  const defaultOccurredAt = utcIsoToZonedInput(new Date().toISOString(), vault.timeZone);
  const caption = vault.budget
    ? `Gasto · ${vault.budgetPct} % de ${money(vault.budget, vault.currency)}`
    : `Gasto de ${month}`;

  return (
    <Sheet>
      <SheetHeader tab="vault" meta={vault.isCurrentMonth ? 'Mes en curso' : month} />
      <DisplayNumeral
        value={vault.spent}
        format={{ style: 'currency', currency: vault.currency }}
        label={`Gasto de ${month}`}
        caption={caption}
        lastSeenKey={vault.isCurrentMonth ? 'vault.spend_mtd' : undefined}
        upIsGood={false}
      />
      <div className="col-span-full -mt-2 flex flex-wrap gap-3">
        {vault.budget !== null && vault.spent > vault.budget ? (
          <Signal tone="down" glyph="!">
            Presupuesto superado en {money(vault.spent - vault.budget, vault.currency)}
          </Signal>
        ) : null}
        {vault.isCurrentMonth && vault.paceDelta !== null && Math.abs(vault.paceDelta) >= 5 ? (
          vault.paceDelta > 0 ? (
            <Signal tone="down" glyph="▲">
              {vault.paceDelta} puntos por encima del ritmo del mes
            </Signal>
          ) : (
            <Signal tone="up" glyph="▼">
              {Math.abs(vault.paceDelta)} puntos por debajo del ritmo del mes
            </Signal>
          )
        ) : null}
        {vault.income > 0 ? <Signal tone="neutral">Ingresos: {money(vault.income, vault.currency)}</Signal> : null}
      </div>

      <BrutalistCard title="Nuevo movimiento" className="col-span-full md:col-span-8 lg:col-span-5">
        <TransactionForm defaultOccurredAt={defaultOccurredAt} currency={vault.currency} />
      </BrutalistCard>

      <BrutalistCard title="Por categoría" eyebrow={month} className="col-span-full md:col-span-8 lg:col-span-7">
        {vault.byCategory.length > 0 ? (
          <BarTable
            caption={`Gasto por categoría en ${month}`}
            labelHeader="Categoría"
            valueHeader="Gasto"
            rows={vault.byCategory.map((row) => ({
              key: row.category,
              label: row.label,
              value: row.total,
              formatted: money(row.total, vault.currency),
            }))}
          />
        ) : (
          <EmptyState>Cuando registres gastos, aquí verás en qué se va el dinero, de más a menos.</EmptyState>
        )}
      </BrutalistCard>

      <BrutalistCard
        title="Movimientos"
        eyebrow={plural(vault.transactions.length, 'movimiento', 'movimientos')}
        className="col-span-full"
      >
        <div className="mb-4">
          <MonthNav month={vault.month} currentMonth={today.slice(0, 7)} basePath="/vault" />
        </div>
        {vault.transactions.length > 0 ? (
          <TransactionList
            transactions={vault.transactions}
            timeZone={vault.timeZone}
            editId={editId}
            baseHref={baseHref}
            defaultOccurredAt={defaultOccurredAt}
            currency={vault.currency}
          />
        ) : (
          <EmptyState actions={<PrefillButton text="12,40 Mercadona" />}>
            No hay movimientos en {month}. El registro más rápido es escribir el importe y el comercio en la barra de
            abajo.
          </EmptyState>
        )}
      </BrutalistCard>
    </Sheet>
  );
}
