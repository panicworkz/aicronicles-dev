'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Package,
  Edit3,
  Trash2,
  Tag,
  DollarSign,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';

export default function PanicProductsListPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/products?limit=100`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
        toast.success('Product deleted');
      }
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products & Inventory</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage digital products, physical merchandise, variants, and stock</p>
        </div>
        <Link href="/panic/products/new">
          <Button size="default" className="gap-2">
            <Plus className="size-4" />
            <span>New Product</span>
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title, SKU, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs"
          />
        </form>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['all', 'published', 'draft'].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? 'default' : 'outline'}
              size="default"
              onClick={() => setStatusFilter(st)}
              className="capitalize"
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Table Card */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Product & SKU</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                  Loading product catalog...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                  <Package className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                  No products found. Click &quot;New Product&quot; to create your first item.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((prod) => (
                <TableRow key={prod.id}>
                  <TableCell>
                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden border border-border flex items-center justify-center">
                      {prod.featuredImageUrl ? (
                        <img
                          src={prod.featuredImageUrl}
                          alt={prod.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="size-5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/panic/products/${prod.id}`}
                      className="font-medium text-foreground hover:text-primary transition line-clamp-1 text-xs"
                    >
                      {prod.title}
                    </Link>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {prod.sku ? `SKU: ${prod.sku}` : `/${prod.slug}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-[11px] font-normal">
                      {prod.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">
                    ${parseFloat(prod.price).toFixed(2)}
                    {prod.compareAtPrice && (
                      <span className="text-[10px] text-muted-foreground line-through ml-1.5">
                        ${parseFloat(prod.compareAtPrice).toFixed(2)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {prod.unlimitedStock ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Unlimited</span>
                    ) : prod.inventory > 10 ? (
                      <span className="text-xs text-foreground">{prod.inventory} in stock</span>
                    ) : prod.inventory > 0 ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{prod.inventory} low stock</span>
                    ) : (
                      <span className="text-xs text-destructive font-medium">Out of stock</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={prod.status === 'published' ? 'default' : 'secondary'}
                      className="capitalize text-xs font-normal"
                    >
                      {prod.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Link href={`/panic/products/${prod.id}`}>
                      <Button variant="ghost" size="icon" className="text-primary hover:text-primary" title="Edit Product">
                        <Edit3 className="size-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(prod.id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete Product"
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
