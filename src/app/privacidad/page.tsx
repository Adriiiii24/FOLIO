import type { Metadata } from 'next';
import { ContactEmail, LegalList, LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Qué datos guarda FOLIO, para qué los usa y qué puedes hacer con ellos.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad" path="/privacidad">
      <p className="max-w-[65ch] text-body">
        FOLIO es un proyecto personal de Adrián Martínez Panés: una aplicación web para llevar en un solo sitio tu
        entreno, tu dinero, tu diario, lo que comes, lo que lees y ves, y tus hábitos. Aquí se explica qué datos guarda,
        para qué los usa y qué puedes hacer con ellos.
      </p>

      <LegalSection title="Responsable">
        <p>
          Adrián Martínez Panés. Para cualquier cuestión sobre tus datos, escribe a <ContactEmail />.
        </p>
      </LegalSection>

      <LegalSection title="Qué datos guarda">
        <LegalList>
          <li>
            <strong className="font-semibold">Tu cuenta.</strong> Tu dirección de correo. Si entras con Google, Google
            comparte además tu nombre y la dirección de tu foto de perfil. FOLIO usa el correo para identificar tu
            cuenta y el nombre como nombre visible, que puedes cambiar en Ajustes. No accede a nada más de tu cuenta de
            Google: ni a tu correo, ni a tus archivos, ni a tus contactos.
          </li>
          <li>
            <strong className="font-semibold">Lo que registras.</strong> Movimientos de dinero, entrenos, entradas del
            diario, comidas, fichas de libros, series o películas, hábitos, sesiones de foco y tus objetivos.
          </li>
          <li>
            <strong className="font-semibold">Archivos.</strong> Las fotos de tickets y platos y las notas de voz que
            envías. Las fotos pierden sus metadatos, como la ubicación, antes de salir de tu dispositivo.
          </li>
          <li>
            <strong className="font-semibold">Uso de la IA.</strong> Un registro técnico de cada uso (tipo de tarea,
            modelo, duración, tokens y resultado), sin el contenido, para aplicar el límite diario.
          </li>
          <li>
            <strong className="font-semibold">En tu navegador.</strong> Si los atajos de teclado están activos y las
            últimas cifras que viste, para enseñarte cuánto han cambiado. Esto no sale de tu dispositivo.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Para qué se usan">
        <p>
          Solo para prestarte el servicio que pides al crear la cuenta (artículo 6.1.b del Reglamento General de
          Protección de Datos): guardar tus registros, calcular tus cifras y, cuando usas la IA, preparar borradores y
          respuestas.
        </p>
        <p>
          Tus datos no se venden, no se ceden a anunciantes y no se usan para publicidad. Cada cuenta está aislada en la
          base de datos: nadie más ve lo que registras.
        </p>
      </LegalSection>

      <LegalSection title="Inteligencia artificial">
        <p>
          Cuando usas Foto, Voz o Preguntar, cuando se genera tu briefing diario y cuando guardas una entrada del diario
          (para poder buscarla por significado), el contenido necesario se envía a la API de Gemini de Google. La IA
          solo propone: nada se guarda sin que lo confirmes.
        </p>
        <p>
          FOLIO usa la cuota gratuita de esa API y se gestiona desde el Espacio Económico Europeo. Según las{' '}
          <a href="https://ai.google.dev/gemini-api/terms" rel="noreferrer">
            condiciones de la API de Gemini
          </a>
          , en ese caso Google aplica el mismo tratamiento que a sus servicios de pago y no usa el contenido para
          mejorar sus productos.
        </p>
      </LegalSection>

      <LegalSection title="Dónde se guardan y quién los trata">
        <LegalList>
          <li>
            <strong className="font-semibold">Supabase:</strong> base de datos, inicio de sesión y archivos, en
            servidores de la Unión Europea (Irlanda).
          </li>
          <li>
            <strong className="font-semibold">Vercel:</strong> aloja la aplicación, que se ejecuta en su región de
            Dublín. Vercel Speed Insights mide la velocidad de las páginas de forma anónima, sin asociarla a ninguna
            persona ni dirección IP.
          </li>
          <li>
            <strong className="font-semibold">Google:</strong> procesa el contenido que se envía a la IA, como se
            explica arriba, y el inicio de sesión si entras con Google.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          FOLIO solo usa las cookies necesarias para mantener tu sesión iniciada. No hay cookies de analítica ni de
          publicidad.
        </p>
      </LegalSection>

      <LegalSection title="Cuánto tiempo se conservan">
        <p>
          Mientras tengas la cuenta. Si la borras, se eliminan tus registros, tus archivos y tu cuenta en ese momento.
        </p>
      </LegalSection>

      <LegalSection title="Tus derechos">
        <p>
          Desde 08 // AJUSTES puedes descargar todos tus datos, en JSON o en CSV, y borrar tu cuenta. Para ejercer
          cualquier otro derecho (acceso, rectificación, supresión, oposición, limitación o portabilidad), escribe a{' '}
          <ContactEmail />.
        </p>
        <p>
          Si crees que no se ha atendido bien tu petición, puedes reclamar ante la{' '}
          <a href="https://www.aepd.es" rel="noreferrer">
            Agencia Española de Protección de Datos
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Datos de Google">
        <p>
          El uso que hace FOLIO de la información recibida de las API de Google se ajusta a la{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" rel="noreferrer">
            Política de datos de usuario de los servicios de API de Google
          </a>
          , incluidos los requisitos de uso limitado.
        </p>
      </LegalSection>

      <LegalSection title="Menores y cambios">
        <p>FOLIO no está dirigido a menores de 14 años.</p>
        <p>Si esta política cambia, se actualiza la fecha de arriba.</p>
      </LegalSection>
    </LegalPage>
  );
}
