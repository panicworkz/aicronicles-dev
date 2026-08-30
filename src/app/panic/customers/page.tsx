'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  ChevronRight,
  TrendingUp,
  Award,
  Repeat,
  DollarSign,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';

export default function PanicCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalCustomers: 0,
    avgLtv: 0,
    repeatRate: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/customers', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (segmentFilter !== 'all') url.searchParams.set('segment', segmentFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, segmentFilter]);

  const getSegmentBadge = (segment: string) => {
    switch (segment) {
      case 'VIP Whale':
        return <Badge variant="default" className="text-[10px] bg-amber-500 text-black font-semibold gap-1"><Award className="size-3" /> VIP Whale</Badge>;
      case 'Repeat Buyer':
        return <Badge variant="secondary" className="text-[10px] text-primary gap-1 font-medium"><Repeat className="size-3" /> Repeat</Badge>;
      case 'First-Time':
      default:
        return <Badge variant="outline" className="text-[10px] text-muted-foreground font-medium">First-Time</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers & LTV Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Customer profiles, lifetime revenue value (LTV), retention rate and order history</p>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Customer Accounts</span>
              <div className="text-xl font-bold font-mono text-foreground">{stats.totalCustomers} Accounts</div>
            </div>
            <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Average Customer LTV</span>
              <div className="text-xl font-bold font-mono text-foreground">{formatPrice(stats.avgLtv, 'USD')}</div>
            </div>
            <div className="size-9 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Repeat Purchase Rate</span>
              <div className="text-xl font-bold font-mono text-primary">{stats.repeatRate}%</div>
            </div>
            <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Repeat className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Gross Customer Spend</span>
              <div className="text-xl font-bold font-mono text-foreground">{formatPrice(stats.totalRevenue, 'USD')}</div>
            </div>
            <div className="size-9 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Award className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8.5 text-xs"
              />
            </div>

            {/* Segment Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'All Customers' },
                { id: 'vip', label: 'VIP Whale 💎' },
                { id: 'repeat', label: 'Repeat 🔁' },
                { id: 'first_time', label: 'First-Time 🛒' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSegmentFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer shrink-0 ${
                    segmentFilter === tab.id
                      ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground animate-pulse font-medium">
              Loading customer profiles...
            </div>
          ) : customers.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Users className="size-10 text-muted-foreground/50 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-foreground">No customers found</p>
                <p className="text-xs text-muted-foreground">Customer profiles are created automatically when orders are placed.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Segment</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Lifetime Value (LTV)</th>
                  <th className="py-3 px-4">Avg Order (AOV)</th>
                  <th className="py-3 px-4">Customer Since</th>
                  <th className="py-3 px-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-muted/20 transition-colors group cursor-pointer"
                    onClick={() => window.location.href = `/panic/customers/${c.id}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {c.name ? c.name[0]?.toUpperCase() : 'C'}
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-semibold text-xs text-foreground group-hover:text-primary transition block">
                            {c.name || 'Anonymous'}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono block">
                            {c.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getSegmentBadge(c.segment)}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground text-xs font-mono">
                      {c.phone || '—'}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-foreground">
                      {c.orderCount || 0} orders
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(c.totalSpent || 0, 'USD')}
                    </td>

                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {formatPrice(c.aov || 0, 'USD')}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/panic/customers/${c.id}`}>
                        <Button variant="ghost" size="icon-xs" title="View Customer 360 Profile">
                          <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition" />
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
  );
}
