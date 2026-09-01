"use client";

import { SOCIAL_LINKS } from "@/lib/social";

type Props = {
  title: string;
  description: string;
  categoryLabel?: string;
};

export function BlogSocialFollow({ title, description, categoryLabel }: Props) {
  return (
    <section className="mt-10 pt-8 border-t border-slate-100" aria-labelledby="blog-social-title">
      <h2 id="blog-social-title" className="text-lg font-bold text-slate-900">
        {title}
      </h2>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
      <ul className="mt-4 space-y-2 list-none p-0 m-0">
        {SOCIAL_LINKS.map((link) => (
          <li key={link.id}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-dark hover:text-teal underline-offset-2 hover:underline"
            >
              <span aria-hidden="true">{link.emoji}</span>
              <span>
                {link.label}: {link.handle}
              </span>
            </a>
          </li>
        ))}
      </ul>
      {categoryLabel ? (
        <p className="mt-4">
          <span className="inline-block rounded-full bg-teal/15 text-teal-dark text-xs font-semibold px-3 py-1">
            {categoryLabel}
          </span>
        </p>
      ) : null}
    </section>
  );
}
