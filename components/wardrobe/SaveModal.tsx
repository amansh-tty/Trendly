'use client';

import { supabase } from '@/lib/supabase';

interface SaveModalProps {
  open: boolean;
  onClose: () => void;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function SaveModal({ open, onClose }: SaveModalProps) {
  if (!open) return null;

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — bottom sheet on mobile, centered card on desktop */}
      <div
        className="relative w-full sm:w-[420px] rounded-t-[20px] sm:rounded-[20px] p-6 flex flex-col gap-5 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
        style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors font-jost text-xs"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Heading */}
        <div className="flex flex-col gap-1 pr-8">
          <h2 className="font-fraunces text-[20px] leading-snug text-foreground">
            ✦ Save your style reads
          </h2>
          <p className="font-jost text-[13px] text-muted-foreground">
            Free forever. Your closet, your data.
          </p>
        </div>

        {/* Google CTA */}
        <button
          onClick={handleGoogle}
          className="w-full h-12 rounded-[14px] font-jost font-medium text-sm flex items-center justify-center gap-3 transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-accent-gold)', color: '#0a0a0a' }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Fine print */}
        <p
          className="font-jost text-[11px] text-center"
          style={{ color: 'var(--color-text-secondary)', opacity: 0.45 }}
        >
          We never post anything without your permission
        </p>
      </div>
    </div>
  );
}
