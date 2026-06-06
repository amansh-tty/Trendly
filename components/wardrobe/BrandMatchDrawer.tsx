'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, ExternalLink, Sparkles } from 'lucide-react';
import type { WardrobeItem, BrandMatchResult } from '@/types';

interface BrandMatchDrawerProps {
  item: WardrobeItem | null;
  open: boolean;
  onClose: () => void;
}

type SectionKey = 'top' | 'bottom' | 'shoes';

export default function BrandMatchDrawer({ item, open, onClose }: BrandMatchDrawerProps) {
  const [results, setResults] = useState<BrandMatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sections = item?.ai_sections?.sections;

  const fetchMatches = async (sectionKey: SectionKey) => {
    if (!item || !sections) return;
    const section = sections[sectionKey];
    if (!section.detected) return;

    setActiveSection(sectionKey);
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch('/api/brand-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, section }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  const sectionLabels: Record<SectionKey, string> = { top: 'Top', bottom: 'Bottom', shoes: 'Shoes' };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[440px] bg-zinc-950 border-zinc-800 text-white p-0 overflow-y-auto">
        <SheetHeader className="p-6 pb-4 border-b border-zinc-800">
          <SheetTitle className="text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            Shop Similar Items
          </SheetTitle>
          {item?.ai_sections?.fit_notes && (
            <p className="text-sm text-zinc-400 mt-1 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
              {item.ai_sections.fit_notes}
            </p>
          )}
        </SheetHeader>

        <div className="p-6 flex flex-col gap-6">
          {/* Section selector */}
          {sections && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Select a piece to shop</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(sectionLabels) as SectionKey[]).map((key) => {
                  const sec = sections[key];
                  if (!sec.detected) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => fetchMatches(key)}
                      className={`relative flex flex-col gap-1.5 p-3 rounded-xl border transition-all ${
                        activeSection === key
                          ? 'border-indigo-500 bg-indigo-950/40'
                          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border border-white/10 mx-auto"
                        style={{ backgroundColor: sec.dominant_color_hex }}
                      />
                      <span className="text-xs text-zinc-300 text-center">{sectionLabels[key]}</span>
                      <span className="text-[10px] text-zinc-600 text-center truncate">{sec.color}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results */}
          {loading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900">
                  <Skeleton className="w-20 h-20 rounded-lg bg-zinc-800 flex-shrink-0" />
                  <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                    <Skeleton className="h-3 w-1/2 bg-zinc-800" />
                    <Skeleton className="h-3 w-1/3 bg-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                {results.length} match{results.length > 1 ? 'es' : ''} found
              </p>
              {results.map((r, i) => (
                <a
                  key={i}
                  href={r.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/80 transition-all group"
                >
                  {r.thumbnail && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                      <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 font-medium leading-snug line-clamp-2">{r.title}</p>
                    <p className="text-xs text-zinc-500">{r.source}</p>
                    <div className="flex items-center justify-between mt-auto">
                      {r.price && (
                        <Badge className="bg-emerald-900/60 text-emerald-400 border-emerald-800/50 text-xs">
                          {r.price}
                        </Badge>
                      )}
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors ml-auto" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {!loading && !error && results.length === 0 && !activeSection && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <ShoppingBag className="w-10 h-10 text-zinc-700" />
              <p className="text-sm text-zinc-500">Select a clothing piece above to find similar items to shop</p>
            </div>
          )}

          {!loading && !error && results.length === 0 && activeSection && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <p className="text-sm text-zinc-500">No results found for this item.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
