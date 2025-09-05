"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface KYBStatusCardProps {
  kybStatus: string;
  isKybVerified: boolean;
  formPath?: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const getKYBStatusInfo = (status: string, isVerified: boolean) => {
  switch (status) {
    case 'APPROVED':
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        text: 'KYB Verified',
        description: 'Your business has been successfully verified',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    case 'PENDING':
      return {
        icon: <Clock className="h-5 w-5 text-yellow-500" />,
        text: 'KYB Under Review',
        description: 'Your KYB application is being reviewed',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    case 'REJECTED':
      return {
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        text: 'KYB Rejected',
        description: 'Your KYB application was rejected. Please resubmit.',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    case 'REQUIRES_RESUBMISSION':
      return {
        icon: <AlertCircle className="h-5 w-5 text-orange-500" />,
        text: 'KYB Resubmission Required',
        description: 'Additional information is required for verification',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    default:
      return {
        icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
        text: 'KYB Not Submitted',
        description: 'Complete your KYB verification to unlock all features',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
  }
};

export default function KYBStatusCard({ kybStatus, isKybVerified, formPath }: KYBStatusCardProps) {
  const statusInfo = getKYBStatusInfo(kybStatus, isKybVerified);
  const targetPath = "/seller/kyb-form";

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <Card className={`${statusInfo.borderColor} ${statusInfo.bgColor}`}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">KYB Verification Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {statusInfo.icon}
            <div>
              <h3 className={`font-medium ${statusInfo.color}`}>
                {statusInfo.text}
              </h3>
              <p className="text-sm text-muted-foreground tracking-wide">
                {statusInfo.description}
              </p>
            </div>
          </div>
          
          {(kybStatus === 'NOT_SUBMITTED' || kybStatus === 'REJECTED' || kybStatus === 'REQUIRES_RESUBMISSION' || kybStatus === 'PENDING' || kybStatus === 'APPROVED') && (
            <Button 
              className="w-full cursor-pointer tracking-wide"
              variant={kybStatus === 'PENDING' || kybStatus === 'APPROVED' ? "link" : "default"}
              onClick={() => {
                // Navigate to KYB form
                window.location.href = targetPath;
              }}
            >
              {kybStatus === 'NOT_SUBMITTED' 
                ? 'Start KYB Verification' 
                : kybStatus === 'PENDING'
                ? 'View KYB Form'
                : kybStatus === 'APPROVED'
                ? 'View KYB Form'
                : 'Resubmit KYB'}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
