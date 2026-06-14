import { supabase } from './supabase';
import type { AiSections } from '@/types';

export interface StyleRevealData {
  dominant_styles: string[];
  dominant_colors: string[];
  style_signals: string[];
}

export interface StyleProfileResult {
  newCount: number;
  profile: StyleRevealData;
}

// Merges two arrays and sorts by frequency — most-seen items float to the front
function mergeByFrequency(existing: string[], incoming: string[]): string[] {
  const combined = [...existing, ...incoming];
  const freq = new Map<string, number>();
  for (const item of combined) {
    freq.set(item, (freq.get(item) ?? 0) + 1);
  }
  return Array.from(new Set(combined)).sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0));
}

/**
 * Accumulates style signals into style_profile after each analysis.
 * Returns newCount + merged profile so callers can trigger milestone moments
 * without a second DB read.
 */
export async function upsertStyleProfile(uid: string, aiSections: AiSections): Promise<StyleProfileResult> {
  const { data: existing } = await supabase
    .from('style_profile')
    .select('dominant_styles, dominant_colors, style_signals, improvement_areas, occasion_preferences, analyses_count')
    .eq('user_id', uid)
    .maybeSingle();

  const newCount = (existing?.analyses_count ?? 0) + 1;

  const merged = {
    user_id: uid,
    dominant_styles: mergeByFrequency(existing?.dominant_styles ?? [], aiSections.overall_style),
    dominant_colors: mergeByFrequency(existing?.dominant_colors ?? [], aiSections.color_palette),
    style_signals: mergeByFrequency(existing?.style_signals ?? [], aiSections.style_signals ?? []),
    improvement_areas: mergeByFrequency(
      existing?.improvement_areas ?? [],
      aiSections.improvement_category ? [aiSections.improvement_category] : [],
    ),
    occasion_preferences: mergeByFrequency(existing?.occasion_preferences ?? [], aiSections.occasion_fit),
    analyses_count: newCount,
    last_updated: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('style_profile')
    .upsert(merged, { onConflict: 'user_id' });

  if (error) {
    console.error('[upsertStyleProfile] upsert failed:', error);
    throw error;
  }

  // Mirror count to profiles so guided first-experience check has a fast read
  const { error: profileCountError } = await supabase
    .from('profiles')
    .update({ analyses_count: newCount })
    .eq('id', uid);
  if (profileCountError) console.error('[upsertStyleProfile] profile count update failed:', profileCountError);

  return {
    newCount,
    profile: {
      dominant_styles: merged.dominant_styles,
      dominant_colors: merged.dominant_colors,
      style_signals: merged.style_signals,
    },
  };
}
