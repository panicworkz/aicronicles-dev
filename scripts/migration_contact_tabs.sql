-- Her sabit sayfa, iletisim formunun KENDI sekmesine yonlendirsin.
--
-- Onceki adimda butun mailto baglantilari /contact'a cevrilmisti ama
-- hepsi ayni yere, sekmesiz gidiyordu: reklam sormak isteyen okur
-- "General & corrections" sekmesi acik bir form buluyordu.
--
-- meet.istanbul'daki desen: reklam.html -> iletisim.html?type=reklam.
-- Burada da her sayfa kendi sekmesini aciyor:
--
--   /about                -> ?type=general
--   /advertise            -> ?type=advertising
--   /sponsor              -> ?type=sponsorship
--   /terms-and-conditions -> ?type=licensing
--   /data-and-privacy     -> ?type=privacy

UPDATE pages SET content_html = replace(content_html, 'href="/contact"', 'href="/contact?type=general"'),     updated_at = now() WHERE slug = 'about';
UPDATE pages SET content_html = replace(content_html, 'href="/contact"', 'href="/contact?type=advertising"'), updated_at = now() WHERE slug = 'advertise';
UPDATE pages SET content_html = replace(content_html, 'href="/contact"', 'href="/contact?type=sponsorship"'), updated_at = now() WHERE slug = 'sponsor';
UPDATE pages SET content_html = replace(content_html, 'href="/contact"', 'href="/contact?type=licensing"'),   updated_at = now() WHERE slug = 'terms-and-conditions';
UPDATE pages SET content_html = replace(content_html, 'href="/contact"', 'href="/contact?type=privacy"'),     updated_at = now() WHERE slug = 'data-and-privacy';
