import React from 'react';
import { db, schema } from '@/db';
import { desc } from 'drizzle-orm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function PanicCategoriesPage() {
  const tagList = await db.query.tags.findMany({
    orderBy: [desc(schema.tags.createdAt)],
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Categories & Topics</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Organize editorial guides into taxonomies</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {tagList.map((tag) => (
          <Card key={tag.id}>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {tag.name}
                </span>
                <span className="size-2.5 rounded-full" style={{ backgroundColor: tag.color || '#6366f1' }} />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{tag.description || 'No description provided.'}</p>
              <div className="text-[11px] text-muted-foreground font-mono pt-2">/{tag.slug}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
