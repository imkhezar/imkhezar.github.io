-- ============================================================
-- Schema for Muhammad Khezar's portfolio site
-- Run this once against your Neon database to create the tables.
-- (Neon dashboard → SQL Editor → paste this whole file → Run)
-- ============================================================

-- Services shown on services.html (gig-style cards)
CREATE TABLE IF NOT EXISTS services (
  id            SERIAL PRIMARY KEY,
  category      TEXT NOT NULL,           -- e.g. "Development", "SEO", "Design"
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  delivery_time TEXT,                    -- e.g. "1-day delivery", "Ongoing, monthly"
  price_type    TEXT NOT NULL DEFAULT 'quote', -- 'fixed' or 'quote'
  price_label   TEXT,                    -- e.g. "From $30" — only used when price_type = 'fixed'
  details       TEXT[],                  -- bullet points shown under "Show more"
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Portfolio items shown on the homepage scrollable strip
CREATE TABLE IF NOT EXISTS portfolio_items (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  caption       TEXT NOT NULL,
  image_url     TEXT NOT NULL,           -- path or URL to the thumbnail
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keeps updated_at accurate on every edit
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_services_updated_at ON services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_portfolio_items_updated_at ON portfolio_items;
CREATE TRIGGER trg_portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Seed data — your current 8 services and 3 portfolio items,
-- so the site has real content the moment the API goes live.
-- ============================================================

INSERT INTO services (category, title, description, delivery_time, price_type, price_label, details, sort_order) VALUES
('Development', 'WordPress installation & theme setup', 'Your WordPress site installed, themed and ready to customise in one day.', '1-day delivery', 'fixed', 'From $30',
  ARRAY['WordPress core installation','Theme installation & configuration','Demo content import','Essential plugin setup'], 1),

('Development', 'Shopify store setup', 'A new Shopify store configured end to end — theme, products, payments and shipping.', '3-day delivery', 'quote', NULL,
  ARRAY['Theme selection & customisation','Product & collection setup','Payment & shipping configuration','Basic app installation'], 2),

('Paid Ads', 'Meta Ads account setup', 'Professional setup of your Facebook & Instagram ads account, ready to launch campaigns.', '1-day delivery', 'fixed', 'From $25',
  ARRAY['Business Manager & ad account setup','Pixel & conversion tracking install','Audience & campaign structure ready to launch'], 3),

('Paid Ads', 'Google Ads campaign setup', 'Search, Shopping or Performance Max campaigns built and structured for real ROI.', '2-day delivery', 'quote', NULL,
  ARRAY['Keyword & audience research','Campaign, ad group & ad copy setup','Conversion tracking & GA4 linkage'], 4),

('SEO', 'SEO audit & keyword research', 'A full technical and on-page audit, plus a keyword plan built around real search intent.', '3-day delivery', 'quote', NULL,
  ARRAY['Technical SEO audit (speed, indexing, structure)','On-page content review','Keyword & competitor research report'], 5),

('Marketing', 'Social media management', 'Ongoing content, posting and community management for your brand''s social channels.', 'Ongoing, monthly', 'quote', NULL,
  ARRAY['Monthly content calendar','Post design & scheduling','Community replies & basic reporting'], 6),

('Design', 'Graphic design for ads & social', 'Static and motion graphics for ad creatives, social posts and promotional banners.', '2-day delivery', 'quote', NULL,
  ARRAY['Ad creative design (static & motion)','Social post templates','Source files provided'], 7),

('Support', 'Website maintenance & customer support', 'Ongoing site updates, troubleshooting and customer support for your store or website.', 'Ongoing, monthly', 'quote', NULL,
  ARRAY['Regular updates & backups','Bug fixes & troubleshooting','Customer support & ticket handling'], 8)
ON CONFLICT DO NOTHING;

INSERT INTO portfolio_items (title, caption, image_url, sort_order) VALUES
('Ads & Motion Design', 'Motion design, Facebook & Instagram ad posts', 'images/thumb-ads-motion.svg', 1),
('WordPress Builds', 'WordPress / Bootstrap / HTML, CSS, JS builds', 'images/thumb-wordpress.svg', 2),
('Web Design Presentations', 'Web design video presentations', 'images/thumb-webdesign.svg', 3)
ON CONFLICT DO NOTHING;