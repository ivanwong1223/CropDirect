"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProductList() {
  const router = useRouter();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Product List</h1>
      <Button
        className="cursor-pointer"
        onClick={() => {
          router.push('/seller/add-product');
        }}
      >
        <Plus className="mr-2" />
        Add New Product
      </Button>
    </div>
  );
}
