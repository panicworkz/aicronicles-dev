import React from 'react';
import { db, schema } from '@/db';
import { desc } from 'drizzle-orm';
import { Tags } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PanicCategoriesPage() {
  const tagList = await db.query.tags.findMany({
    orderBy: [desc(schema.tags.createdAt)],
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Categories & Topics</h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">Organize editorial guides into taxonomies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {tagList.map((tag) => (
          <div
            key={tag.id}
            className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 space-y-2 backdrop-blur shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 font-mono">
                {tag.name}
              </span>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color || '#2563eb' }} />
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">{tag.description || 'No description provided.'}</p>
            <div className="text-[11px] text-neutral-500 font-mono pt-2">/{tag.slug}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
