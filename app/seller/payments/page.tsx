"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  DollarSign, 
  Receipt, 
  Calendar, 
  Eye, 
  Trash2,
  CreditCard,
  Building,
  Wallet,
  Filter,
  Search
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { getUserData } from "@/lib/localStorage";

// Sales Transaction interface aligned with backend
interface SalesTransaction {
  id: string;
  invoiceId: string; // mirror id for UI display
  orderId: string;
  productTitle: string;
  quantity: number;
  paymentMethod: string;
  amountPaid: number;
  currency: string;
  paidAt: string | Date;
  // Refund tracking fields
  isRefunded?: boolean;
  refundAmount?: number | null;
  refundReason?: string | null;
  refundedAt?: string | Date | null;
  stripeRefundId?: string | null;
}

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<SalesTransaction | null>(null);

  // Initialize by fetching seller profile then transactions
  useEffect(() => {
    async function loadTransactions() {
      try {
        const user = getUserData();
        if (!user?.id) return;
        // Get seller (agribusiness) id
        const sellerRes = await fetch(`/api/user/agribusiness?userId=${user.id}`);
        const sellerJson = await sellerRes.json();
        if (!sellerJson?.success || !sellerJson?.data?.id) return;
        const sellerId = sellerJson.data.id as string;

        // Fetch seller payments history
        const params = new URLSearchParams();
        params.set("sellerId", sellerId);
        params.set("page", "1");
        params.set("pageSize", "50");
        const txRes = await fetch(`/api/payments/seller-history?${params.toString()}`);
        const txJson = await txRes.json();
        if (!txJson?.success) return;

        const items = (txJson.data?.items || []) as Array<{
          id: string;
          orderId: string;
          amountPaid: number;
          currency: string;
          paymentMethod: string;
          paidAt: string;
          order: { quantity: number; product: { productTitle: string } };
          isRefunded?: boolean;
          refundAmount?: number | null;
          refundReason?: string | null;
          refundedAt?: string | null;
          stripeRefundId?: string | null;
        }>;

        const mapped: SalesTransaction[] = items.map((t) => ({
          id: t.id,
          invoiceId: t.id,
          orderId: t.orderId,
          productTitle: t.order?.product?.productTitle || "-",
          quantity: t.order?.quantity ?? 0,
          paymentMethod: t.paymentMethod,
          amountPaid: Number(t.amountPaid || 0),
          currency: t.currency || "RM",
          paidAt: t.paidAt,
          isRefunded: t.isRefunded,
          refundAmount: t.refundAmount ?? null,
          refundReason: t.refundReason ?? null,
          refundedAt: t.refundedAt ?? null,
          stripeRefundId: t.stripeRefundId ?? null,
        }));

        setTransactions(mapped);
      } catch (e) {
        console.error("Failed to load transactions", e);
      }
    }
    loadTransactions();
  }, []);

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction =>
    transaction.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle delete transaction
  const handleDeleteTransaction = (transactionId: string) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = "RM") => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit card':
        return <CreditCard className="h-4 w-4" />;
      case 'bank transfer':
      case 'online banking':
        return <Building className="h-4 w-4" />;
      case 'paypal':
        return <Wallet className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  // Get payment method color
  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit card':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'bank transfer':
      case 'online banking':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paypal':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mt-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales Income</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View your recent sales income transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                View your completed payment transactions
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Invoice ID
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Quantity
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Payment Method
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Date & Time
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="font-mono text-sm text-blue-600 dark:text-blue-400">
                        {transaction.invoiceId}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-mono text-sm text-gray-600 dark:text-gray-400">
                        {transaction.orderId}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {transaction.productTitle}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="secondary" className="font-mono">
                        {transaction.quantity} units
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={`${getPaymentMethodColor(transaction.paymentMethod)} border-0`}>
                        <div className="flex items-center gap-1">
                          {getPaymentMethodIcon(transaction.paymentMethod)}
                          <span className="text-xs">{transaction.paymentMethod}</span>
                        </div>
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(transaction.amountPaid, transaction.currency)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(transaction.paidAt), "MMM dd, yyyy")}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(transaction.paidAt), "hh:mm a")}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTransaction(transaction)}
                          className="h-8 w-8 p-0 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this transaction record? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No transactions found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? "Try adjusting your search terms." : "Your payment history will appear here once you receive payments."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <AlertDialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Transaction Details</AlertDialogTitle>
              <AlertDialogDescription>
                Complete information for invoice {selectedTransaction.invoiceId}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Invoice ID
                  </label>
                  <div className="font-mono text-blue-600 dark:text-blue-400">
                    {selectedTransaction.invoiceId}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Order ID
                  </label>
                  <div className="font-mono text-gray-600 dark:text-gray-400">
                    {selectedTransaction.orderId}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product
                  </label>
                  <div className="font-medium">
                    {selectedTransaction.productTitle}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantity
                  </label>
                  <div>
                    {selectedTransaction.quantity} units
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Method
                  </label>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(selectedTransaction.paymentMethod)}
                    {selectedTransaction.paymentMethod}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount Paid
                  </label>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(selectedTransaction.amountPaid, selectedTransaction.currency)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Transaction Date
                  </label>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedTransaction.paidAt), "MMMM dd, yyyy 'at' hh:mm a")}
                  </div>
                </div>
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
