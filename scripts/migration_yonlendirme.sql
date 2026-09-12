-- KALICI YONLENDIRMELER
--
-- Bir yazinin adresi degistiginde ya da iki yazi birlestiginde eski
-- adrese gelen okuru ve arama motorunu yeni adrese gondermek gerekir.
-- Bugune kadar boyle bir yol yoktu: eski adres 404 donuyordu, yani
-- o adrese verilmis butun dis baglantilar ve arama sirasindaki yeri
-- bir anda cope gidiyordu.
--
-- 404 ile yonlendirme arasindaki fark: 404 "burasi yok" der ve
-- birikmis deger kaybolur; kalici yonlendirme "burasi suraya tasindi"
-- der ve deger yeni adrese gecer.

CREATE TABLE IF NOT EXISTS redirects (
  id          serial PRIMARY KEY,
  from_slug   text NOT NULL UNIQUE,
  to_slug     text NOT NULL,
  -- Neden tasindi. Alti ay sonra bakan birinin "bu neydi" dememesi
  -- icin; kod yorumunun veritabanindaki karsiligi.
  note        text,
  created_at  timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS redirects_from_slug_idx ON redirects (from_slug);
