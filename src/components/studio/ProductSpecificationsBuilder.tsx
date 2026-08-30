'use client';

import React from 'react';
import { Plus, Trash2, Sliders } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SpecificationItem {
  key: string;
  value: string;
}

interface ProductSpecificationsBuilderProps {
  specifications: SpecificationItem[];
  onChange: (specs: SpecificationItem[]) => void;
}

export function ProductSpecificationsBuilder({
  specifications = [],
  onChange,
}: ProductSpecificationsBuilderProps) {
  const addSpec = () => {
    onChange([...specifications, { key: '', value: '' }]);
  };

  const updateSpec = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...specifications];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const removeSpec = (index: number) => {
    onChange(specifications.filter((_, i) => i !== index));
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sliders className="size-4 text-primary" />
            <span>Product Specifications & Highlights</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Key-value deliverables, technical specs & dimensions</p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSpec}
          className="gap-1.5 text-xs font-medium"
        >
          <Plus className="size-3.5" />
          <span>Add Spec</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {specifications.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
            No specifications added. Click &quot;Add Spec&quot; to define materials, warranty, dimensions, or deliverables.
          </div>
        ) : (
          <div className="space-y-2">
            {specifications.map((spec, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={spec.key}
                  onChange={(e) => updateSpec(idx, 'key', e.target.value)}
                  placeholder="e.g. Material / Warranty / File Format"
                  className="text-xs flex-1 font-medium"
                />
                <Input
                  value={spec.value}
                  onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                  placeholder="e.g. 100% Genuine Leather / 2 Years / PDF + ePub"
                  className="text-xs flex-1 font-normal text-muted-foreground"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeSpec(idx)}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
