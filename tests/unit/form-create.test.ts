import { describe, expect, it } from 'vitest';
import { NoteFormSchema } from '@/modules/brain/form';
import { WorkoutFormSchema } from '@/modules/gym/form';
import { MediaFormSchema } from '@/modules/media/form';
import { MealFormSchema } from '@/modules/nutrition/form';
import { HabitFormSchema } from '@/modules/routine/form';
import { TransactionFormSchema } from '@/modules/vault/form';

// Regresión: un alta no envía `id` (el campo oculto solo existe al editar) y un borrador compacto no pinta
// todos los campos opcionales. Antes, Zod recibía undefined y rechazaba TODAS las altas.
describe('altas sin id ni campos opcionales', () => {
  it('movimiento', () => {
    const result = TransactionFormSchema.safeParse({
      kind: 'expense',
      amount: '19,51',
      category: 'groceries',
      occurredAt: '2026-09-26T19:42',
    });
    expect(result.success && result.data).toMatchObject({ id: null, merchant: null, paymentMethod: null });
  });

  it('comida', () => {
    const result = MealFormSchema.safeParse({
      mealType: 'lunch',
      description: 'Pollo con arroz',
      caloriesKcal: '650',
      proteinG: '45',
      carbsG: '70',
      fatG: '18',
      eatenAt: '2026-09-28T14:00',
    });
    expect(result.success && result.data.id).toBeNull();
  });

  it('entrada del diario', () => {
    const result = NoteFormSchema.safeParse({ entryDate: '2026-09-28', content: 'Buen día.' });
    expect(result.success && result.data).toMatchObject({ id: null, title: null, mood: null, tags: [] });
  });

  it('ficha cultural compacta', () => {
    const result = MediaFormSchema.safeParse({ kind: 'book', title: 'Dune', status: 'done', rating: '9' });
    expect(result.success && result.data).toMatchObject({ id: null, creator: null, startedOn: null });
  });

  it('sesión y hábito', () => {
    expect(WorkoutFormSchema.safeParse({ title: 'Pierna', startedAt: '2026-09-28T09:00' }).success).toBe(true);
    expect(HabitFormSchema.safeParse({ name: 'Meditar', cadence: 'daily', targetPerPeriod: '1' }).success).toBe(true);
  });

  it('un id presente sigue validándose', () => {
    expect(NoteFormSchema.safeParse({ id: 'no-es-un-uuid', entryDate: '2026-09-28', content: 'x' }).success).toBe(
      false,
    );
  });
});
