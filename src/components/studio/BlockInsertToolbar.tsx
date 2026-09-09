'use client';

import React from 'react';
import { HelpCircle, Scale, ShoppingBag, Code, Sparkles, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface BlockInsertToolbarProps {
  title: string;
  contentHtml: string;
  onInsertHtml: (htmlToAppend: string) => void;
}

/**
 * YAPAY ZEKA EYLEMLERI.
 *
 * Bu cubukta once alti dugme vardi. Dordu artik BLOK: ipucu kutusu,
 * kod blogu, urun karti ve artilar-eksiler ekleme menusunden
 * geliyor — ayni isi iki yerden yapmak, hangisinin dogru oldugunu
 * kullaniciya sordurmakti.
 *
 * Geriye YALNIZCA uretilen seyler kaldi: yazinin kendisinden SSS
 * cikaran, artilari-eksileri yazan ve cagri metni kuran uc eylem.
 * Bunlarin blok karsiligi yok; icerigi model yaziyor.
 */
export function BlockInsertToolbar({ title, contentHtml, onInsertHtml }: BlockInsertToolbarProps) {
  const [generating, setGenerating] = React.useState<string | null>(null);

  const handleAiAction = async (action: string) => {
    setGenerating(action);
    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, title, contentHtml }),
      });
      const data = await res.json();
      if (data.faqHtml) {
        onInsertHtml(data.faqHtml);
        toast.success('Smart FAQ block inserted into content');
      } else if (data.html) {
        onInsertHtml(data.html);
        toast.success('Rich block inserted into content');
      }
    } catch (err) {
      toast.error('AI generation failed');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="p-3 rounded-md border bg-muted/20 space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" />
          <span>AI copilot</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAiAction('generateFaq')}
          disabled={generating !== null}
          className="gap-1.5 text-xs rounded-md"
        >
          <HelpCircle className="size-3.5 text-amber-500" />
          <span>{generating === 'generateFaq' ? 'Generating...' : '+ Smart FAQ (Schema)'}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAiAction('generateProsCons')}
          disabled={generating !== null}
          className="gap-1.5 text-xs rounded-md"
        >
          <Scale className="size-3.5 text-emerald-500" />
          <span>{generating === 'generateProsCons' ? 'Building...' : '+ Pros & Cons Box'}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAiAction('generateCta')}
          disabled={generating !== null}
          className="gap-1.5 text-xs rounded-md"
        >
          <ShoppingBag className="size-3.5 text-primary" />
          <span>{generating === 'generateCta' ? 'Building...' : '+ Product CTA Box'}</span>
        </Button>

      </div>

    </div>
  );
}
