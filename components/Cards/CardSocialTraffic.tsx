'use client';

import React from 'react';
import { getUserData } from '@/lib/localStorage';

interface TopProductRow {
  name: string;
  sales: number;
  percentage: number;
}

/**
 * CardSocialTraffic: Displays Top Selling Products using real order data for the current seller.
 * - Resolves seller (agribusiness) ID from the current user
 * - Fetches seller orders and aggregates total sales by product title
 * - Computes percentage share within top N (5) products
 */
export default function CardSocialTraffic() {
  const [rows, setRows] = React.useState<TopProductRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const user = getUserData();
        if (!user?.id) return;

        // 1) Resolve seller (agribusiness) id
        const abRes = await fetch(`/api/user/agribusiness?userId=${user.id}`);
        const abJson = await abRes.json();
        const sellerId: string | undefined = abJson?.data?.id;
        if (!abRes.ok || !sellerId) return;

        // 2) Fetch orders for seller
        const params = new URLSearchParams();
        params.set('sellerId', sellerId);
        const ordersRes = await fetch(`/api/orders?${params.toString()}`);
        const ordersJson = await ordersRes.json();
        if (!ordersRes.ok) return;

        type Order = {
          totalAmount?: number | null;
          product?: { productTitle?: string | null } | null;
        };
        const orders: Order[] = Array.isArray(ordersJson?.data) ? ordersJson.data : [];

        // 3) Aggregate by product title
        const totals = new Map<string, number>();
        for (const o of orders) {
          const title = (o?.product?.productTitle as string) || 'Unknown Product';
          const amt = Number(o?.totalAmount || 0);
          totals.set(title, (totals.get(title) || 0) + (isNaN(amt) ? 0 : amt));
        }

        // 4) Pick top 5 by sales and compute percentage share
        const sorted = Array.from(totals.entries())
          .map(([name, sales]) => ({ name, sales }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5);
        const sumTop = sorted.reduce((s, r) => s + r.sales, 0);
        const computed: TopProductRow[] = sorted.map((r) => ({
          name: r.name,
          sales: r.sales,
          percentage: sumTop > 0 ? Math.round((r.sales / sumTop) * 100) : 0,
        }));

        setRows(computed);
      } catch (e) {
        console.error('CardSocialTraffic load error', e);
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
              <h3 className="font-semibold text-base text-blueGray-700">Top Selling Products</h3>
            </div>
            <div className="relative w-full max-w-full flex-grow flex-1 text-right">
              <button
                className="bg-indigo-500 text-white active:bg-indigo-600 text-xs font-bold uppercase px-3 py-1 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                type="button"
              >
                See all
              </button>
            </div>
          </div>
        </div>
        <div className="block w-full overflow-x-hidden">
          {/* Products table */}
          <table className="items-center w-full bg-transparent border-collapse">
            <thead className="thead-light">
              <tr>
                <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Product
                </th>
                <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Sales
                </th>
                <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left min-w-140-px"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center p-6 text-sm text-blueGray-400">Loading...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center p-6 text-sm text-blueGray-400">No data available</td>
                </tr>
              ) : (
                rows.map((product, index) => (
                  <tr key={index}>
                    <th className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left">
                      {product.name}
                    </th>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      RM {product.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <div className="flex items-center">
                        <span className="mr-2">{product.percentage}%</span>
                        <div className="relative w-full">
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-red-200">
                            <div
                              style={{ width: `${product.percentage}%` }}
                              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                product.percentage >= 70
                                  ? 'bg-emerald-500'
                                  : product.percentage >= 50
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                              }`}
                            ></div>
                          </div>
                        </div>
                      </div>
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
