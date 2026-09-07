import React from "react";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { magazaAcik } from "@/lib/magaza-durumu";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import SearchClient from "./SearchClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Articles & Guides | Fabelo",
  description: "Search across all personal finance, career, and AI productivity stories.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const resolvedParams = await searchParams;
  const initialQuery = resolvedParams.q || "";
  const initialCategory = resolvedParams.category || "";

  const posts = await db.query.posts.findMany({
    where: eq(schema.posts.status, "published"),
    orderBy: [desc(schema.posts.publishedAt)],
    limit: 60,
  });

  /* Urunler yalnizca magaza ACIKKEN aramaya giriyor. Kapaliyken
     eklemek, disariya kapali bir dukkani arama sonuclarindan sizdirmak
     olurdu — magaza acilinca kendiliginden devreye giriyor. */
  const urunler = (await magazaAcik())
    ? await db.query.products.findMany({
        where: eq(schema.products.status, "published"),
        orderBy: [desc(schema.products.createdAt)],
        limit: 40,
      })
    : [];

  const categories = await db.query.categories.findMany();
  const authors = await db.query.authors.findMany();

  return (
    <div className="mag min-h-screen">
      <MagazineHeader />

      <main className="mag-wrap py-12 sm:py-16">
        <SearchClient
          initialQuery={initialQuery}
          initialCategory={initialCategory}
          posts={posts}
          urunler={urunler as any[]}
          categories={categories}
          authors={authors}
        />
      </main>

      <MagazineFooter />
    </div>
  );
}
