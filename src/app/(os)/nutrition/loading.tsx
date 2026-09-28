import { Sheet } from '@/components/os/Sheet';
import { SheetSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <Sheet>
      <SheetSkeleton label="05 // NUTRICIÓN" />
    </Sheet>
  );
}
