import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Interface for shipping calculation request
interface ShippingRequest {
  distance: number;
  weight?: number;
  logisticsProvider?: string;
  logisticsPartnerId?: string; // Optional: when provided, use partner pricing from DB
}

// Interface for shipping calculation response
interface ShippingResponse {
  cost: number;
  estimatedDays: string | null;
  distance: number;
  provider: string | null;
}

// Logistics providers with unified pricing model (Distance × Weight × RM rate/kg)
const logisticsProviders: Record<string, { name: string; ratePerKgKm: number; deliveryTime: string }> = {
  'dhl': { name: 'DHL', ratePerKgKm: 0.18, deliveryTime: '1-2 business days' },
  'fedex': { name: 'FedEx', ratePerKgKm: 0.15, deliveryTime: '1-3 business days' },
  'pos laju': { name: 'Pos Laju', ratePerKgKm: 0.12, deliveryTime: '2-5 business days' },
  'j&t express': { name: "J&T Express", ratePerKgKm: 0.10, deliveryTime: '2-4 business days' },
};

function normalizeProviderName(provider?: string): string {
  if (!provider) return 'pos laju';
  const k = provider.toLowerCase().trim();
  if (k === 'pos-laju') return 'pos laju';
  if (k === 'jnt express' || k === 'jnt' || k === 'j&t') return 'j&t express';
  return k;
}

/**
 * Parse pricingConfig persisted as string[] into structured tiers.
 * Supported formats:
 * - Flat Rate Model: ["0.05"]
 * - Tiered by Weight: ["min-max@rate", ...] (use "+" for open ended max)
 * - Tiered by Distance: same as above
 */
function parsePricingConfig(model: string | null | undefined, arr: string[] | undefined | null): {
  flatRatePerKgKm?: number;
  weightTiers?: { min: number; max: number | null; rate: number }[];
  distanceTiers?: { min: number; max: number | null; rate: number }[];
} {
  const cfg: {
    flatRatePerKgKm?: number;
    weightTiers?: { min: number; max: number | null; rate: number }[];
    distanceTiers?: { min: number; max: number | null; rate: number }[];
  } = {};
  if (!model || !Array.isArray(arr) || arr.length === 0) return cfg;
  const isNumeric = (s: string) => /^\s*\d+(?:\.\d+)?\s*$/.test(s);

  if (model === 'Flat Rate Model') {
    const line = arr.find((l) => isNumeric(l)) ?? arr[0];
    const rate = Number(line);
    if (Number.isFinite(rate)) cfg.flatRatePerKgKm = rate;
    return cfg;
  }

  if (model === 'Tiered Rate by Weight') {
    const tiers: { min: number; max: number | null; rate: number }[] = [];
    for (const raw of arr) {
      if (!raw.includes('@')) continue;
      const [range, rateStr] = raw.split('@');
      const [minStr, maxStr] = (range ?? '').split('-');
      const min = Number(minStr ?? 0);
      const max = maxStr === '+' || maxStr === undefined || maxStr === '' ? null : Number(maxStr);
      const rate = Number(rateStr ?? 0);
      if (Number.isFinite(min) && Number.isFinite(rate)) tiers.push({ min, max, rate });
    }
    cfg.weightTiers = tiers;
    return cfg;
  }

  if (model === 'Tiered Rate by Distance') {
    const tiers: { min: number; max: number | null; rate: number }[] = [];
    for (const raw of arr) {
      if (!raw.includes('@')) continue;
      const [range, rateStr] = raw.split('@');
      const [minStr, maxStr] = (range ?? '').split('-');
      const min = Number(minStr ?? 0);
      const max = maxStr === '+' || maxStr === undefined || maxStr === '' ? null : Number(maxStr);
      const rate = Number(rateStr ?? 0);
      if (Number.isFinite(min) && Number.isFinite(rate)) tiers.push({ min, max, rate });
    }
    cfg.distanceTiers = tiers;
    return cfg;
  }

  return cfg;
}

/**
 * Given tiers, pick the applicable rate based on weight or distance.
 */
