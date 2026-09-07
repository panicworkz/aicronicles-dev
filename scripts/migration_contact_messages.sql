-- Iletisim formu mesajlari CMS'e giriyor.
--
-- Once mesaj YALNIZCA merkezi gateway'e iletiliyordu. Iki eksigi vardi:
--   1. SMTP ya da gateway dusse mesaj sitenin tarafinda hic iz
--      birakmadan kayboluyordu.
--   2. Panelde iletisim diye bir ekran yoktu; "bu mesaji cevapladim"
--      diyebilecegin bir yer de yoktu.
--
-- Artik bulten aboneligiyle ayni sira isliyor: once bu tabloya yaz,
-- sonra gateway'e ilet, iletimin sonucunu gateway_status'a isle.

CREATE TABLE IF NOT EXISTS contact_messages (
  id             serial PRIMARY KEY,
  -- Formdaki sekme: general | advertising | sponsorship | licensing | privacy
  topic          text NOT NULL DEFAULT 'general',
  -- Sekmenin okunabilir adi. Sekme kodu sonradan degisse bile kayit
  -- hangi konuda geldigini kendi icinde tasisin.
  topic_label    text,
  name           text NOT NULL,
  email          text NOT NULL,
  organization   text,
  phone          text,
  subject        text,
  message        text NOT NULL,
  -- Sekmeye ozel alanlar (format, butce, hangi yazi...). Sekmeler
  -- degisebildigi icin sabit sutun degil, etiket -> deger.
  fields         jsonb,
  source_url     text,
  ip             text,
  user_agent     text,
  -- new | read | replied | archived
  status         text NOT NULL DEFAULT 'new',
  -- sent | failed
  gateway_status text,
  created_at     timestamp NOT NULL DEFAULT now(),
  updated_at     timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_messages_status_idx     ON contact_messages (status);
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON contact_messages (created_at);
