import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactEmail, LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Condiciones del servicio',
  description: 'Las condiciones de uso de FOLIO, un proyecto personal y gratuito.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Condiciones del servicio" path="/terminos">
      <p className="max-w-[65ch] text-body">
        Estas condiciones regulan el uso de FOLIO. Al crear una cuenta, las aceptas.
      </p>

      <LegalSection title="El servicio">
        <p>
          FOLIO es un proyecto personal, gratuito y sin ánimo de lucro, creado como parte del portfolio de Adrián
          Martínez Panés. Se ofrece tal cual: puede tener errores, cambiar o dejar de estar disponible. Si se cierra, se
          avisará con antelación razonable para que puedas descargar tus datos.
        </p>
      </LegalSection>

      <LegalSection title="Tu cuenta">
        <p>
          Cada cuenta es personal. Eres responsable de lo que registras y de conservar el acceso a tu correo o a tu
          cuenta de Google, que es con lo que entras.
        </p>
      </LegalSection>

      <LegalSection title="Uso aceptable">
        <p>
          No uses FOLIO para guardar contenido ilegal, para intentar acceder a datos de otras cuentas ni para forzar el
          servicio o la IA más allá de su uso normal. Una cuenta que lo haga puede suspenderse.
        </p>
      </LegalSection>

      <LegalSection title="La inteligencia artificial">
        <p>
          Los borradores, las estimaciones de calorías y macros, la lectura de tickets y las respuestas del chat son
          orientativos y pueden equivocarse. Revisa cada borrador antes de guardarlo. FOLIO no da consejo médico,
          nutricional ni financiero.
        </p>
        <p>
          La IA usa una cuota gratuita limitada: cada cuenta tiene un tope diario de usos y puede no estar disponible en
          algunos momentos. Sin IA, todo se puede registrar a mano.
        </p>
      </LegalSection>

      <LegalSection title="Tus datos">
        <p>
          Lo que registras es tuyo. Puedes descargarlo y borrarlo cuando quieras desde 08 // AJUSTES. Cómo se tratan tus
          datos se explica en la <Link href="/privacidad">política de privacidad</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilidad">
        <p>
          En la medida en que lo permita la ley, FOLIO no responde de pérdidas causadas por errores del servicio ni de
          decisiones tomadas a partir de sus cifras o de la IA. Conviene que descargues tus datos de vez en cuando.
        </p>
      </LegalSection>

      <LegalSection title="Cambios, ley y contacto">
        <p>
          Estas condiciones pueden cambiar; la fecha de arriba indica la versión vigente. Se rigen por la ley española.
          Para cualquier duda, escribe a <ContactEmail />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
