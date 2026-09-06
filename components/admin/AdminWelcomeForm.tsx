"use client";

import { useEffect, useState, type FormEvent } from "react";

import { adminRequest, getAdminErrorMessage } from "@/lib/adminApi";
import type { WelcomeSettingsDto } from "@/types/api";

const fieldClass =
  "mt-2 h-12 w-full border border-border bg-ivory px-4 text-14 text-charcoal outline-none focus:border-taupe";
const areaClass =
  "mt-2 min-h-56 w-full border border-border bg-ivory px-4 py-3 text-14 text-charcoal outline-none focus:border-taupe";

export function AdminWelcomeForm() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminRequest<WelcomeSettingsDto>("/api/admin/welcome")
      .then((data) => {
        setSubject(data.welcomeSubject);
        setBody(data.welcomeBody);
      })
      .catch((caught) => setError(getAdminErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    try {
      const data = await adminRequest<WelcomeSettingsDto>("/api/admin/welcome", {
        method: "PUT",
        body: JSON.stringify({
          welcomeSubject: subject,
          welcomeBody: body,
        }),
      });
      setSubject(data.welcomeSubject);
      setBody(data.welcomeBody);
      setNotice("Hoş geldin mesajı kaydedildi. Yeni üyeler bu metni alacak.");
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return <p className="text-14 text-taupe">Yükleniyor</p>;
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="max-w-3xl">
      <p className="text-12 tracking-label text-taupe">Üyelik</p>
      <h1 className="mt-3 font-heading text-32 text-black">Hoş geldin mesajı</h1>
      <p className="mt-3 max-w-xl text-14 text-taupe">
        Yeni üye olduğunda gönderilecek e-posta.{" "}
        <code className="text-charcoal">{"{{name}}"}</code> ve{" "}
        <code className="text-charcoal">{"{{email}}"}</code> yer tutucularını
        kullanabilirsiniz.
      </p>

      <label className="mt-10 block text-12 tracking-label text-charcoal">
        Konu
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="mt-5 block text-12 tracking-label text-charcoal">
        Mesaj
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className={areaClass}
        />
      </label>

      {error ? <p className="mt-6 text-14 text-accent">{error}</p> : null}
      {notice ? <p className="mt-6 text-14 text-charcoal">{notice}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-8 inline-flex h-12 items-center bg-charcoal px-8 text-12 tracking-nav text-ivory hover:bg-black disabled:opacity-60"
      >
        {pending ? "Kaydediliyor" : "Kaydet"}
      </button>
    </form>
  );
}
