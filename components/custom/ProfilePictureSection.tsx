"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

interface ProfilePictureSectionProps {
  businessName: string;
  businessImage?: string;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function ProfilePictureSection({
  businessName,
  businessImage,
  onImageUpload,
  imagePreview
}: ProfilePictureSectionProps) {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Business Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage 
                src={imagePreview || businessImage} 
                alt={businessName}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl bg-gray-200">
                <svg
                  className="h-16 w-16 text-gray-500"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col items-center space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('business-image-upload')?.click()}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                Change Picture
              </Button>
              <input
                id="business-image-upload"
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground text-center">
                Upload a professional business logo or image
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}