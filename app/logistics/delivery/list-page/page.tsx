"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserData } from '@/lib/localStorage';

// Minimal UI using tailwind-like utility classes presumed available

interface OrderListItem {
  id: string;
  businessName: string; // seller.agribusiness.businessName
  companyName: string;  // buyer.companyName
  location: string;     // product.location
  deliveryAddress: string;
  shippingDistance: number | null;
  status: string;
}

const STATUS_OPTIONS = ['confirmed', 'Ready to Pickup', 'Picked Up', 'In Transit', 'Delivered'] as const;

type StatusType = typeof STATUS_OPTIONS[number];

// Truncate a text to a fixed length and append ellipsis if needed
const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default function LogisticsDeliveryListPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logisticsPartnerId, setLogisticsPartnerId] = useState<string>('');

  /**
   * Fetch logistics partner ID from user data stored in localStorage
   */
  const fetchLogisticsPartnerId = async () => {
    const userData = getUserData();
    if (!userData?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      const res = await fetch(`/api/user/logistics?userId=${userData.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to get logistics partner info');
      }
      setLogisticsPartnerId(data.data.id);
      console.log("The logistics partner ID is:", data.data.id);
    } catch (e) {
      setError(e as string || 'Failed to get logistics partner info');
    }
  };

  /**
   * Fetches orders from the API, excluding orders with 'pending' status
   * Only retrieves orders that are confirmed or in later stages of the delivery process
   */
  const fetchOrders = async () => {
    console.log("Fetched order")
    if (!logisticsPartnerId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch orders excluding 'pending' status - only get confirmed and later stages
      const res = await fetch(`/api/logistics/orders?logisticsPartnerId=${encodeURIComponent(logisticsPartnerId)}&statusNot=pending`);
      const data = await res.json();
      console.log("The data is:", data);
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load orders');
      setOrders(data.data as OrderListItem[]);
    } catch (e) {
      setError(e as string || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
    console.log("The fetched data is:", orders);
  };

  useEffect(() => {
    fetchLogisticsPartnerId();
  }, []);

  useEffect(() => {
    if (logisticsPartnerId) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logisticsPartnerId]);

  const handleStatusChange = async (orderId: string, newStatus: StatusType) => {
    try {
      const res = await fetch(`/api/logistics/orders/${orderId}?logisticsPartnerId=${encodeURIComponent(logisticsPartnerId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update status');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (e) {
      alert(e as string || 'Failed to update status');
    }
  };

  return (
    <div className="mt-8 p-3 sm:p-6 space-y-8 min-h-screen bg-gray-50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Assigned Deliveries</h1>
        <button 
          onClick={fetchOrders} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          Loading orders...
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Seller</th>
                <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Buyer</th>
                <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pickup</th>
                <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Delivery</th>
                <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Distance</th>
                <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 && !loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5" />
                      </svg>
                      <p className="text-lg font-medium">No confirmed orders assigned yet</p>
                      <p className="text-sm text-gray-400 mt-1">Orders will appear here once they are assigned to you</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-xs font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded text-center">
                        {o.id}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm font-medium text-gray-900">{truncateText(o.businessName, 20)}</div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm text-gray-900">{truncateText(o.companyName, 20)}</div>
                    </td>
                    <td className="px-3 py-4" title={o.location}>
                      <div className="text-xs text-gray-600 max-w-32">{truncateText(o.location, 40)}</div>
                    </td>
                    <td className="px-3 py-4" title={o.deliveryAddress}>
                      <div className="text-xs text-gray-600 max-w-32">{truncateText(o.deliveryAddress, 40)}</div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{o.shippingDistance ? `${o.shippingDistance} km` : '-'}</div>
                    </td>
                    <td className="px-3 py-4">
                      {o.status === 'confirmed' ? (
                        <div className="text-xs py-1 bg-yellow-100 text-yellow-800 rounded-md border border-yellow-300 text-center">
                          Waiting for Ready to Pickup
                        </div>
                      ) : (
                        <select
                          className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value as StatusType)}
                        >
                          {STATUS_OPTIONS.filter(s => s !== 'confirmed').map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <Link 
                        href={`/logistics/delivery/${o.id}`} 
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors duration-200"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}