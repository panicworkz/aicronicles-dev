-- content_json KALDIRILIYOR.
-- TipTap'in kendi belge agaciydi; TipTap gittikten sonra hicbir yerde
-- okunmuyordu. Yazilan ama okunmayan bir sutun, ileride "hangisi
-- dogru?" diye sorulacak ikinci bir govde kaynagi olurdu.
ALTER TABLE posts           DROP COLUMN IF EXISTS content_json;
ALTER TABLE post_revisions  DROP COLUMN IF EXISTS content_json;
ALTER TABLE pages           DROP COLUMN IF EXISTS content_json;
ALTER TABLE products        DROP COLUMN IF EXISTS content_json;
