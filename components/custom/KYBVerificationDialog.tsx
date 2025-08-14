"use client";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface KYBVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kybStatus: string | null;
}

export default function KYBVerificationDialog({
  open,
  onOpenChange,
  kybStatus,
}: KYBVerificationDialogProps) {
  const router = useRouter();

  const getDialogMessage = () => {
    switch (kybStatus) {
      case "REJECTED":
        return "Your KYB was rejected. To get started, please undergo the verification process again to start selling on CropDirect.";
      case "REQUIRES_RESUBMISSION":
        return "Your KYB requires resubmission. To get started, please update your information to complete verification and start selling on CropDirect.";
      default:
        return "Your KYB has not been verified yet. To get started, please undergo the verification process first to start selling on CropDirect.";
    }
  };

  const handleStartVerification = () => {
    router.push("/seller/kyb-form");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center">
          <AlertDialogTitle className="text-2xl font-semibold text-center">
            Verification Required
          </AlertDialogTitle>
          <AlertDialogDescription className="text-lg text-center leading-8 text-gray-600 font-medium mt-4 mb-2 tracking-wide">
            {getDialogMessage()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center sm:justify-center gap-4">
          <AlertDialogCancel className="bg-gray-500 border-gray-500 border-1 hover:border-1 hover:bg-white hover:border-gray-500 hover:text-gray-800 text-white font-bold tracking-wider text-md px-10 py-5.5 rounded-lg transition-colors duration-200 cursor-pointer">
            Maybe later
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleStartVerification}
            className="bg-blue-700 border-blue-600 border-1 hover:border-1 hover:bg-white hover:border-blue-600 hover:text-blue-800 text-white font-bold tracking-wider text-md px-10 py-5.5 rounded-lg transition-colors duration-200 cursor-pointer"
          >
            Start Verification
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
