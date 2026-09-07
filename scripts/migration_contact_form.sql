-- Iletisim formunun sekmeleri ve alanlari panelden yonetilsin.
--
-- Once ikisi de kodda duruyordu (contact/sekmeler.ts). Yeni bir sekme
-- acmak ya da bir butce araligini degistirmek kod degisikligi ve
-- yeniden derleme istiyordu.
--
-- `key` adres parametresidir: /contact?type=advertising. Sabit
-- sayfalardaki baglantilar bu degeri kullaniyor.

CREATE TABLE IF NOT EXISTS contact_tabs (
  id            serial PRIMARY KEY,
  key           text NOT NULL UNIQUE,
  no            text NOT NULL DEFAULT '01',
  title         text NOT NULL,
  summary       text,
  -- Bu sekmeyi acan sabit sayfa; yalnizca kayit icin.
  page          text,
  message_label text NOT NULL DEFAULT 'Your message',
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamp NOT NULL DEFAULT now(),
  updated_at    timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_tabs_sort_idx ON contact_tabs (sort_order);

-- Ortak alanlar (ad, kurum, e-posta, telefon, mesaj) formda sabit;
-- burada yalnizca KONUYA ozel olanlar duruyor.
CREATE TABLE IF NOT EXISTS contact_fields (
  id         serial PRIMARY KEY,
  tab_id     integer NOT NULL REFERENCES contact_tabs(id) ON DELETE CASCADE,
  name       text NOT NULL,
  label      text NOT NULL,
  type       text NOT NULL DEFAULT 'text',   -- text | select
  hint       text,
  required   boolean NOT NULL DEFAULT false,
  options    jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_fields_tab_id_idx ON contact_fields (tab_id);
