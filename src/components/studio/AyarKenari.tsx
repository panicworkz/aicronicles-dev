"use client";

import React from "react";
import { Sparkles, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AeoScoreMeter } from "@/components/studio/AeoScoreMeter";
import { SerpSocialPreview } from "@/components/studio/SerpSocialPreview";
import { ImageUploadDropzone } from "@/components/ui/image-upload-dropzone";
import { toast } from "sonner";

/**
 * AYAR KENAR CUBUGU — yazi ve sabit sayfa icin TEK uygulama.
 *
 * NEDEN BURAYA TASINDI: sabit sayfa editorune once AYRI, daha kucuk
 * bir kenar cubugu yazmistim. Sonuc iki farkli panel oldu: yazida
 * kapak gorselinin yaninda alt metin, AEO puani ve SERP onizlemesi
 * varken sayfada yoktu; kartlarin olculeri bile tutmuyordu. Ayni isi
 * goren iki yuzey, ayni urunun icinde iki ayri urun gibi duruyordu.
 *
 * Simdi tek yer. Icerik turune ozel olan sey PROP olarak geliyor
 * (yazida kategori secici, sayfada giris cumlesi); geri kalan her sey
 * — durum, kapak, arama gorunumu, AEO — ikisinde de ayni.
 */

export type KenarAlanlari = {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  status: string;
  setStatus: (d: string) => void;
  featuredImageUrl: string;
  setFeaturedImageUrl: (d: string) => void;
  featuredImageAlt: string;
  setFeaturedImageAlt: (d: string) => void;
  metaTitle: string;
  setMetaTitle: (d: string) => void;
  metaDescription: string;
  setMetaDescription: (d: string) => void;
};

export function AyarKenari({
  acik,
  kapat,
  alanlar,
  /** Duruma ozel kart — yazida kategori, sayfada giris cumlesi. */
  ustKart,
  /** En alta eklenen kart — sayfada silme alani. */
  altKart,
  /** Yayin durumu kartinin secenek metinleri icerik turune gore. */
  yayindaEtiketi = "Published (Live on web)",
  taslakEtiketi = "Draft (Private)",
}: {
  acik: boolean;
  kapat: () => void;
  alanlar: KenarAlanlari;
  ustKart?: React.ReactNode;
  altKart?: React.ReactNode;
  yayindaEtiketi?: string;
  taslakEtiketi?: string;
}) {
  const [sekme, setSekme] = React.useState<"settings" | "ai_aeo">("settings");
  const [uretiliyor, setUretiliyor] = React.useState(false);

  const a = alanlar;

  const seoDoldur = async () => {
    if (!a.title.trim()) {
      toast.error("Please enter a title first");
      return;
    }
    setUretiliyor(true);
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateSeoMeta",
          title: a.title,
          slug: a.slug,
          contentHtml: a.contentHtml,
          excerpt: a.excerpt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.metaTitle) a.setMetaTitle(data.metaTitle);
        if (data.metaDescription) a.setMetaDescription(data.metaDescription);
        toast.success("Dynamic AI SEO metadata generated!");
      } else {
        toast.error("Could not generate metadata");
      }
    } catch {
      toast.error("AI synthesis failed");
    } finally {
      setUretiliyor(false);
    }
  };

  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-hidden border-l bg-background/95 shadow-xs backdrop-blur-xs transition-all duration-300 ease-in-out ${
        acik
          ? "w-[340px] opacity-100 xl:w-[380px]"
          : "pointer-events-none w-0 border-l-0 opacity-0"
      }`}
    >
      <div className="flex h-full w-[340px] flex-col overflow-hidden xl:w-[380px]">
        {/* Sekmeler */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b bg-muted/20 px-3">
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSekme("settings")}
              className={`cursor-pointer rounded-md px-3 py-1 font-medium transition ${
                sekme === "settings"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Publishing &amp; SEO
            </button>
            <button
              type="button"
              onClick={() => setSekme("ai_aeo")}
              className={`flex cursor-pointer items-center gap-1 rounded-md px-3 py-1 font-medium transition ${
                sekme === "ai_aeo"
                  ? "bg-background text-primary shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="size-3 text-primary" />
              <span>AI &amp; AEO</span>
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={kapat}
            title="Collapse Sidebar"
            className="cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <PanelRightClose className="size-3.5" />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {sekme === "settings" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="px-3 pb-2 pt-3">
                  <CardTitle className="text-xs font-semibold">
                    Publication Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <select
                    value={a.status}
                    onChange={(e) => a.setStatus(e.target.value)}
                    className="h-8 w-full rounded-lg border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="published">{yayindaEtiketi}</option>
                    <option value="draft">{taslakEtiketi}</option>
                  </select>
                </CardContent>
              </Card>

              {ustKart}

              <Card>
                <CardHeader className="px-3 pb-2 pt-3">
                  <CardTitle className="text-xs font-semibold">
                    Featured Cover Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  {/* Yukleme, kitaplik, adres ve gorsel SEO'su —
                      hepsi bu bilesende. */}
                  <ImageUploadDropzone
                    value={a.featuredImageUrl}
                    onChange={a.setFeaturedImageUrl}
                    altValue={a.featuredImageAlt}
                    onAltChange={a.setFeaturedImageAlt}
                    label=""
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between px-3 pb-2 pt-3">
                  <CardTitle className="text-xs font-semibold">
                    Google Search &amp; Meta
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={seoDoldur}
                    disabled={uretiliyor}
                    className="h-5 gap-1 px-1.5 text-[10px] font-medium text-primary hover:text-primary"
                  >
                    <Sparkles className="size-2.5" />
                    <span>{uretiliyor ? "Generating…" : "AI Auto-Fill"}</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 px-3 pb-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Meta Title</Label>
                    <Input
                      value={a.metaTitle}
                      onChange={(e) => a.setMetaTitle(e.target.value)}
                      placeholder={a.title}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Meta Description</Label>
                    <Textarea
                      rows={3}
                      value={a.metaDescription}
                      onChange={(e) => a.setMetaDescription(e.target.value)}
                      placeholder="Meta description for search engines..."
                      className="resize-none text-xs leading-relaxed"
                    />
                  </div>
                </CardContent>
              </Card>

              {altKart}
            </div>
          )}

          {sekme === "ai_aeo" && (
            <div className="space-y-5">
              <AeoScoreMeter
                title={a.title}
                contentHtml={a.contentHtml}
                excerpt={a.excerpt}
                metaTitle={a.metaTitle}
                metaDescription={a.metaDescription}
              />

              <SerpSocialPreview
                title={a.title}
                slug={a.slug}
                excerpt={a.excerpt}
                featuredImageUrl={a.featuredImageUrl}
                metaTitle={a.metaTitle}
                metaDescription={a.metaDescription}
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
