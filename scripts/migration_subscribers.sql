-- Bulten aboneleri tablosu.
-- Abonelik formu bu tabloya yaziyor; gateway'e iletim ayrica yapiliyor.
CREATE TABLE IF NOT EXISTS subscribers (
  id              serial PRIMARY KEY,
  email           text NOT NULL UNIQUE,
  source          text,
  status          text NOT NULL DEFAULT 'active',
  ip              text,
  user_agent      text,
  gateway_status  text,
  created_at      timestamp NOT NULL DEFAULT now(),
  updated_at      timestamp NOT NULL DEFAULT now(),
  unsubscribed_at timestamp
);
CREATE INDEX IF NOT EXISTS subscribers_status_idx     ON subscribers(status);
CREATE INDEX IF NOT EXISTS subscribers_created_at_idx ON subscribers(created_at);
