const TSHIRT_IMAGES = ["/placeholders/tshirt.svg"] as const;
const PANTOLON_IMAGES = ["/placeholders/pantolon.svg"] as const;
const PARFUM_IMAGES = ["/placeholders/parfum.svg"] as const;
const KEMER_IMAGES = ["/placeholders/kemer.svg"] as const;
const CANTA_IMAGES = ["/placeholders/canta.svg"] as const;
const AKSESUAR_IMAGES = ["/placeholders/aksesuar.svg"] as const;

export const PRODUCT_IMAGE_MAP: Record<string, readonly string[]> = {
  "oversize-orme-tshirt": TSHIRT_IMAGES,
  "silk-touch-crew-tshirt": TSHIRT_IMAGES,
  "relaxed-pima-cotton-tshirt": TSHIRT_IMAGES,
  "fine-rib-essential-tshirt": TSHIRT_IMAGES,
  "boxy-heavyweight-tshirt": TSHIRT_IMAGES,
  "soft-modal-v-yaka-tshirt": TSHIRT_IMAGES,
  "structured-shoulder-tshirt": TSHIRT_IMAGES,
  "washed-cotton-longline-tshirt": TSHIRT_IMAGES,
  "relaxed-tailored-pantolon": PANTOLON_IMAGES,
  "wide-leg-yun-pantolon": PANTOLON_IMAGES,
  "high-rise-straight-pantolon": PANTOLON_IMAGES,
  "soft-drape-palazzo-pantolon": PANTOLON_IMAGES,
  "cropped-cigarette-pantolon": PANTOLON_IMAGES,
  "fluid-satin-slip-pantolon": PANTOLON_IMAGES,
  "woody-amber-edp": PARFUM_IMAGES,
  "velvet-oud-edp": PARFUM_IMAGES,
  "white-musk-noir": PARFUM_IMAGES,
  "fig-leaf-santal": PARFUM_IMAGES,
  "citrus-neroli-essence": PARFUM_IMAGES,
  "rose-saffron-elixir": PARFUM_IMAGES,
  "deri-minimal-kemer": KEMER_IMAGES,
  "brushed-buckle-leather-belt": KEMER_IMAGES,
  "sculpted-oval-kemer": KEMER_IMAGES,
  "slim-calfskin-kemer": KEMER_IMAGES,
  "soft-grain-leather-tote": CANTA_IMAGES,
  "structured-mini-shoulder-bag": CANTA_IMAGES,
  "suede-hobo-canta": CANTA_IMAGES,
  "metal-minimalist-bracelet": AKSESUAR_IMAGES,
  "sculptural-hoop-kupe": AKSESUAR_IMAGES,
  "polished-signet-yuzuk": AKSESUAR_IMAGES,
};

export function getProductImages(productId: string): string[] {
  const images = PRODUCT_IMAGE_MAP[productId];

  if (!images) {
    throw new Error(`Missing image mapping for product "${productId}".`);
  }

  return [...images];
}
