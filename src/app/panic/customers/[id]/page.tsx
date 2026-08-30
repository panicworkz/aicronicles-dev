'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  Award,
  TrendingUp,
  ShoppingBag,
  ChevronRight,
  Save,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';

export default function PanicCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers/${customerId}`);
      const data = await res.json();
      if (data.customer) {
        setCustomer(data.customer);
        setName(data.customer.name || '');
        setPhone(data.customer.phone || '');
        setOrders(data.orders || []);
      } else {
        toast.error('Customer not found');
      }
    } catch (err) {
      toast.error('Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomer(data.customer);
        toast.success('Customer details updated');
      } else {
        toast.error('Save failed');
      }
    } catch (err) {
      toast.error('Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs text-muted-foreground animate-pulse font-medium">Loading customer profile...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm font-semibold">Customer profile not found</p>
        <Link href="/panic/customers">
          <Button variant="outline" size="sm">Back to Customers</Button>
        </Link>
      </div>
    );
  }

  const spent = parseFloat(String(customer.totalSpent || '0'));
  const count = customer.orderCount || orders.length || 0;
  const aov = count > 0 ? spent / count : 0;
  const address = customer.shippingAddressJson || {};

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/panic/customers">
            <Button variant="outline" size="icon-sm" type="button">
              <ArrowLeft className="size-3.5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {customer.name ? customer.name[0]?.toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{customer.name || 'Anonymous Customer'}</h1>
                {spent >= 300 && (
                  <Badge variant="default" className="text-[10px] bg-amber-500 text-black font-semibold gap-1">
                    <Award className="size-3" /> VIP Whale
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{customer.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Lifetime Value (LTV)</span>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatPrice(spent, 'USD')}</div>
            </div>
            <div className="size-9 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Orders Placed</span>
              <div className="text-2xl font-bold font-mono text-foreground">{count} Orders</div>
            </div>
            <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingBag className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Average Order Value (AOV)</span>
              <div className="text-2xl font-bold font-mono text-foreground">{formatPrice(aov, 'USD')}</div>
            </div>
            <div className="size-9 rounded-md bg-muted text-muted-foreground flex items-center justify-center">
              <Award className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Order History */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingBag className="size-4 text-primary" />
                <span>Customer Order History ({orders.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No orders recorded for this customer.
                </div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4">Order #</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Payment</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Amount</th>
                      <th className="py-2.5 px-4 text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          {o.orderNumber}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                          {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={o.paymentStatus === 'paid' ? 'default' : 'secondary'} className="text-[10px]">
                            {o.paymentStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {o.orderStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          {formatPrice(o.total, o.currency || 'USD')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/panic/orders/${o.id}`}>
                            <Button variant="ghost" size="icon-xs" title="Open Order Details">
                              <ChevronRight className="size-4 text-muted-foreground hover:text-primary transition" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Customer Details & Address */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <span>Edit Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Customer Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone Number</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="text-xs font-mono"
                  />
                </div>

                <Button type="submit" size="sm" disabled={saving} className="w-full gap-1.5">
                  <Save className="size-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span>Saved Shipping Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              {address.street ? (
                <div className="space-y-1 text-foreground leading-relaxed">
                  <div className="font-semibold">{address.name || customer.name}</div>
                  <div>{address.street}</div>
                  <div>{address.city}, {address.state || ''} {address.postalCode || ''}</div>
                  <div className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px] pt-1">{address.country || 'Global'}</div>
                </div>
              ) : (
                <div className="italic">No physical address on file.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
