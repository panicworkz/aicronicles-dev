'use client';

import React, { useState } from 'react';
import { Sparkles, Globe, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ProductSeoAeoSuiteProps {
  title: string;
  slug: string;
  price: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  onMetaTitleChange: (v: string) => void;
  onMetaDescriptionChange: (v: string) => void;
}

export function ProductSeoAeoSuite({
  title,
  slug,
  price,
  description,
  metaTitle,
  metaDescription,
  onMetaTitleChange,
  onMetaDescriptionChange,
}: ProductSeoAeoSuiteProps) {
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'serp' | 'aeo_schema'>('serp');

  const displayTitle = metaTitle || title || 'Product Title | Official Store';
  const displayDesc = metaDescription || description || 'Buy official products, instant digital downloads, and consulting services with secure checkout.';

  const handleGenerateAiMeta = async () => {
    if (!title) {
      toast.error('Please enter a product title first');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateProductSeo',
          title,
          description,
        }),
      });

      const data = await res.json();
      if (data.success && data.metaTitle && data.metaDescription) {
        onMetaTitleChange(data.metaTitle);
        onMetaDescriptionChange(data.metaDescription);
        toast.success(`Generated complete, grammatical SEO copy (${data.metaTitle.length} & ${data.metaDescription.length} chars)`);
      } else {
        toast.error('Failed to generate SEO copy');
      }
    } catch (err) {
      toast.error('AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const schemaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title || 'Product Name',
    description: displayDesc,
    sku: slug || 'PROD-SKU',
    offers: {
      '@type': 'Offer',
      price: price || '0.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `https://fabelo.testworkz.com/store/${slug}`,
    },
  };

  const titleLength = (metaTitle || '').length;
  const descLength = (metaDescription || '').length;

  const isTitleOptimal = titleLength >= 30 && titleLength <= 60;
  const isDescOptimal = descLength >= 100 && descLength <= 155;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="size-4 text-primary" />
            <span>Product SEO, AEO & Structured Schema</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Google SERP ranking & ChatGPT/Perplexity product entity indexing</p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerateAiMeta}
          disabled={generating}
          className="gap-1.5 text-xs text-primary font-medium"
        >
          <Sparkles className="size-3.5" />
          <span>{generating ? 'Crafting copy...' : 'AI Auto-Fill SEO'}</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Meta Title (Search Heading)</Label>
            <span
              className={`text-[11px] font-mono font-medium ${
                titleLength === 0
                  ? 'text-muted-foreground'
                  : isTitleOptimal
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-500'
              }`}
            >
              {titleLength}/60 chars {isTitleOptimal ? '✓ Optimal' : titleLength > 60 ? '⚠️ Too long' : ''}
            </span>
          </div>
          <Input
            value={metaTitle}
            onChange={(e) => onMetaTitleChange(e.target.value)}
            placeholder={title ? `${title} | Official Fabelo` : 'Meta Title (max 60 chars)...'}
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Meta Description (Snippet & LLM Summary)</Label>
            <span
              className={`text-[11px] font-mono font-medium ${
                descLength === 0
                  ? 'text-muted-foreground'
                  : isDescOptimal
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-500'
              }`}
            >
              {descLength}/155 chars {isDescOptimal ? '✓ Optimal' : descLength > 155 ? '⚠️ Too long' : ''}
            </span>
          </div>
          <Textarea
            rows={2}
            value={metaDescription}
            onChange={(e) => onMetaDescriptionChange(e.target.value)}
            placeholder="Compelling 130-155 character complete sentence for Google & AI search engine snippets..."
            className="text-xs resize-none leading-relaxed"
          />
        </div>

        {/* Simulator Tabs */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
              <Button
                type="button"
                variant={activeTab === 'serp' ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={() => setActiveTab('serp')}
                className="w-24 text-[10px]"
              >
                Google Search
              </Button>
              <Button
                type="button"
                variant={activeTab === 'aeo_schema' ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={() => setActiveTab('aeo_schema')}
                className="w-28 text-[10px]"
              >
                AEO JSON-LD Schema
              </Button>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle className="size-3" />
              <span>AEO Ready</span>
            </span>
          </div>

          {activeTab === 'serp' ? (
            <div className="p-3.5 rounded-xl border bg-background space-y-1 font-sans">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">F</div>
                <span className="truncate">fabelo.testworkz.com › store › {slug || 'product'}</span>
              </div>
              <h4 className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer line-clamp-1">
                {displayTitle}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {displayDesc}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-neutral-900 text-neutral-100 font-mono text-[11px] overflow-x-auto border border-neutral-800">
              <pre>{JSON.stringify(schemaJsonLd, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
