import React from 'react';
import { db, schema } from '@/db';
import { desc } from 'drizzle-orm';
import { Card, CardContent } from '@/components/ui/card';
import { FolderTree, Tag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PanicCategoriesPage() {
  const categoryList = await db.query.categories.findMany({
    orderBy: [desc(schema.categories.createdAt)],
  });

  const tagList = await db.query.tags.findMany({
    orderBy: [desc(schema.tags.createdAt)],
  });

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories & Taxonomies</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Organize editorial guides and articles</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryList.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <FolderTree className="size-3.5" />
                    <span>{cat.name}</span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{cat.description || 'Editorial category.'}</p>
                <div className="text-[11px] text-muted-foreground font-mono pt-2">/{cat.slug}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Tags & Topics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Keywords and topic groupings</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tagList.map((tag) => (
            <Card key={tag.id}>
              <CardContent className="p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Tag className="size-3 text-muted-foreground" />
                    <span>{tag.name}</span>
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">#{tag.slug}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
