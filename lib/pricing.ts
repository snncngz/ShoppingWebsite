import type { PerfumeDetails, Product, VolumePrice } from "@/types";

export type PricedCatalogItem = {
  price: number;
  oldPrice?: number | null;
  campaignPercent?: number | null;
  perfumeDetails?: PerfumeDetails;
};

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

export function parseVolumePrices(details?: PerfumeDetails): VolumePrice[] {
  if (!details) {
    return [];
  }

  if (details.volumePrices && details.volumePrices.length > 0) {
    return details.volumePrices.filter(
      (row) => row.volume.trim().length > 0 && row.price > 0,
    );
  }

  return [];
}

export function catalogVolumes(product: {
  sizes?: string[];
  perfumeDetails?: PerfumeDetails;
}): string[] {
  const priced = parseVolumePrices(product.perfumeDetails);
  if (priced.length > 0) {
    return priced.map((row) => row.volume);
  }
  if (product.perfumeDetails?.volume?.length) {
    return product.perfumeDetails.volume;
  }
  return product.sizes ?? [];
}

export function volumeListPrice(
  product: PricedCatalogItem,
  variant?: string,
): { price: number; oldPrice?: number } {
  const wanted = variant?.trim();
  const rows = parseVolumePrices(product.perfumeDetails);
  const match = wanted
    ? rows.find((row) => row.volume === wanted)
    : rows[0];
  const row = match ?? rows[0];

  const price = row?.price && row.price > 0 ? row.price : product.price;
  const oldPrice = row?.oldPrice && row.oldPrice > price ? row.oldPrice : undefined;
  const fallbackOld =
    product.oldPrice && product.oldPrice > price ? product.oldPrice : undefined;

  return {
    price,
    oldPrice: oldPrice ?? fallbackOld,
  };
}

export function applyCampaign(
  price: number,
  campaignPercent?: number | null,
): number {
  if (!campaignPercent || campaignPercent <= 0) {
    return roundMoney(price);
  }
  const clamped = Math.min(90, campaignPercent);
  return roundMoney(price * (1 - clamped / 100));
}

export type DisplayPricing = {
  price: number;
  oldPrice?: number;
  campaignPercent?: number;
};

export function displayPricing(
  product: PricedCatalogItem,
  variant?: string,
): DisplayPricing {
  const list = volumeListPrice(product, variant);
  const campaign =
    product.campaignPercent && product.campaignPercent > 0
      ? Math.min(90, product.campaignPercent)
      : undefined;
  const price = applyCampaign(list.price, campaign);
  const compareAt =
    list.oldPrice && list.oldPrice > price
      ? list.oldPrice
      : campaign && list.price > price
        ? list.price
        : undefined;

  return {
    price,
    oldPrice: compareAt,
    campaignPercent: campaign,
  };
}

export function lineSalePrice(
  product: PricedCatalogItem,
  variant?: string,
): number {
  return displayPricing(product, variant).price;
}

export function toPricedProduct(product: Product): PricedCatalogItem {
  return {
    price: product.price,
    oldPrice: product.oldPrice,
    campaignPercent: product.campaignPercent,
    perfumeDetails: product.perfumeDetails,
  };
}
