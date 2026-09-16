-- The application role the Worker connects as.
-- Deliberately NOT the table owner and explicitly NOBYPASSRLS, so the RLS
-- policies in db/migrations/000004 are a real protection layer.
CREATE ROLE app LOGIN PASSWORD 'app' NOBYPASSRLS;
