'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bidAmount: number) => Promise<void>;
  product: {
    id: string;
    title: string;
    currentPrice: number;
    minimumIncrement: number;
    currency: string;
    unitOfMeasurement: string;
    auctionEndTime?: Date;
    autoAcceptThreshold?: number;
  };
  currentHighestBid?: number;
  quantity: number;
}

export default function BidModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  currentHighestBid,
  quantity
}: BidModalProps) {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startingPrice = product.currentPrice;
  const minimumIncrement = product.minimumIncrement;
  const autoAcceptThreshold = product.autoAcceptThreshold || null;
  const highestBid = currentHighestBid || 0;
  
  const minimumBidAmount = highestBid > 0 
    ? highestBid + minimumIncrement
    : startingPrice + minimumIncrement;

  const handleBidAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBidAmount(value);
    }
  };

  const handleQuickBid = (amount: number) => {
    setBidAmount(amount.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidBid()) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(parseFloat(bidAmount));
      setBidAmount('');
      onClose();
    } catch (error) {
      console.error('Error submitting bid:', error);
      toast.error('Failed to submit bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidBid = () => {
    const bidValue = parseFloat(bidAmount);
    return !isNaN(bidValue) && bidValue >= minimumBidAmount;
  };

  const formatPrice = (price: number) => {
    return `${product.currency} ${price.toFixed(2)}`;
  };

  const getTimeRemaining = () => {
    if (!product.auctionEndTime) return null;
    
    const endTime = product.auctionEndTime;
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Auction ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Place Your Bid</span>
          </DialogTitle>
          <DialogDescription>
            {product.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pr-2">
          {/* Auction Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            {/* <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Quantity:</span>
              <span className="font-semibold">{quantity} {product.unitOfMeasurement}</span>
            </div> */}

            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-black">TOTAL:</span>
              <span className="font-semibold">
                {bidAmount && parseFloat(bidAmount) > 0 
                  ? formatPrice(parseFloat(bidAmount) * quantity)
                  : formatPrice(startingPrice * quantity)
                }
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Starting Price (per unit):</span>
              <span className="font-semibold">{formatPrice(startingPrice)}</span>
            </div>
            
            {highestBid > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Current Highest Bid (per unit):</span>
                  <span className="font-semibold text-green-600">{formatPrice(highestBid)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Current Highest Total:</span>
                  <span className="font-semibold text-green-600">{formatPrice(highestBid * quantity)}</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Minimum Bid (per unit):</span>
              <span className="font-semibold text-blue-600">{formatPrice(minimumBidAmount)}</span>
            </div>
            
            {/* <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Minimum Total:</span>
              <span className="font-semibold text-blue-600">{formatPrice(minimumBidAmount * quantity)}</span>
            </div> */}
            
            {autoAcceptThreshold && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Auto-Accept at (per unit):</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {formatPrice(autoAcceptThreshold)}
                  </Badge>
                </div>
                {/* <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Auto-Accept Total:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {formatPrice(autoAcceptThreshold * quantity)}
                  </Badge>
                </div> */}
              </>
            )}
          </div>

          {/* Time Remaining */}
          {product.auctionEndTime && (
            <div className="flex items-center space-x-2 text-sm">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-orange-600 font-medium">{getTimeRemaining()}</span>
            </div>
          )}

          <Separator />

          {/* Bid Input */}
          <div className="space-y-2">
            <Label htmlFor="bidAmount">Your Bid Amount (per unit)</Label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  id="bidAmount"
                  type="text"
                  placeholder={`Min: ${formatPrice(minimumBidAmount)}`}
                  value={bidAmount}
                  onChange={(e) => handleBidAmountChange(e.target.value)}
                  className={`text-lg font-semibold ${
                    bidAmount && !isValidBid() ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
              </div>
              <div className="flex items-center px-3 bg-gray-100 rounded-md">
                <span className="text-sm font-medium text-gray-600">{product.currency}</span>
              </div>
            </div>
            
            {bidAmount && parseFloat(bidAmount) > 0 && (
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">Total Bid Amount:</span>
                  <span className="text-lg font-bold text-blue-800">
                    {formatPrice(parseFloat(bidAmount) * quantity)}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {formatPrice(parseFloat(bidAmount))} × {quantity} {product.unitOfMeasurement}
                </p>
              </div>
            )}
            
            {bidAmount && !isValidBid() && (
              <p className="text-sm text-red-600">
                Bid must be at least {formatPrice(minimumBidAmount)} per unit
              </p>
            )}
          </div>

          {/* Quick Bid Options */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">Quick Bid Options:</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickBid(minimumBidAmount)}
                className="h-auto py-2 px-3 flex flex-col items-center justify-center"
              >
                <span className="text-xs font-medium">Min Bid</span>
                <span className="text-xs text-gray-600">{formatPrice(minimumBidAmount)}</span>
                <span className="text-xs text-blue-600">Total: {formatPrice(minimumBidAmount * quantity)}</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickBid(minimumBidAmount + minimumIncrement)}
                className="h-auto py-2 px-3 flex flex-col items-center justify-center"
              >
                <span className="text-xs font-medium">+{product.currency} {minimumIncrement.toFixed(2)}</span>
                <span className="text-xs text-gray-600">{formatPrice(minimumBidAmount + minimumIncrement)}</span>
                <span className="text-xs text-blue-600">Total: {formatPrice((minimumBidAmount + minimumIncrement) * quantity)}</span>
              </Button>
              
              {autoAcceptThreshold && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickBid(autoAcceptThreshold)}
                  className="h-auto py-2 px-3 flex flex-col items-center justify-center border-green-300 text-green-700 hover:bg-green-50 col-span-2"
                >
                  <span className="text-xs font-medium">Auto-Accept Threshold</span>
                  <span className="text-xs text-green-600">{formatPrice(autoAcceptThreshold)}</span>
                  <span className="text-xs text-green-600">Total: {formatPrice(autoAcceptThreshold * quantity)}</span>
                </Button>
              )}
            </div>
          </div>

          <Separator />

          <div className="p-3">
            <p className="text-sm text-gray-500 tracking-wide">
              Click Check Out to confirm your bid and proceed with the transaction. 
              This action cannot be undone after submission.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto cursor-pointer">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValidBid() || isSubmitting}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto cursor-pointer"
          >
            {isSubmitting ? 'Checking Out...' : 'Check Out'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}