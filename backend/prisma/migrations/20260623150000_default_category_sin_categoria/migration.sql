INSERT INTO "categoria" ("id", "nombre")
SELECT gen_random_uuid()::text, 'Sin Categoria'
WHERE NOT EXISTS (
  SELECT 1 FROM "categoria" WHERE "nombre" = 'Sin Categoria'
);
