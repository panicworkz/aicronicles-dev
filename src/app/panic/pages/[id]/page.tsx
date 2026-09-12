"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Trash2,
  Clock,
  PanelRightClose,
  PanelRightOpen,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { onayla } from "@/components/ui/modal";
import { KaynakDuzenleyici } from "@/components/studio/KaynakDuzenleyici";
import {
  ImageStudioDrawer,
  type ImageStudioTarget,
} from "@/components/studio/ImageStudioDrawer";
import { CanliTuval, type TuvalKolu } from "@/components/studio/CanliTuval";
import { AyarKenari } from "@/components/studio/AyarKenari";
import { SITE_DOMAIN } from "@/lib/seo";
import { toast } from "sonner";

/**
 * SABIT SAYFA EDITORU.
 *
 * Yazi editoruyle AYNI tuvali kullaniyor (components/studio/CanliTuval).
 * Onceki hali ham HTML yazilan bir kutuydu: sayfanin nasil gorunecegi
 * ancak kaydedip yeni sekmede acinca ortaya cikiyordu ve gorsel
 * yuklemenin hicbir yolu yoktu — HTML'e elle <img> yazmak
 * gerekiyordu.
 *
 * Kaynak gorunumu KACIS KAPISI olarak duruyor; onizleme yanit
 * vermezse sayfaya ulasacak baska yol kalmasin diye.
 */
