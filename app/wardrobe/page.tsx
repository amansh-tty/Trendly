'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ClosetItemSheet from '@/components/wardrobe/ClosetItemSheet';
import Navbar from '@/components/wardrobe/Navbar';
import { Skeleton } from '@/components/ui/skeleton';
import type { WardrobeItem } from '@/types';

function ScoreBadge({ score }: { score: number }) {
  const cfg =
    score >= 8
      ? { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', color: '#34d399' }
      : score >= 5
      ? { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', color: '#fbbf24' }
      : { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)', color: '#7a7570' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full font-jost text-[10px] font-semibold"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      {score}/10
    </span>
  );
}

function ClosetCard({ item, onClick }: { item: WardrobeItem; onClick: () => void }) {
  const score = item.ai_sections?.style_confidence_score;
  const styles = item.ai_sections?.overall_style ?? [];

  return (
    <button
      onClick={onClick}
      className="relative aspect-square rounded-[14px] overflow-hidden group focus:outline-none"
      style={{ border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image_url}
        alt="Outfit"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Score badge — top right */}
      {score != null && (
        <div className="absolute top-2 right-2">
          <ScoreBadge score={score} />
        </div>
      )}

      {/* Gradient overlay + style verdict */}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/20 to-transparent pb-3 px-3 pt-8">
        {styles.length > 0 && (
          <p className="font-fraunces text-[12px] text-white leading-tight line-clamp-1">
            {styles.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' · ')}
          </p>
        )}
      </div>
    </button>
  );
}

export default function ClosetPage() {
  const router = useRouter();
  // undefined = auth loading, null = logged out, string = logged in
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (userId === undefined) return;
    if (!userId) { setLoading(false); return; }

    supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems((data as WardrobeItem[]) ?? []);
        setLoading(false);
      });
  }, [userId]);

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="flex flex-col gap-2 max-w-65">
        <h2 className="font-fraunces text-[28px] leading-tight text-foreground">
          Your closet lives here
        </h2>
        <p className="font-jost text-[15px] text-muted-foreground">
          Analyse your first outfit to start
        </p>
      </div>
      <button
        onClick={() => router.push('/')}
        className="h-12 px-8 rounded-[14px] font-jost font-medium text-sm transition-opacity hover:opacity-90"
        style={{ background: 'var(--color-accent-gold)', color: '#0a0a0a' }}
      >
        Analyse an outfit
      </button>
    </div>
  );

  /* ── Logged-out gate ── */
  if (!loading && userId === null) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16">
        <header className="px-6 pt-7">
          <span
            className="font-fraunces italic text-sm tracking-tight"
            style={{ color: 'var(--color-text)' }}
          >
            Trendly
          </span>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center">
          <EmptyState />
        </main>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-xl border-b border-border"
        style={{ background: 'rgba(10,10,10,0.9)' }}
      >
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-3">
          <span className="font-fraunces text-base text-foreground">My Closet</span>
          {!loading && items.length > 0 && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full font-jost text-[11px] text-muted-foreground"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {items.length}
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-5 pt-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-[14px] bg-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <ClosetCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </main>

      <ClosetItemSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
      <Navbar />
    </div>
  );
}
