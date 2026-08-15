import { getCartLineKey } from "@/lib/cart";
import type { Order } from "@/types";

export const demoOrders: Order[] = [
  {
    id: "BTQ-10248",
    userId: "demo-ece",
    items: [
      {
        id: getCartLineKey("oversize-orme-tshirt", "Fildişi", "M"),
        productId: "oversize-orme-tshirt",
        quantity: 2,
        color: "Fildişi",
        size: "M",
      },
      {
        id: getCartLineKey("deri-minimal-kemer", "Siyah", "85"),
        productId: "deri-minimal-kemer",
        quantity: 1,
        color: "Siyah",
        size: "85",
      },
    ],
    subtotal: 5670,
    shipping: 0,
    total: 5670,
    status: "delivered",
    createdAt: "2026-05-18T14:20:00.000Z",
  },
  {
    id: "BTQ-10241",
    userId: "demo-ece",
    items: [
      {
        id: getCartLineKey("woody-amber-edp", "Amber", "100 ml"),
        productId: "woody-amber-edp",
        quantity: 1,
        color: "Amber",
        size: "100 ml",
      },
    ],
    subtotal: 3490,
    shipping: 0,
    total: 3490,
    status: "confirmed",
    createdAt: "2026-07-02T09:15:00.000Z",
  },
  {
    id: "BTQ-10233",
    userId: "demo-ece",
    items: [
      {
        id: getCartLineKey("relaxed-tailored-pantolon", "Kömür", "38"),
        productId: "relaxed-tailored-pantolon",
        quantity: 1,
        color: "Kömür",
        size: "38",
      },
      {
        id: getCartLineKey("silk-touch-crew-tshirt", "Siyah", "S"),
        productId: "silk-touch-crew-tshirt",
        quantity: 1,
        color: "Siyah",
        size: "S",
      },
    ],
    subtotal: 4780,
    shipping: 0,
    total: 4780,
    status: "delivered",
    createdAt: "2026-03-09T16:40:00.000Z",
  },
  {
    id: "BTQ-10219",
    userId: "demo-ece",
    items: [
      {
        id: getCartLineKey("soft-grain-leather-tote", "Kum", "Tek Beden"),
        productId: "soft-grain-leather-tote",
        quantity: 1,
        color: "Kum",
        size: "Tek Beden",
      },
    ],
    subtotal: 6490,
    shipping: 0,
    total: 6490,
    status: "shipped",
    createdAt: "2026-08-01T11:05:00.000Z",
  },
];

export const orderAddresses: Record<string, string> = {
  "BTQ-10248":
    "Teşvikiye Mah. Abdi İpekçi Cad. No:12 Daire:5, Şişli / İstanbul",
  "BTQ-10241":
    "Teşvikiye Mah. Abdi İpekçi Cad. No:12 Daire:5, Şişli / İstanbul",
  "BTQ-10233":
    "Cihangir Mah. Akyol Sok. No:7 Daire:3, Beyoğlu / İstanbul",
  "BTQ-10219":
    "Teşvikiye Mah. Abdi İpekçi Cad. No:12 Daire:5, Şişli / İstanbul",
};

export function getOrderById(id: string): Order | undefined {
  const normalized = id.replace(/^#/, "");
  return demoOrders.find((order) => order.id === normalized);
}
