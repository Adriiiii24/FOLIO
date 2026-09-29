import 'server-only';
import { addDays, localDayRangeUtc } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';
import { getProfile, getToday } from '@/modules/settings/queries';
import { DISH_SELECT, dishMatch } from './items';

export async function getNutritionSheet() {
  const [{ today, timeZone }, profile] = await Promise.all([getToday(), getProfile()]);
  const from = addDays(today, -6);
  const range = localDayRangeUtc(from, today, timeZone);
  const supabase = await createClient();

  const [daily, meals, dishes] = await Promise.all([
    supabase.rpc('nutrition_daily', { p_from: from, p_to: today }),
    supabase
      .from('macros')
      .select('id, eaten_at, meal_type, description, calories_kcal, protein_g, carbs_g, fat_g, source, items')
      .gte('eaten_at', range.fromIso)
      .lt('eaten_at', range.toIso)
      .order('eaten_at', { ascending: false })
      .limit(200),
    supabase.from('dishes').select(DISH_SELECT).order('name').limit(200),
  ]);
  if (daily.error) throw new Error(daily.error.message);
  if (meals.error) throw new Error(meals.error.message);
  if (dishes.error) throw new Error(dishes.error.message);

  const byDay = new Map(daily.data.map((row) => [row.day, row]));
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i)).map((day) => {
    const row = byDay.get(day);
    return {
      day,
      kcal: Number(row?.calories_kcal ?? 0),
      protein: Number(row?.protein_g ?? 0),
      carbs: Number(row?.carbs_g ?? 0),
      fat: Number(row?.fat_g ?? 0),
      meals: Number(row?.meals ?? 0),
    };
  });
  const todayTotals = days[days.length - 1] ?? { day: today, kcal: 0, protein: 0, carbs: 0, fat: 0, meals: 0 };

  return {
    today,
    timeZone,
    days,
    todayTotals,
    meals: meals.data,
    dishes: dishes.data.map((row) => ({ ...dishMatch(row), servings: row.servings })),
    targets: {
      kcal: profile.daily_kcal_target,
      protein: profile.daily_protein_g_target,
      carbs: profile.daily_carbs_g_target,
      fat: profile.daily_fat_g_target,
    },
  };
}

export async function getNutritionOverview() {
  const sheet = await getNutritionSheet();
  return { eaten: sheet.todayTotals.kcal, target: sheet.targets.kcal, meals: sheet.todayTotals.meals };
}
