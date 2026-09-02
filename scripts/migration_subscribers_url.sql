-- Abonenin hangi sayfadayken kaydoldugu.
-- Kaynak alani hangi FORM oldugunu soyluyor (footer/dispatch/article);
-- bu alan hangi SAYFA oldugunu soyluyor. Ozellikle yazi sayfalarindaki
-- form icin degerli: hangi yazinin abone getirdigi gorunur oluyor.
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS source_url text;
