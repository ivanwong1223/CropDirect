"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchField() {
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    
    return (
        <div className="flex gap-3">
            <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search produce, categories, sellers..."
                    className="p-5 pl-10 bg-white text-gray-800 placeholder:text-gray-400 border border-gray-200 focus:border-gray-300 focus:ring-gray-300"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            window.location.href = `/buyer/marketplace?search=${encodeURIComponent(search)}`;
                        }
                    }}
                />
            </div>
        </div>
    )
}
