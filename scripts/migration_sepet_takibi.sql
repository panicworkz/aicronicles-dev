-- SEPET TAKIBI
--
-- Sepet bugune kadar yalnizca TARAYICIDA duruyordu (localStorage).
-- Dogru bir tercihti: sunucuda tutmak oturum, cerez ve temizlik isi
-- demek. Ama bir bedeli vardi — sepete urun konup birakildiginda
-- bunu gorecek hicbir kayit yoktu. "Kac kisi sepete koydu, kaci
-- siparise dondu, unutulan sepette ne kadar para duruyor" sorulari
-- cevapsizdi.
--
-- Bu tablo sepetin GOLGESI: tarayici yine kendi sepetini tutuyor,
-- sunucu yalnizca ne oldugunu kaydediyor.
--
-- KISISEL VERI: e-posta ancak odeme adiminda YAZILDIGINDA kaydediliyor.
-- O ana kadar elimizde yalnizca rastgele bir belirtec (token) ve urun
-- listesi var — kimseye ait degil. Saklama suresi sinirli, temizligi
-- asagidaki notta.

CREATE TABLE IF NOT EXISTS carts (
  id            serial PRIMARY KEY,
  -- Tarayicinin urettigi rastgele kimlik. Cerez degil: localStorage'da
  -- duruyor ve yalnizca bu sepeti tanimaya yariyor.
  token         text NOT NULL UNIQUE,
  -- Odeme adiminda yazildiysa. Yazilmadiysa sepetin sahibi bilinmiyor
  -- ve bu normal.
  email         text,
  name          text,
  items_json    jsonb NOT NULL DEFAULT '[]',
  item_count    integer NOT NULL DEFAULT 0,
  subtotal      numeric(10,2) NOT NULL DEFAULT '0.00',
  currency      text NOT NULL DEFAULT 'USD',
  -- active | ordered
  -- "abandoned" YAZILMIYOR, hesaplaniyor: son hareketin uzerinden
  -- gecen sure. Durum olarak yazsaydik onu gunceleyecek bir zamanlanmis
  -- is gerekirdi ve o is calismadiginda rapor sessizce yalan soylerdi.
  status        text NOT NULL DEFAULT 'active',
  order_id      integer REFERENCES orders(id) ON DELETE SET NULL,
  ordered_at    timestamp,
  created_at    timestamp NOT NULL DEFAULT now(),
  updated_at    timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS carts_status_idx     ON carts (status);
CREATE INDEX IF NOT EXISTS carts_updated_at_idx ON carts (updated_at);
CREATE INDEX IF NOT EXISTS carts_email_idx      ON carts (email);
