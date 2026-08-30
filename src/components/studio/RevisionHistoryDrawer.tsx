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

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] flex justify-end overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen
          ? 'opacity-100 pointer-events-auto visible'
          : 'opacity-0 pointer-events-none invisible'
      }`}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 top-0 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out cursor-pointer ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Slide-over Panel from Right (100% Flush Top-0) */}
      <aside
        className={`relative z-[101] flex h-screen max-h-screen w-full sm:w-[450px] flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-in-out will-change-transform top-0 right-0 m-0 p-0 rounded-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between gap-3 border-b px-4 shrink-0 bg-background">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Revision History & Snapshots</h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} title="Close (ESC)">
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
              No previous revisions recorded. Snapshots are created automatically upon saving.
            </div>
          ) : (
            revisions.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 rounded-md border bg-card hover:border-primary/50 transition space-y-2"
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
                    className="gap-1.5 text-xs text-primary font-medium rounded-md"
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
