"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { normalizeExternalUrl } from "@/lib/resume";

type LinkPreview = {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
};

export function InteractivePreviewLink({
  href,
  label,
  description,
  compact = false,
}: {
  href: string;
  label: string;
  description?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const normalizedHref = normalizeExternalUrl(href);

  useEffect(() => {
    if (!open || !normalizedHref || preview) {
      return;
    }

    const controller = new AbortController();

    void fetch(`/api/link-preview?url=${encodeURIComponent(normalizedHref)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        return (await response.json()) as LinkPreview;
      })
      .then((data) => {
        if (data) {
          setPreview(data);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [normalizedHref, open, preview]);

  if (!normalizedHref) {
    return null;
  }

  return (
    <div
      className="group relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <a
        href={normalizedHref}
        target="_blank"
        rel="noreferrer"
        className={[
          "inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/42 font-semibold text-[var(--foreground)] transition hover:bg-white",
          compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm",
        ].join(" ")}
      >
        {label}
        <ExternalLink className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </a>

      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0, y: open ? 0 : 8, pointerEvents: open ? "auto" : "none" }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="fixed left-1/2 top-1/2 z-50 w-[380px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[1.4rem] border border-white/45 bg-[rgba(255,255,255,0.82)] shadow-[0_22px_60px_rgba(45,73,88,0.18)] backdrop-blur-2xl sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[340px] sm:-translate-x-0 sm:-translate-y-0"
      >
        {preview?.image ? (
          <div className="relative h-[124px] w-full overflow-hidden">
            <Image
              src={preview.image}
              alt={preview.title}
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(22,49,60,0.68)] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-4 py-3 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-white/80">{preview.siteName}</p>
              <p className="mt-1 text-sm font-semibold">{preview.title}</p>
            </div>
          </div>
        ) : null}
        <div className="border-b border-[rgba(22,49,60,0.08)] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">{preview?.title || label}</p>
          <p className="mt-1 line-clamp-3 text-xs leading-5 text-[rgba(22,49,60,0.62)]">
            {preview?.description || description || normalizedHref}
          </p>
        </div>
        <div className="h-[180px] bg-[rgba(244,239,230,0.85)]">
          <iframe
            src={normalizedHref}
            title={`${label} preview`}
            className="h-full w-full bg-white"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="px-4 py-3 text-xs text-[rgba(22,49,60,0.62)]">
          If the site blocks embedding, the metadata card still gives a preview and the link opens in a new tab.
        </div>
      </motion.div>
    </div>
  );
}
