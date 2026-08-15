export const AUTH_STORAGE_KEY = "velora-auth";
export const ORDER_SEQ_KEY = "velora-order-seq";
export const NEXT_ORDER_SEQUENCE_START = 10248;
export const EXPRESS_SHIPPING_FEE = 249;

export const DEMO_USER = {
  id: "demo-ece",
  firstName: "Ece",
  lastName: "Arslan",
  phone: "+90 532 415 08 21",
  createdAt: "2024-03-12T10:00:00.000Z",
} as const;

export const DEMO_ADDRESS = {
  title: "Ev",
  line: "Teşvikiye Mah. Abdi İpekçi Cad. No:12 Daire:5",
  city: "Şişli / İstanbul",
  full: "Teşvikiye Mah. Abdi İpekçi Cad. No:12 Daire:5, Şişli / İstanbul",
} as const;
