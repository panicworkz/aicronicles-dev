"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Globe, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import TipTapEditor from "@/components/editor/TipTapEditor";
import { toast } from "sonner";

export default function PanicNewPageStudio() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [contentJson, setContentJson] = useState<any>(null);
  const [status, setStatus] = useState("published");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Auto-generate slug from title if user hasn't manually typed a custom slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generated);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Page title is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("URL slug is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          contentHtml,
          contentJson,
          status,
          metaTitle: metaTitle || title,
          metaDescription: metaDescription || "",
        }),
      });

      const data = await res.json();
      if (data.success && data.page) {
        toast.success("Page created successfully!");
        router.push(`/panic/pages/${data.page.id}`);
      } else {
        toast.error(data.error || "Failed to create page");
      }
    } catch (err: any) {
      toast.error(err.message || "Creation error");
    } finally {
      setSaving(false);
    }
  };

  const handleAiAutoFill = async () => {
    if (!title.trim()) {
      toast.error("Please enter a page title first");
      return;
    }

    setGeneratingAi(true);
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateSeoMeta",
          title,
          slug,
          contentHtml,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.metaTitle) setMetaTitle(data.metaTitle);
        if (data.metaDescription) setMetaDescription(data.metaDescription);
        toast.success("Dynamic AI SEO metadata generated!");
      } else {
        toast.error("Could not generate metadata");
      }
    } catch (e) {
      toast.error("AI synthesis failed");
    } finally {
      setGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/panic/pages">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              title="Back to Pages"
            >
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Create New Static Page
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Publish legal terms, landing pages, corporate guides, or policy
              documents
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Save className="size-3.5" />
            <span>{saving ? "Publishing..." : "Publish Page"}</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Content Editor (Left) & Sidebar Settings (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Title & TipTap Rich Editor */}
        <div className="lg:col-span-8 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Page Title</Label>
            <Input
              type="text"
              placeholder="e.g. Terms of Service, Editorial Guidelines, Sponsorship Deck..."
              value={title}
              onChange={handleTitleChange}
              className="text-base font-semibold"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Page Content (Rich Visual Editor)
            </Label>
            <TipTapEditor
              content={contentHtml}
              onChange={(html, json) => {
                setContentHtml(html);
                setContentJson(json);
              }}
            />
          </div>
        </div>

        {/* Right Column (4 cols): Publishing & SEO Settings */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Status & Slug */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="size-4 text-primary" />
                <span>Publishing Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 font-medium"
                >
                  <option value="published">Published (Public)</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">URL Slug</Label>
                <div className="flex items-center">
                  <span className="h-8 px-2.5 bg-muted/60 border border-r-0 border-input rounded-l-md text-xs text-muted-foreground font-mono flex items-center">
                    /
                  </span>
                  <Input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="custom-landing"
                    className="rounded-l-none text-xs font-mono h-8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: SEO Meta Settings */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span>SEO Metadata</span>
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleAiAutoFill}
                disabled={generatingAi}
                className="h-6 gap-1 text-[11px] text-primary hover:text-primary font-medium"
              >
                <Sparkles className="size-3" />
                <span>
                  {generatingAi ? "Generating..." : "AI Auto-Fill ✨"}
                </span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Meta Title (Google Tab Title)</Label>
                <Input
                  type="text"
                  placeholder={title ? `${title} - Fabelo` : "Meta Title"}
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  Meta Description (SERP Snippet)
                </Label>
                <Textarea
                  rows={3}
                  placeholder="Short description for Google Search snippets..."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="text-xs resize-none leading-relaxed"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
