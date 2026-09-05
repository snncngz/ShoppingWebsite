"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import Link from "next/link";

import { EmptyState } from "@/components/category/EmptyState";
import { CartSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import { EXPRESS_SHIPPING_FEE } from "@/lib/auth";
import {
  FREE_SHIPPING_THRESHOLD,
  GIFT_WRAP_FEE,
  getShippingFee,
} from "@/lib/cart";
import { displayPricing, toPricedProduct } from "@/lib/pricing";
import { formatOrderNumber, nextCheckoutOrderNumber } from "@/lib/orders";
import { createOrder, mergeCart } from "@/lib/shopApi";
import { formatPrice } from "@/lib/utils";

const fieldClass =
  "mt-2 h-12 w-full border border-border bg-ivory px-4 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe";

type ShippingMethod = "standard" | "express";
type PaymentMethod = "card" | "transfer" | "cod";

export function CheckoutView() {
  const { items, hydrated, clearCart } = useCart();
  const { getById } = useCatalog();
  const { user, isLoggedIn } = useAuth();
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [giftWrap, setGiftWrap] = useState(false);
  const [name, setName] = useState(
    user ? `${user.firstName} ${user.lastName}`.trim() : "",
  );
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.addressLine ?? "");
  const [city, setCity] = useState(user?.addressCity ?? "");

  useEffect(() => {
    if (!user) {
      return;
    }

    setName((current) => current || `${user.firstName} ${user.lastName}`.trim());
    setEmail((current) => current || user.email);
    setPhone((current) => current || user.phone || "");
    setAddress((current) => current || user.addressLine || "");
    setCity((current) => current || user.addressCity || "");
  }, [user]);

  const lines = useMemo(
    () =>
      items
        .map((item) => {
          const product = getById(item.productId);
          if (!product) {
            return null;
          }
          return { item, product };
        })
        .filter((line): line is NonNullable<typeof line> => Boolean(line)),
    [getById, items],
  );

  const subtotal = lines.reduce((total, line) => {
    const unit = displayPricing(toPricedProduct(line.product), line.item.size).price;
    return total + unit * line.item.quantity;
  }, 0);
  const discount = lines.reduce((total, line) => {
    const pricing = displayPricing(toPricedProduct(line.product), line.item.size);
    const compareAt =
      pricing.oldPrice && pricing.oldPrice > pricing.price
        ? pricing.oldPrice
        : pricing.discountPercent && pricing.listPrice > pricing.price
          ? pricing.listPrice
          : undefined;
    if (!compareAt) {
      return total;
    }
    return total + (compareAt - pricing.price) * line.item.quantity;
  }, 0);
  const standardShipping = getShippingFee(subtotal);
  const shipping =
    shippingMethod === "express" ? EXPRESS_SHIPPING_FEE : standardShipping;
  const total = subtotal + shipping + (giftWrap ? GIFT_WRAP_FEE : 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setError("İletişim ve teslimat alanlarını doldurun.");
      return;
    }

    if (!isLoggedIn) {
      const orderNumber = nextCheckoutOrderNumber();
      clearCart();
      setConfirmation(orderNumber);
      setError("");
      return;
    }

    setPending(true);
    setError("");

    try {
      if (items.length > 0) {
        await mergeCart(items);
      }
      const order = await createOrder({ giftWrap });
      clearCart();
      setConfirmation(formatOrderNumber(order.id.slice(0, 8).toUpperCase()));
    } catch {
      const orderNumber = nextCheckoutOrderNumber();
      clearCart();
      setConfirmation(orderNumber);
    } finally {
      setPending(false);
    }
  };

  if (!hydrated) {
    return <CartSkeleton />;
  }

  if (confirmation) {
    return (
      <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title="Ödemeniz Onaylandı"
            message="Siparişiniz alındı. Ödeme doğrulandı, siparişiniz hazırlanıyor."
          />
          <p className="mt-6 text-center font-heading text-24 text-black">
            {confirmation}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/siparislerim"
              className="inline-flex h-12 items-center justify-center bg-charcoal px-8 text-12 tracking-nav text-ivory transition-colors hover:bg-black"
            >
              Siparişlerim
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center border border-charcoal px-8 text-12 tracking-nav text-charcoal transition-colors hover:bg-charcoal hover:text-ivory"
            >
              Alışverişe Devam Et
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title="Sepetiniz Boş"
            message="Ödeme adımına geçmek için sepetinize ürün ekleyin."
            actionHref="/sepet"
            actionLabel="Sepete Dön"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-12 tracking-label text-taupe">Sipariş</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">Ödeme</h1>

        <form
          onSubmit={handleSubmit}
          className="mt-12 grid gap-16 lg:grid-cols-[minmax(0,1fr)_20rem]"
        >
          <div className="flex flex-col gap-12">
            <fieldset>
              <legend className="text-12 tracking-label text-black">
                İletişim Bilgileri
              </legend>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="text-12 tracking-label text-charcoal sm:col-span-2">
                  Ad Soyad
                  <input
                    name="name"
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
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="text-12 tracking-label text-charcoal">
                  Telefon
                  <input
                    type="tel"
                    name="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className={fieldClass}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-12 tracking-label text-black">
                Teslimat Adresi
              </legend>
              <div className="mt-6 grid gap-5">
                <label className="text-12 tracking-label text-charcoal">
                  Adres
                  <input
                    name="address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="text-12 tracking-label text-charcoal">
                  İlçe / Şehir
                  <input
                    name="city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className={fieldClass}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-12 tracking-label text-black">
                Teslimat Yöntemi
              </legend>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  aria-pressed={shippingMethod === "standard"}
                  onClick={() => setShippingMethod("standard")}
                  className={`h-12 flex-1 px-4 text-12 tracking-nav ${
                    shippingMethod === "standard"
                      ? "border border-charcoal bg-charcoal text-ivory"
                      : "border border-border text-charcoal hover:border-taupe"
                  }`}
                >
                  Standart
                  {standardShipping === 0
                    ? " · Ücretsiz"
                    : ` · ${formatPrice(standardShipping)}`}
                </button>
                <button
                  type="button"
                  aria-pressed={shippingMethod === "express"}
                  onClick={() => setShippingMethod("express")}
                  className={`h-12 flex-1 px-4 text-12 tracking-nav ${
                    shippingMethod === "express"
                      ? "border border-charcoal bg-charcoal text-ivory"
                      : "border border-border text-charcoal hover:border-taupe"
                  }`}
                >
                  Hızlı · {formatPrice(EXPRESS_SHIPPING_FEE)}
                </button>
              </div>
            </fieldset>

            <label className="flex min-h-12 cursor-pointer items-start gap-3 border border-border bg-off-white px-4 py-4 text-14 text-charcoal">
              <input
                type="checkbox"
                checked={giftWrap}
                onChange={(event) => setGiftWrap(event.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block text-12 tracking-label text-black">
                  Hediye paketi
                </span>
                <span className="mt-1 block text-14 text-taupe">
                  Ürünleriniz hediye paketiyle gönderilsin · {formatPrice(GIFT_WRAP_FEE)}
                </span>
              </span>
            </label>

            <fieldset>
              <legend className="text-12 tracking-label text-black">
                Ödeme Yöntemi
              </legend>
              {isLoggedIn ? (
                <p className="mt-6 text-14 text-taupe">
                  Kart bilgileri bu aşamada alınmaz. Siparişi onayladığınızda
                  ödeme onaylanmış sayılır ve siparişiniz oluşturulur.
                </p>
              ) : (
                <>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    {(
                      [
                        ["card", "Kredi Kartı"],
                        ["transfer", "Banka Havalesi"],
                        ["cod", "Kapıda Ödeme"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={paymentMethod === value}
                        onClick={() => setPaymentMethod(value)}
                        className={`h-12 flex-1 px-4 text-12 tracking-nav ${
                          paymentMethod === value
                            ? "border border-charcoal bg-charcoal text-ivory"
                            : "border border-border text-charcoal hover:border-taupe"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === "card" ? (
                    <p className="mt-6 text-14 text-taupe">
                      Misafir ödeme demosudur. Kart bilgisi istenmez ve saklanmaz.
                      Gerçek ödeme için giriş yapın.
                    </p>
                  ) : null}

                  {paymentMethod === "transfer" ? (
                    <p className="mt-6 text-14 text-taupe">
                      Sipariş onayından sonra demo IBAN bilgisi e-posta ile iletilir.
                      Gerçek bir havale işlemi yapılmaz.
                    </p>
                  ) : null}

                  {paymentMethod === "cod" ? (
                    <p className="mt-6 text-14 text-taupe">
                      Kapıda ödeme demo seçenektir. Teslimatta ücret tahsil edilmez.
                    </p>
                  ) : null}
                </>
              )}
            </fieldset>

            {error ? <p className="text-14 text-accent">{error}</p> : null}
          </div>

          <aside className="h-fit border border-border bg-off-white p-8 lg:sticky lg:top-24">
            <h2 className="text-12 tracking-label text-black">Sipariş Özeti</h2>
            <ul className="mt-6 flex flex-col gap-4">
              {lines.map(({ item, product }) => (
                <li key={item.id} className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-16 w-12 bg-ivory object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-14 text-black">{product.name}</p>
                    <p className="text-12 text-taupe">
                      {item.quantity} ×{" "}
                      {formatPrice(
                        displayPricing(toPricedProduct(product), item.size).price,
                      )}
                      {item.size ? ` · ${item.size}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-6 flex flex-col gap-3 text-14">
              <div className="flex justify-between">
                <dt className="text-taupe">Ara Toplam</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-taupe">İndirim</dt>
                  <dd className="text-accent">-{formatPrice(discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-taupe">Kargo</dt>
                <dd>
                  {shipping === 0 ? "Ücretsiz Kargo" : formatPrice(shipping)}
                </dd>
              </div>
              {giftWrap ? (
                <div className="flex justify-between">
                  <dt className="text-taupe">Hediye paketi</dt>
                  <dd>{formatPrice(GIFT_WRAP_FEE)}</dd>
                </div>
              ) : null}
              {shippingMethod === "standard" && shipping > 0 ? (
                <p className="text-12 text-taupe">
                  {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} daha ekleyin,
                  kargo ücretsiz olsun.
                </p>
              ) : null}
              <div className="mt-2 flex justify-between border-t border-border pt-4 text-16 text-black">
                <dt>Toplam</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>
            <button
              type="submit"
              disabled={pending}
              className="mt-8 inline-flex h-12 w-full items-center justify-center bg-charcoal text-12 tracking-nav text-ivory transition-colors hover:bg-black disabled:opacity-60"
            >
              {pending ? "Onaylanıyor" : "Siparişi Onayla"}
            </button>
          </aside>
        </form>
      </div>
    </section>
  );
}
