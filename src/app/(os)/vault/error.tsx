'use client';

import { TabError } from '@/components/os/TabStates';

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <TabError error={error} retry={retry} label="03 // FINANZAS" />;
}
