"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getUserData } from "@/lib/localStorage";
import ProfilePictureSection from "@/components/custom/ProfilePictureSection";

// Types for API data
interface BuyerUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
}

interface BuyerProfile {
  id: string; // BusinessBuyer.id
  companyName?: string | null;
  companyType?: string | null;
  companyAddress?: string | null;
  contactNo?: string | null;
  businessImage?: string | null;
  loyaltyPoints: number;
  user: BuyerUser;
}

interface LoyaltyItem {
  id: string;
  type: "EARN" | "REDEEM" | "ADJUST" | "REFUND_REVERSAL";
  points: number;
  amount?: string | number | null;
  description?: string | null;
  createdAt: string | Date;
  order?: { id: string; productTitle?: string | null } | null;
}

// Added: Payment history item interface based on SalesTransaction + related Order
interface PaymentItem {
  id: string;
  orderId: string;
  amountPaid: number;
  currency: string;
  paymentMethod: string;
  stripePaymentIntentId?: string | null;
  paidAt: string | Date;
  isRefunded: boolean;
  refundAmount?: number | null;
  refundReason?: string | null;
  refundedAt?: string | Date | null;
  stripeRefundId?: string | null;
  order?: {
    id: string;
    currency?: string | null;
    paymentStatus?: string | null;
    product?: { productTitle?: string | null } | null;
    seller?: { businessName?: string | null } | null;
  } | null;
}

