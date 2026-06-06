'use client';

import { useState } from 'react';
import { Heart, ShoppingBag, Lock, Globe, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WardrobeItem } from '@/types';

interface OutfitCardProps {
  item: WardrobeItem;
  isLiked?: boolean;
  onLike?: (id: string) => void;
  onBrandMatch?: (item: WardrobeItem) => void;
  showActions?: boolean;
}

export default function OutfitCard({
  item,
  isLiked = false,
  onLike,
  onBrandMatch,
  showActions = true,
}: OutfitCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const palette = item.ai_sections?.color_palette ?? [];
  const styles = item.ai_sections?.overall_style ?? item.style_tags ?? [];
  const fitNotes = item.ai_sections?.fit_notes;

  const handleLike = () => {
    setLiked((v) => !v);
    onLike?.(item.id);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-300 hover:shadow-xl hover:shadow-black/40">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950">
        <img
          src={item.image_url}
          alt="Outfit"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Visibility badge */}
        <div className="absolute top-3 left-3">
          {item.is_public ? (
            <Badge className="bg-emerald-600/80 text-white text-xs backdrop-blur-sm">
              <Globe className="w-3 h-3 mr-1" /> Public
            </Badge>
          ) : (
            <Badge className="bg-zinc-700/80 text-zinc-300 text-xs backdrop-blur-sm">
              <Lock className="w-3 h-3 mr-1" /> Private
            </Badge>
          )}
        </div>

        {/* Color palette dots */}
        {palette.length > 0 && (
          <div className="absolute top-3 right-3 flex gap-1">
            {palette.map((hex, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        )}

        {/* Actions overlay */}
        {showActions && (
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-y-2 group-hover:translate-y-0">
            <Button
              size="icon"
              variant="secondary"
              className="w-8 h-8 rounded-full bg-zinc-900/90 border border-zinc-700 hover:bg-zinc-800"
              onClick={handleLike}
            >
              <Heart className={`w-4 h-4 transition-colors ${liked ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'}`} />
            </Button>
            {onBrandMatch && (
              <Button
                size="icon"
                variant="secondary"
                className="w-8 h-8 rounded-full bg-zinc-900/90 border border-zinc-700 hover:bg-zinc-800"
                onClick={() => onBrandMatch(item)}
              >
                <ShoppingBag className="w-4 h-4 text-zinc-400" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2">
        {/* Style tags */}
        {styles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {styles.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs border-zinc-700 text-zinc-400 capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Fit notes */}
        {fitNotes && (
          <p className="text-xs text-zinc-500 leading-relaxed flex items-start gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
            {fitNotes}
          </p>
        )}

        {/* Category */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-600 capitalize">{item.category ?? 'outfit'}</span>
          <span className="text-xs text-zinc-700">
            {new Date(item.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
