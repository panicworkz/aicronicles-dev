-- Abonelikten cikma jetonu.
-- Her aboneye tahmin edilemez bir jeton veriyoruz; e-postadaki baglanti
-- bunu tasiyor. Kimlik dogrulamasi gerekmeden, tek tikla cikilabiliyor
-- ama baskasinin adresini kimse cikaramiyor.
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS unsubscribe_token text;

UPDATE subscribers
   SET unsubscribe_token = encode(gen_random_bytes(24), 'hex')
 WHERE unsubscribe_token IS NULL;

ALTER TABLE subscribers ALTER COLUMN unsubscribe_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS subscribers_unsub_token_idx
  ON subscribers(unsubscribe_token);
