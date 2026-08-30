'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  RotateCcw,
  Mail,
  MapPin,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';

export default function PanicOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
        setItems(data.items || []);
      } else {
        toast.error('Order not found');
      }
    } catch (err) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const updateStatus = async (field: 'paymentStatus' | 'orderStatus', value: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        toast.success(`Updated ${field === 'paymentStatus' ? 'Payment' : 'Order'} Status to ${value}`);
      } else {
        toast.error('Update failed');
      }
    } catch (err) {
      toast.error('Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs text-muted-foreground animate-pulse font-medium">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm font-semibold">Order not found</p>
        <Link href="/panic/orders">
          <Button variant="outline" size="sm">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const shipping = order.shippingAddressJson || {};

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/panic/orders">
            <Button variant="outline" size="icon-sm" type="button">
              <ArrowLeft className="size-3.5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
              <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'} className="text-[10px]">
                {order.paymentStatus}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {order.orderStatus}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Placed on {new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 font-medium">
            <Printer className="size-3.5" />
            <span>Print Invoice</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Order Line Items */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="size-4 text-primary" />
                <span>Order Items ({items.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4">Item & Description</th>
                    <th className="py-2.5 px-4">Price</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground text-xs">{item.title}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{formatPrice(item.unitPrice, order.currency)}</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        {formatPrice(item.totalPrice, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Order Totals Summary */}
              <div className="p-4 border-t border-border bg-muted/10 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatPrice(order.total, order.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Shipping & Taxes</span>
                  <span className="font-mono">$0.00</span>
                </div>
                <div className="flex items-center justify-between font-bold text-foreground text-sm pt-2 border-t border-border">
                  <span>Total Amount Paid</span>
                  <span className="font-mono text-base text-primary">{formatPrice(order.total, order.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Fulfillment Management */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Truck className="size-4 text-primary" />
                <span>Fulfillment & Dispatch Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={order.orderStatus === 'processing' ? 'secondary' : 'outline'}
                  size="sm"
                  disabled={updating}
                  onClick={() => updateStatus('orderStatus', 'processing')}
                >
                  Processing ⏳
                </Button>
                <Button
                  type="button"
                  variant={order.orderStatus === 'shipped' ? 'secondary' : 'outline'}
                  size="sm"
                  disabled={updating}
                  onClick={() => updateStatus('orderStatus', 'shipped')}
                >
                  Mark as Shipped 🚚
                </Button>
                <Button
                  type="button"
                  variant={order.orderStatus === 'delivered' ? 'secondary' : 'outline'}
                  size="sm"
                  disabled={updating}
                  onClick={() => updateStatus('orderStatus', 'delivered')}
                >
                  Mark as Delivered ✓
                </Button>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Payment Status:</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={order.paymentStatus === 'paid' ? 'default' : 'outline'}
                    size="xs"
                    disabled={updating}
                    onClick={() => updateStatus('paymentStatus', 'paid')}
                  >
                    Paid
                  </Button>
                  <Button
                    type="button"
                    variant={order.paymentStatus === 'pending' ? 'secondary' : 'outline'}
                    size="xs"
                    disabled={updating}
                    onClick={() => updateStatus('paymentStatus', 'pending')}
                  >
                    Pending
                  </Button>
                  <Button
                    type="button"
                    variant={order.paymentStatus === 'refunded' ? 'destructive' : 'outline'}
                    size="xs"
                    disabled={updating}
                    onClick={() => updateStatus('paymentStatus', 'refunded')}
                  >
                    Refunded
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Customer & Shipping Details */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="size-4 text-primary" />
                <span>Customer Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Full Name</span>
                <span className="font-semibold text-foreground text-sm">{order.customerName || 'Anonymous Customer'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Email Address</span>
                <a href={`mailto:${order.customerEmail}`} className="text-primary font-mono hover:underline flex items-center gap-1.5 mt-0.5">
                  <Mail className="size-3.5" />
                  <span>{order.customerEmail}</span>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span>Shipping Destination</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {shipping.street ? (
                <div className="space-y-1 text-foreground leading-relaxed">
                  <div className="font-semibold">{shipping.name || order.customerName}</div>
                  <div>{shipping.street}</div>
                  <div>{shipping.city}, {shipping.state || ''} {shipping.postalCode || ''}</div>
                  <div className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px] pt-1">{shipping.country || 'Global'}</div>
                </div>
              ) : (
                <div className="text-muted-foreground italic">
                  Digital fulfillment (No physical shipping required).
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
