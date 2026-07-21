"use client";

import { useEffect, useState } from "react";
import type { BlogPost } from "@/lib/blog-posts";

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/blog");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al cargar blog");
        if (!cancelled) setPosts(data.posts ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar blog");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { posts, loading, error };
}

export function useBlogPost(slug: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/blog/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Artículo no encontrado");
        if (!cancelled) setPost(data.post ?? null);
      } catch (e) {
        if (!cancelled) {
          setPost(null);
          setError(e instanceof Error ? e.message : "Artículo no encontrado");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  return { post, loading, error };
}
