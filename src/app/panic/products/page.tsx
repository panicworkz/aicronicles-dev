'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Package,
  Layers,
  FileDown,
  Briefcase,
  ExternalLink,
  Edit3,
  Trash2,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';

export default function PanicProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/products', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
      if (categoryFilter !== 'all') url.searchParams.set('categoryId', categoryFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/product-categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.categories) setCategories(d.categories);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter, categoryFilter]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Product deleted');
        setProducts(products.filter((p) => p.id !== id));
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const getProductTypeBadge = (type: string) => {
    switch (type) {
      case 'digital':
        return <Badge variant="secondary" className="gap-1 text-[10px]"><FileDown className="size-3 text-primary" /> Digital</Badge>;
      case 'service':
        return <Badge variant="secondary" className="gap-1 text-[10px]"><Briefcase className="size-3 text-emerald-500" /> Service</Badge>;
      case 'physical':
      default:
        return <Badge variant="secondary" className="gap-1 text-[10px]"><Package className="size-3 text-amber-500" /> Physical</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products & Store Catalog</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Physical goods, digital assets, variants, multi-currency & stock management</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/store" target="_blank">
            <Button variant="outline" className="gap-1.5">
              <ExternalLink className="size-3.5" />
              <span>Storefront View</span>
            </Button>
          </Link>

          <Link href="/panic/products/new">
            <Button className="gap-1.5 font-medium shadow-xs">
              <Plus className="size-3.5" />
              <span>New Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search products by title, slug, or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 rounded-lg border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary w-full md:w-48"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
            {[
              { id: 'all', label: 'All Products' },
              { id: 'published', label: 'Published' },
              { id: 'draft', label: 'Draft' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground animate-pulse font-medium">
              Loading products catalog...
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Package className="size-10 text-muted-foreground/50 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-foreground">No products found</p>
                <p className="text-xs text-muted-foreground">Get started by creating your first physical or digital product.</p>
              </div>
              <Link href="/panic/products/new">
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-3.5" />
                  <span>Create Product</span>
                </Button>
              </Link>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-14">Cover</th>
                  <th className="py-3 px-4">Title & Slug</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Inventory</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((prod) => (
                  <tr
                    key={prod.id}
                    className="hover:bg-muted/20 transition-colors group cursor-pointer"
                    onClick={() => window.location.href = `/panic/products/${prod.id}`}
                  >
                    <td className="py-3 px-4">
                      <div className="size-10 rounded-lg overflow-hidden border border-border bg-muted/40 shrink-0">
                        {prod.featuredImageUrl ? (
                          <img src={prod.featuredImageUrl} alt={prod.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-foreground">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-xs text-foreground group-hover:text-primary transition line-clamp-1">
                          {prod.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono block">
                          /store/{prod.slug}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getProductTypeBadge(prod.productType)}
                    </td>

                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {prod.sku || '-'}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {formatPrice(prod.price, 'USD')}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {prod.unlimitedStock ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          Unlimited
                        </Badge>
                      ) : prod.inventory > 10 ? (
                        <span className="text-foreground">{prod.inventory} in stock</span>
                      ) : prod.inventory > 0 ? (
                        <span className="text-amber-500 font-semibold">{prod.inventory} low stock</span>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">
                          Out of stock
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={prod.status === 'published' ? 'default' : 'secondary'}
                        className="capitalize text-[10px] font-normal"
                      >
                        {prod.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/store/${prod.slug}`} target="_blank">
                          <Button variant="ghost" size="icon-xs" title="View Storefront">
                            <ExternalLink className="size-3.5 text-muted-foreground" />
                          </Button>
                        </Link>
                        <Link href={`/panic/products/${prod.id}`}>
                          <Button variant="ghost" size="icon-xs" title="Edit Product">
                            <Edit3 className="size-3.5 text-muted-foreground" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => handleDelete(prod.id, e)}
                          title="Delete Product"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
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