function pickTierRate(value: number, tiers: { min: number; max: number | null; rate: number }[] | undefined): number | null {
  if (!tiers || tiers.length === 0) return null;
  // Prefer the first tier that matches value in [min, max]
  const match = tiers.find(t => value >= t.min && (t.max == null || value <= t.max));
  if (match) return match.rate;
  // If none matched, try open-ended tier (max == null)
  const open = tiers.find(t => t.max == null);
  if (open) return open.rate;
  // Fallback to nearest tier by min
  const sorted = [...tiers].sort((a,b) => a.min - b.min);
  return sorted[sorted.length - 1].rate;
}

// Calculate shipping cost based on distance × weight × ratePerKgKm
function calculateShippingCost(
  distance: number,
  weight: number,
  providerKey: string
): { cost: number; deliveryTime: string; name: string } {
  const providerInfo = logisticsProviders[providerKey];
  if (!providerInfo) {
    throw new Error('Invalid logistics provider');
  }

  const rate = providerInfo.ratePerKgKm; // RM per kg per km
  const totalCost = distance * weight * rate;

  return {
    cost: Math.round(totalCost * 100) / 100, // Round to 2 decimals
    deliveryTime: providerInfo.deliveryTime,
    name: providerInfo.name,
  };
}

// Calculate shipping cost and delivery time
export async function POST(request: NextRequest) {
  try {
    const body: ShippingRequest = await request.json();

    // Validate required fields
    if (!body.distance || body.distance <= 0) {
      return NextResponse.json(
        { error: 'Distance is required and must be greater than 0' },
        { status: 400 }
      );
    }

    const weight = body.weight && body.weight > 0 ? body.weight : 1; // Default 1kg

    // Prefer dynamic partner pricing if logisticsPartnerId provided
    if (body.logisticsPartnerId) {
      const partner = await prisma.logisticsPartner.findUnique({
        where: { id: body.logisticsPartnerId },
        select: {
          companyName: true,
          estimatedDeliveryTime: true,
          pricingModel: true,
          pricingConfig: true,
        },
      });

      if (!partner) {
        return NextResponse.json(
          { error: 'Logistics partner not found' },
          { status: 404 }
        );
      }

      const cfg = parsePricingConfig(partner.pricingModel, partner.pricingConfig);
      let rate: number | null = null;

      if (partner.pricingModel === 'Flat Rate Model') {
        rate = cfg.flatRatePerKgKm ?? null;
      } else if (partner.pricingModel === 'Tiered Rate by Weight') {
        rate = pickTierRate(weight, cfg.weightTiers);
      } else if (partner.pricingModel === 'Tiered Rate by Distance') {
        rate = pickTierRate(body.distance, cfg.distanceTiers);
      }

      if (rate == null || !Number.isFinite(rate)) {
        return NextResponse.json(
          { error: 'Invalid pricing configuration for logistics partner' },
          { status: 400 }
        );
      }

      const totalCost = body.distance * weight * rate;
      const response: ShippingResponse = {
        cost: Math.round(totalCost * 100) / 100,
        estimatedDays: partner.estimatedDeliveryTime ?? null,
        distance: Math.round(body.distance * 100) / 100,
        provider: partner.companyName ?? null,
      };

      return NextResponse.json(response);
    }

    // Fallback: name-based provider pricing (legacy)
    const providerKey = normalizeProviderName(body.logisticsProvider);

    // Validate provider
    if (!logisticsProviders[providerKey]) {
      return NextResponse.json(
        { error: 'Invalid logistics provider' },
        { status: 400 }
      );
    }

    const { cost, deliveryTime, name } = calculateShippingCost(body.distance, weight, providerKey);

    const response: ShippingResponse = {
      cost,
      estimatedDays: deliveryTime,
      distance: Math.round(body.distance * 100) / 100,
      provider: name,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping cost' },
      { status: 500 }
    );
  }
}

// Get available logistics providers (for display/reference)
export async function GET() {
  try {
    const providers = Object.entries(logisticsProviders).map(([key, value]) => ({
      id: key,
      name: value.name,
      deliveryTime: value.deliveryTime,
      ratePerKgKm: value.ratePerKgKm,
      rateMethod: `Distance × Weight × RM ${value.ratePerKgKm}/kg`,
    }));

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching logistics providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logistics providers' },
      { status: 500 }
    );
  }
}