"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { demoOrders } from "@/data/orders";
import { DEMO_ADDRESS } from "@/lib/auth";
import { formatOrderDate, formatOrderNumber, ORDER_STATUS_LABELS } from "@/lib/orders";

export function AccountDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { count } = useWishlist();

  if (!user) {
    return null;
  }

  const recent = demoOrders.slice(0, 2);

  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-12 tracking-label text-taupe">Account</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">
          Hoş geldin, {user.firstName}
        </h1>
        <p className="mt-4 max-w-xl text-14 text-taupe">
          Siparişlerinizi, adreslerinizi ve favorilerinizi buradan yönetebilirsiniz.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <section className="border border-border bg-off-white p-8">
            <p className="text-12 tracking-label text-taupe">Profil</p>
            <h2 className="mt-3 font-heading text-24 text-black">
              {user.firstName} {user.lastName}
            </h2>
            <dl className="mt-6 flex flex-col gap-3 text-14">
              <div>
                <dt className="text-taupe">E-posta</dt>
                <dd className="text-charcoal">{user.email}</dd>
              </div>
              <div>
                <dt className="text-taupe">Telefon</dt>
                <dd className="text-charcoal">{user.phone}</dd>
              </div>
            </dl>
          </section>

          <section className="border border-border bg-off-white p-8">
            <p className="text-12 tracking-label text-taupe">Favoriler</p>
            <h2 className="mt-3 font-heading text-24 text-black">
              {count} kayıtlı parça
            </h2>
            <p className="mt-3 text-14 text-taupe">
              Beğendiğiniz ürünler listenizde sizi bekliyor.
            </p>
            <Link
              href="/favoriler"
              className="mt-6 inline-flex h-12 items-center justify-center border border-charcoal px-6 text-12 tracking-nav text-charcoal transition-colors hover:bg-charcoal hover:text-ivory"
            >
              Favorilere Git
            </Link>
          </section>

          <section className="border border-border bg-off-white p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-12 tracking-label text-taupe">Siparişler</p>
                <h2 className="mt-3 font-heading text-24 text-black">Son siparişler</h2>
              </div>
              <Link
                href="/siparislerim"
                className="text-12 tracking-nav text-charcoal hover:text-black"
              >
                Tümü
              </Link>
            </div>
            <ul className="mt-6 flex flex-col gap-4">
              {recent.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-4 text-14">
                  <span className="text-charcoal">{formatOrderNumber(order.id)}</span>
                  <span className="text-taupe">
                    {ORDER_STATUS_LABELS[order.status]} · {formatOrderDate(order.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-border bg-off-white p-8">
            <p className="text-12 tracking-label text-taupe">Adresler</p>
            <h2 className="mt-3 font-heading text-24 text-black">{DEMO_ADDRESS.title}</h2>
            <p className="mt-3 text-14 text-charcoal">{DEMO_ADDRESS.full}</p>
          </section>
        </div>

        <section className="mt-6 border border-border bg-off-white p-8">
          <p className="text-12 tracking-label text-taupe">Hesap Ayarları</p>
          <h2 className="mt-3 font-heading text-24 text-black">Oturum</h2>
          <p className="mt-3 text-14 text-taupe">
            Oturumunuz güvenli bir çerez ile tutulur. Çıkış yaptığınızda sepetiniz korunur.
          </p>
          <button
            type="button"
            onClick={() => {
              void logout().then(() => {
                router.push("/");
                router.refresh();
              });
            }}
            className="mt-6 inline-flex h-12 items-center justify-center bg-charcoal px-8 text-12 tracking-nav text-ivory transition-colors hover:bg-black"
          >
            Çıkış Yap
          </button>
        </section>
      </div>
    </section>
  );
}
