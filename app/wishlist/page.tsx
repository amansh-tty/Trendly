'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/wardrobe/Navbar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Heart, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WishlistItem } from '@/types';

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems((data as WishlistItem[]) ?? []);
        setLoading(false);
      });
  }, [userId]);

  const handleRemove = async (id: string) => {
    await supabase.from('wishlist').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-400" />
          <span className="font-semibold text-white tracking-tight">Wishlist</span>
          {!loading && (
            <Badge className="bg-zinc-800 text-zinc-400 text-xs ml-1">{items.length}</Badge>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900">
                <Skeleton className="w-20 h-20 rounded-lg bg-zinc-800 flex-shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                  <Skeleton className="h-3 w-1/2 bg-zinc-800" />
                  <Skeleton className="h-3 w-1/4 bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Heart className="w-9 h-9 text-zinc-700" />
            </div>
            <div>
              <p className="text-zinc-300 font-medium">No saved items yet</p>
              <p className="text-zinc-600 text-sm mt-1">
                Use the shop icon on wardrobe items to find and save similar products
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900 group"
              >
                {item.product_image && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                    <img src={item.product_image} alt={item.product_title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 font-medium leading-snug line-clamp-2">{item.product_title}</p>
                  <p className="text-xs text-zinc-500">{item.brand}</p>
                  <div className="flex items-center justify-between mt-auto">
                    {item.price && (
                      <Badge className="bg-emerald-900/60 text-emerald-400 border-emerald-800/50 text-xs">
                        {item.price}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemove(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <a
                        href={item.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-600 hover:text-indigo-400 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Navbar />
    </div>
  );
}
