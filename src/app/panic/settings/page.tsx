'use client';

import React, { useState } from 'react';
import { ShoppingCart, Globe, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PanicSettingsPage() {
  const [ecommerceEnabled, setEcommerceEnabled] = useState(false);
  const [siteName, setSiteName] = useState('Fabelo');
  const [domain, setDomain] = useState('fabelo.testworkz.com');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Project & Engine Settings</h1>
        <p className="text-xs text-neutral-400 font-mono mt-1">Configure site branding, AEO parameters, and modular features</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6 space-y-4 backdrop-blur shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-500" />
            <span>Site Identity</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="siteName">Project Name</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="domain">Primary Domain</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="font-mono text-xs text-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6 space-y-4 backdrop-blur shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-amber-500" />
            <span>Modular E-Commerce Engine</span>
          </h2>

          <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-800 bg-neutral-950/60">
            <div>
              <p className="text-xs font-semibold text-white">Enable Product Checkout & Digital Commerce</p>
              <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                Stripe payment intents, cart drawer, and order processing
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEcommerceEnabled(!ecommerceEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                ecommerceEnabled ? 'bg-amber-500' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  ecommerceEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Settings saved!
            </span>
          )}
          <Button type="submit" className="bg-white text-black hover:bg-neutral-200">
            <Save className="w-4 h-4 mr-1.5" />
            <span>Save Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
