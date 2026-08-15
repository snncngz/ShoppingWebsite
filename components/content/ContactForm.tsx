"use client";

import { useState, type FormEvent } from "react";

const fieldClass =
  "mt-2 h-12 w-full border border-border bg-ivory px-4 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe";

const areaClass =
  "mt-2 min-h-32 w-full border border-border bg-ivory px-4 py-3 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setSent(false);
      setError("Tüm alanlar zorunludur.");
      return;
    }

    if (!emailPattern.test(email.trim())) {
      setSent(false);
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }

    setError("");
    setSent(true);
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <label className="text-12 tracking-label text-charcoal">
        Ad
        <input
          type="text"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="text-12 tracking-label text-charcoal">
        E-posta
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="text-12 tracking-label text-charcoal">
        Konu
        <input
          type="text"
          name="subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="text-12 tracking-label text-charcoal">
        Mesaj
        <textarea
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={areaClass}
        />
      </label>

      {error ? <p className="text-14 text-accent">{error}</p> : null}
      {sent ? (
        <p className="text-14 text-charcoal">
          Mesajınız alındı. En kısa sürede dönüş yapacağız.
        </p>
      ) : null}

      <button
        type="submit"
        className="mt-2 inline-flex h-12 items-center justify-center bg-charcoal text-12 tracking-nav text-ivory transition-colors hover:bg-black"
      >
        Gönder
      </button>
    </form>
  );
}
