-- Reklam hedefleme ve olay kaydi.
--
-- NEDEN: "ortusen marka mi daha iyi calisiyor" sorusunu mevcut yapiyla
-- cevaplayamiyorduk. Iki eksik vardi:
--   1. Reklamin hangi sayfada cikacagini soyleyecek bir alan yoktu;
--      secim tamamen rastgeleydi.
--   2. impressions/clicks reklam satirinda biriken iki sayiydi. Bir
--      reklam bes sayfada donunce tek rakam cikiyor, tiklamanin hangi
--      baglamdan geldigi kaybediliyordu.
--
-- Bu goc ikisini de kapatiyor: hedefleme alanlari ve her olayi kendi
-- baglamiyla saklayan bir tablo.

ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_categories text[] DEFAULT '{}';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_tags       text[] DEFAULT '{}';
-- Deneydeki kol: konuyla ortusen mi, ortusmeyen mi. Bos = deney disi.
ALTER TABLE ads ADD COLUMN IF NOT EXISTS arm text;

COMMENT ON COLUMN ads.target_categories IS 'Bos dizi = her kategoride cikabilir';
COMMENT ON COLUMN ads.target_tags       IS 'Bos dizi = her etikette cikabilir';
COMMENT ON COLUMN ads.arm               IS 'contextual | offset | NULL';

CREATE TABLE IF NOT EXISTS ad_events (
  id           bigserial PRIMARY KEY,
  ad_id        integer NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  kind         text    NOT NULL,          -- impression | click
  page_path    text,
  context_type text,                      -- home | category | tag | author | article
  context_slug text,
  -- Kol olayin YASANDIGI andaki degeriyle saklaniyor; reklamin kolu
  -- sonradan degisirse gecmis olcum bozulmasin.
  arm          text,
  created_at   timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_events_ad_idx      ON ad_events(ad_id);
CREATE INDEX IF NOT EXISTS ad_events_kind_idx    ON ad_events(kind);
CREATE INDEX IF NOT EXISTS ad_events_context_idx ON ad_events(context_type, context_slug);
CREATE INDEX IF NOT EXISTS ad_events_created_idx ON ad_events(created_at);

-- Dil de olculen bir degisken: ortusmeyen kolun 9/12'si Turkce siteye
-- gidiyor. Kol dusuk cikarsa "konu uymadi" mi "okuyamadi" mi ayirmak
-- icin dilin de kayda gecmesi gerekiyor.
ALTER TABLE ads       ADD COLUMN IF NOT EXISTS dest_lang text;
ALTER TABLE ad_events ADD COLUMN IF NOT EXISTS dest_lang text;
COMMENT ON COLUMN ads.dest_lang IS 'Hedef sitenin dili: en | tr';
CREATE INDEX IF NOT EXISTS ad_events_lang_idx ON ad_events(dest_lang);
