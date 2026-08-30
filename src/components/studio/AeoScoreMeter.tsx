'use client';

import React from 'react';
import { Sparkles, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface AeoScoreMeterProps {
  title: string;
  contentHtml: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
}

export function AeoScoreMeter({
  title,
  contentHtml,
  excerpt,
  metaTitle,
  metaDescription,
}: AeoScoreMeterProps) {
  const plainText = (contentHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const hasH2 = /<h2/i.test(contentHtml);
  const hasH3 = /<h3/i.test(contentHtml);
  const hasFaq = /panic-faq-block|faq|frequently asked/i.test(contentHtml);
  const hasLists = /<ul|<ol/i.test(contentHtml);
  const hasNumbers = /\d+%|\$\d+|\d+ (steps|tips|ways|rules)/i.test(contentHtml);
  const metaDescLength = (metaDescription || excerpt || '').length;

  let score = 30; // base score
  if (title.length >= 10 && title.length <= 70) score += 15;
  if (wordCount >= 300) score += 15;
  if (hasH2 && hasH3) score += 15;
  if (hasFaq) score += 15;
  if (hasLists) score += 5;
  if (hasNumbers) score += 5;
  if (metaDescLength >= 80 && metaDescLength <= 160) score += 10;
  if (score > 100) score = 100;

  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 50) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    return 'text-red-500 bg-red-500/10 border-red-500/30';
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span>AI Search & AEO Citation Readiness</span>
        </CardTitle>
        <div className={`px-2.5 py-1 rounded-full border text-xs font-bold font-mono ${getScoreColor()}`}>
          {score}/100
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Semantic H2 & H3 Hierarchy</span>
            {hasH2 && hasH3 ? (
              <span className="text-emerald-500 flex items-center gap-1 font-medium"><CheckCircle className="size-3.5" /> Optimal</span>
            ) : (
              <span className="text-amber-500 flex items-center gap-1"><AlertCircle className="size-3.5" /> Needs H2/H3</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">FAQ Structured Entity</span>
            {hasFaq ? (
              <span className="text-emerald-500 flex items-center gap-1 font-medium"><CheckCircle className="size-3.5" /> Detected</span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-1"><HelpCircle className="size-3.5" /> Recommended</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Word Count & Depth</span>
            <span className={wordCount >= 300 ? 'text-emerald-500 font-medium' : 'text-amber-500'}>
              {wordCount} words ({wordCount >= 300 ? 'Deep content' : 'Short'})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Data Points & Quantifiable Stats</span>
            {hasNumbers ? (
              <span className="text-emerald-500 flex items-center gap-1 font-medium"><CheckCircle className="size-3.5" /> Yes</span>
            ) : (
              <span className="text-muted-foreground">None detected</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Meta Description (Snippet)</span>
            <span className={metaDescLength >= 80 && metaDescLength <= 160 ? 'text-emerald-500 font-medium' : 'text-amber-500'}>
              {metaDescLength}/160 chars
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
