-- Sitede hicbir yerde e-posta adresi yazmamali.
--
-- Bes sabit sayfa "support@fabelo.io" diye mailto baglantisi
-- tasiyordu. Adres duz metin olarak sayfada durunca toplayici botlarin
-- isine yariyor ve okuru posta programini acmaya zorluyor. Butun
-- iletisim /contact formundan geciyor.
--
-- Cumleler korunuyor; degisen yalnizca baglantinin nereye gittigi ve
-- gorunen metin. "Reach us at <adres>" -> "Reach us through the
-- contact form" gibi, cumle akisi bozulmadan.

UPDATE pages
SET content_html = replace(
      content_html,
      '<a href="mailto:support@fabelo.io">support@fabelo.io</a>',
      '<a href="/contact">the contact form</a>'
    ),
    updated_at = now()
WHERE content_html LIKE '%mailto:support@fabelo.io%';

-- "Reach us at the contact form" bozuk okunuyor; edati duzeltiyoruz.
UPDATE pages
SET content_html = replace(content_html, 'Reach us at <a href="/contact">', 'Reach us through <a href="/contact">'),
    updated_at = now()
WHERE content_html LIKE '%Reach us at <a href="/contact">%';

UPDATE pages
SET content_html = replace(content_html, 'contact us at <a href="/contact">', 'contact us through <a href="/contact">'),
    updated_at = now()
WHERE content_html LIKE '%contact us at <a href="/contact">%';

UPDATE pages
SET content_html = replace(content_html, 'goals at <a href="/contact">', 'goals through <a href="/contact">'),
    updated_at = now()
WHERE content_html LIKE '%goals at <a href="/contact">%';
