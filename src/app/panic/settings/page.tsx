'use client';

import React, { useState } from 'react';
import { ShoppingCart, Globe, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { SITE_DOMAIN } from '@/lib/seo';

export default function PanicSettingsPage() {
  const [ecommerceEnabled, setEcommerceEnabled] = useState(false);
  const [siteName, setSiteName] = useState('Fabelo');
  const [domain, setDomain] = useState(SITE_DOMAIN);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    toast.success('Project settings saved successfully');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project & Engine Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Configure site branding, AEO parameters, and modular features</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="size-4 text-primary" />
              <span>Site Identity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  className="font-mono text-xs text-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="size-4 text-primary" />
              <span>Modular E-Commerce Engine</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
              <div>
                <p className="text-xs font-semibold text-foreground">Enable Product Checkout & Digital Commerce</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Stripe payment intents, cart drawer, and order processing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEcommerceEnabled(!ecommerceEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  ecommerceEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div
                  className={`size-5 rounded-full bg-background shadow-xs transition-transform ${
                    ecommerceEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <Check className="size-3.5" />
              Settings saved!
            </span>
          )}
          <Button type="submit" className="gap-1.5 font-medium">
            <Save className="size-3.5" />
            <span>Save Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
