-- Siparise ONAY KAYDI eklenir.
--
-- Neden gerekli: Mesafeli Sozlesmeler Yonetmeligi'nin 15. maddesindeki
-- "aninda teslim edilen gayrimaddi urun" istisnasi KENDILIGINDEN
-- islemiyor. Tuketiciye on bilgilendirme yapilmis ve tuketici bunu
-- onaylamis olmali; aksi halde dijital urunde de cayma hakki dogar ve
-- satici bunun aksini ISPAT edemez.
--
-- Yani onay kutusunu ekrana koymak yetmiyor; onayin ALINDIGINI
-- gosteren bir kayit gerekiyor. Iki ayri zaman damgasi:
--
--   terms_accepted_at         on bilgilendirme + sozlesme onayi
--                             (her sipariste zorunlu)
--   digital_waiver_at         dijital uründe cayma hakkinin
--                             bulunmadiginin ayrica onaylanmasi
--                             (yalnizca sepette dijital urun varsa)
--
-- Ikisi AYRI cunku hukuken ayri seyler: birincisi "okudum", ikincisi
-- "bu hakkimdan vazgectigimi biliyorum". Tek kutuya sikistirmak,
-- onayin acikligini tartismali hale getirirdi.
--
-- Zaman damgasi, boolean degil: "onayladi mi" sorusunun yaninda "ne
-- zaman" da duruyor. Bir uyusmazlikta sorulan sey budur.
--
-- Ikisi de NULL olabilir: bu tarihten onceki siparislerde kayit yok.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS digital_waiver_at timestamp;
