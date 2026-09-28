import type { Metadata } from 'next';
import {
  AiForm,
  DeleteAccountForm,
  ProfileForm,
  ShortcutsToggle,
  SignOutEverywhereForm,
  TargetsForm,
} from '@/components/modules/settings/SettingsForms';
import { Sheet } from '@/components/os/Sheet';
import { SheetHeader } from '@/components/os/SheetHeader';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { buttonClass } from '@/components/ui/Button';
import { DisplayNumeral } from '@/components/ui/DisplayNumeral';
import { SubmitButton } from '@/components/ui/FormControls';
import { signOut } from '@/modules/auth/actions';
import { EXPORT_LABEL, EXPORT_TABLES } from '@/modules/settings/export';
import { getSettingsSheet } from '@/modules/settings/sheet';

export const metadata: Metadata = { title: 'SETTINGS · Configuración' };

export default async function SettingsPage() {
  const settings = await getSettingsSheet();
  const { profile } = settings;
  const { aiQuota } = settings;
  const profileProps = {
    display_name: profile.display_name,
    timezone: profile.timezone,
    currency: profile.currency,
    daily_kcal_target: profile.daily_kcal_target,
    daily_protein_g_target: profile.daily_protein_g_target,
    daily_carbs_g_target: profile.daily_carbs_g_target,
    daily_fat_g_target: profile.daily_fat_g_target,
    monthly_budget: profile.monthly_budget === null ? null : Number(profile.monthly_budget),
    ai_monthly_budget_usd: Number(profile.ai_monthly_budget_usd),
    briefing_enabled: profile.briefing_enabled,
  };

  return (
    <Sheet>
      <SheetHeader tab="settings" meta={settings.email ?? 'Tu cuenta'} />
      <DisplayNumeral
        value={Math.min(aiQuota.used, aiQuota.limit)}
        display={`${Math.min(aiQuota.used, aiQuota.limit)}/${aiQuota.limit}`}
        srValue={`${Math.min(aiQuota.used, aiQuota.limit)} de ${aiQuota.limit}`}
        label="Usos de IA hoy"
        caption={`Usos de IA hoy · ${aiQuota.remaining === 1 ? 'queda 1' : `quedan ${aiQuota.remaining}`}`}
      />

      <BrutalistCard title="Perfil" className="col-span-full lg:col-span-6">
        <ProfileForm profile={profileProps} timeZones={settings.timeZones} />
      </BrutalistCard>

      <BrutalistCard title="Objetivos" eyebrow="Nutrición y dinero" className="col-span-full lg:col-span-6">
        <TargetsForm profile={profileProps} />
      </BrutalistCard>

      <BrutalistCard title="IA" eyebrow={`${aiQuota.limit} usos al día`} className="col-span-full lg:col-span-6">
        <p className="mb-5 max-w-[65ch] text-small text-ash">
          Leer tickets y platos por foto, dictar notas y preguntar a tu archivador. La IA es gratuita y compartida: cada
          cuenta tiene {aiQuota.limit} usos al día y, si se agotan, todo sigue funcionando a mano. El briefing de cada
          mañana no gasta tus usos.
        </p>
        <AiForm profile={profileProps} />
      </BrutalistCard>

      <BrutalistCard title="Accesibilidad" eyebrow="Atajos de teclado" className="col-span-full lg:col-span-6">
        <ShortcutsToggle />
      </BrutalistCard>

      <BrutalistCard title="Tus datos" eyebrow="Exportar" className="col-span-full lg:col-span-6">
        <p className="mb-4 max-w-[65ch] text-small text-ash">
          Todo lo que has registrado, en un solo archivo JSON o en una hoja CSV por área.
        </p>
        <a href="/api/export" download className={buttonClass({ tone: 'primary' })}>
          Descargar todo (JSON)
        </a>
        <ul className="mt-5 grid grid-cols-1 gap-x-4 @md:grid-cols-2">
          {EXPORT_TABLES.filter((table) => table !== 'daily_briefings' && table !== 'ai_runs').map((table) => (
            <li key={table} className="border-t-2 border-line">
              <a
                href={`/api/export?format=csv&tabla=${table}`}
                download
                className="flex min-h-11 items-center justify-between gap-3 text-body decoration-2 underline-offset-4 hover:underline"
              >
                {EXPORT_LABEL[table]}
                <span className="font-mono text-label text-ash uppercase">CSV</span>
              </a>
            </li>
          ))}
        </ul>
      </BrutalistCard>

      <BrutalistCard title="Sesión" eyebrow={settings.email ?? undefined} className="col-span-full lg:col-span-6">
        <div className="flex flex-col items-start gap-4">
          <form action={signOut}>
            <SubmitButton tone="secondary" pendingLabel="Cerrando…">
              Cerrar sesión en este dispositivo
            </SubmitButton>
          </form>
          <SignOutEverywhereForm />
        </div>
      </BrutalistCard>

      <section aria-labelledby="zona-peligrosa" className="col-span-full border-2 border-signal-down p-4 lg:p-5">
        <h2 id="zona-peligrosa" className="mb-4 text-title font-semibold">
          Borrar la cuenta
        </h2>
        <DeleteAccountForm />
      </section>
    </Sheet>
  );
}