export default function PanicSayfaEditoru({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sayfaId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kip, setKip] = useState<"tuval" | "kaynak">("tuval");
  const [kenarAcik, setKenarAcik] = useState(true);
  const [studioAcik, setStudioAcik] = useState(false);
  const [studioHedef, setStudioHedef] = useState<ImageStudioTarget | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  /* Kapak gorselinin alt metni. Sayfada ayri bir sutun yok: gorselin
     alt metni medya kaydinda duruyor, burasi onu duzenleyen alan. */
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [status, setStatus] = useState("published");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const kol = useRef<TuvalKolu | null>(null);
  /* Kaydetme, cerceveden gelen en guncel degeri yazmali: durum
     degiskeni bir olay isleyicisinin icinde eski kalabiliyor. */
  const alanlar = useRef({ title, slug, excerpt, contentHtml, featuredImageUrl });
  alanlar.current = { title, slug, excerpt, contentHtml, featuredImageUrl };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/pages/${sayfaId}`);
        const data = await res.json();
        if (!data.page) {
          toast.error("Page not found");
          router.push("/panic/pages");
          return;
        }
        const p = data.page;
        setTitle(p.title || "");
        setSlug(p.slug || "");
        setExcerpt(p.excerpt || "");
        setContentHtml(p.contentHtml || "");
        setFeaturedImageUrl(p.featuredImageUrl || "");
        setFeaturedImageAlt(p.metaTitle || p.title || "");
        setStatus(p.status || "published");
        setMetaTitle(p.metaTitle || "");
        setMetaDescription(p.metaDescription || "");
        setUpdatedAt(p.updatedAt || null);
      } catch {
        toast.error("Failed to load page");
      } finally {
        setLoading(false);
      }
    })();
  }, [sayfaId, router]);

  const kaydet = async (ustuneYaz: Partial<typeof alanlar.current> = {}) => {
    const d = { ...alanlar.current, ...ustuneYaz };
    if (!d.title.trim() || !d.slug.trim()) {
      toast.error("Title and Slug are required");
      return false;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${sayfaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: d.title,
          slug: d.slug,
          excerpt: d.excerpt,
          contentHtml: d.contentHtml,
          featuredImageUrl: d.featuredImageUrl || null,
          status,
          metaTitle: metaTitle || d.title,
          metaDescription: metaDescription || "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Page saved");
        setUpdatedAt(new Date().toISOString());
        return true;
      }
      toast.error(data.error || "Failed to save page");
      return false;
    } catch (err: any) {
      toast.error(err.message || "Saving error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  /* Onizlemeden gelen gorsel istegi. Kapak ise sayfanin kapagi
     degisiyor; govdedeki bir gorsel ise sonuc CERCEVEYE yollaniyor —
     hangi oge oldugunu yalnizca o biliyor. Panelin HTML icinde src
     eslestirmeye calismasi, adresi bos yeni bir gorselde her seyi
     bozan yoldu. */
  const gorselIstegi = (istek: {
    src: string;
    alt?: string;
    title?: string;
    caption?: string;
    isCover?: boolean;
    istek?: string;
  }) => {
    setStudioHedef({
      src: istek.src,
      alt: istek.alt,
      title: istek.title,
      caption: istek.caption,
      isCover: istek.isCover,
      onSave: async (yeni) => {
        if (istek.isCover) {
          setFeaturedImageUrl(yeni.src);
          await kaydet({ featuredImageUrl: yeni.src });
          return;
        }
        if (istek.istek) {
          kol.current?.yolla("PANIC_STUDIO_IMAGE_RESULT", {
            istek: istek.istek,
            src: yeni.src,
            alt: yeni.alt || "",
            title: yeni.title || "",
            caption: yeni.caption || "",
          });
          toast.success("Image updated");
        }
      },
    });
    setStudioAcik(true);
  };

  const sil = async () => {
    const onay = await onayla({
      baslik: `Delete “${title}”?`,
      aciklama:
        "The page comes off the site and its address stops working. This cannot be undone.",
      onayYazisi: "Delete page",
      yikici: true,
    });
    if (!onay) return;

    try {
      const res = await fetch(`/api/pages/${sayfaId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Page deleted");
        router.push("/panic/pages");
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Error deleting page");
    }
  };


  if (loading) {
    return (
      <div className="animate-pulse p-16 text-center text-xs text-muted-foreground">
        Loading page studio…
      </div>
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-5rem)] flex-col overflow-hidden">
      {/* ---- Ust serit ---- */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b bg-background px-4">
        <div className="flex items-center gap-3">
          <Link href="/panic/pages">
            <Button variant="outline" size="icon-sm" title="Back to Pages">
              <ArrowLeft className="size-3.5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge
              variant={status === "published" ? "default" : "secondary"}
              className="text-[11px] font-normal capitalize"
            >
              {status}
            </Badge>
            <span className="hidden max-w-[220px] truncate text-xs font-medium text-muted-foreground sm:inline">
              {title || "Untitled page"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={kip === "kaynak" ? "secondary" : "ghost"}
            size="default"
            onClick={() => setKip((k) => (k === "kaynak" ? "tuval" : "kaynak"))}
            className="gap-1.5 text-xs"
            title="Edit the underlying HTML"
          >
            <Code2 className="size-3.5" />
            <span className="hidden sm:inline">HTML</span>
          </Button>

          <Button
            variant={kenarAcik ? "secondary" : "outline"}
            size="default"
            onClick={() => setKenarAcik((a) => !a)}
            className="cursor-pointer gap-1.5 text-xs font-medium"
            title={kenarAcik ? "Hide settings" : "Show settings"}
          >
            {kenarAcik ? (
              <PanelRightClose className="size-3.5" />
            ) : (
              <PanelRightOpen className="size-3.5" />
            )}
            <span className="hidden sm:inline">Settings</span>
          </Button>

          <Link href={`/${slug}`} target="_blank">
            <Button variant="outline" size="default" className="gap-1.5 text-xs">
              <ExternalLink className="size-3.5" />
              <span className="hidden md:inline">View</span>
            </Button>
          </Link>

          <Button
            size="default"
            onClick={() => kaydet()}
            disabled={saving}
            className="gap-1.5 text-xs font-semibold"
          >
            <Save className="size-3.5" />
            <span>{saving ? "Saving…" : "Save"}</span>
          </Button>
        </div>
      </div>

      {/* ---- Tuval + kenar cubugu ---- */}
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          {kip === "tuval" ? (
            <CanliTuval
              kol={kol}
              slug={slug}
              degerler={{ title, excerpt, contentHtml, featuredImageUrl }}
              onDegisim={(k) => {
                if (k.title !== undefined) setTitle(k.title);
                if (k.excerpt !== undefined) setExcerpt(k.excerpt);
                if (k.contentHtml !== undefined) setContentHtml(k.contentHtml);
              }}
              onGorsel={gorselIstegi}
              onKacis={() => setKip("kaynak")}
            />
          ) : (
            <div className="h-full overflow-auto p-6">
              <div className="mx-auto max-w-3xl space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Page title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-base font-semibold"
                    placeholder="About, Privacy Policy, Sponsor…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Intro line
                    <span className="ml-1.5 font-normal text-muted-foreground">
                      shown under the title
                    </span>
                  </Label>
                  <Textarea
                    rows={2}
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="resize-none text-sm leading-relaxed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Page HTML</Label>
                  <KaynakDuzenleyici value={contentHtml} onChange={setContentHtml} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sag denetim kenari — yazi editoruyle AYNI bilesen.
            Sayfaya ozel olan tek sey giris cumlesi ve silme alani. */}
        <AyarKenari
          acik={kenarAcik}
          kapat={() => setKenarAcik(false)}
          yayindaEtiketi="Published (Live on web)"
          taslakEtiketi="Draft (Hidden)"
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
                  Address &amp; Intro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-3 pb-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Address</Label>
                  <div className="flex items-center">
                    <span className="flex h-8 items-center rounded-l-md border border-r-0 border-input bg-muted/60 px-2.5 font-mono text-[11px] text-muted-foreground">
                      {SITE_DOMAIN}/
                    </span>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="about"
                      className="h-8 rounded-l-none font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  {/* Giris cumlesi tuvalde de yazilabiliyor; burada
                      olmasinin sebebi HENUZ YOKKEN tuvalde tutunacak
                      bir yer olmamasi. */}
                  <Label className="text-[11px]">Intro line</Label>
                  <Textarea
                    rows={3}
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="One sentence under the title."
                    className="resize-none text-xs leading-relaxed"
                  />
                </div>
                {updatedAt && (
                  <div className="flex items-center gap-1 border-t pt-2 font-mono text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    <span>Saved {new Date(updatedAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          }
          altKart={
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="text-xs font-semibold text-destructive">Delete page</p>
                  <p className="text-[10px] text-muted-foreground">
                    Removes it from the site permanently
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={sil}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete</span>
                </Button>
              </CardContent>
            </Card>
          }
        />
      </div>

      <ImageStudioDrawer
        isOpen={studioAcik}
        onClose={() => setStudioAcik(false)}
        target={studioHedef}
        articleTitle={title}
        articleContent={contentHtml}
      />
    </div>
  );
}
