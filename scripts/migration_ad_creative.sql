-- Reklam deneyi — ikinci faktor: KREATIF
--
-- Ilk kurgu yalnizca konu uyumunu (arm) olcuyordu. Tasarimlar serbest
-- birakilinca daha guzel afislere sahip kol kazanir ve sonuc konu uyumu
-- hakkinda hicbir sey soylemez. Bu yuzden tasarim da olculen bir
-- degisken oluyor:
--
--   arm       contextual | offset   Sayfanin konusuyla ortusuyor mu?
--   creative  plain      | styled   Tek tip sade mi, kendi tarzi mi?
--
-- Ayni markanin iki afisi ayni "brand" degerini paylasiyor; boylece
-- "Superdamping'in hangi kreatifi daha iyi calisti" sorusu tek satirlik
-- bir gruplamayla cevaplanabiliyor.
--
-- viewer: okuru taniyor muyuz? Sitede okur girisi henuz yok, elimizdeki
-- tek gercek sinyal bulten abonesi olup olmadigi (abone olurken birakilan
-- cerez). Persona hedeflemesi bir okur hesabi modeli gerektiriyor; bu
-- sutun o geldigi gun de ayni yerde durmaya devam edecek.

ALTER TABLE ads ADD COLUMN IF NOT EXISTS creative text;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS brand text;

ALTER TABLE ad_events ADD COLUMN IF NOT EXISTS creative text;
ALTER TABLE ad_events ADD COLUMN IF NOT EXISTS brand text;
-- anon | member
ALTER TABLE ad_events ADD COLUMN IF NOT EXISTS viewer text;

CREATE INDEX IF NOT EXISTS ads_brand_idx ON ads (brand);
CREATE INDEX IF NOT EXISTS ad_events_creative_idx ON ad_events (creative);
CREATE INDEX IF NOT EXISTS ad_events_brand_idx ON ad_events (brand);
CREATE INDEX IF NOT EXISTS ad_events_viewer_idx ON ad_events (viewer);

-- Gun ve saat kirilimi icin ayri sutun ACMIYORUZ: created_at zaten
-- duruyor, tureti sutun ayni bilgiyi ikinci kez saklayip tutarsizlik
-- riski dogururdu. Rapor tarafinda date_part ile cikariliyor.
CREATE INDEX IF NOT EXISTS ad_events_created_at_idx ON ad_events (created_at);
