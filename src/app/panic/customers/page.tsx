'use client';

import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, ShoppingBag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function PanicCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        if (data.customers) {
          setCustomers(data.customers);
        }
      } catch (err) {
        console.error('Fetch customers error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers & Accounts</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage customer profiles, purchase history, and lifetime value</p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total Spent (LTV)</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                  Loading customer accounts...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                  <Users className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                  No customer profiles registered yet.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-semibold text-xs text-foreground">{c.name || 'Anonymous'}</div>
                    <div className="text-[11px] text-muted-foreground">{c.email}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.phone || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-foreground font-medium">
                    {c.orderCount || 0} orders
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-primary">
                    ${parseFloat(c.totalSpent || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
