'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, LogIn, AlertCircle } from 'lucide-react';

/**
 * Panic CMS girisi — duzeni hubz.panic.pw ile ayni.
 *
 * Onceki hali sayfayi bg-neutral-950 ile KOYU boyuyordu ama alanlar
 * tasarim sisteminin text-foreground'unu kullaniyor; o da acik temada
 * oklch(0.15 0.03 260), yani neredeyse siyah. Siyah zeminde siyah yazi:
 * kullanici yaziyor, hicbir sey gormuyor.
 *
 * Ustune e-posta alani "support@fabelo.io" ile DOLU geliyordu. Yazi
 * gorunmedigi icin uzerine yazilan her sey adresin sonuna ekleniyor ve
 * "support@fabelo.iodeneme" gibi bir sey olusuyordu — ekranda gorunen
 * hata "Invalid email or password." Iki kusur birbirini gizliyordu.
 *
 * hubz ayni token'lari kullaniyor, yalnizca acik zeminde. O yuzden
 * duzeni ona esitlemek hatayi da kapatiyor. Renkler token'dan okunuyor,
 * elle yazilmiyor: tema degisirse burasi da onunla degisir.
 *
 * hubz'da olup burada olmayan tek sey "Forgot password?" — bu CMS'te
 * parola sifirlama akisi yok, hicbir yere gitmeyen bir baglanti
 * koymaktansa yazmadim.
 */
export default function PanicLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');

      router.push('/panic');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // hubz olcusu: alanlar 44px, kose 10px, buton kosesi 8px, blok 336px.
  const alan =
    'h-11 w-full rounded-[10px] border border-input bg-transparent px-3 text-sm ' +
    'text-foreground placeholder:text-muted-foreground outline-none transition ' +
    'focus:border-ring focus:ring-1 focus:ring-ring';

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-[336px]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
            <LockKeyhole className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Panic CMS</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-[10px] border border-destructive/25 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              /* Adres yer tutucuda duruyor, alanin ICINDE degil. Dolu bir
                 alan uzerine yazilinca sessizce bozuluyordu. */
              placeholder="support@fabelo.io"
              autoComplete="username"
              className={alan}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={alan}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            <LogIn className="size-4" />
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
