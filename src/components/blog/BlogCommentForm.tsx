"use client";

import { useState } from "react";

type Copy = {
  title: string;
  note: string;
  comment: string;
  name: string;
  email: string;
  submit: string;
  sending: string;
  ok: string;
  err: string;
  errFields: string;
};

type Props = {
  postSlug: string;
  postTitle: string;
  copy: Copy;
};

export function BlogCommentForm({ postSlug, postTitle, copy }: Props) {
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;

    const c = comment.trim();
    const n = name.trim();
    const em = email.trim();
    if (c.length < 3 || n.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setStatus("err");
      setMsg(copy.errFields);
      return;
    }

    setStatus("sending");
    setMsg("");

    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postSlug,
          postTitle,
          comment: c,
          name: n,
          email: em,
          website: hp,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setStatus("err");
        setMsg(typeof data.error === "string" ? data.error : copy.err);
        return;
      }
      setStatus("ok");
      setMsg(copy.ok);
      setComment("");
      setName("");
      setEmail("");
    } catch {
      setStatus("err");
      setMsg(copy.err);
    }
  }

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal";

  return (
    <section className="mt-12 pt-10 border-t border-slate-100" aria-labelledby="blog-comments-title">
      <h2 id="blog-comments-title" className="text-xl font-bold text-slate-900">
        {copy.title}
      </h2>
      <p className="mt-2 text-sm text-slate-500">{copy.note}</p>

      {status === "ok" ? (
        <p className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800" role="status">
          {msg}
        </p>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <label className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          />
        </label>

        <div>
          <label htmlFor="blog-comment" className="block text-sm font-medium text-slate-700">
            {copy.comment} <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="blog-comment"
            name="comment"
            rows={5}
            required
            maxLength={2000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="blog-name" className="block text-sm font-medium text-slate-700">
            {copy.name} <span aria-hidden="true">*</span>
          </label>
          <input
            id="blog-name"
            name="name"
            type="text"
            required
            maxLength={80}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="blog-email" className="block text-sm font-medium text-slate-700">
            {copy.email} <span aria-hidden="true">*</span>
          </label>
          <input
            id="blog-email"
            name="email"
            type="email"
            required
            maxLength={120}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
        </div>

        {status === "err" && msg ? (
          <p className="text-sm text-red-600" role="alert">
            {msg}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl bg-teal hover:bg-teal/90 text-[#070f1a] font-bold text-sm transition-colors disabled:opacity-60"
        >
          {status === "sending" ? copy.sending : copy.submit}
        </button>
      </form>
    </section>
  );
}
