"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getUserData } from '@/lib/localStorage';
import { Button } from "@/components/ui/button"

interface OrderDetails {
  id: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  shippingCost: string | null;
  totalAmount: string;
  currency: string;
  status: string;
  deliveryAddress: string;
  estimatedDeliveryTime?: string | null;
  shippingDistance?: number | null;
  product: {
    id: string;
    productTitle: string;
    unitOfMeasurement: string;
    location: string;
    productImages: string[];
    storageConditions?: string | null;
  };
  seller: {
    id: string;
    businessName: string;
    contactNo?: string | null;
    bio?: string | null;
    businessImage?: string | null;
    user: { name: string } | null;
  };
  buyer: {
    id: string;
    companyName: string;
    contactNo?: string | null;
    businessImage?: string | null;
    user: { name: string } | null;
  };
}

const STATUS_OPTIONS = ['confirmed', 'Ready to Pickup', 'Picked Up', 'In Transit', 'Delivered'] as const;

type StatusType = typeof STATUS_OPTIONS[number];

export default function LogisticsOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [details, setDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingDeliveryTime, setUpdatingDeliveryTime] = useState(false);
  const [newEstimatedDeliveryTime, setNewEstimatedDeliveryTime] = useState<string>('');
  const [isEditingDeliveryTime, setIsEditingDeliveryTime] = useState(false);

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
    } catch (e) {
      setError(e as string || 'Failed to get logistics partner info');
    }
  };

  /**
   * Fetch order details using the logistics partner ID
   */
  const fetchDetails = async () => {
    if (!orderId || !logisticsPartnerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/logistics/orders/${orderId}?logisticsPartnerId=${encodeURIComponent(logisticsPartnerId)}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load order details');
      setDetails(data.data as OrderDetails);
    } catch (e) {
      setError(e as string || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogisticsPartnerId();
  }, []);

  useEffect(() => {
    if (logisticsPartnerId) {
      fetchDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, logisticsPartnerId]);

  useEffect(() => {
    if (details?.estimatedDeliveryTime) {
      setNewEstimatedDeliveryTime(details.estimatedDeliveryTime);
    }
  }, [details?.estimatedDeliveryTime]);

  /**
   * Handle status change for the order
   */
  const handleStatusChange = async (newStatus: StatusType) => {
    if (!orderId || !logisticsPartnerId) return;
    try {
      const res = await fetch(`/api/logistics/orders/${orderId}?logisticsPartnerId=${encodeURIComponent(logisticsPartnerId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update status');
      setDetails(prev => prev ? { ...prev, status: newStatus } : prev);
    } catch (e) {
      setError(e as string || 'Failed to update status');
    }
  };

  /**
   * Handle estimated delivery time update
   */
  const handleDeliveryTimeUpdate = async () => {
    if (!orderId || !logisticsPartnerId || !newEstimatedDeliveryTime.trim()) return;
    setUpdatingDeliveryTime(true);
    try {
      const res = await fetch(`/api/logistics/orders/${orderId}?logisticsPartnerId=${encodeURIComponent(logisticsPartnerId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimatedDeliveryTime: newEstimatedDeliveryTime.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update delivery time');
      setDetails(prev => prev ? { ...prev, estimatedDeliveryTime: newEstimatedDeliveryTime.trim() } : prev);
      setNewEstimatedDeliveryTime('');
    } catch (e) {
      setError(e as string || 'Failed to update delivery time');
    } finally {
      setUpdatingDeliveryTime(false);
    }
  };

  const progress = useMemo(() => {
    const order = ['confirmed', 'Ready to Pickup', 'Picked Up', 'In Transit', 'Delivered'] as const;
    const idx = order.findIndex(s => s.toLowerCase() === (details?.status || 'confirmed').toLowerCase());
    const normalizedIdx = Math.max(0, idx);
    return (normalizedIdx / (order.length - 1)) * 100;
  }, [details?.status]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/logistics/delivery/list-page')}
                className="cursor-pointer"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to List
              </Button>
              <h1 className="text-xl ml-6 sm:text-2xl font-bold text-gray-900">Order Delivery Details</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {loading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            Loading order details...
          </div>
        )}
        {!details ? null : (
          <div className="space-y-6">
            {/* Status Tracker */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Status Tracker</h2>
                {details.status === 'confirmed' ? (
                  <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-300 text-sm font-medium">
                    Waiting for seller to mark as Ready to Pickup
                  </div>
                ) : (
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium"
                    value={details.status}
                    onChange={(e) => handleStatusChange(e.target.value as StatusType)}
                  >
                    {STATUS_OPTIONS.filter(s => s !== 'confirmed').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-green-500 h-4 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Order Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Information</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 mb-1">Order ID</span>
                    <span className="text-sm font-mono bg-gray-100 px-3 py-2 rounded-lg">{details.id}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 mb-1">Product</span>
                    <span className="text-gray-900 font-medium">{details.product.productTitle}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 mb-1">Total Weight</span>
                    <span className="text-gray-900">{details.quantity} {details.product.unitOfMeasurement}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 mb-1">Shipping Cost (Your Earning)</span>
                    <span className="text-gray-900 font-semibold">{details.currency} {details.shippingCost || '0.00'}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 mb-1">Pickup Location</span>
                    <span className="text-gray-900">{details.product.location}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 mb-1">Delivery Address</span>
                    <span className="text-gray-900">{details.deliveryAddress}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 mb-1">Distance</span>
                    <span className="text-gray-900">{details.shippingDistance ? `${details.shippingDistance} km` : '-'}</span>
                  </div>
                  {details.product.storageConditions && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 mb-1">Storage Conditions</span>
                      <span className="text-gray-900">{details.product.storageConditions}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Images */}
            {details.product.productImages && details.product.productImages.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Images</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {details.product.productImages.map((image, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={image}
                        alt={`Product ${index + 1}`}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                        onClick={() => window.open(image, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estimated Delivery Time */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Estimated Delivery Time</h2>
              <div className="space-y-4">
                {!isEditingDeliveryTime ? (
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 mb-1">Current Estimate</span>
                      <span className="text-gray-900">{details.estimatedDeliveryTime || 'Not set'}</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsEditingDeliveryTime(true);
                        setNewEstimatedDeliveryTime(details.estimatedDeliveryTime || '');
                      }}
                      className="cursor-pointer p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                      title="Edit estimated delivery time"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={newEstimatedDeliveryTime}
                      onChange={(e) => setNewEstimatedDeliveryTime(e.target.value)}
                      placeholder="Enter new estimated delivery time (e.g., 2-3 business days)"
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await handleDeliveryTimeUpdate();
                          setIsEditingDeliveryTime(false);
                        }}
                        disabled={updatingDeliveryTime || !newEstimatedDeliveryTime.trim()}
                        className="cursor-pointer px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
                      >
                        {updatingDeliveryTime ? 'Updating...' : 'Update'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingDeliveryTime(false);
                          setNewEstimatedDeliveryTime('');
                        }}
                        disabled={updatingDeliveryTime}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Seller Information</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  {details.seller.businessImage ? (
                    <Image src={details.seller.businessImage} alt="seller" width={64} height={64} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-lg">{details.seller.businessName}</div>
                    {details.seller.bio && <div className="text-sm text-gray-600 mt-1">{details.seller.bio}</div>}
                    {details.seller.user?.name && <div className="text-sm text-gray-700 mt-2">Contact Person: {details.seller.user.name}</div>}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500 mb-1">Contact</span>
                  <span className="text-gray-900">{details.seller.contactNo ?? '-'}</span>
                </div>
              </div>
            </div>

            {/* Buyer Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Buyer Information</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  {details.buyer.businessImage ? (
                    <Image src={details.buyer.businessImage} alt="buyer" width={64} height={64} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-lg">{details.buyer.companyName}</div>
                    {details.buyer.user?.name && <div className="text-sm text-gray-700 mt-2">Contact Person: {details.buyer.user.name}</div>}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500 mb-1">Contact</span>
                  <span className="text-gray-900">{details.buyer.contactNo ?? '-'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}