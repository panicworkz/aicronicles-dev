-- SABIT SAYFALARA BLOK MODELI
--
-- Yazilarda govdenin dogruluk kaynagi blocks_json; sabit sayfalar
-- HTML metni olarak duruyordu ve duzenleri (kart izgarasi, serit,
-- kunye, kapanis bandi) KOD'da bir eslesme tablosundan geliyordu.
-- Bu goc, sayfalari da yazilarla ayni modele tasiyor.
--
-- Sutunlari eklemek yeter: govdeyi bloklara cevirme isi
-- scripts/sayfa-blok-gocu.mjs'de, cunku ayristirma kurallari
-- (lib/bloklar.ts) SQL'de tekrar yazilamaz.

ALTER TABLE pages ADD COLUMN IF NOT EXISTS excerpt text;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS blocks_json jsonb;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS featured_image_id integer
  REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS featured_image_url text;
