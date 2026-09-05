"use client";

import { useState, type FormEvent } from "react";

import { useAuth } from "@/context/AuthContext";
import { getAuthErrorMessage } from "@/lib/authApi";

const fieldClass =
  "mt-2 h-12 w-full border border-border bg-ivory px-4 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe";

export function AccountProfileForm() {
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [addressTitle, setAddressTitle] = useState(user?.addressTitle || "Ev");
  const [addressLine, setAddressLine] = useState(user?.addressLine ?? "");
  const [addressCity, setAddressCity] = useState(user?.addressCity ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  if (!user) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");
    try {
      await updateProfile({
        name: `${firstName} ${lastName}`.trim() || user.firstName,
        phone: phone.trim(),
        addressTitle: addressTitle.trim() || "Ev",
        addressLine: addressLine.trim(),
        addressCity: addressCity.trim(),
      });
      setSuccess("Profil kaydedildi.");
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 grid gap-5 sm:grid-cols-2">
      <label className="text-12 tracking-label text-charcoal">
        Ad
        <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className={fieldClass} />
      </label>
      <label className="text-12 tracking-label text-charcoal">
        Soyad
        <input value={lastName} onChange={(event) => setLastName(event.target.value)} className={fieldClass} />
      </label>
      <label className="text-12 tracking-label text-charcoal sm:col-span-2">
        Telefon
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="text-12 tracking-label text-charcoal">
        Adres başlığı
        <input
          value={addressTitle}
          onChange={(event) => setAddressTitle(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="text-12 tracking-label text-charcoal">
        İlçe / Şehir
        <input
          value={addressCity}
          onChange={(event) => setAddressCity(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="text-12 tracking-label text-charcoal sm:col-span-2">
        Ev adresi
        <input
          value={addressLine}
          onChange={(event) => setAddressLine(event.target.value)}
          className={fieldClass}
        />
      </label>
      {error ? <p className="text-14 text-accent sm:col-span-2">{error}</p> : null}
      {success ? <p className="text-14 text-charcoal sm:col-span-2">{success}</p> : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center bg-charcoal px-8 text-12 tracking-nav text-ivory hover:bg-black disabled:opacity-60"
        >
          {pending ? "Kaydediliyor" : "Profili kaydet"}
        </button>
      </div>
    </form>
  );
}
