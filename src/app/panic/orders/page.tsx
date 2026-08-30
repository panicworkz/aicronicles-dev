'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Package,
  Clock,
  CheckCircle2,
  DollarSign,
  Search,
  ChevronRight,
  TrendingUp,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';

export default function PanicOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalRevenue: 0,
    totalOrders: 0,
    paidCount: 0,
    pendingFulfillmentCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/orders', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (paymentFilter !== 'all') url.searchParams.set('paymentStatus', paymentFilter);
      if (statusFilter !== 'all') url.searchParams.set('orderStatus', statusFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, paymentFilter, statusFilter]);

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="text-[10px] bg-emerald-600 dark:bg-emerald-500 font-medium">✓ Paid</Badge>;
      case 'refunded':
        return <Badge variant="destructive" className="text-[10px] font-medium"><RotateCcw className="size-3 mr-1" /> Refunded</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary" className="text-[10px] text-amber-600 dark:text-amber-400 font-medium"><Clock className="size-3 mr-1" /> Pending</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">✓ Delivered</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="text-[10px] text-blue-600 dark:text-blue-400 border-blue-500/30"><Truck className="size-3 mr-1" /> Shipped</Badge>;
      case 'processing':
      default:
        return <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">Processing</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders & Transactions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track customer purchases, fulfillment, shipping addresses and transaction receipts</p>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Sales Revenue</span>
              <div className="text-xl font-bold font-mono text-foreground">{formatPrice(stats.totalRevenue, 'USD')}</div>
            </div>
            <div className="size-9 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Paid Transactions</span>
              <div className="text-xl font-bold font-mono text-foreground">{stats.paidCount} Orders</div>
            </div>
            <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pending Fulfillment</span>
              <div className="text-xl font-bold font-mono text-amber-500">{stats.pendingFulfillmentCount} Items</div>
            </div>
            <div className="size-9 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Package className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Orders</span>
              <div className="text-xl font-bold font-mono text-foreground">{stats.totalOrders} Orders</div>
            </div>
            <div className="size-9 rounded-md bg-muted text-muted-foreground flex items-center justify-center">
              <ShoppingCart className="size-5" />
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
                placeholder="Search orders by ORD-#, customer name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8.5 text-xs"
              />
            </div>

            {/* Quick Status Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="h-8.5 rounded-md border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary w-full md:w-36"
              >
                <option value="all">Payment: All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8.5 rounded-md border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary w-full md:w-36"
              >
                <option value="all">Status: All</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground animate-pulse font-medium">
              Loading orders & transactions...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ShoppingCart className="size-10 text-muted-foreground/50 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-foreground">No orders found</p>
                <p className="text-xs text-muted-foreground">Transactions will appear here when customers purchase from the store.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/20 transition-colors group cursor-pointer"
                    onClick={() => window.location.href = `/panic/orders/${order.id}`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {order.orderNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-xs text-foreground group-hover:text-primary transition line-clamp-1">
                          {order.customerName || 'Customer'}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono block">
                          {order.customerEmail}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getPaymentBadge(order.paymentStatus)}
                    </td>

                    <td className="py-3 px-4">
                      {getOrderStatusBadge(order.orderStatus)}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {formatPrice(order.total, order.currency || 'USD')}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/panic/orders/${order.id}`}>
                        <Button variant="ghost" size="icon-xs" title="View Order Details & Fulfillment">
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
