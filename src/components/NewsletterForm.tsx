'use client';

import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setStatus('success');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-emerald-800/80 text-white font-medium py-3 px-6 rounded-lg text-sm max-w-md mx-auto">
        ✓ Thank you for subscribing! You will receive weekly updates.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-2 pt-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your work email"
        className="flex-1 px-4 py-2.5 rounded-lg text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        required
      />
      <button
        type="submit"
        className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm transition shadow"
      >
        Subscribe
      </button>
    </form>
  );
}
