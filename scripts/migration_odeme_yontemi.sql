-- Siparise ODEME YONTEMI eklenir.
--
-- Tabloda yalnizca stripe_payment_intent_id vardi: yani sema tek bir
-- saglayiciya gore yazilmisti. Fabelo ise once HAVALE ve KAPIDA ODEME
-- ile satacak; kart odemesi sonra gelecek (globalde Stripe, Turkiye'de
-- PayTR/iyzico gibi bir ortak). Saglayiciya bagli olmayan bir alan
-- olmadan bu iki yontem hicbir yerde kayitli olmazdi.
--
-- payment_method — parayi NASIL aliyoruz:
--   bank_transfer     havale/EFT
--   cash_on_delivery  kapida odeme
--   card              sonra gelecek
--
-- payment_reference — havalede dekont/aciklama notu, kartta saglayici
-- referansi. Tek alan, cunku ikisi de ayni isi goruyor: "bu parayi
-- hangi kayitla eslestirdik".
--
-- Ikisi de NULL olabilir: eski siparisler (bu tarihten oncekiler)
-- bilinmiyor, ve sonradan degisebiliyor.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference text;

-- Panelde "odeme bekleyen havaleler" listesi bunun uzerinden cikacak.
CREATE INDEX IF NOT EXISTS orders_payment_method_idx ON orders (payment_method);
