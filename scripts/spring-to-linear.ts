// scripts/spring-to-linear.ts · npx tsx scripts/spring-to-linear.ts
type Spring = { stiffness: number; damping: number; mass?: number };

export function springToLinear({ stiffness, damping, mass = 1 }: Spring, durationS: number, steps = 20): string {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta >= 1) throw new Error('Solo muelles subamortiguados (ζ < 1)');
  const wd = w0 * Math.sqrt(1 - zeta ** 2);
  const x = (t: number) => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));

  const stops = Array.from({ length: steps + 1 }, (_, i) => {
    const value = i === steps ? 1 : x((i / steps) * durationS);
    return `${Number(value.toFixed(3))} ${Math.round((i / steps) * 100)}%`;
  });
  return `linear(${stops.join(', ')})`;
}

console.log(springToLinear({ stiffness: 300, damping: 30 }, 0.4));
