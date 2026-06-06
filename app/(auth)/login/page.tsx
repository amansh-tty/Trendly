'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shirt, Loader2, Sparkles, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/wardrobe` },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setStep('sent');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-zinc-950 to-zinc-950 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <Shirt className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">Wardrobe</h1>
            <p className="text-sm text-zinc-500 mt-1">Your AI-powered style vault</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { label: 'AI Analysis', desc: 'GPT-4o vision' },
            { label: 'Face Blur', desc: 'Auto privacy' },
            { label: 'Shop Match', desc: 'Find similar' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <Sparkles className="w-4 h-4 text-indigo-400 mb-0.5" />
              <span className="text-xs font-medium text-zinc-300">{label}</span>
              <span className="text-[10px] text-zinc-600">{desc}</span>
            </div>
          ))}
        </div>

        {/* Auth card */}
        <div className="w-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
          {step === 'email' ? (
            <form onSubmit={handleSendMagicLink} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold text-white">Sign in</h2>
                <p className="text-sm text-zinc-500">We&apos;ll send you a magic link — no password needed.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-zinc-400 text-sm">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-zinc-950 border-zinc-700 text-zinc-200 placeholder-zinc-600"
                />
              </div>

              {error && (
                <p className="text-sm text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white h-10 w-full"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                ) : (
                  <><Mail className="w-4 h-4 mr-2" /> Send magic link</>
                )}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center">
                <Mail className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-white font-medium">Check your inbox</p>
                <p className="text-sm text-zinc-500 mt-1">
                  We sent a magic link to <span className="text-zinc-300">{email}</span>
                </p>
              </div>
              <button
                onClick={() => setStep('email')}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
