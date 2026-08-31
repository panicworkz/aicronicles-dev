"use client";

import React, { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  ImageIcon,
  Sparkles,
  Globe,
  FileText,
  Clock,
  Trash2,
  RefreshCw,
  History,
  Check,
  Share2,
  Columns,
  Eye,
  Settings,
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import TipTapEditor from "@/components/editor/TipTapEditor";
import { AeoScoreMeter } from "@/components/studio/AeoScoreMeter";
import { SerpSocialPreview } from "@/components/studio/SerpSocialPreview";
import { BlockInsertToolbar } from "@/components/studio/BlockInsertToolbar";
import { RevisionHistoryDrawer } from "@/components/studio/RevisionHistoryDrawer";
import { MediaPickerModal } from "@/components/studio/MediaPickerModal";
import {
  ImageStudioDrawer,
  type ImageStudioTarget,
} from "@/components/studio/ImageStudioDrawer";
import { ImageUploadDropzone } from "@/components/ui/image-upload-dropzone";
import { toast } from "sonner";

export default function PanicSplitLiveStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const postId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [viewMode, setViewMode] = useState<"editor" | "live" | "split">(
    "editor",
  );
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">(
    "desktop",
  );

  // Right Inspector Sidebar state (collapsible, alongside editor, zero overlay)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"settings" | "ai_aeo">(
    "settings",
  );

  const [iframeKey, setIframeKey] = useState(0);
  const [showRevisions, setShowRevisions] = useState(false);
  const [splitPickerOpen, setSplitPickerOpen] = useState(false);
  const [targetReplaceImg, setTargetReplaceImg] = useState<{
    src: string;
    alt?: string;
    isCover?: boolean;
  } | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioTarget, setStudioTarget] = useState<ImageStudioTarget | null>(
    null,
  );

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [contentJson, setContentJson] = useState<any>(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [status, setStatus] = useState("published");
  const [readingTime, setReadingTime] = useState("5 min read");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const contentHtmlRef = useRef(contentHtml);
  contentHtmlRef.current = contentHtml;
  const titleRef = useRef(title);
  titleRef.current = title;
  const slugRef = useRef(slug);
  slugRef.current = slug;
  const featuredImageUrlRef = useRef(featuredImageUrl);
  featuredImageUrlRef.current = featuredImageUrl;

  useEffect(() => {
    // Fetch Categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});

    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        const data = await res.json();
        if (data.post) {
          const p = data.post;
          const initialSlug =
            p.slug ||
            p.title
              ?.toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "") ||
            `article-${p.id}`;
          setTitle(p.title || "");
          setSlug(initialSlug);
          slugRef.current = initialSlug;
          setExcerpt(p.excerpt || "");
          setContentHtml(p.contentHtml || "");
          setContentJson(p.contentJson || null);
          setFeaturedImageUrl(p.featuredImageUrl || "");
          setFeaturedImageAlt(p.metaTitle || p.title || "");
          setStatus(p.status || "published");
          setReadingTime(p.readingTime || "5 min read");
          setMetaTitle(p.metaTitle || p.title || "");
          setMetaDescription(p.metaDescription || p.excerpt || "");
          setCategoryId(p.categoryId || p.category_id || null);
        } else {
          toast.error("Article not found");
        }
      } catch (err) {
        toast.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();

    // Listen for real-time edits or image manage requests made on the live canvas
    const handleLiveMessage = (event: MessageEvent) => {
      if (event.data?.type === "PANIC_LIVE_TO_STUDIO_SYNC") {
        const { title: liveTitle, contentHtml: liveHtml } =
          event.data.payload || {};
        if (liveTitle !== undefined) {
          setTitle(liveTitle);
          titleRef.current = liveTitle;
        }
        if (liveHtml !== undefined) {
          setContentHtml(liveHtml);
          contentHtmlRef.current = liveHtml;
        }
      }

      if (event.data?.type === "PANIC_OPEN_IMAGE_STUDIO") {
        const {
          src,
          alt,
          title: imgTitle,
          caption: imgCaption,
          isCover,
        } = event.data.payload || {};
        setStudioTarget({
          src,
          alt,
          title: imgTitle,
          caption: imgCaption,
          isCover,
          onSave: async (newData) => {
            if (isCover) {
              setFeaturedImageUrl(newData.src);
              if (newData.alt) setFeaturedImageAlt(newData.alt);
              broadcastLiveSync(
                titleRef.current,
                contentHtmlRef.current,
                newData.src,
              );
              try {
                const res = await fetch(`/api/posts/${postId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: titleRef.current,
                    slug: slugRef.current,
                    excerpt,
                    contentHtml: contentHtmlRef.current,
                    contentJson,
                    featuredImageUrl: newData.src,
                    status,
                    readingTime,
                    metaTitle,
                    metaDescription,
                  }),
                });
                const resData = await res.json();
                if (resData.success) {
                  toast.success("Cover image updated and saved!");
                }
              } catch (e) {
                // silent
              }
            } else {
              const currentHtml = contentHtmlRef.current || "";
              const parser = new DOMParser();
              const doc = parser.parseFromString(currentHtml, "text/html");
              const imgs = doc.querySelectorAll("img");
              let matched = false;

              imgs.forEach((im) => {
                const imSrc = im.getAttribute("src") || "";
                const imFilename = imSrc.split("/").pop() || "";
                const targetFilename = src.split("/").pop() || "";
                if (
                  imSrc === src ||
                  src.endsWith(imSrc) ||
                  imSrc.endsWith(src) ||
                  (imFilename &&
                    targetFilename &&
                    imFilename === targetFilename)
                ) {
                  matched = true;
                  im.setAttribute("src", newData.src);
                  im.setAttribute("alt", newData.alt || "");
                  if (newData.title) im.setAttribute("title", newData.title);
                  else im.removeAttribute("title");
                  if (newData.caption)
                    im.setAttribute("data-caption", newData.caption);
                  else im.removeAttribute("data-caption");
                }
              });

              let updatedHtml = doc.body.innerHTML;
              if (!matched && src !== newData.src) {
                updatedHtml = currentHtml.replaceAll(src, newData.src);
              }

              setContentHtml(updatedHtml);
              broadcastLiveSync(
                titleRef.current,
                updatedHtml,
                featuredImageUrlRef.current,
              );

              try {
                const res = await fetch(`/api/posts/${postId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: titleRef.current,
                    slug: slugRef.current,
                    excerpt,
                    contentHtml: updatedHtml,
                    contentJson,
                    featuredImageUrl: featuredImageUrlRef.current,
                    status,
                    readingTime,
                    metaTitle,
                    metaDescription,
                  }),
                });
                const resData = await res.json();
                if (resData.success) {
                  toast.success("Image settings applied and saved!");
                } else {
                  toast.error(resData.error || "Failed to save changes");
                }
              } catch (e: any) {
                toast.error("Save error");
              }
            }
          },
        });
        setStudioOpen(true);
      }
    };

    window.addEventListener("message", handleLiveMessage);
    return () => window.removeEventListener("message", handleLiveMessage);
  }, [postId]);

  const broadcastLiveSync = (
    newTitle: string,
    newHtml: string,
    newCover: string,
  ) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "PANIC_STUDIO_LIVE_UPDATE",
          source: "studio_parent",
          payload: {
            title: newTitle,
            contentHtml: newHtml,
            featuredImageUrl: newCover,
          },
        },
        "*",
      );
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    titleRef.current = newTitle;
    broadcastLiveSync(newTitle, contentHtml, featuredImageUrl);
  };

  const handleContentChange = (newHtml: string, newJson: any) => {
    setContentHtml(newHtml);
    contentHtmlRef.current = newHtml;
    setContentJson(newJson);
    broadcastLiveSync(title, newHtml, featuredImageUrl);
  };

  const handleInsertHtml = (snippetHtml: string) => {
    const combined = `${contentHtml}\n${snippetHtml}`;
    setContentHtml(combined);
    contentHtmlRef.current = combined;
    broadcastLiveSync(title, combined, featuredImageUrl);
    toast.success("Block added to article");
  };

  const handleSave = async (isAuto = false) => {
    if (!title.trim()) {
      if (!isAuto) toast.error("Please enter an article title");
      return;
    }

    if (isAuto) setAutosaving(true);
    else setSaving(true);

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slugRef.current || slug,
          excerpt,
          contentHtml,
          contentJson,
          featuredImageUrl,
          status,
          readingTime,
          metaTitle,
          metaDescription,
          categoryId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (!isAuto) {
          toast.success("Article saved successfully!");
        }
      } else {
        if (!isAuto) toast.error(data.error || "Failed to save");
      }
    } catch (err) {
      if (!isAuto) toast.error("An error occurred while saving");
    } finally {
      if (isAuto) setAutosaving(false);
      else setSaving(false);
    }
  };

  const handleRestoreRevision = (rev: any) => {
    if (rev.title) setTitle(rev.title);
    if (rev.contentHtml) setContentHtml(rev.contentHtml);
    if (rev.contentJson) setContentJson(rev.contentJson);
    broadcastLiveSync(
      rev.title || title,
      rev.contentHtml || contentHtml,
      featuredImageUrl,
    );
    toast.success("Revision restored to editor");
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <RefreshCw className="size-6 animate-spin text-primary" />
          <p className="text-xs font-mono">Loading Studio...</p>
        </div>
      </div>
    );
  }

  const getFrameWidth = () => {
    switch (deviceMode) {
      case "mobile":
        return "w-[375px]";
      case "tablet":
        return "w-[768px]";
      case "desktop":
      default:
        return "w-full";
    }
  };

  // Render the Visual Editor Form
  const renderVisualEditorContent = () => (
    <div className="space-y-4">
      {/* Frameless Large Title */}
      <div className="space-y-3">
        <textarea
          rows={1}
          value={title}
          onChange={(e) => {
            handleTitleChange(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          placeholder="Article Title..."
          className="w-full resize-none bg-transparent text-2xl sm:text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/40 focus:outline-none border-0 p-0 leading-snug"
        />

        {/* URL Slug & Reading Time Bar */}
        <div className="flex flex-wrap items-center gap-3 p-2 rounded-lg border bg-muted/20 text-xs">
          <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
            <Globe className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground truncate">
              fabelo.testworkz.com/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="bg-transparent text-primary font-mono outline-none flex-1 min-w-[100px]"
            />
          </div>
          <div className="flex items-center gap-1 text-muted-foreground border-l pl-3">
            <Clock className="size-3.5" />
            <input
              type="text"
              value={readingTime}
              onChange={(e) => setReadingTime(e.target.value)}
              className="bg-transparent text-foreground w-16 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Rich Block Quick Insert Toolbar */}
      <BlockInsertToolbar
        title={title}
        contentHtml={contentHtml}
        onInsertHtml={handleInsertHtml}
      />

      {/* TipTap Rich Editor */}
      <div>
        <TipTapEditor
          content={contentHtml}
          onChange={handleContentChange}
          articleTitle={title}
        />
      </div>
    </div>
  );

  // Render the Live Web Preview Canvas
  const renderLiveCanvas = () => (
    <div className="flex flex-col w-full h-full bg-muted/30 overflow-hidden relative">
      {/* Live Studio Control Bar */}
      <div className="flex h-9 items-center justify-between gap-2 border-b bg-background/80 backdrop-blur-xs px-4 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live In-Context Canvas</span>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
          <Button
            variant={deviceMode === "desktop" ? "secondary" : "ghost"}
            size="icon-xs"
            onClick={() => setDeviceMode("desktop")}
            title="Desktop 100%"
          >
            <Monitor className="size-3" />
          </Button>
          <Button
            variant={deviceMode === "tablet" ? "secondary" : "ghost"}
            size="icon-xs"
            onClick={() => setDeviceMode("tablet")}
            title="Tablet 768px"
          >
            <Tablet className="size-3" />
          </Button>
          <Button
            variant={deviceMode === "mobile" ? "secondary" : "ghost"}
            size="icon-xs"
            onClick={() => setDeviceMode("mobile")}
            title="Mobile 375px"
          >
            <Smartphone className="size-3" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setIframeKey((prev) => prev + 1)}
          title="Reload Frame"
        >
          <RefreshCw className="size-3" />
        </Button>
      </div>

      {/* Responsive Live Frame Canvas */}
      <div className="flex-1 p-4 overflow-hidden flex items-center justify-center">
        <div
          className={`h-full transition-all duration-300 rounded-xl overflow-hidden border border-border bg-background shadow-lg mx-auto ${getFrameWidth()}`}
        >
          {slug ? (
            <iframe
              ref={iframeRef}
              key={`${slug}-${iframeKey}`}
              src={`/${slug}?live=1`}
              className="w-full h-full border-0 bg-background"
              title="Live Web Preview"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-mono">
              Loading live canvas preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-6 overflow-hidden">
      {/* Studio Header Toolbar */}
      <div className="flex h-12 items-center justify-between gap-3 border-b bg-background px-4 shrink-0">
        {/* Left Info */}
        <div className="flex items-center gap-3">
          <Link href="/panic/posts">
            <Button variant="outline" size="icon-sm" title="Back to Articles">
              <ArrowLeft className="size-3.5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge
              variant={status === "published" ? "default" : "secondary"}
              className="capitalize text-[11px] font-normal"
            >
              {status}
            </Badge>
            <span className="text-xs text-muted-foreground truncate max-w-[160px] font-medium hidden sm:inline">
              {title || "Untitled"}
            </span>
          </div>
        </div>

        {/* Center: Main 3-Way Mode Switcher */}
        <div className="flex items-center rounded-xl border border-border/80 bg-muted/30 p-0.5 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("editor")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "editor"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="size-3.5 text-primary" />
            <span>Visual Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("live")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "live"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="size-3.5 text-emerald-500" />
            <span>Live In-Context</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "split"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Columns className="size-3.5 text-blue-500" />
            <span>Split View</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Collapsible Inspector Sidebar Toggle Button */}
          <Button
            variant={sidebarOpen ? "secondary" : "outline"}
            size="default"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="gap-1.5 text-xs font-medium cursor-pointer"
            title={
              sidebarOpen ? "Hide Settings Sidebar" : "Show Settings Sidebar"
            }
          >
            {sidebarOpen ? (
              <PanelRightClose className="size-3.5" />
            ) : (
              <PanelRightOpen className="size-3.5" />
            )}
            <span className="hidden sm:inline">Settings</span>
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={() => setShowRevisions(true)}
            className="gap-1.5 text-xs hidden md:inline-flex"
          >
            <History className="size-3.5" />
            <span>Revisions</span>
          </Button>

          <Link href={`/${slug}`} target="_blank">
            <Button
              variant="outline"
              size="default"
              className="gap-1.5 hidden lg:inline-flex"
            >
              <ExternalLink className="size-3.5" />
              <span>Live URL</span>
            </Button>
          </Link>

          <Button
            size="default"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="gap-1.5 font-medium"
          >
            <Save className="size-3.5" />
            <span>
              {saving
                ? "Saving..."
                : autosaving
                  ? "Autosaving..."
                  : "Save Changes"}
            </span>
          </Button>
        </div>
      </div>

      {/* Main Workspace: Editor/Canvas on Left + Fixed Sibling Sidebar on Right (Zero Overlay) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content / Canvas Area (Resizes automatically when sidebar is toggled) */}
        <div className="flex-1 h-full overflow-hidden bg-background">
          {/* Mode 1: Visual Editor */}
          {viewMode === "editor" && (
            <div className="w-full h-full overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto py-4 space-y-6">
                {renderVisualEditorContent()}
              </div>
            </div>
          )}

          {/* Mode 2: Live In-Context Canvas */}
          {viewMode === "live" && (
            <div className="w-full h-full">{renderLiveCanvas()}</div>
          )}

          {/* Mode 3: Split View */}
          {viewMode === "split" && (
            <div className="flex w-full h-full overflow-hidden">
              <div className="w-full lg:w-1/2 border-r bg-background overflow-y-auto p-6 space-y-6">
                {renderVisualEditorContent()}
              </div>
              <div className="hidden lg:flex lg:w-1/2 h-full">
                {renderLiveCanvas()}
              </div>
            </div>
          )}
        </div>

        {/* Option 3: Fixed Right Inspector Sidebar (Smooth animated slide & width transition) */}
        <aside
          className={`border-l bg-background/95 backdrop-blur-xs shrink-0 flex flex-col h-full overflow-hidden shadow-xs transition-all duration-300 ease-in-out ${
            sidebarOpen
              ? "w-[340px] xl:w-[380px] opacity-100"
              : "w-0 opacity-0 border-l-0 pointer-events-none"
          }`}
        >
          <div className="w-[340px] xl:w-[380px] flex flex-col h-full overflow-hidden">
            {/* Sidebar Sub-Header Tabs */}
            <div className="flex h-11 items-center justify-between border-b px-3 bg-muted/20 shrink-0">
              <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSidebarTab("settings")}
                  className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                    sidebarTab === "settings"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Publishing & SEO
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab("ai_aeo")}
                  className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1 cursor-pointer ${
                    sidebarTab === "ai_aeo"
                      ? "bg-background text-primary shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sparkles className="size-3 text-primary" />
                  <span>AI & AEO</span>
                </button>
              </div>

              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setSidebarOpen(false)}
                title="Collapse Sidebar"
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <PanelRightClose className="size-3.5" />
              </Button>
            </div>

            {/* Sidebar Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {sidebarTab === "settings" && (
                <div className="space-y-4">
                  {/* Publishing Status */}
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-semibold">
                        Publication Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full h-8 rounded-lg border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="published">
                          Published (Live on web)
                        </option>
                        <option value="draft">Draft (Private)</option>
                      </select>
                    </CardContent>
                  </Card>

                  {/* Category & Taxonomy */}
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-semibold">
                        Category & Topic
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <select
                        value={categoryId ? String(categoryId) : ""}
                        onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value, 10) : null)}
                        className="w-full h-8 rounded-lg border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Select Primary Category</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.slug})
                          </option>
                        ))}
                      </select>
                    </CardContent>
                  </Card>

                  {/* Featured Cover Image */}
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-semibold">
                        Featured Cover Image
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 space-y-2">
                      <ImageUploadDropzone
                        value={featuredImageUrl}
                        onChange={(url) => {
                          setFeaturedImageUrl(url);
                          broadcastLiveSync(title, contentHtml, url);
                        }}
                        altValue={featuredImageAlt}
                        onAltChange={(alt) => setFeaturedImageAlt(alt)}
                        label=""
                      />
                    </CardContent>
                  </Card>

                  {/* SEO & Meta */}
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-semibold">
                        Google Search & Meta
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={async () => {
                          if (!title.trim()) {
                            toast.error("Please enter an article title first");
                            return;
                          }
                          try {
                            const res = await fetch("/api/ai/copilot", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                action: "generateSeoMeta",
                                title,
                                slug,
                                contentHtml,
                                excerpt,
                              }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              if (data.metaTitle) setMetaTitle(data.metaTitle);
                              if (data.metaDescription)
                                setMetaDescription(data.metaDescription);
                              toast.success(
                                "Dynamic AI SEO metadata generated!",
                              );
                            }
                          } catch (e) {
                            toast.error("AI synthesis failed");
                          }
                        }}
                        className="h-5 px-1.5 text-[10px] text-primary hover:text-primary font-medium gap-1"
                      >
                        <Sparkles className="size-2.5" />
                        <span>AI Auto-Fill</span>
                      </Button>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Meta Title</Label>
                        <Input
                          value={metaTitle}
                          onChange={(e) => setMetaTitle(e.target.value)}
                          placeholder={title}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Meta Description</Label>
                        <Textarea
                          rows={3}
                          value={metaDescription}
                          onChange={(e) => setMetaDescription(e.target.value)}
                          placeholder="Meta description for search engines..."
                          className="text-xs resize-none leading-relaxed"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {sidebarTab === "ai_aeo" && (
                <div className="space-y-5">
                  <AeoScoreMeter
                    title={title}
                    contentHtml={contentHtml}
                    excerpt={excerpt}
                    metaTitle={metaTitle}
                    metaDescription={metaDescription}
                  />

                  <SerpSocialPreview
                    title={title}
                    slug={slug}
                    excerpt={excerpt}
                    featuredImageUrl={featuredImageUrl}
                    metaTitle={metaTitle}
                    metaDescription={metaDescription}
                  />
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Revision History Drawer */}
      <RevisionHistoryDrawer
        postId={postId}
        isOpen={showRevisions}
        onClose={() => setShowRevisions(false)}
        onRestore={handleRestoreRevision}
      />

      {/* Slide-Over Image Studio & AI Optimizer Drawer for Live Canvas */}
      <ImageStudioDrawer
        isOpen={studioOpen}
        onClose={() => {
          setStudioOpen(false);
          setStudioTarget(null);
        }}
        target={studioTarget}
        articleTitle={title}
        articleContent={contentHtml}
      />

      {/* Split Live Canvas & Editor Image Replace Modal */}
      <MediaPickerModal
        isOpen={splitPickerOpen}
        onClose={() => {
          setSplitPickerOpen(false);
          setTargetReplaceImg(null);
        }}
        onSelect={(newUrl, newAlt) => {
          if (targetReplaceImg?.isCover) {
            setFeaturedImageUrl(newUrl);
            broadcastLiveSync(title, contentHtml, newUrl);
            toast.success("Cover image replaced live!");
          } else if (targetReplaceImg?.src) {
            const oldSrc = targetReplaceImg.src;
            const updatedHtml = (contentHtml || "").replaceAll(oldSrc, newUrl);
            setContentHtml(updatedHtml);
            broadcastLiveSync(title, updatedHtml, featuredImageUrl);
            toast.success("Image replaced in content!");
          }
          setSplitPickerOpen(false);
          setTargetReplaceImg(null);
        }}
        title={
          targetReplaceImg?.isCover
            ? "Replace Cover Image"
            : "Replace Image in Content"
        }
        currentUrl={targetReplaceImg?.src}
      />
    </div>
  );
}
