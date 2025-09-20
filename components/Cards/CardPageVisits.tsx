'use client';

import React from 'react';
import { getUserData } from '@/lib/localStorage';

interface TopClientRow {
  clientName: string;
  totalValue: number;
  products: number;
  lastPurchased: string;
}

// CardPageVisits: Displays Top Clients table using real order data for the current seller
export default function CardPageVisits() {
  const [rows, setRows] = React.useState<TopClientRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    // load: Fetch agribusiness (seller) for current user, then fetch orders and aggregate by buyer
    async function load() {
      try {
        const user = getUserData();
        if (!user?.id) return;

        // 1) Resolve the seller's agribusiness id for the current user
        const abRes = await fetch(`/api/user/agribusiness?userId=${user.id}`);
        const abJson = await abRes.json();
        const sellerId: string | undefined = abJson?.data?.id;
        if (!abRes.ok || !sellerId) return;

        // 2) Fetch orders for this seller
        const params = new URLSearchParams();
        params.set('sellerId', String(sellerId));
        // Optionally, you could limit to completed orders only by: params.set('status', 'completed');
        const ordersRes = await fetch(`/api/orders?${params.toString()}`);
        const ordersJson = await ordersRes.json();
        if (!ordersRes.ok) return;

        type Order = {
          totalAmount?: number | null;
          createdAt?: string | Date | null;
          product?: { id?: string; productTitle?: string | null } | null;
          buyerId?: string | null;
          buyer?: {
            id?: string | null;
            firstName?: string | null;
            lastName?: string | null;
            name?: string | null;
            email?: string | null;
          } | null;
        };

        const orders: Order[] = Array.isArray(ordersJson?.data) ? ordersJson.data : [];

        // 3) Group by buyer and compute totals
        type Agg = {
          name: string;
          total: number;
          productSet: Set<string>;
          lastPurchased: Date | null;
        };
        const byBuyer = new Map<string, Agg>();

        for (const o of orders) {
          const buyerKey = (o?.buyer?.id as string) || (o?.buyerId as string) || '';
          if (!buyerKey) continue;

          const name =
            [o?.buyer?.firstName, o?.buyer?.lastName].filter(Boolean).join(' ').trim() ||
            (o?.buyer?.name as string) ||
            (o?.buyer?.email as string) ||
            'Unknown Buyer';

          const existing = byBuyer.get(buyerKey) ?? {
            name,
            total: 0,
            productSet: new Set<string>(),
            lastPurchased: null,
          };

          const amount = Number(o?.totalAmount || 0);
          existing.total += isNaN(amount) ? 0 : amount;

          const productTitle = (o?.product?.productTitle as string) || 'Unknown Product';
          if (productTitle) existing.productSet.add(productTitle);

          const createdAt = o?.createdAt ? new Date(o.createdAt) : null;
          if (createdAt) {
            if (!existing.lastPurchased || createdAt > existing.lastPurchased) {
              existing.lastPurchased = createdAt;
            }
          }

          byBuyer.set(buyerKey, existing);
        }

        // 4) Sort by total and take top 5
        const entries = Array.from(byBuyer.values())
          .map((v) => ({
            clientName: v.name,
            totalValue: v.total,
            products: v.productSet.size,
            lastPurchased: v.lastPurchased
              ? v.lastPurchased.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                })
              : '-',
          }))
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, 5);

        setRows(entries);
      } catch (err) {
        console.error('CardPageVisits load error', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <>
      <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
        <div className="rounded-t mb-0 px-4 py-3 border-0">
          <div className="flex flex-wrap items-center">
            <div className="relative w-full px-4 max-w-full flex-grow flex-1">
              <h3 className="font-semibold text-base text-blueGray-700">Top Clients</h3>
            </div>
            <div className="relative w-full px-4 max-w-full flex-grow flex-1 text-right">
              <button
                className="bg-indigo-500 text-white active:bg-indigo-600 text-xs font-bold uppercase px-3 py-1 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                type="button"
              >
                See all
              </button>
            </div>
          </div>
        </div>
        <div className="block w-full overflow-x-auto">
          {/* Top Clients table */}
          <table className="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr>
                <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Client Name
                </th>
                <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Total Value
                </th>
                <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Products
                </th>
                <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Last Purchased
                </th>
                <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-sm text-blueGray-400">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-sm text-blueGray-400">
                    No data available
                  </td>
                </tr>
              ) : (
                rows.map((visit, index) => (
                  <tr key={index}>
                    <th className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left">
                      {visit.clientName}
                    </th>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      RM {visit.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {visit.products}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {visit.lastPurchased}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <button className="cursor-pointer text-xs font-bold rounded outline-none focus:outline-none transition-all duration-300 hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm hover:underline">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
