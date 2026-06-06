'use client';

import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Check, ImagePlus } from 'lucide-react';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

export default function UploadModal({ open, onClose, onUploaded }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!blob) return;
    setError(null);

    try {
      setStatus('uploading');
      const reader = new FileReader();
      const base64 = await new Promise<string>((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });

      setStatus('analyzing');
      const response = await fetch('/api/analyze-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, notes, isPublic }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setStatus('done');
      setTimeout(() => {
        onUploaded();
        onClose();
        setStatus('idle');
        setBlob(null);
        setPreviewUrl(null);
        setNotes('');
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      setStatus('idle');
    }
  };

  const statusLabel = {
    idle: 'Analyze & Save',
    uploading: 'Uploading…',
    analyzing: 'AI analyzing outfit…',
    done: 'Saved!',
  }[status];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Add to Wardrobe
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {previewUrl ? (
            <div
              className="relative w-full aspect-3/4 rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => inputRef.current?.click()}
            >
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImagePlus className="w-8 h-8 text-white" />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 w-full aspect-3/4 rounded-xl border-2 border-dashed border-zinc-700 hover:border-indigo-500 hover:bg-zinc-900/50 transition-colors text-zinc-500 hover:text-indigo-400"
            >
              <ImagePlus className="w-10 h-10" />
              <span className="text-sm font-medium">Click to choose photo</span>
              <span className="text-xs">JPG, PNG, WEBP</span>
            </button>
          )}

          {previewUrl && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-zinc-400 text-sm">Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Where did you wear this? Any thoughts…"
                  className="bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600 resize-none"
                  rows={2}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`w-10 h-5 rounded-full transition-colors relative ${isPublic ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                  onClick={() => setIsPublic((v) => !v)}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-zinc-400">Make public in community feed</span>
              </label>

              {error && (
                <p className="text-sm text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={status !== 'idle'}
                className="bg-indigo-600 hover:bg-indigo-500 text-white h-11"
              >
                {status === 'done' ? (
                  <><Check className="w-4 h-4 mr-2" /> {statusLabel}</>
                ) : status !== 'idle' ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {statusLabel}</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> {statusLabel}</>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
