-- Reklamin ANA SAYFADA cikip cikmayacagi.
--
-- Once ana sayfa "hedefi olmayan reklam" demekti: kategori ve etiket
-- listesi bos olan her reklam orada cikiyordu. Bu, CMS'te ana sayfayi
-- yonetilemez yapiyordu — reklami ana sayfaya koymanin ya da oradan
-- almanin bir yolu yoktu, ancak butun hedefleri silerek olabiliyordu ve
-- o da reklami her yere birden aciyordu.
ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_home boolean NOT NULL DEFAULT false;
