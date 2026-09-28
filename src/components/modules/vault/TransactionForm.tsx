'use client';

import type { ReactNode } from 'react';
import { SelectField, TextField } from '@/components/ui/Field';
import { FormShell, type Saved } from '@/components/ui/FormShell';
import { saveTransaction } from '@/modules/vault/actions';
import type { TransactionFormValues } from '@/modules/vault/form';
import { CATEGORY_OPTIONS, KIND_OPTIONS, PAYMENT_OPTIONS } from '@/modules/vault/labels';

type TransactionFormProps = {
  /** Valores iniciales: un movimiento que se edita o un borrador de la barra de entrada. */
  initial?: Partial<TransactionFormValues>;
  /** Fecha y hora local por defecto ('YYYY-MM-DDTHH:mm'), calculada en el servidor con la zona del perfil. */
  defaultOccurredAt: string;
  currency: string;
  surface?: 'folder' | 'paper';
  submitLabel?: string;
  doneHref?: string;
  onSaved?: (state: Saved) => void;
  secondaryAction?: ReactNode;
};

export function TransactionForm({
  initial,
  defaultOccurredAt,
  currency,
  surface,
  submitLabel,
  doneHref,
  onSaved,
  secondaryAction,
}: TransactionFormProps) {
  const editing = Boolean(initial?.id);
  return (
    <FormShell
      action={saveTransaction}
      submitLabel={submitLabel ?? (editing ? 'Guardar cambios' : 'Guardar movimiento')}
      surface={surface}
      resetOnSuccess={!editing && !onSaved}
      doneHref={doneHref}
      onSaved={onSaved}
      secondaryAction={secondaryAction}
    >
      {(errors) => (
        <>
          {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
          <SelectField
            label="Tipo"
            name="kind"
            options={KIND_OPTIONS}
            defaultValue={initial?.kind ?? 'expense'}
            error={errors.kind}
          />
          <TextField
            label={`Importe (${currency})`}
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="12,40"
            defaultValue={initial?.amount ?? ''}
            error={errors.amount}
            required
          />
          <TextField
            label="Comercio o concepto"
            name="merchant"
            autoComplete="off"
            placeholder="Mercadona"
            defaultValue={initial?.merchant ?? ''}
            error={errors.merchant}
          />
          <SelectField
            label="Categoría"
            name="category"
            options={CATEGORY_OPTIONS}
            defaultValue={initial?.category ?? 'groceries'}
            error={errors.category}
          />
          <TextField
            label="Fecha y hora"
            name="occurredAt"
            type="datetime-local"
            defaultValue={initial?.occurredAt ?? defaultOccurredAt}
            error={errors.occurredAt}
            required
          />
          <SelectField
            label="Medio de pago"
            name="paymentMethod"
            options={PAYMENT_OPTIONS}
            defaultValue={initial?.paymentMethod ?? ''}
            error={errors.paymentMethod}
          />
          <TextField
            label="Nota"
            name="description"
            autoComplete="off"
            defaultValue={initial?.description ?? ''}
            error={errors.description}
            className="@md:col-span-2"
          />
        </>
      )}
    </FormShell>
  );
}
