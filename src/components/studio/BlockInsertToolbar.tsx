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

  const insertCodeBlock = () => {
    const codeHtml = `
<pre class="my-6 p-4 rounded-md bg-neutral-900 text-neutral-100 font-mono text-xs overflow-x-auto border border-neutral-800">
<code>// Panic CMS Automation Script
async function executeWorkflow() {
  console.log("Publishing live to Fabelo...");
}</code>
</pre>`;
    onInsertHtml(codeHtml);
    toast.success('Code block inserted');
  };

  const insertCallout = () => {
    const calloutHtml = `
<div class="my-6 p-4 rounded-md border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
  <span class="text-amber-500 font-bold">💡 Pro Tip:</span>
  <p class="text-xs text-foreground m-0">Always verify your primary keyword and ensure your H2 headings directly answer user search intent.</p>
</div>`;
    onInsertHtml(calloutHtml);
    toast.success('Pro Tip Callout inserted');
  };

  return (
    <div className="p-3 rounded-md border bg-muted/20 space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" />
          <span>Rich Interactive Blocks & AI Copilot Insert</span>
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

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={insertCallout}
          className="gap-1.5 text-xs rounded-md"
        >
          <Lightbulb className="size-3.5 text-amber-500" />
          <span>+ Pro Tip Alert</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={insertCodeBlock}
          className="gap-1.5 text-xs rounded-md"
        >
          <Code className="size-3.5 text-cyan-500" />
          <span>+ Code Block</span>
        </Button>
      </div>
    </div>
  );
}
