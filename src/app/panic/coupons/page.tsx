'use client';

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Trash2,
  Copy,
  Check,
  TrendingUp,
  Percent,
  DollarSign,
  Power,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';

export default function PanicCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalCoupons: 0,
    activeCount: 0,
    totalUses: 0,
    maxDiscount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('20');
  const [minOrder, setMinOrder] = useState('0');
  const [usageLimit, setUsageLimit] = useState('');

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coupons');
      const data = await res.json();
      if (data.coupons) {
        setCoupons(data.coupons);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          type,
          value: parseFloat(value) || 0,
          minOrderAmount: parseFloat(minOrder) || 0,
          usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
          active: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Coupon ${data.coupon.code} created!`);
        setCode('');
        setUsageLimit('');
        fetchCoupons();
      } else {
        toast.error(data.error || 'Failed to create coupon');
      }
    } catch (err) {
      toast.error('Error creating coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCouponStatus = async (coupon: any) => {
    try {
      const res = await fetch('/api/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: coupon.id,
          active: !coupon.active,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Coupon ${coupon.code} is now ${!coupon.active ? 'Active' : 'Inactive'}`);
        fetchCoupons();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteCoupon = async (id: number, couponCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon ${couponCode}?`)) return;

    try {
      const res = await fetch(`/api/coupons?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Coupon ${couponCode} deleted`);
        fetchCoupons();
      } else {
        toast.error('Delete failed');
      }
    } catch (err) {
      toast.error('Error deleting coupon');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast.success(`Copied "${text}" to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Coupons & Promotions</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage promotional discount codes, minimum order thresholds, and redemption rules</p>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Active Campaigns</span>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{stats.activeCount} Active</div>
            </div>
            <div className="size-9 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Ticket className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Redemptions</span>
              <div className="text-xl font-bold font-mono text-primary">{stats.totalUses} Uses</div>
            </div>
            <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Max Promo Discount</span>
              <div className="text-xl font-bold font-mono text-foreground">{stats.maxDiscount}% OFF</div>
            </div>
            <div className="size-9 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Percent className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Promo Codes</span>
              <div className="text-xl font-bold font-mono text-foreground">{stats.totalCoupons} Codes</div>
            </div>
            <div className="size-9 rounded-md bg-muted text-muted-foreground flex items-center justify-center">
              <Ticket className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create Coupon Card (4 cols) */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Plus className="size-4 text-primary" />
                <span>Create New Promo Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Coupon Code</Label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FABELO20"
                    className="text-xs font-mono uppercase font-bold tracking-wider"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type</Label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full h-8.5 rounded-md border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed ($)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Discount Value</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Min. Cart ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={minOrder}
                      onChange={(e) => setMinOrder(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Usage Limit</Label>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={submitting} className="w-full gap-1.5 font-medium">
                  <Plus className="size-3.5" />
                  <span>{submitting ? 'Creating...' : 'Create Promo Code'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Coupons List Table (8 cols) */}
        <div className="lg:col-span-8">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="py-16 text-center text-xs text-muted-foreground animate-pulse font-medium">
                  Loading promotional codes...
                </div>
              ) : coupons.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Ticket className="size-10 text-muted-foreground/50 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">No promo codes yet</p>
                    <p className="text-xs text-muted-foreground">Create discount codes to boost customer conversion.</p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Coupon Code</th>
                      <th className="py-3 px-4">Discount</th>
                      <th className="py-3 px-4">Min. Cart</th>
                      <th className="py-3 px-4">Redemptions</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {coupons.map((cp) => (
                      <tr key={cp.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                              {cp.code}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => copyToClipboard(cp.code)}
                              title="Copy code"
                            >
                              {copiedCode === cp.code ? (
                                <Check className="size-3 text-emerald-500" />
                              ) : (
                                <Copy className="size-3 text-muted-foreground hover:text-foreground" />
                              )}
                            </Button>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-foreground font-mono">
                          {cp.type === 'percentage'
                            ? `${parseFloat(cp.value)}% OFF`
                            : `$${parseFloat(cp.value).toFixed(2)} OFF`}
                        </td>

                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {parseFloat(cp.minOrderAmount || '0') > 0
                            ? `$${parseFloat(cp.minOrderAmount).toFixed(2)}`
                            : 'No Min'}
                        </td>

                        <td className="py-3 px-4 font-mono">
                          <span className="text-foreground font-semibold">{cp.timesUsed || 0}</span>
                          {cp.usageLimit && <span className="text-muted-foreground"> / {cp.usageLimit}</span>}
                        </td>

                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => toggleCouponStatus(cp)}
                            className="cursor-pointer"
                            title="Click to toggle status"
                          >
                            <Badge
                              variant={cp.active ? 'default' : 'secondary'}
                              className={`text-[10px] font-medium transition ${
                                cp.active ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500' : ''
                              }`}
                            >
                              {cp.active ? '✓ Active' : 'Inactive'}
                            </Badge>
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDeleteCoupon(cp.id, cp.code)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete Coupon"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
