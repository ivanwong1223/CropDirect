"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { getUserData } from "@/lib/localStorage";
import { AnimatedBeamDemo } from "@/components/custom/AnimatedBeamDemo";
import NotificationContainer from "@/components/custom/NotificationContainer";

// Form data interface based on KYBForm model
interface KYBFormData {
  businessRegistrationNumber: string;
  businessAddress: string;
  taxId: string;
  businessLicense: File | null;
}

interface KYBStatus {
  businessName: string;
  kybStatus: string;
  isKybVerified: boolean;
  kybForm: {
    id: string;
    businessRegistrationNumber: string;
    businessAddress: string;
    taxId: string;
    businessLicense: string;
    submittedAt: string;
    reviewedAt: string | null;
    rejectionReason: string | null;
  } | null;
}

const KYBForm: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [kybStatus, setKybStatus] = useState<KYBStatus | null>(null);
  const [formData, setFormData] = useState<KYBFormData>({
    businessRegistrationNumber: "",
    businessAddress: "",
    taxId: "",
    businessLicense: null,
  });
  const [notifications, setNotifications] = useState<React.ReactNode[]>([]);

  // Get user ID from localStorage and check KYB status
  useEffect(() => {
    const initializeComponent = async () => {
      const userData = getUserData();
      if (userData) {
        setUserId(userData.id);
        console.log("The User ID is: ", userData.id);
        
        // Check current KYB status
        try {
          const response = await fetch(`/api/kyb-status?userId=${userData.id}`);
          if (response.ok) {
            const result = await response.json();
            setKybStatus(result.data);
          }
        } catch (error) {
          console.error('Error fetching KYB status:', error);
        }
      } else {
        router.push('/login');
        return;
      }
      setIsPageLoading(false);
    };
    
    initializeComponent();
  }, [router]);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      businessLicense: file,
    }));
  };

  // Remove uploaded file
  const removeFile = () => {
    setFormData((prev) => ({
      ...prev,
      businessLicense: null,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      const ts = new Date().toLocaleTimeString();
      setNotifications((prev) => [
        <div 
          key={`auth-error-${Date.now()}`} 
          className="flex items-start gap-3 rounded-md border bg-white p-3 shadow-sm opacity-100 transition-opacity duration-300"
          onAnimationEnd={() => {
            setTimeout(() => {
              setNotifications(prev => prev.slice(1));
            }, 5000);
          }}
          style={{
            animation: 'fadeOut 300ms ease-in-out 5s forwards'
          }}
        >
          <style jsx>{`
            @keyframes fadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
            }
          `}</style>
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-red-700">Authentication Required</div>
            <div className="text-xs text-gray-600">Please login again. {ts}</div>
          </div>
        </div>,
        ...prev,
      ]);
      router.push('/login');
      return;
    }
    
    setIsLoading(true);

    try {
      const submitFormData = new FormData();
      submitFormData.append("userId", userId);
      submitFormData.append("businessRegistrationNumber", formData.businessRegistrationNumber);
      submitFormData.append("businessAddress", formData.businessAddress);
      submitFormData.append("taxId", formData.taxId);
      
      if (formData.businessLicense) {
        submitFormData.append("businessLicense", formData.businessLicense);
      }
      console.log("The Form Data submitted is: ", formData);

      const response = await fetch("/api/kyb-form", {
        method: "POST",
        body: submitFormData,
      });

      const result = await response.json();

      if (response.ok) {
        // Navigate to profile page with success notification parameter
        router.push("/seller/my-profile?kybSuccess=true");
      } else {
        const ts = new Date().toLocaleTimeString();
        setNotifications((prev) => [
          <div 
            key={`error-${Date.now()}`} 
            className="flex items-start gap-3 rounded-md border bg-white p-3 shadow-sm opacity-100 transition-opacity duration-300"
            onAnimationEnd={() => {
              setTimeout(() => {
                setNotifications(prev => prev.slice(1));
              }, 5000);
            }}
            style={{
              animation: 'fadeOut 300ms ease-in-out 5s forwards'
            }}
          >
            <style jsx>{`
              @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
              }
            `}</style>
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-red-700">Submission Failed</div>
              <div className="text-xs text-gray-600">{result.error || "Failed to submit KYB form"}. {ts}</div>
            </div>
          </div>,
          ...prev,
        ]);
      }
    } catch (error) {
      console.error("❌ KYB submission error:", error);
      const ts = new Date().toLocaleTimeString();
      setNotifications((prev) => [
        <div 
          key={`catch-error-${Date.now()}`} 
          className="flex items-start gap-3 rounded-md border bg-white p-3 shadow-sm opacity-100 transition-opacity duration-300"
          onAnimationEnd={() => {
            setTimeout(() => {
              setNotifications(prev => prev.slice(1));
            }, 5000);
          }}
          style={{
            animation: 'fadeOut 300ms ease-in-out 5s forwards'
          }}
        >
          <style jsx>{`
            @keyframes fadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
            }
          `}</style>
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-red-700">Submission Error</div>
            <div className="text-xs text-gray-600">Failed to submit KYB form. Please try again. {ts}</div>
          </div>
        </div>,
        ...prev,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking KYB status
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-gray-900 font-semibold text-xl tracking-wide">We are preparing your KYB document status...</p>
        </div>
        <AnimatedBeamDemo />
      </div>
    );
  }

  // Show status if KYB form has already been submitted
  if (kybStatus?.kybForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => router.push("/seller/my-profile")}
            className="flex cursor-pointer items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow duration-200 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <motion.div
          className="max-w-2xl w-full bg-white shadow-xl rounded-2xl p-8"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              KYB Verification Status
            </h1>
            <p className="text-gray-600">
              Your business verification application status
            </p>
          </div>

          {/* Status Display */}
          <div className="space-y-6">
            <div className={`p-6 rounded-lg border-2 ${
              kybStatus.kybStatus === 'APPROVED' ? 'bg-green-50 border-green-200' :
              kybStatus.kybStatus === 'REJECTED' ? 'bg-red-50 border-red-200' :
              kybStatus.kybStatus === 'PENDING' ? 'bg-yellow-50 border-yellow-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-center mb-4">
                {kybStatus.kybStatus === 'APPROVED' && (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {kybStatus.kybStatus === 'REJECTED' && (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {kybStatus.kybStatus === 'PENDING' && (
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <h3 className={`text-xl font-semibold text-center mb-2 ${
                kybStatus.kybStatus === 'APPROVED' ? 'text-green-800' :
                kybStatus.kybStatus === 'REJECTED' ? 'text-red-800' :
                kybStatus.kybStatus === 'PENDING' ? 'text-yellow-800' :
                'text-gray-800'
              }`}>
                {kybStatus.kybStatus === 'APPROVED' && 'Verification Approved'}
                {kybStatus.kybStatus === 'REJECTED' && 'Verification Rejected'}
                {kybStatus.kybStatus === 'PENDING' && 'Verification Pending'}
                {kybStatus.kybStatus === 'REQUIRES_RESUBMISSION' && 'Resubmission Required'}
              </h3>
              
              <p className={`text-center ${
                kybStatus.kybStatus === 'APPROVED' ? 'text-green-700' :
                kybStatus.kybStatus === 'REJECTED' ? 'text-red-700' :
                kybStatus.kybStatus === 'PENDING' ? 'text-yellow-700' :
                'text-gray-700'
              }`}>
                {kybStatus.kybStatus === 'APPROVED' && 'Congratulations! Your business has been verified. You can now start selling on CropDirect.'}
                {kybStatus.kybStatus === 'REJECTED' && 'Your verification was rejected. Please see the reason below and resubmit with correct information.'}
                {kybStatus.kybStatus === 'PENDING' && 'Your application is being reviewed by our admin team. This usually takes 2-3 business days.'}
                {kybStatus.kybStatus === 'REQUIRES_RESUBMISSION' && 'Please review the feedback and resubmit your application with the required changes.'}
              </p>
            </div>

            {/* Rejection Reason */}
            {kybStatus.kybStatus === 'REJECTED' && kybStatus.kybForm.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Rejection Reason:</h4>
                <p className="text-red-700">{kybStatus.kybForm.rejectionReason}</p>
              </div>
            )}

            {/* Submitted Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-800 mb-4">Submitted Information:</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Business Registration Number:</span>
                  <span className="ml-2 text-gray-800">{kybStatus.kybForm.businessRegistrationNumber || 'Not provided'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Business Address:</span>
                  <span className="ml-2 text-gray-800">{kybStatus.kybForm.businessAddress}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Tax ID:</span>
                  <span className="ml-2 text-gray-800">{kybStatus.kybForm.taxId || 'Not provided'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Business License Document:</span>
                  {kybStatus.kybForm.businessLicense ? (
                    <a 
                      href={kybStatus.kybForm.businessLicense} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      View My Document
                    </a>
                  ) : (
                    <span className="ml-2 text-gray-800">Not provided</span>
                  )}
                </div>
                <div>
                  <span className="font-medium text-gray-600">Submitted At:</span>
                  <span className="ml-2 text-gray-800">{new Date(kybStatus.kybForm.submittedAt).toLocaleDateString()}</span>
                </div>
                {kybStatus.kybForm.reviewedAt && (
                  <div>
                    <span className="font-medium text-gray-600">Reviewed At:</span>
                    <span className="ml-2 text-gray-800">{new Date(kybStatus.kybForm.reviewedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => router.push("/seller/my-profile")}
                className="flex-1 py-3 px-6 cursor-pointer bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Back to Profile
              </button>
              {(kybStatus.kybStatus === 'REJECTED' || kybStatus.kybStatus === 'REQUIRES_RESUBMISSION') && (
                <button
                  onClick={() => {
                    // Reset form and allow resubmission
                    setKybStatus(null);
                  }}
                  className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Resubmit Application
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <NotificationContainer notifications={notifications} />
      
      <motion.div
        className="max-w-2xl w-full bg-white shadow-xl rounded-2xl p-8"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        {/* Header */}
        <div className="mb-8 mt-4">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push("/seller/my-profile")}
              className="flex cursor-pointer items-center justify-center w-8 h-8 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow duration-200 text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 flex-1 text-center pr-14">
              Business Verification Form
            </h1>
          </div>
          <p className="text-gray-600 tracking-wide text-center">
            Complete your KYB (Know Your Business) verification to start selling on CropDirect
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Registration Number */}
          <div>
            <label htmlFor="businessRegistrationNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Business Registration Number<span className='text-red-500'>*</span>
            </label>
            <input
              type="text"
              id="businessRegistrationNumber"
              name="businessRegistrationNumber"
              value={formData.businessRegistrationNumber}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your business registration number"
            />
          </div>

          {/* Business Address */}
          <div>
            <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Business Address<span className='text-red-500'>*</span>
            </label>
            <textarea
              id="businessAddress"
              name="businessAddress"
              value={formData.businessAddress}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Enter your complete business address"
            />
          </div>

          {/* Tax ID */}
          <div>
            <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-2">
              Tax ID (Optional)
            </label>
            <input
              type="text"
              id="taxId"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your tax identification number"
            />
          </div>

          {/* Business License Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business License Document<span className='text-red-500'>*</span>
            </label>
            
            {!formData.businessLicense ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors duration-200">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="text-sm text-gray-600 mb-2">
                  <label htmlFor="businessLicense" className="cursor-pointer text-green-900 hover:text-green-500 font-medium">
                    Click to upload
                  </label>
                  <span> or drag and drop</span>
                </div>
                <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                <input
                  type="file"
                  id="businessLicense"
                  name="businessLicense"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  required
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Upload className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formData.businessLicense.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(formData.businessLicense.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-all duration-200 ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-800 hover:bg-blue-700 cursor-pointer shadow-lg hover:shadow-xl"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                "Submit KYB Form"
              )}
            </button>
          </motion.div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Verification Process
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Your KYB application will be reviewed by our admin team within 2-3 business days. 
                    You will receive a notification once the review is complete.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default KYBForm;