// Function: ProgressBar
// Renders a simple horizontal progress bar. Accepts a numeric value and an optional max (defaults to 100).
// It clamps the percentage between 0 and 100 and renders a filled track using Tailwind classes.
function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  return (
    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-3 bg-green-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

// Function: BuyerProfilePage
// Top-level client page for Buyer My Profile.
// Responsibilities:
// - Fetch and display buyer profile (BusinessBuyer + User details)
// - Fetch and paginate loyalty history
// - Compute and display upcoming rewards progress toward 2 delivered purchases
// - Allow claiming bonus points when eligible and show confirmation dialog
// - Fetch and paginate buyer payment history (SalesTransaction joined via Order.buyerId)
export default function BuyerProfilePage() {
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
  const [history, setHistory] = useState<LoyaltyItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Added: Payment history state (separate pagination from loyalty)
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [payPage, setPayPage] = useState<number>(1);
  const [payPageSize] = useState<number>(10);
  const [payTotalCount, setPayTotalCount] = useState<number>(0);
  const [payLoading, setPayLoading] = useState<boolean>(false);

  // Claim UI state
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimResult, setClaimResult] = useState<{ success: boolean; message: string } | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState<boolean>(false);
  // Edit state for Buyer profile
  const [editing, setEditing] = useState<boolean>(false);
  const [editSaving, setEditSaving] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [editForm, setEditForm] = useState<{
    companyName: string;
    companyType: string;
    companyAddress: string;
    contactNo: string;
    businessImage: string;
  }>({ companyName: "", companyType: "", companyAddress: "", contactNo: "", businessImage: "" });

  function startEditing() {
    if (!buyer) return;
    setEditForm({
      companyName: buyer.companyName || "",
      companyType: buyer.companyType || "",
      companyAddress: buyer.companyAddress || "",
      contactNo: buyer.contactNo || "",
      businessImage: buyer.businessImage || "",
    });
    setImagePreview(buyer.businessImage || "");
    setEditing(true);
  }

  // Handle image upload similar to seller profile
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setEditForm(prev => ({ ...prev, businessImage: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  async function saveEdits() {
    if (!buyer) return;
    try {
      setEditSaving(true);
      const user = getUserData();
      const res = await fetch('/api/user/businessBuyer/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          companyName: editForm.companyName,
          companyType: editForm.companyType,
          companyAddress: editForm.companyAddress,
          contactNo: editForm.contactNo,
          businessImage: editForm.businessImage,
        })
      });
      const json = await res.json();
      if (!json?.success) {
        throw new Error(json?.error || 'Failed to update buyer profile');
      }
      // Refresh buyer profile
      const refreshed = await fetch(`/api/user/businessBuyer?userId=${user?.id}`);
      const refreshedJson = await refreshed.json();
      if (refreshedJson?.success && refreshedJson?.data) {
        setBuyer(refreshedJson.data as BuyerProfile);
      }
      setEditing(false);
    } catch (e) {
      console.error(e);
      alert('Unable to save changes. Please try again.');
    } finally {
      setEditSaving(false);
    }
  }

  // Load buyer profile on mount
  useEffect(() => {
    async function loadBuyer() {
      try {
        setLoading(true);
        setError(null);
        const user = getUserData();
        if (!user?.id) {
          setError("Please sign in to view your profile.");
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/user/businessBuyer?userId=${user.id}`);
        const json = await res.json();
        if (!json?.success || !json?.data) {
          setError("Business buyer profile not found.");
          setLoading(false);
          return;
        }
        setBuyer(json.data as BuyerProfile);
      } catch (e) {
        console.error(e);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    loadBuyer();
  }, []);

  // Load loyalty history when buyer or pagination changes
  useEffect(() => {
    async function loadHistory() {
      if (!buyer?.id) return;
      try {
        const params = new URLSearchParams();
        params.set("buyerId", buyer.id);
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        const res = await fetch(`/api/loyalty/history?${params.toString()}`);
        const json = await res.json();
        if (!json?.success) {
          console.warn(json?.error || "Failed to fetch loyalty history");
          setHistory([]);
          setTotalCount(0);
        } else {
          setHistory(Array.isArray(json.data?.items) ? json.data.items : []);
          setTotalCount(Number(json.data?.totalCount || 0));
        }
      } catch (e) {
        console.error(e);
        setHistory([]);
        setTotalCount(0);
      }
    }
    loadHistory();
  }, [buyer?.id, page, pageSize]);

  // Added: Load payment history when buyer or payment pagination changes
  useEffect(() => {
    async function loadPayments() {
      if (!buyer?.id) return;
      try {
        setPayLoading(true);
        const params = new URLSearchParams();
        params.set("buyerId", buyer.id);
        params.set("page", String(payPage));
        params.set("pageSize", String(payPageSize));
        const res = await fetch(`/api/payments/buyer-history?${params.toString()}`);
        const json = await res.json();
        if (!json?.success) {
          console.warn(json?.error || "Failed to fetch payments history");
          setPayments([]);
          setPayTotalCount(0);
        } else {
          setPayments(Array.isArray(json.data?.items) ? json.data.items : []);
          setPayTotalCount(Number(json.data?.totalCount || 0));
        }
      } catch (e) {
        console.error(e);
        setPayments([]);
        setPayTotalCount(0);
      } finally {
        setPayLoading(false);
      }
    }
    loadPayments();
  }, [buyer?.id, payPage, payPageSize]);

  // Upcoming rewards logic constants
  const REQUIRED_PURCHASES = 2;
  const BONUS_POINTS = 20;

  // Fetch delivered orders count for accurate milestone progress
  const [deliveredCount, setDeliveredCount] = useState<number>(0);
  useEffect(() => {
    async function loadDeliveredCount() {
      if (!buyer?.id) return;
      try {
        const params = new URLSearchParams();
        params.set("buyerId", buyer.id);
        params.set("status", "delivered");
        params.set("page", "1");
        params.set("pageSize", "1"); // we only need totalCount
        const res = await fetch(`/api/orders?${params.toString()}`);
        const json = await res.json();
        if (json?.success) {
          setDeliveredCount(Number(json?.data?.totalCount || 0));
        } else {
          setDeliveredCount(0);
        }
      } catch (e) {
        console.error(e);
        setDeliveredCount(0);
      }
    }
    loadDeliveredCount();
  }, [buyer?.id]);

  const progressValue = Math.min(deliveredCount, REQUIRED_PURCHASES);

  // Function: handleClaimBonus
  // Calls the loyalty claim API to attempt awarding the 2-completed-purchases bonus.
  // On success, it refreshes buyer profile, history, and delivered count; otherwise shows an informative dialog.
  async function handleClaimBonus() {
    if (!buyer?.id) return;
    try {
      setClaiming(true);
      setClaimResult(null);
      const res = await fetch("/api/loyalty/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId: buyer.id })
      });
      const json = await res.json();
      if (!json?.success && json?.code === 'NOT_REACHED') {
        setClaimResult({ success: false, message: json.error || "Milestone not reached yet." });
        setClaimDialogOpen(true);
        return;
      }
      if (!json?.success) {
        setClaimResult({ success: false, message: json.error || "Failed to claim bonus." });
        setClaimDialogOpen(true);
        return;
      }
      // Success: refresh buyer points and history
      setClaimResult({ success: true, message: `You have been awarded ${BONUS_POINTS} points!` });
      setClaimDialogOpen(true);

      // Refresh buyer profile
      const user = getUserData();
      if (user?.id) {
        const p = await fetch(`/api/user/businessBuyer?userId=${user.id}`);
        const pj = await p.json();
        if (pj?.success && pj?.data) setBuyer(pj.data as BuyerProfile);
      }
      // Refresh history
      setPage(1);
      // Refresh delivered count
      try {
        const params = new URLSearchParams();
        params.set("buyerId", buyer.id);
        params.set("status", "delivered");
        params.set("page", "1");
        params.set("pageSize", "1");
        const res2 = await fetch(`/api/orders?${params.toString()}`);
        const json2 = await res2.json();
        setDeliveredCount(Number(json2?.data?.totalCount || 0));
      } catch {}
    } catch (e) {
      console.error(e);
      setClaimResult({ success: false, message: "Failed to claim bonus." });
      setClaimDialogOpen(true);
    } finally {
      setClaiming(false);
    }
  }

  if (loading) return <div className="p-6">Loading profile...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!buyer) return <div className="p-6">Profile not found.</div>;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const payTotalPages = Math.max(1, Math.ceil(payTotalCount / payPageSize));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Profile</h1>
      </div>

      {/* Profile and Loyalty Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Buyer Information</CardTitle>
            <Button className='cursor-pointer' variant="ghost" size="icon" aria-label="Edit profile" onClick={startEditing}>
              <Pencil className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <div className="space-y-6">
                {/* Profile Picture Section - Using Custom Component */}
                <ProfilePictureSection
                  businessName={editForm.companyName || buyer.companyName || "Business"}
                  businessImage={editForm.businessImage}
                  onImageUpload={handleImageUpload}
                  imagePreview={imagePreview}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" value={editForm.companyName} onChange={(e) => setEditForm(f => ({ ...f, companyName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyType">Company Type</Label>
                    <Input id="companyType" value={editForm.companyType} onChange={(e) => setEditForm(f => ({ ...f, companyType: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactNo">Contact Number</Label>
                    <Input id="contactNo" value={editForm.contactNo} onChange={(e) => setEditForm(f => ({ ...f, contactNo: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <Input id="companyAddress" value={editForm.companyAddress} onChange={(e) => setEditForm(f => ({ ...f, companyAddress: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveEdits} disabled={editSaving}>{editSaving ? 'Saving...' : 'Save'}</Button>
                  <Button variant="outline" onClick={() => setEditing(false)} disabled={editSaving}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                    {buyer.businessImage ? (
                      <Image src={buyer.businessImage} alt="Business" width={64} height={64} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">NO IMG</div>
                    )}
                  </div>
                  <div>
                    <div className="text-lg font-medium">{buyer.companyName || buyer.user?.name || 'Unnamed Company'}</div>
                    <div className="text-sm text-gray-600">{buyer.user?.email}</div>
                    <div className="text-sm text-gray-600">{buyer.companyType}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Contact Number</div>
                    <div className="font-medium">{buyer.contactNo || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Company Address</div>
                    <div className="font-medium">{buyer.companyAddress || '-'}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loyalty Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Points</span>
              <span className="text-2xl font-semibold">{buyer.loyaltyPoints}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Upcoming Reward</span>
                <span className="font-medium">+{BONUS_POINTS} pts</span>
              </div>
              <ProgressBar value={progressValue} max={REQUIRED_PURCHASES} />
              <div className="text-xs text-gray-600">You’ve made {progressValue}/{REQUIRED_PURCHASES} purchases, {Math.max(0, REQUIRED_PURCHASES - progressValue)} more to earn {BONUS_POINTS} bonus points.</div>
            </div>
            <Button onClick={handleClaimBonus} disabled={claiming || progressValue < REQUIRED_PURCHASES}>
              {claiming ? 'Claiming...' : progressValue < REQUIRED_PURCHASES ? 'Not eligible yet' : 'Claim Bonus'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty History */}
      <Card>
        <CardHeader>
          <CardTitle>Loyalty History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">No loyalty history found.</TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{item.type}</span>
                      </TableCell>
                      <TableCell className={item.points >= 0 ? "text-green-600" : "text-red-600"}>
                        {item.points >= 0 ? `+${item.points}` : item.points}
                      </TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell>
                        {item.order ? (
                          <a className="text-blue-600 hover:underline" href={`/buyer/my-orders?orderId=${item.order.id}`}>{item.order.productTitle || item.order.id}</a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
              <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Added: Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Refund</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500">Loading payments...</TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500">No payments found.</TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.paidAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{p.id}</span>
                      </TableCell>
                      <TableCell>
                        <a className="text-blue-600 hover:underline" href={`/buyer/my-orders?orderId=${p.orderId}`}>{p.orderId}</a>
                      </TableCell>
                      <TableCell>{p.order?.product?.productTitle || '-'}</TableCell>
                      <TableCell>{p.order?.seller?.businessName || '-'}</TableCell>
                      <TableCell className="text-right">{(p.order?.currency || p.currency || 'RM')} {Number(p.amountPaid).toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{p.paymentMethod || '-'}</TableCell>
                      <TableCell>
                        {p.isRefunded ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Refunded</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.isRefunded && typeof p.refundAmount === 'number' ? (
                          <span className="text-green-600">+ {(p.order?.currency || p.currency || 'RM')} {Number(p.refundAmount).toFixed(2)}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Payment Pagination */}
          {payTotalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button variant="outline" disabled={payPage <= 1} onClick={() => setPayPage(p => Math.max(1, p - 1))}>Previous</Button>
              <div className="text-sm text-gray-600">Page {payPage} of {payTotalPages}</div>
              <Button variant="outline" disabled={payPage >= payTotalPages} onClick={() => setPayPage(p => Math.min(payTotalPages, p + 1))}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claim dialog */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{claimResult?.success ? 'Bonus Claimed!' : 'Cannot Claim Yet'}</DialogTitle>
            <DialogDescription>
              {claimResult?.message || (claimResult?.success ? 'Your bonus has been credited.' : 'You have not met the requirement.')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setClaimDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}