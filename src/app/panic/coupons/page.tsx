'use client';

import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';

export default function PanicCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('20');
  const [minOrder, setMinOrder] = useState('0');

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/coupons');
      const data = await res.json();
      if (data.coupons) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.error('Fetch coupons error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          type,
          value: parseFloat(value),
          minOrderAmount: parseFloat(minOrder) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCoupons([data.coupon, ...coupons]);
        setCode('');
        toast.success('Coupon created successfully');
      } else {
        toast.error(data.error || 'Failed to create coupon');
      }
    } catch (err) {
      toast.error('Error creating coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Coupons & Discounts</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Create promotional codes, seasonal discounts, and minimum order rules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create Coupon Card (4 cols) */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Ticket className="size-4 text-primary" />
                <span>Create New Coupon</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Coupon Code</Label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER2026"
                    className="text-xs font-mono uppercase"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Discount Type</Label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full h-8 rounded-lg border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_amount">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Discount Value</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Min. Cart Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <Button type="submit" className="w-full gap-1.5 font-medium">
                  <Plus className="size-3.5" />
                  <span>Create Coupon</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Coupons List Table (8 cols) */}
        <div className="lg:col-span-8">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min. Order</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                      Loading coupons...
                    </TableCell>
                  </TableRow>
                ) : coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                      No active discount coupons yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((cp) => (
                    <TableRow key={cp.id}>
                      <TableCell className="font-mono font-bold text-xs text-primary">
                        {cp.code}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {cp.type === 'percentage' ? `${cp.value}% OFF` : `$${parseFloat(cp.value).toFixed(2)} OFF`}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {parseFloat(cp.minOrderAmount) > 0 ? `$${parseFloat(cp.minOrderAmount).toFixed(2)}` : 'None'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {cp.timesUsed || 0} times
                      </TableCell>
                      <TableCell>
                        <Badge variant={cp.active ? 'default' : 'secondary'} className="text-[11px] font-normal">
                          {cp.active ? 'Active' : 'Expired'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
