'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, PackageCheck, Clock, CheckCircle2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function PanicOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error('Fetch orders error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders & Transactions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track customer purchases, fulfillment, and payment statuses</p>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Fulfillment</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  <ShoppingCart className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                  No orders recorded yet. As customers purchase products, transactions will appear here.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-xs text-foreground">{order.customerName || 'Customer'}</div>
                    <div className="text-[11px] text-muted-foreground">{order.customerEmail}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
                      className="capitalize text-[11px] font-normal"
                    >
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-[11px] font-normal">
                      {order.orderStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">
                    ${parseFloat(order.total).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
