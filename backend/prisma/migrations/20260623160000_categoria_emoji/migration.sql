-- AlterTable
ALTER TABLE "categoria" ADD COLUMN "emoji" TEXT NOT NULL DEFAULT '✨';

UPDATE "categoria" SET "emoji" = '📦' WHERE "nombre" = 'Sin Categoria';
UPDATE "categoria" SET "emoji" = '🏠' WHERE "nombre" = 'Hogar';
UPDATE "categoria" SET "emoji" = '💍' WHERE "nombre" = 'Accesorios';
UPDATE "categoria" SET "emoji" = '💄' WHERE "nombre" = 'Belleza';
UPDATE "categoria" SET "emoji" = '🎁' WHERE "nombre" = 'Regalos';
UPDATE "categoria" SET "emoji" = '📒' WHERE "nombre" = 'Papelería';
UPDATE "categoria" SET "emoji" = '🕯️' WHERE "nombre" = 'Decoración';
