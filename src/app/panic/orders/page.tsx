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
  FileDown,
  Briefcase,
  Landmark,
  Banknote,
  CreditCard,
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
    awaitingTransferCount: 0,
    awaitingTransferTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  /* Odeme yontemi suzgeci. Gunluk is "hangi havaleleri bekliyorum"
     oldugu icin bu, durum suzgecinden daha cok kullanilacak. */
  const [methodFilter, setMethodFilter] = useState('all');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/orders', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (paymentFilter !== 'all') url.searchParams.set('paymentStatus', paymentFilter);
      if (statusFilter !== 'all') url.searchParams.set('orderStatus', statusFilter);
      if (typeFilter !== 'all') url.searchParams.set('productType', typeFilter);
      if (methodFilter !== 'all') url.searchParams.set('paymentMethod', methodFilter);

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
  }, [search, paymentFilter, statusFilter, typeFilter, methodFilter]);

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

  /* Odeme YONTEMI — durumdan ayri bir sey. "Pending" tek basina
     eksik bilgi: havale mi bekliyoruz yoksa parayi kurye mi alacak?
     Ilkinde yapacak bir isimiz var, ikincisinde yok. */
  const getMethodBadge = (method: string | null) => {
    switch (method) {
      case 'bank_transfer':
        return <Badge variant="outline" className="text-[10px] font-medium gap-1"><Landmark className="size-3" /> Transfer</Badge>;
      case 'cash_on_delivery':
        return <Badge variant="outline" className="text-[10px] font-medium gap-1"><Banknote className="size-3" /> On delivery</Badge>;
      case 'card':
        return <Badge variant="outline" className="text-[10px] font-medium gap-1"><CreditCard className="size-3" /> Card</Badge>;
      default:
        /* Bu satirdan onceki siparislerde yontem kayitli degil. */
        return <span className="text-[10px] text-muted-foreground">—</span>;
    }
  };

  /* Siparisin turleri. API bunu productTypes DIZISI olarak gonderiyor;
     ekran ise primaryType okuyordu — oyle bir alan yok, o yuzden her
     siparis 'physical'e dusuyordu. Dijital bir rehber listede
     "Physical" ve "Needs Shipping" gorunuyordu. Stat kartlarindaki
     hatanin aynisi: iki taraf ayni seye iki ad vermis.

     Dizi olmasi da dogru — bir siparis hem kupa hem rehber
     tasiyabiliyor; tek bir tur yazmak yalan olurdu. */
  const turleri = (order: any): string[] => {
    const t = Array.isArray(order?.productTypes) ? order.productTypes : [];
    return t.length ? t : ['physical'];
  };

  const getProductTypeBadge = (type: string) => {
    switch (type) {
      case 'digital':
        return <Badge variant="secondary" className="text-[10px] gap-1 font-medium"><FileDown className="size-3 text-primary" /> Digital</Badge>;
      case 'service':
        return <Badge variant="secondary" className="text-[10px] gap-1 font-medium"><Briefcase className="size-3 text-emerald-500" /> Service</Badge>;
      case 'physical':
      default:
        return <Badge variant="secondary" className="text-[10px] gap-1 font-medium"><Package className="size-3 text-amber-500" /> Physical</Badge>;
    }
  };

  const getDeliveryAccessBadge = (order: any) => {
    /* Karma sipariste kargolanacak bir sey varsa belirleyici odur:
       kutu yola cikmadan siparis tamamlanmis sayilmaz. */
    const turler = turleri(order);
    const type = turler.includes('physical')
      ? 'physical'
      : turler.includes('service')
        ? 'service'
        : 'digital';
    const payment = order.paymentStatus;
    const status = order.orderStatus;

    if (type === 'digital') {
      if (payment === 'paid') {
        return (
          <Badge variant="outline" className="text-[10px] text-primary border-primary/30 gap-1 font-mono">
            <FileDown className="size-3" />
            <span>⚡ Instant Access (File Ready)</span>
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border gap-1 font-mono">
          <span>🔒 Awaiting Payment (Locked)</span>
        </Badge>
      );
    }

    if (type === 'service') {
      if (status === 'completed' || status === 'delivered') {
        return (
          <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 font-mono">
            <span>✓ Session Completed</span>
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 font-mono">
          <Briefcase className="size-3" />
          <span>📅 Session Booked (Meet Ready)</span>
        </Badge>
      );
    }

    // Physical good
    if (status === 'delivered' || status === 'completed') {
      return (
        <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 font-mono">
          <CheckCircle2 className="size-3" />
          <span>✓ Delivered</span>
        </Badge>
      );
    }

    if (status === 'shipped') {
      return (
        <Badge variant="outline" className="text-[10px] text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1 font-mono">
          <Truck className="size-3" />
          <span>🚚 Shipped {order.carrier ? `(${order.carrier})` : ''}</span>
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 gap-1 font-mono">
        <Package className="size-3" />
        <span>⏳ Needs Shipping</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      {/* Dugme grubu SIKISMASIN: metin blogu min-w-0 ile kisalabiliyor,
          dugmeler shrink-0 ile sabit. Once ikisi de esnekti ve uzun bir
          aciklama dugmeleri birbirine gecirene kadar eziyordu. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Orders & Transactions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track physical shipments, digital downloads, consulting bookings, and invoices</p>
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

        {/* Bu kart ONCE "Pending Fulfillment" idi ve HEP BOS cikiyordu:
            API pendingFulfillment gonderiyor, ekran
            pendingFulfillmentCount okuyordu. Adlar esitlendi.

            Yerine gecen olcu daha ise yarar: bekleyen havaleler.
            Kapida odeme buraya girmiyor — orada parayi kurye aliyor,
            bizim takip edecegimiz bir sey yok. Tiklayinca liste o
            siparislere suzuluyor. */}
        <Card
          className={methodFilter === 'bank_transfer' && paymentFilter === 'pending' ? 'ring-1 ring-primary' : ''}
        >
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => {
                const acik = methodFilter === 'bank_transfer' && paymentFilter === 'pending';
                setMethodFilter(acik ? 'all' : 'bank_transfer');
                setPaymentFilter(acik ? 'all' : 'pending');
              }}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Awaiting Transfer</span>
                <div className="text-xl font-bold font-mono text-amber-500">
                  {stats.awaitingTransferCount ?? 0}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {formatPrice(stats.awaitingTransferTotal ?? 0, 'USD')}
                  </span>
                </div>
              </div>
              <div className="size-9 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Landmark className="size-5" />
              </div>
            </button>
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

            {/* Quick Status and Type Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8.5 rounded-md border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary w-full md:w-36"
              >
                <option value="all">Type: All</option>
                <option value="physical">📦 Physical</option>
                <option value="digital">⚡ Digital</option>
                <option value="service">💼 Service</option>
              </select>

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
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="h-8.5 rounded-md border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary w-full md:w-40"
              >
                <option value="all">How paid: All</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="cash_on_delivery">On delivery</option>
                <option value="card">Card</option>
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
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Delivery & Access Status</th>
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
                        <span className="font-semibold text-xs text-foreground group-hover:text-primary transition">
                          {order.customerName || 'Customer'}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono block">
                          {order.customerEmail}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {turleri(order).map((t: string) => (
                          <React.Fragment key={t}>{getProductTypeBadge(t)}</React.Fragment>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col items-start gap-1">
                        {getPaymentBadge(order.paymentStatus)}
                        {/* Durumun altinda YONTEM: "Pending" tek basina
                            eksik bilgi, havale mi bekliyoruz yoksa
                            parayi kurye mi alacak? */}
                        {getMethodBadge(order.paymentMethod)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getDeliveryAccessBadge(order)}
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
