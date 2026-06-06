'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/wardrobe/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, LogOut, Save, Loader2, Check, Globe, Lock } from 'lucide-react';
import type { Profile } from '@/types';

const STYLE_TAGS = ['casual', 'formal', 'streetwear', 'minimalist', 'Y2K', 'bohemian', 'preppy', 'athleisure', 'vintage', 'techwear'];
const SKIN_TONES = ['warm', 'cool', 'neutral', 'deep'] as const;

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? '');

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data as Profile);
      setLoading(false);
    };
    load();
  }, []);

  const toggleStyleTag = (tag: string) => {
    setProfile((p) => {
      const current = p.style_tags ?? [];
      return {
        ...p,
        style_tags: current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
      };
    });
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);

    await supabase.from('profiles').upsert({ id: user.id, ...profile });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-white tracking-tight">Profile</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-zinc-500 hover:text-rose-400"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-8 flex flex-col gap-8">
        {/* Avatar + username */}
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-zinc-700">
            <AvatarFallback className="bg-indigo-900 text-indigo-200 text-xl">
              {profile.username?.[0]?.toUpperCase() ?? email[0]?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1 flex-1">
            <p className="text-xs text-zinc-500">{email}</p>
            <div className="flex items-center gap-2">
              <Input
                value={profile.username ?? ''}
                onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                placeholder="username"
                className="bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600 h-8 text-sm"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-zinc-800" />

        {/* Visibility */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-zinc-300">Profile visibility</h3>
          <div className="flex gap-3">
            {[
              { value: true, label: 'Public', icon: Globe, desc: 'Others can see your public outfits' },
              { value: false, label: 'Private', icon: Lock, desc: 'Only you can see your wardrobe' },
            ].map(({ value, label, icon: Icon, desc }) => (
              <button
                key={label}
                onClick={() => setProfile((p) => ({ ...p, is_public: value }))}
                className={`flex-1 flex flex-col gap-1.5 p-3 rounded-xl border transition-all text-left ${
                  profile.is_public === value
                    ? 'border-indigo-500 bg-indigo-950/40'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${profile.is_public === value ? 'text-indigo-400' : 'text-zinc-500'}`} />
                <span className="text-sm font-medium text-zinc-200">{label}</span>
                <span className="text-xs text-zinc-600">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-zinc-800" />

        {/* Body profile */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-medium text-zinc-300">Body profile</h3>

          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-400 text-xs">Skin tone</Label>
            <div className="flex gap-2">
              {SKIN_TONES.map((tone) => (
                <button
                  key={tone}
                  onClick={() => setProfile((p) => ({ ...p, skin_tone: tone }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs capitalize transition-colors ${
                    profile.skin_tone === tone
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-zinc-400 text-xs">Body type</Label>
              <Input
                value={profile.body_type ?? ''}
                onChange={(e) => setProfile((p) => ({ ...p, body_type: e.target.value }))}
                placeholder="e.g. athletic, pear…"
                className="bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600 h-8 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-zinc-400 text-xs">Height range</Label>
              <Input
                value={profile.height_range ?? ''}
                onChange={(e) => setProfile((p) => ({ ...p, height_range: e.target.value }))}
                placeholder="e.g. 5ft6–5ft10"
                className="bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600 h-8 text-sm"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-zinc-800" />

        {/* Style tags */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-zinc-300">Style preferences</h3>
          <div className="flex flex-wrap gap-2">
            {STYLE_TAGS.map((tag) => {
              const selected = profile.style_tags?.includes(tag);
              return (
                <Badge
                  key={tag}
                  onClick={() => toggleStyleTag(tag)}
                  className={`cursor-pointer capitalize transition-colors ${
                    selected
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500 border-transparent'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'
                  }`}
                  variant="outline"
                >
                  {tag}
                </Badge>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 text-white h-11"
        >
          {saved ? (
            <><Check className="w-4 h-4 mr-2" /> Saved</>
          ) : saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save profile</>
          )}
        </Button>
      </main>

      <Navbar />
    </div>
  );
}
