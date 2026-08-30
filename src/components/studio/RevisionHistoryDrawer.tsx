'use client';

import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Clock, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface RevisionHistoryDrawerProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (revision: any) => void;
}

export function RevisionHistoryDrawer({
  postId,
  isOpen,
  onClose,
  onRestore,
}: RevisionHistoryDrawerProps) {
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const fetchRevisions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/posts/${postId}/revisions`);
        const data = await res.json();
        if (data.revisions) {
          setRevisions(data.revisions);
        }
      } catch (err) {
        console.error('Failed to load revisions', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRevisions();
  }, [isOpen, postId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs cursor-pointer" onClick={onClose} />

      <aside className="relative z-50 flex h-full w-full sm:w-[450px] flex-col border-l bg-background shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex h-14 items-center justify-between gap-3 border-b px-4 shrink-0">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Revision History & Snapshots</h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center py-12 text-xs text-muted-foreground animate-pulse">
              Loading revision logs...
            </div>
          ) : revisions.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              No previous revisions recorded. Snapshots are created upon saving.
            </div>
          ) : (
            revisions.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 rounded-xl border bg-card hover:border-primary/50 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                    {rev.title}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    ID #{rev.id}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="size-3" />
                    <span>{rev.authorName || 'Editor'}</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="size-3" />
                    <span>{new Date(rev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>

                <div className="pt-2 border-t flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onRestore(rev);
                      toast.success(`Restored snapshot from ${new Date(rev.createdAt).toLocaleTimeString()}`);
                      onClose();
                    }}
                    className="gap-1.5 text-xs text-primary font-medium"
                  >
                    <RotateCcw className="size-3" />
                    <span>Restore Version</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
