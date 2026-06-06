'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, LayoutGrid, Compass, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SaveModal from '@/components/wardrobe/SaveModal';

const FEED_UNLOCK_THRESHOLD = 3;

export default function Navbar() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [itemCount, setItemCount] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showFeedTooltip, setShowFeedTooltip] = useState(false);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>();

  /* ── Fetch item count for a given uid ── */
  const fetchCount = async (uid: string) => {
    const { count } = await supabase
      .from('wardrobe_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid);
    setItemCount(count ?? 0);
  };

  /* ── Auth + count on mount and auth change ── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) fetchCount(uid);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) fetchCount(uid);
      else setItemCount(0);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Re-check count on navigation (catches saves from results page) ── */
  useEffect(() => {
    if (userId) fetchCount(userId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isClosetLocked = !userId;
  const isFeedLocked = !userId || itemCount < FEED_UNLOCK_THRESHOLD;

  /* ── Locked Closet tap ── */
  const handleClosetTap = (e: React.MouseEvent) => {
    if (!isClosetLocked) return;
    e.preventDefault();
    setShowSaveModal(true);
  };

  /* ── Locked Feed tap ── */
  const handleFeedTap = (e: React.MouseEvent) => {
    if (!isFeedLocked) return;
    e.preventDefault();
    clearTimeout(tooltipTimer.current);
    setShowFeedTooltip(true);
    tooltipTimer.current = setTimeout(() => setShowFeedTooltip(false), 2200);
  };

  const active = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const tabColor = (href: string, locked = false) => {
    if (locked) return 'var(--color-text-secondary)';
    return active(href) ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)';
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl pb-safe"
        style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-4">

          {/* ── Analyse ── always accessible ── */}
          <Link
            href="/"
            className="flex flex-col items-center gap-1 px-4 transition-colors"
            style={{ color: tabColor('/') }}
          >
            <Camera
              className="w-5 h-5 transition-transform"
              style={{ transform: active('/') ? 'scale(1.1)' : 'scale(1)' }}
            />
            <span className="text-[10px] font-medium tracking-wide font-jost">Analyse</span>
          </Link>

          {/* ── Closet ── locked if not signed in ── */}
          <Link
            href="/wardrobe"
            onClick={handleClosetTap}
            className="flex flex-col items-center gap-1 px-4 transition-colors"
            style={{ color: tabColor('/wardrobe', isClosetLocked) }}
          >
            {isClosetLocked ? (
              <Lock className="w-5 h-5" />
            ) : (
              <LayoutGrid
                className="w-5 h-5 transition-transform"
                style={{ transform: active('/wardrobe') ? 'scale(1.1)' : 'scale(1)' }}
              />
            )}
            <span className="text-[10px] font-medium tracking-wide font-jost">Closet</span>
          </Link>

          {/* ── Feed ── locked if not signed in OR < 3 saves ── */}
          <div className="relative flex flex-col items-center gap-1 px-4">
            {/* Tooltip */}
            {showFeedTooltip && (
              <div
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-[10px] font-jost text-[11px] text-foreground pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-150"
                style={{
                  background: 'var(--color-surface2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}
              >
                Save {FEED_UNLOCK_THRESHOLD} outfits to unlock
              </div>
            )}

            <Link
              href="/feed"
              onClick={handleFeedTap}
              className="flex flex-col items-center gap-1 transition-colors"
              style={{ color: tabColor('/feed', isFeedLocked) }}
            >
              {isFeedLocked ? (
                <Lock className="w-5 h-5" />
              ) : (
                <Compass
                  className="w-5 h-5 transition-transform"
                  style={{ transform: active('/feed') ? 'scale(1.1)' : 'scale(1)' }}
                />
              )}
              <span className="text-[10px] font-medium tracking-wide font-jost">Feed</span>
            </Link>
          </div>

        </div>
      </nav>

      <SaveModal open={showSaveModal} onClose={() => setShowSaveModal(false)} />
    </>
  );
}
