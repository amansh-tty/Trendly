'use client';

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import type { WardrobeItem, AiSection, AiAccessories } from '@/types';

function ScoreBadge({ score }: { score: number }) {
  const cfg =
    score >= 8
      ? { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#34d399' }
      : score >= 5
      ? { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24' }
      : { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', color: '#7a7570' };
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full font-jost text-xs font-medium shrink-0"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      {score}/10
    </span>
  );
}

function SectionCard({ label, section }: { label: string; section: AiSection | AiAccessories }) {
  if (!section.detected) return null;
  const isAcc = 'items' in section;
  const acc = isAcc ? (section as AiAccessories) : null;
  const sec = !isAcc ? (section as AiSection) : null;

  return (
    <div
      className="rounded-[14px] p-3.5 flex flex-col gap-2"
      style={{ background: 'var(--color-surface2)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-jost font-medium">
          {label}
        </span>
        {sec?.dominant_color_hex && (
          <span className="flex items-center gap-1.5 shrink-0">
            <span
              className="w-3 h-3 rounded-full border border-border"
              style={{ backgroundColor: sec.dominant_color_hex }}
            />
            <span className="text-[11px] text-muted-foreground font-jost">{sec.color}</span>
          </span>
        )}
      </div>
      <p className="font-jost text-[13px] text-foreground/80 leading-relaxed">
        {sec ? sec.description : acc!.items.join(', ')}
      </p>
      {acc?.impact && (
        <p className="font-jost text-[11px] text-muted-foreground italic leading-snug">{acc.impact}</p>
      )}
      {section.style_tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {section.style_tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full font-jost text-[10px] font-medium"
              style={{
                background: 'var(--color-accent-glow)',
                border: '1px solid rgba(200,176,138,0.2)',
                color: 'var(--color-accent-gold)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  item: WardrobeItem | null;
  onClose: () => void;
}

export default function ClosetItemSheet({ item, onClose }: Props) {
  const ai = item?.ai_sections;

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-[20px] max-h-[92dvh] overflow-y-auto p-0 gap-0 border-t-0"
        style={{ background: 'var(--color-surface)' }}
      >
        {/* Accessibility title (visually hidden) */}
        <SheetTitle className="sr-only">
          {ai?.overall_style?.join(' · ') ?? 'Style read'}
        </SheetTitle>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {!ai ? (
          <div className="flex flex-col items-center gap-5 py-12 px-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item?.image_url}
              alt="Outfit"
              className="w-full max-w-[280px] rounded-[14px] object-cover"
            />
            <p className="font-jost text-sm text-muted-foreground">No analysis available.</p>
          </div>
        ) : (
          <div className="px-5 pb-10 flex flex-col gap-5">
            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item!.image_url}
              alt="Outfit"
              className="w-full max-h-[320px] object-cover rounded-[14px]"
            />

            {/* Verdict + score row */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className="font-jost text-[10px] uppercase tracking-[0.15em] font-medium mb-1"
                  style={{ color: 'var(--color-accent-gold)' }}
                >
                  Overall Style
                </p>
                <h2 className="font-fraunces text-[26px] leading-tight text-foreground">
                  {ai.overall_style
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(' · ')}
                </h2>
              </div>
              <ScoreBadge score={ai.style_confidence_score} />
            </div>

            {/* Fit notes */}
            <div className="pl-4 py-0.5" style={{ borderLeft: '2px solid var(--color-accent-gold)' }}>
              <p className="font-jost text-[14px] text-foreground/80 leading-[1.7]">
                {ai.fit_notes}
              </p>
            </div>

            {/* Section breakdown */}
            <div className="flex flex-col gap-2.5">
              <p className="font-jost text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                Breakdown
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <SectionCard label="Top" section={ai.sections.top} />
                <SectionCard label="Bottom" section={ai.sections.bottom} />
                <SectionCard label="Shoes" section={ai.sections.shoes} />
                <SectionCard label="Accessories" section={ai.sections.accessories} />
              </div>
            </div>

            {/* The one thing */}
            {ai.one_improvement && (
              <div
                className="rounded-[14px] p-5 flex flex-col gap-2.5"
                style={{
                  background: 'rgba(200,176,138,0.08)',
                  border: '1px solid rgba(200,176,138,0.25)',
                }}
              >
                <p
                  className="font-fraunces text-[15px] italic leading-snug"
                  style={{ color: 'var(--color-accent-gold)' }}
                >
                  What would make this 10× better
                </p>
                <p className="font-jost text-[13px] text-foreground/80 leading-relaxed">
                  {ai.one_improvement}
                </p>
                {ai.occasion_fit?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <span className="font-jost text-[10px] uppercase tracking-widest text-muted-foreground">
                      Works for:
                    </span>
                    {ai.occasion_fit.map((occ) => (
                      <span
                        key={occ}
                        className="px-2.5 py-0.5 rounded-full font-jost text-[11px] text-muted-foreground"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {occ}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
