import { NextRequest, NextResponse } from 'next/server';

// Interface for shipping calculation request
interface ShippingRequest {
  distance: number;
  weight?: number;
  logisticsProvider?: string;
}

// Interface for shipping calculation response
interface ShippingResponse {
  cost: number;
  estimatedDays: string;
  distance: number;
  provider: string;
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