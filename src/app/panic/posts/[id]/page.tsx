"use client";

import React, { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  ExternalLink,
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
import { UrunSecici } from "@/components/studio/UrunSecici";
import { KaynakDuzenleyici } from "@/components/studio/KaynakDuzenleyici";
import { AeoScoreMeter } from "@/components/studio/AeoScoreMeter";
import { SerpSocialPreview } from "@/components/studio/SerpSocialPreview";
import { RevisionHistoryDrawer } from "@/components/studio/RevisionHistoryDrawer";
import { MediaPickerModal } from "@/components/studio/MediaPickerModal";
import {
  ImageStudioDrawer,
  type ImageStudioTarget,
} from "@/components/studio/ImageStudioDrawer";
import { AyarKenari } from "@/components/studio/AyarKenari";
import {
  CanliTuval,
  type TuvalKolu,
  type GorselIstegi,
} from "@/components/studio/CanliTuval";
import { ImageUploadDropzone } from "@/components/ui/image-upload-dropzone";
import { toast } from "sonner";
import { SITE_DOMAIN } from '@/lib/seo';

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
  /* ACILIS KIPI TUVAL.
     Varsayilan "editor" idi: HTML gorunumune giden dugmeyi
     kaldirmama ragmen yazi her acildiginda oraya dusuyordu — asil
     sebep buydu. Yazinin editoru tuval; ham isaretleme yalnizca
     onizleme yanit vermediginde one cikiyor. */
  const [viewMode, setViewMode] = useState<"editor" | "live">("live");

  // Right Inspector Sidebar state (collapsible, alongside editor, zero overlay)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"settings" | "ai_aeo">(
    "settings",
  );

  const [showRevisions, setShowRevisions] = useState(false);
  const [splitPickerOpen, setSplitPickerOpen] = useState(false);
  const [targetReplaceImg, setTargetReplaceImg] = useState<{
    src: string;
    alt?: string;
    isCover?: boolean;
  } | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  /* Onizlemeden gelen urun karti istegi. */
  const [urunSeciciAcik, setUrunSeciciAcik] = useState(false);
  const [urunIstek, setUrunIstek] = useState<string | null>(null);
  const [studioTarget, setStudioTarget] = useState<ImageStudioTarget | null>(
    null,
  );

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [status, setStatus] = useState("published");
  const [readingTime, setReadingTime] = useState("5 min read");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  /* Tuvalin kolu: cerceveye mesaj yollamak icin. Cerceveyi tuval
     tutuyor — panelin dogrudan erismesi, ayni isin iki yerden
     yapilmasi demekti. */
  const kol = useRef<TuvalKolu | null>(null);
  const contentHtmlRef = useRef(contentHtml);
  contentHtmlRef.current = contentHtml;
  const titleRef = useRef(title);
  titleRef.current = title;
  const slugRef = useRef(slug);
  slugRef.current = slug;
  const featuredImageUrlRef = useRef(featuredImageUrl);
  featuredImageUrlRef.current = featuredImageUrl;
  /* Ozet de ref tutuyor: cerceveden gelen mesaj en guncel degeri
     gormeli, yoksa kapanan bir kapali deger (stale closure) eski
     aciklamayi geri yazar. */
  const excerptRef = useRef(excerpt);
  excerptRef.current = excerpt;

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
  }, [postId]);

  /* ONIZLEMEDEN GELEN GORSEL ISTEGI.
     Mesajlasmanin kendisi tuvalde (components/studio/CanliTuval);
     burada yalnizca yaziya OZEL karsilik veriliyor: kapak degisimi
     kaydediliyor, govdedeki gorselin sonucu cerceveye geri
     yollaniyor. */
  const gorselIstegi = (istek: GorselIstegi) => {
    const { src, alt, title: imgTitle, caption: imgCaption, isCover } = istek;
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
          try {
            const res = await fetch(`/api/posts/${postId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: titleRef.current,
                slug: slugRef.current,
                excerpt: excerptRef.current,
                contentHtml: contentHtmlRef.current,
                featuredImageUrl: newData.src,
                status,
                readingTime,
                metaTitle,
                metaDescription,
              }),
            });
            const resData = await res.json();
            if (resData.success) toast.success("Cover image updated and saved!");
          } catch {
            /* Kaydetme basarisiz olsa da kapak ekranda degisti;
               kullanici Save'e basabilir. */
          }
          return;
        }

        if (istek.istek) {
          /* KAYNAK ESLESTIRME YOK.
             Eskiden panel govde HTML'ini ayristirip gorseli src'sine
             gore buluyordu. Yeni eklenen gorselin src'si BOS oldugu
             icin hicbir seyle eslesmiyor, eslesmeyince de "src'yi her
             yerde degistir" yoluna dusuluyordu — bos dizgeyi
             degistirmek metnin her harfinin arasina adres sokardi.
             Ogeyi taniyan taraf onizleme; sonucu ona yolluyoruz. */
          kol.current?.yolla("PANIC_STUDIO_IMAGE_RESULT", {
            istek: istek.istek,
            src: newData.src,
            alt: newData.alt || "",
            title: newData.title || "",
            caption: newData.caption || "",
          });
          toast.success("Image updated");
          return;
        }

        /* Istek kimligi olmayan hal: gorsel kenar cubugundan
           aciliyor. Govdedeki ayni adresli gorseller guncelleniyor. */
        const currentHtml = contentHtmlRef.current || "";
        const doc = new DOMParser().parseFromString(currentHtml, "text/html");
        let matched = false;

        doc.querySelectorAll("img").forEach((im) => {
          const imSrc = im.getAttribute("src") || "";
          const imFilename = imSrc.split("/").pop() || "";
          const targetFilename = src.split("/").pop() || "";
          if (
            imSrc === src ||
            src.endsWith(imSrc) ||
            imSrc.endsWith(src) ||
            (imFilename && targetFilename && imFilename === targetFilename)
          ) {
            matched = true;
            im.setAttribute("src", newData.src);
            im.setAttribute("alt", newData.alt || "");
            if (newData.title) im.setAttribute("title", newData.title);
            else im.removeAttribute("title");
            if (newData.caption) im.setAttribute("data-caption", newData.caption);
            else im.removeAttribute("data-caption");
          }
        });

        let updatedHtml = doc.body.innerHTML;
        if (!matched && src !== newData.src) {
          updatedHtml = currentHtml.replaceAll(src, newData.src);
        }

        setContentHtml(updatedHtml);
        contentHtmlRef.current = updatedHtml;

        try {
          const res = await fetch(`/api/posts/${postId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: titleRef.current,
              slug: slugRef.current,
              excerpt: excerptRef.current,
              contentHtml: updatedHtml,
              featuredImageUrl: featuredImageUrlRef.current,
              status,
              readingTime,
              metaTitle,
              metaDescription,
            }),
          });
          const resData = await res.json();
          if (resData.success) toast.success("Image settings applied and saved!");
          else toast.error(resData.error || "Failed to save changes");
        } catch {
          toast.error("Save error");
        }
      },
    });
    setStudioOpen(true);
  };


  /* ONIZLEMEYE YAYIN ARTIK TUVALDE.
     Once bu panel her degisiklikten sonra elle broadcastLiveSync
     cagiriyordu; bir cagriyi unutmak, onizlemenin sessizce eski
     icerigi gostermesi demekti. Tuval degerleri PROP olarak aliyor
     ve degistiginde kendisi yolluyor — unutulacak bir cagri yok. */

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    titleRef.current = newTitle;
  };

  const handleContentChange = (newHtml: string) => {
    setContentHtml(newHtml);
    contentHtmlRef.current = newHtml;
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

  const renderVisualEditorContent = () => (
    <div className="space-y-4">
      {/* Kacis kipinden donus. Bu gorunume yalnizca onizleme
          yanit vermediginde geliniyor; cikis yolu gorunur olmali. */}
      <button
        type="button"
        onClick={() => setViewMode("live")}
        className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        ← Back to the canvas
      </button>

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
              {SITE_DOMAIN}/
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

      {/* Kaynak gorunumu. Yazinin ASIL editoru onizlemenin uzerindeki
          blok yuzeyi; burasi kacis kapisi — onizleme yuklenemedigi ya
          da isaretlemeyi dogrudan gormek gerektigi zaman. */}
      <KaynakDuzenleyici
        value={contentHtml}
        onChange={(html) => handleContentChange(html)}
      />
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

        {/* HTML DUGMESI DE KALDIRILDI.
            Yazinin her yeri tuval uzerinde duzenlenebiliyor; ayri bir
            "HTML" dugmesi kullaniciyi ham isaretlemenin icine cagiran,
            ama hicbir sey kazandirmayan bir kapi oluyordu. Kacis
            kapisi duruyor: onizleme kendini bildirmezse asagidaki
            uyari onu aciyor. */}

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
          {/* HTML kacis kapisi — mod degil, gecici gorunum. */}
          {viewMode === "editor" && (
            <div className="w-full h-full overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto py-4 space-y-6">
                {renderVisualEditorContent()}
              </div>
            </div>
          )}

          {/* Asil editor: onizlemenin uzerindeki blok yuzeyi. */}
          {viewMode === "live" && (
            <div className="w-full h-full">
              <CanliTuval
                kol={kol}
                slug={slug}
                degerler={{ title, excerpt, contentHtml, featuredImageUrl }}
                onDegisim={(k) => {
                  if (k.title !== undefined) {
                    setTitle(k.title);
                    titleRef.current = k.title;
                  }
                  if (k.excerpt !== undefined) {
                    setExcerpt(k.excerpt);
                    excerptRef.current = k.excerpt;
                  }
                  if (k.contentHtml !== undefined) {
                    setContentHtml(k.contentHtml);
                    contentHtmlRef.current = k.contentHtml;
                  }
                }}
                onGorsel={gorselIstegi}
                onUrun={(istek) => {
                  /* Onizlemeden urun karti eklendi: secici panelde
                     aciliyor, secilen urun cerceveye GERI yollaniyor.
                     Kimligi cerceve kendi ogesine yaziyor — hangi blok
                     oldugunu yalnizca o biliyor. */
                  setUrunIstek(istek);
                  setUrunSeciciAcik(true);
                }}
                onKacis={() => setViewMode("editor")}
              />
            </div>
          )}
        </div>

        {/* Sag denetim kenari — sabit sayfa editoruyle AYNI bilesen
            (components/studio/AyarKenari). Yaziya ozel olan tek sey
            kategori secici; o da ustKart olarak geciyor. */}
        <AyarKenari
          acik={sidebarOpen}
          kapat={() => setSidebarOpen(false)}
          alanlar={{
            title,
            slug,
            excerpt,
            contentHtml,
            status,
            setStatus,
            featuredImageUrl,
            setFeaturedImageUrl,
            featuredImageAlt,
            setFeaturedImageAlt,
            metaTitle,
            setMetaTitle,
            metaDescription,
            setMetaDescription,
          }}
          ustKart={
            <Card>
              <CardHeader className="px-3 pb-2 pt-3">
                <CardTitle className="text-xs font-semibold">
                  Category &amp; Topic
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <select
                  value={categoryId ? String(categoryId) : ""}
                  onChange={(e) =>
                    setCategoryId(e.target.value ? parseInt(e.target.value, 10) : null)
                  }
                  className="h-8 w-full rounded-lg border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
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
          }
        />
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

      {/* Onizlemeden acilan urun secici. Secilen urun cerceveye geri
          gidiyor; panel govde HTML'ine dokunmuyor. */}
      <UrunSecici
        acik={urunSeciciAcik}
        kapat={() => {
          setUrunSeciciAcik(false);
          setUrunIstek(null);
        }}
        sec={(urun) => {
          kol.current?.yolla("PANIC_STUDIO_PRODUCT_RESULT", {
            istek: urunIstek,
            urun,
          });
          setUrunIstek(null);
        }}
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
            toast.success("Cover image replaced live!");
          } else if (targetReplaceImg?.src) {
            const oldSrc = targetReplaceImg.src;
            const updatedHtml = (contentHtml || "").replaceAll(oldSrc, newUrl);
            setContentHtml(updatedHtml);
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
