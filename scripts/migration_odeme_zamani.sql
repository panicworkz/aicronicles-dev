-- SIPARISIN ODENDIGI AN
--
-- orders tablosunda odemenin NE ZAMAN onaylandigini soyleyen bir alan
-- yoktu: yalnizca payment_status = 'paid' yaziyordu. Bunun iki bedeli
-- var. (1) Raporda "haftalik gelir" siparis tarihine gore
-- hesaplaniyordu; oysa havale ve kapida odemede para gunler sonra
-- geliyor, yani gelir yanlis haftaya yaziliyordu. (2) Bir uyusmazlikta
-- "parayi ne zaman aldik" sorusunun cevabi kayitta yoktu.
--
-- Gecmis kayitlar icin doldurulmuyor: bilmedigimiz bir tarihi
-- uydurmaktansa bos birakmak dogru. Rapor, bos oldugunda siparis
-- tarihine dusuyor ve bunu ekranda soyluyor.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamp;

CREATE INDEX IF NOT EXISTS orders_paid_at_idx ON orders (paid_at);
