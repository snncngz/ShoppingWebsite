"use client";

import { useEffect, useState, type FormEvent } from "react";

import { getAdminErrorMessage } from "@/lib/adminApi";
import { listAdminUsers } from "@/lib/adminUsers";
import type { AdminUserListItemDto, NewsletterSubscriberDto } from "@/types/api";

const fieldClass =
  "mt-2 h-12 w-full border border-border bg-ivory px-4 text-14 text-charcoal outline-none focus:border-taupe";
const areaClass =
  "mt-2 min-h-40 w-full border border-border bg-ivory px-4 py-3 text-14 text-charcoal outline-none focus:border-taupe";

export function AdminMailForm() {
  const [users, setUsers] = useState<AdminUserListItemDto[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriberDto[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedNewsletter, setSelectedNewsletter] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState(false);
  const [allNewsletter, setAllNewsletter] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void listAdminUsers({ page: 1, limit: 50, role: "all" })
      .then((data) => setUsers(data.items))
      .catch(() => setUsers([]));
    void fetch("/api/admin/newsletter", { credentials: "include" })
      .then(async (response) => {
        const payload = (await response.json()) as {
          success?: boolean;
          data?: NewsletterSubscriberDto[];
        };
        if (payload.success && payload.data) {
          setSubscribers(payload.data);
        }
      })
      .catch(() => setSubscribers([]));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/mail", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          allUsers,
          allNewsletter,
          userIds: allUsers ? [] : selectedUsers,
          newsletterIds: allNewsletter ? [] : selectedNewsletter,
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { sent: number; failed: number; skipped: number };
        error?: { message: string };
      };
      if (!response.ok || payload.success === false) {
        setError(payload.error?.message || "E-posta gönderilemedi.");
        return;
      }
      setNotice(
        `${payload.data?.sent ?? 0} ileti gönderildi${
          payload.data?.failed ? `, ${payload.data.failed} başarısız` : ""
        }.`,
      );
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="max-w-3xl">
      <p className="text-12 tracking-label text-taupe">Duyuru</p>
      <h1 className="mt-3 font-heading text-32 text-black">E-posta gönder</h1>
      <p className="mt-3 max-w-xl text-14 text-taupe">
        Üyelere veya bülten listesine kampanya mesajı gönderin. Bir seferde en fazla 100 alıcı.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <fieldset>
          <legend className="text-12 tracking-label text-charcoal">Üyeler</legend>
          <label className="mt-4 flex min-h-11 items-center gap-3 text-14">
            <input
              type="checkbox"
              checked={allUsers}
              onChange={(event) => setAllUsers(event.target.checked)}
            />
            Tüm üyeler
          </label>
          <ul className="mt-3 max-h-64 overflow-auto border border-border bg-off-white p-3">
            {users.map((user) => (
              <li key={user.id}>
                <label className="flex min-h-10 items-center gap-3 text-14">
                  <input
                    type="checkbox"
                    disabled={allUsers}
                    checked={allUsers || selectedUsers.includes(user.id)}
                    onChange={(event) =>
                      setSelectedUsers((current) =>
                        event.target.checked
                          ? [...current, user.id]
                          : current.filter((id) => id !== user.id),
                      )
                    }
                  />
                  <span>
                    {user.name}
                    <span className="block text-12 text-taupe">{user.email}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset>
          <legend className="text-12 tracking-label text-charcoal">Bülten</legend>
          <label className="mt-4 flex min-h-11 items-center gap-3 text-14">
            <input
              type="checkbox"
              checked={allNewsletter}
              onChange={(event) => setAllNewsletter(event.target.checked)}
            />
            Tüm bülten kayıtları
          </label>
          <ul className="mt-3 max-h-64 overflow-auto border border-border bg-off-white p-3">
            {subscribers.length === 0 ? (
              <li className="text-14 text-taupe">Kayıt yok</li>
            ) : (
              subscribers.map((subscriber) => (
                <li key={subscriber.id}>
                  <label className="flex min-h-10 items-center gap-3 text-14">
                    <input
                      type="checkbox"
                      disabled={allNewsletter}
                      checked={allNewsletter || selectedNewsletter.includes(subscriber.id)}
                      onChange={(event) =>
                        setSelectedNewsletter((current) =>
                          event.target.checked
                            ? [...current, subscriber.id]
                            : current.filter((id) => id !== subscriber.id),
                        )
                      }
                    />
                    {subscriber.email}
                  </label>
                </li>
              ))
            )}
          </ul>
        </fieldset>
      </div>

      <label className="mt-8 block text-12 tracking-label text-charcoal">
        Konu
        <input value={subject} onChange={(event) => setSubject(event.target.value)} className={fieldClass} />
      </label>
      <label className="mt-5 block text-12 tracking-label text-charcoal">
        Mesaj
        <textarea value={body} onChange={(event) => setBody(event.target.value)} className={areaClass} />
      </label>

      {error ? <p className="mt-6 text-14 text-accent">{error}</p> : null}
      {notice ? <p className="mt-6 text-14 text-charcoal">{notice}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-8 inline-flex h-12 items-center bg-charcoal px-8 text-12 tracking-nav text-ivory hover:bg-black disabled:opacity-60"
      >
        {pending ? "Gönderiliyor" : "Gönder"}
      </button>
    </form>
  );
}
