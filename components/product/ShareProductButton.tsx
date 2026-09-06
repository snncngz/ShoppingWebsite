"use client";

import { useState } from "react";

import { Check, Share2 } from "lucide-react";

type ShareProductButtonProps = {
  name: string;
  slug: string;
  className?: string;
  label?: string;
};

export function ShareProductButton({
  name,
  slug,
  className,
  label = "Ürünü paylaş",
}: ShareProductButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/urun/${slug}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      } catch {
        setCopied(false);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void handleShare();
      }}
      className={className}
      aria-label={copied ? "Bağlantı kopyalandı" : "Ürünü paylaş"}
    >
      {copied ? <Check size={16} strokeWidth={1.6} /> : <Share2 size={16} strokeWidth={1.4} />}
      {label ? <span>{copied ? "Kopyalandı" : label}</span> : null}
    </button>
  );
}
