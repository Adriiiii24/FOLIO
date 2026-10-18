'use client';

import { useId, useSyncExternalStore } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Field';
import { FormShell } from '@/components/ui/FormShell';
import { SINGLE_KEY_SHORTCUTS_KEY } from '@/components/os/TabShortcuts';
import { deleteAccount, saveAiSettings, saveProfile, saveTargets, signOutEverywhere } from '@/modules/settings/actions';
import { DELETE_CONFIRMATION } from '@/modules/settings/form';

type Profile = {
  display_name: string | null;
  timezone: string;
  currency: string;
  daily_kcal_target: number | null;
  daily_protein_g_target: number | null;
  daily_carbs_g_target: number | null;
  daily_fat_g_target: number | null;
  monthly_budget: number | null;
  ai_monthly_budget_usd: number;
  briefing_enabled: boolean;
};

const text = (value: number | null) => (value === null ? '' : String(value).replace('.', ','));

export function ProfileForm({ profile, timeZones }: { profile: Profile; timeZones: readonly string[] }) {
  const options = (timeZones.includes(profile.timezone) ? timeZones : [profile.timezone, ...timeZones]).map((zone) => ({
    value: zone,
    label: zone.replaceAll('_', ' '),
  }));
  return (
    <FormShell action={saveProfile} submitLabel="Guardar perfil">
      {(errors) => (
        <>
          <TextField
            label="Nombre"
            name="displayName"
            autoComplete="nickname"
            defaultValue={profile.display_name ?? ''}
            error={errors.displayName}
            optional
          />
          <TextField
            label="Moneda"
            name="currency"
            autoComplete="off"
            defaultValue={profile.currency}
            error={errors.currency}
            hint="Código de tres letras: EUR, USD…"
            maxLength={3}
            required
          />
          <SelectField
            label="Zona horaria"
            name="timezone"
            options={options}
            defaultValue={profile.timezone}
            error={errors.timezone}
            hint="Decide qué es «hoy» en todas las pestañas."
            className="@md:col-span-2"
          />
        </>
      )}
    </FormShell>
  );
}

export function TargetsForm({ profile }: { profile: Profile }) {
  return (
    <FormShell action={saveTargets} submitLabel="Guardar objetivos" className="grid grid-cols-2 gap-4 @lg:grid-cols-4">
      {(errors) => (
        <>
          <TextField
            label="Kcal al día"
            name="dailyKcalTarget"
            inputMode="numeric"
            defaultValue={text(profile.daily_kcal_target)}
            error={errors.dailyKcalTarget}
            className="col-span-2 @lg:col-span-1"
            optional
          />
          <TextField
            label="Proteína (g)"
            name="dailyProteinGTarget"
            inputMode="numeric"
            defaultValue={text(profile.daily_protein_g_target)}
            error={errors.dailyProteinGTarget}
            optional
          />
          <TextField
            label="Carbohidratos (g)"
            name="dailyCarbsGTarget"
            inputMode="numeric"
            defaultValue={text(profile.daily_carbs_g_target)}
            error={errors.dailyCarbsGTarget}
            optional
          />
          <TextField
            label="Grasa (g)"
            name="dailyFatGTarget"
            inputMode="numeric"
            defaultValue={text(profile.daily_fat_g_target)}
            error={errors.dailyFatGTarget}
            optional
          />
          <TextField
            label={`Presupuesto mensual (${profile.currency})`}
            name="monthlyBudget"
            inputMode="decimal"
            defaultValue={text(profile.monthly_budget)}
            error={errors.monthlyBudget}
            hint="Mide el ritmo de gasto en 03 // FINANZAS. Vacío: sin presupuesto."
            className="col-span-2 @lg:col-span-4"
            optional
          />
        </>
      )}
    </FormShell>
  );
}

export function AiForm({ profile }: { profile: Profile }) {
  return (
    <FormShell action={saveAiSettings} submitLabel="Guardar ajustes de IA">
      {() => (
        <>
          <label className="flex min-h-11 items-center gap-3 text-body">
            <input
              type="checkbox"
              name="briefingEnabled"
              defaultChecked={profile.briefing_enabled}
              className="size-5"
            />
            Briefing cada mañana
          </label>
        </>
      )}
    </FormShell>
  );
}

const SHORTCUTS_EVENT = 'folio:shortcuts';

function subscribeShortcuts(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(SHORTCUTS_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(SHORTCUTS_EVENT, onChange);
  };
}

function readShortcuts(): boolean {
  try {
    return localStorage.getItem(SINGLE_KEY_SHORTCUTS_KEY) !== 'off';
  } catch {
    return true;
  }
}

/** Atajos de una tecla (1–8, /). Se pueden desactivar (WCAG 2.1.4). La preferencia vive en este navegador. */
export function ShortcutsToggle() {
  const enabled = useSyncExternalStore(subscribeShortcuts, readShortcuts, () => true);
  const labelId = useId();
  const hintId = useId();

  function toggle() {
    try {
      localStorage.setItem(SINGLE_KEY_SHORTCUTS_KEY, enabled ? 'off' : 'on');
    } catch {
      // Sin almacenamiento no se puede recordar la preferencia.
    }
    window.dispatchEvent(new Event(SHORTCUTS_EVENT));
  }

  // El interruptor se llama siempre igual (su etiqueta visible); si está activado lo dice aria-checked. El texto del
  // botón repite el estado para quien lo ve.
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span id={labelId} className="field-label font-mono text-label uppercase">
        Atajos de una tecla
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-labelledby={labelId}
        aria-describedby={hintId}
        onClick={toggle}
        className={buttonClass({ tone: enabled ? 'primary' : 'secondary' })}
      >
        <span aria-hidden="true">{enabled ? 'Activados' : 'Desactivados'}</span>
      </button>
      <p id={hintId} className="max-w-[55ch] text-small text-ash">
        <kbd className="font-mono">1</kbd>–<kbd className="font-mono">8</kbd> cambian de pestaña y{' '}
        <kbd className="font-mono">/</kbd> abre REGISTRAR en la barra de entrada. Desactívalos si usas control por voz o
        un lector de pantalla que los active sin querer.
      </p>
    </div>
  );
}

export function SignOutEverywhereForm() {
  return (
    <FormShell
      action={async () => signOutEverywhere()}
      submitLabel="Cerrar sesión en todos los dispositivos"
      pendingLabel="Cerrando…"
      submitTone="secondary"
      className="flex flex-col gap-3"
    >
      {() => null}
    </FormShell>
  );
}

export function DeleteAccountForm() {
  return (
    <FormShell
      action={deleteAccount}
      submitLabel="Borrar mi cuenta y mis datos"
      pendingLabel="Borrando…"
      submitTone="danger"
      className="flex flex-col gap-4"
    >
      {(errors) => (
        <>
          <p className="max-w-[65ch] text-small text-ash">
            Se borran para siempre tu cuenta y todo lo que has registrado en las ocho pestañas. Descarga antes tus datos
            si los quieres conservar.
          </p>
          <TextField
            label={`Escribe ${DELETE_CONFIRMATION} para confirmar`}
            name="confirmation"
            autoComplete="off"
            autoCapitalize="characters"
            error={errors.confirmation}
            className="max-w-xs"
            required
          />
        </>
      )}
    </FormShell>
  );
}
