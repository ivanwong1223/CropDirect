"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import ProfilePictureSection from "@/components/custom/ProfilePictureSection";
import KYBStatusCard from "@/components/custom/KYBStatusCard";
import NotificationContainer from "@/components/custom/NotificationContainer";
import { getUserData } from "@/lib/localStorage";
import { CheckCircle, AlertCircle, Building2, Phone, Mail, MapPin, Truck, Save, X, LandPlot, CircleDollarSign, ClockFading } from "lucide-react";
import { getCountries, getStatesByCountry } from "@/lib/countries";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Types used by this page
// Pricing model and configuration type definitions
export type PricingModel = "Flat Rate Model" | "Tiered Rate by Weight" | "Tiered Rate by Distance";
export interface WeightTier { min: number; max: number | null; rate: number }
export interface DistanceTier { min: number; max: number | null; rate: number }
export interface PricingConfig {
  flatRatePerKgKm?: number;
  weightTiers?: WeightTier[];
  distanceTiers?: DistanceTier[];
}

// Serialize structured pricing config into a string[] for DB storage
function serializePricingConfig(model: PricingModel | "", cfg: PricingConfig): string[] {
  if (!model) return [];
  const out: string[] = [];
  if (model === "Flat Rate Model") {
    // Store only the numeric value (e.g., "0.14") without any label
    out.push(String(cfg.flatRatePerKgKm ?? 0));
    return out;
  }
  if (model === "Tiered Rate by Weight") {
    for (const t of cfg.weightTiers ?? []) {
      const min = t.min ?? 0;
      const max = t.max === null || t.max === undefined ? "+" : String(t.max);
      const rate = t.rate ?? 0;
      // Store unlabeled format: "min-max@rate" (e.g., "3-12@0.08")
      out.push(`${min}-${max}@${rate}`);
    }
    return out;
  }
  if (model === "Tiered Rate by Distance") {
    for (const t of cfg.distanceTiers ?? []) {
      const min = t.min ?? 0;
      const max = t.max === null || t.max === undefined ? "+" : String(t.max);
      const rate = t.rate ?? 0;
      // Store unlabeled format: "min-max@rate" (e.g., "10-50@0.06")
      out.push(`${min}-${max}@${rate}`);
    }
    return out;
  }
  return out;
}

// Parse string[] from DB back into structured pricing config for UI editing
function parsePricingConfig(model: PricingModel | "", arr: string[] | undefined | null): PricingConfig {
  const cfg: PricingConfig = {};
  if (!model || !Array.isArray(arr) || arr.length === 0) return cfg;

  // Helper to determine if a string is a plain numeric value
  const isNumeric = (s: string) => /^\s*\d+(?:\.\d+)?\s*$/.test(s);

  if (model === "Flat Rate Model") {
    // Support legacy labeled format (e.g., "flat:0.14") and new unlabeled numeric (e.g., "0.14")
    const line = arr.find((l) => l.startsWith("flat:")) ?? arr.find((l) => isNumeric(l));
    if (line) {
      const rateStr = line.startsWith("flat:") ? line.split(":")[1] ?? "" : line;
      const rate = Number(rateStr);
      if (Number.isFinite(rate)) cfg.flatRatePerKgKm = rate;
    }
    return cfg;
  }

  if (model === "Tiered Rate by Weight") {
    const tiers: WeightTier[] = [];
    for (const raw of arr) {
      // Accept both legacy labeled ("w:min-max@rate") and new unlabeled ("min-max@rate")
      const l = raw.startsWith("w:") ? raw.substring(2) : raw;
      if (!l.includes("@")) continue;
      const [range, rateStr] = l.split("@");
      const [minStr, maxStr] = (range ?? "").split("-");
      const min = Number(minStr ?? 0);
      const max = maxStr === "+" ? null : maxStr === undefined || maxStr === "" ? null : Number(maxStr);
      const rate = Number(rateStr ?? 0);
      if (Number.isFinite(min) && Number.isFinite(rate)) tiers.push({ min, max, rate });
    }
    cfg.weightTiers = tiers;
    return cfg;
  }

  if (model === "Tiered Rate by Distance") {
    const tiers: DistanceTier[] = [];
    for (const raw of arr) {
      // Accept both legacy labeled ("d:min-max@rate") and new unlabeled ("min-max@rate")
      const l = raw.startsWith("d:") ? raw.substring(2) : raw;
      if (!l.includes("@")) continue;
      const [range, rateStr] = l.split("@");
      const [minStr, maxStr] = (range ?? "").split("-");
      const min = Number(minStr ?? 0);
      const max = maxStr === "+" ? null : maxStr === undefined || maxStr === "" ? null : Number(maxStr);
      const rate = Number(rateStr ?? 0);
      if (Number.isFinite(min) && Number.isFinite(rate)) tiers.push({ min, max, rate });
    }
    cfg.distanceTiers = tiers;
    return cfg;
  }

  return cfg;
}

/**
 * Build a concise human-readable summary for the current pricing configuration.
 * This helps users quickly verify what will be saved.
 */
function pricingSummaryText(model: PricingModel | "", cfg: PricingConfig): string {
  if (!model) return "No pricing model selected";
  if (model === "Flat Rate Model") {
    const rate = cfg.flatRatePerKgKm ?? 0;
    return `Flat rate: ${rate}/kg/km`;
  }
  if (model === "Tiered Rate by Weight") {
    const tiers = (cfg.weightTiers ?? []).map(t => {
      const maxLabel = t.max == null ? "+" : String(t.max);
      return `${t.min}-${maxLabel}kg @ ${t.rate}/kg/km`;
    });
    return tiers.length ? `Weight tiers: ${tiers.join("; ")}` : "No weight tiers defined";
  }
  if (model === "Tiered Rate by Distance") {
    const tiers = (cfg.distanceTiers ?? []).map(t => {
      const maxLabel = t.max == null ? "+" : String(t.max);
      return `${t.min}-${maxLabel}km @ ${t.rate}/kg/km`;
    });
    return tiers.length ? `Distance tiers: ${tiers.join("; ")}` : "No distance tiers defined";
  }
  return "";
}

export default function LogisticsMyProfile() {
  const router = useRouter();
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [profile, setProfile] = useState<LogisticsProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notifications, setNotifications] = useState<React.ReactNode[]>([]);
  const [imagePreview, setImagePreview] = useState("");
  const [customTransportMode, setCustomTransportMode] = useState("");

  // Countries and states (for service areas)
  const countries = getCountries();
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [availableStates, setAvailableStates] = useState<Array<{ code: string; name: string }>>([]);

  // Handlers for Service Areas (country + multi-state)
  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const states = getStatesByCountry(countryCode) || [];
    setAvailableStates(states);
    // Reset selected states when country changes to avoid cross-country mix
    setFormData((p) => ({ ...p, serviceAreas: [] }));
  };

  const toggleStateSelection = (stateCode: string) => {
    setFormData((p) => {
      const set = new Set(p.serviceAreas);
      if (set.has(stateCode)) {
        set.delete(stateCode);
      } else {
        set.add(stateCode);
      }
      return { ...p, serviceAreas: Array.from(set) };
    });
  };

  // Form state for logistics
  const [formData, setFormData] = useState({
    companyName: "",
    name: "",
    email: "",
    contactNo: "",
    companyAddress: "",
    businessImage: "",
    serviceAreas: [] as string[], // Will store selected state codes
    transportModes: [] as string[],
    estimatedDeliveryTime: "",
    pricingModel: "",
    // Holds configuration for the selected pricing model (flat rate or tiers)
    pricingConfig: {} as PricingConfig,
  });

  /**
   * Handle pricing model changes and initialize sensible defaults for the configuration
   * so providers immediately see what to edit.
   */
  function handlePricingModelChange(value: string) {
    const model = value as PricingModel;
    setFormData((prev) => {
      let pricingConfig: PricingConfig = {};
      if (model === "Flat Rate Model") {
        pricingConfig = { flatRatePerKgKm: 0.05 };
      } else if (model === "Tiered Rate by Weight") {
        pricingConfig = {
          weightTiers: [
            { min: 0, max: 10, rate: 0.06 },
            { min: 11, max: 50, rate: 0.04 },
            { min: 51, max: null, rate: 0.03 },
          ],
        };
      } else if (model === "Tiered Rate by Distance") {
        pricingConfig = {
          distanceTiers: [
            { min: 0, max: 50, rate: 0.07 },
            { min: 51, max: 200, rate: 0.05 },
            { min: 201, max: null, rate: 0.04 },
          ],
        };
      }
      return { ...prev, pricingModel: value, pricingConfig };
    });
  }

  /** Add a new tier row for weight or distance pricing. */
  function addTier(kind: "weight" | "distance") {
    setFormData((prev) => {
      const key = kind === "weight" ? "weightTiers" : "distanceTiers";
      const tiers = Array.isArray(prev.pricingConfig?.[key]) ? [...prev.pricingConfig[key]] : [];
      tiers.push({ min: 0, max: null, rate: 0 });
      return { ...prev, pricingConfig: { ...prev.pricingConfig, [key]: tiers } };
    });
  }

  /** Remove a tier by index for the given kind. */
  function removeTier(kind: "weight" | "distance", index: number) {
    setFormData((prev) => {
      const key = kind === "weight" ? "weightTiers" : "distanceTiers";
      const tiers = Array.isArray(prev.pricingConfig?.[key]) ? [...prev.pricingConfig[key]] : [];
      tiers.splice(index, 1);
      return { ...prev, pricingConfig: { ...prev.pricingConfig, [key]: tiers } };
    });
  }

  /** Update a field (min, max, rate) on a specific tier. */
  function updateTierField(
    kind: "weight" | "distance",
    index: number,
    field: "min" | "max" | "rate",
    value: string
  ) {
    setFormData((prev) => {
      const key = kind === "weight" ? "weightTiers" : "distanceTiers";
      const tiers = Array.isArray(prev.pricingConfig?.[key]) ? [...prev.pricingConfig[key]] : [];
      const parsed: number | null = value === "" ? null : Number(value);
      tiers[index] = {
        ...tiers[index],
        [field]: field === "rate" || field === "min" ? Number(parsed ?? 0) : parsed,
      };
      return { ...prev, pricingConfig: { ...prev.pricingConfig, [key]: tiers } };
    });
  }

  // Initialize Google Places Autocomplete for company address
  useEffect(() => {
    const tryInit = () => {
      if (autocompleteRef.current) return true; // already initialized

      const inputEl = addressInputRef.current;
      const gm = (window).google;

      if (!inputEl || !gm?.maps?.places) {
        return false;
      }

      try {
        const autocomplete = new gm.maps.places.Autocomplete(inputEl, {
          types: ["geocode"],
          componentRestrictions: { country: "my" },
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place?.formatted_address) {
            setFormData((p) => ({ ...p, companyAddress: place.formatted_address! }));
            console.log("Selected address:", place.formatted_address);
            console.log("Lat:", place.geometry?.location?.lat());
            console.log("Lng:", place.geometry?.location?.lng());
          } else {
            console.log("No formatted address found in place result");
          }
        });

        autocompleteRef.current = autocomplete;
        console.log("Google Places Autocomplete initialized successfully for address");
        return true;
      } catch (error) {
        console.error("Error initializing Google Places Autocomplete:", error);
        return false;
      }
    };

    // Try immediately in case both input and google are ready
    if (tryInit()) {
      return () => {
        if (autocompleteRef.current) {
          (window).google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
          autocompleteRef.current = null;
        }
      };
    }

    // Poll until both address input is mounted and Google Places is available
    const checkReadyInterval = window.setInterval(() => {
      if (tryInit()) {
        window.clearInterval(checkReadyInterval);
        window.clearTimeout(timeoutId);
      }
    }, 200);

    // Give up after 15s to avoid infinite polling
    const timeoutId = window.setTimeout(() => {
      window.clearInterval(checkReadyInterval);
      console.error("Google Maps API or address input not ready within 15 seconds");
    }, 15000);

    // Cleanup function
    return () => {
      window.clearInterval(checkReadyInterval);
      window.clearTimeout(timeoutId);
      if (autocompleteRef.current) {
        (window).google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
    // Re-run when loading state changes so that once the form mounts, we can initialize
  }, [isLoading]);

  // Fetch initial profile
  useEffect(() => {
    (async () => {
      try {
        const user = getUserData();
        if (!user) {
          router.push("/sign-in");
          return;
        }
        const res = await fetch(`/api/user/logistics?userId=${user.id}`);
        const json = await res.json();
        if (json.success) {
          const d: LogisticsProfile = json.data;
          setProfile(d);

          // Derive initial country and state codes from stored serviceAreas
          let initialCountry = "";
          let initialStateCodes: string[] = [];
          if (Array.isArray(d.serviceAreas) && d.serviceAreas.length) {
            const withCountry = d.serviceAreas.find((s: string) => s.includes(":"));
            if (withCountry) {
              initialCountry = withCountry.split(":")[0];
              initialStateCodes = d.serviceAreas
                .filter((s: string) => s.startsWith(`${initialCountry}:`))
                .map((s: string) => s.split(":")[1]);
              setSelectedCountry(initialCountry);
              const states = getStatesByCountry(initialCountry) || [];
              setAvailableStates(states);
            } else {
              initialStateCodes = d.serviceAreas;
            }
          }

          setFormData({
            companyName: d.companyName || "",
            name: d.user.name || "",
            email: d.user.email || "",
            contactNo: d.contactNo || "",
            companyAddress: d.companyAddress || "",
            businessImage: d.businessImage || "",
            serviceAreas: initialStateCodes,
            transportModes: d.transportModes || [],
            estimatedDeliveryTime: d.estimatedDeliveryTime || "",
            pricingModel: d.pricingModel || "",
            pricingConfig: parsePricingConfig(d.pricingModel || "", d.pricingConfig),
          });
          if (d.businessImage) setImagePreview(d.businessImage);
        } else {
          setError(json.error || "Failed to load profile");
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [router]);

  // Input handlers
  function onInput(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (error) setError("");
  }
  function onSelect(name: keyof typeof formData) {
    return (v: string) => {
      setFormData((p) => ({ ...p, [name]: v }));
      if (error) setError("");
    };
  }
  function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onloadend = () => {
      const src = r.result as string;
      setImagePreview(src);
      setFormData((p) => ({ ...p, businessImage: src }));
    };
    r.readAsDataURL(f);
  }

  // Transport modes toggle
  function toggleMode(opt: string) {
    setFormData((p) => {
      const s = new Set(p.transportModes);
      if (s.has(opt)) {
        s.delete(opt);
        // If unchecking 'Other', also clear the custom transport mode
        if (opt === 'Other') {
          setCustomTransportMode('');
        }
      } else {
        s.add(opt);
      }
      return { ...p, transportModes: [...s] };
    });
  }



  // Service areas helpers
  function removeArea(v: string) {
    setFormData((p) => ({ ...p, serviceAreas: p.serviceAreas.filter((a) => a !== v) }));
  }

  // Submit
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      // Add custom transport mode to the list if it exists
      const finalTransportModes = [...formData.transportModes];
      if (formData.transportModes.includes('Other') && customTransportMode.trim()) {
        finalTransportModes.push(customTransportMode.trim());
      }

      // Persist service areas as `${country}:${state}` for clarity
      const serviceAreasPayload = selectedCountry
        ? formData.serviceAreas.map((code) => `${selectedCountry}:${code}`)
        : formData.serviceAreas;

      const body = {
        userId: profile?.user.id,
        name: formData.name,
        email: formData.email,
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        businessImage: formData.businessImage,
        contactNo: formData.contactNo,
        serviceAreas: serviceAreasPayload,
        transportModes: finalTransportModes,
        estimatedDeliveryTime: formData.estimatedDeliveryTime,
        pricingModel: formData.pricingModel,
        // serialize pricing config object into string[] before sending to API
        pricingConfig: serializePricingConfig(formData.pricingModel as PricingModel | "", formData.pricingConfig),
      };
      const res = await fetch("/api/user/logistics/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess("Profile updated successfully!");
        // Fire a transient notification similar to seller page pattern
        setNotifications((prev) => [
          <div
            key={`logistics-success-${Date.now()}`}
            className="flex items-start gap-3 rounded-md border bg-white p-3 shadow-sm opacity-100 transition-opacity duration-300"
            onAnimationEnd={() => {
              setTimeout(() => {
                setNotifications((p) => p.slice(1));
              }, 4000);
            }}
            style={{ animation: "fadeOut 300ms ease-in-out 4s forwards" }}
          >
            <style jsx>{`
              @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
            `}</style>
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm font-medium">Profile Updated</div>
              <div className="text-xs text-gray-600">Your logistics profile changes were saved.</div>
            </div>
          </div>,
          ...prev,
        ]);
        // Delay reload to allow notification to be visible
        // setTimeout(() => {
        //   window.location.reload();
        // }, 3000);
      } else {
        setError(json.error || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1E9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <NotificationContainer notifications={notifications} />
      <div className="max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-6">My Profile</h1>
        <p className="text-gray-600 mb-6">Manage your logistics profile</p>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Profile Picture */}
              <ProfilePictureSection
                businessName={formData.companyName}
                businessImage={formData.businessImage}
                onImageUpload={onImage}
                imagePreview={imagePreview}
              />

              <Separator />

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Name
                  </Label>
                  <Input id="companyName" name="companyName" value={formData.companyName} onChange={onInput} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Name
                  </Label>
                  <Input id="name" name="name" value={formData.name} onChange={onInput} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={onInput} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNo" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Number
                  </Label>
                  <Input id="contactNo" name="contactNo" type="tel" value={formData.contactNo} onChange={onInput} required />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="companyAddress" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Company Address
                </Label>
                <Input
                  ref={addressInputRef}
                  id="companyAddress"
                  name="companyAddress"
                  type="text"
                  value={formData.companyAddress}
                  onChange={onInput}
                  placeholder="Start typing your company address..."
                  autoComplete="off"
                  className="bg-white border-1 border-gray-300"
                  required
                />
              </div>

              <Separator />

              {/* Transport Modes */}
              <div className="space-y-5 mb-10">
                <Label className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Available Transport Modes
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TRANSPORT_OPTIONS.map((opt: (typeof TRANSPORT_OPTIONS)[number]) => (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        className="border-2 border-gray-400"
                        checked={formData.transportModes.includes(opt)}
                        onCheckedChange={() => toggleMode(opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
                
                {/* Custom transport mode input - shows when 'Other' is selected */}
                {formData.transportModes.includes('Other') && (
                  <div className="mt-3">
                    <Input
                      placeholder="Enter custom transport mode"
                      value={customTransportMode}
                      onChange={(e) => setCustomTransportMode(e.target.value)}
                    />
                  </div>
                )}
                
                {/* Display added custom transport modes */}
                {formData.transportModes.filter(mode => !(TRANSPORT_OPTIONS as readonly string[]).includes(mode)).length > 0 && (
                  <div className="mt-3">
                    <Label className="text-sm text-gray-600">Custom Transport Modes:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.transportModes
                        .filter(mode => !(TRANSPORT_OPTIONS as readonly string[]).includes(mode))
                        .map((mode) => (
                          <span
                            key={mode}
                            className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm"
                          >
                            {mode}
                            <button
                              type="button"
                              onClick={() => toggleMode(mode)}
                              className="text-gray-500 hover:text-red-500 ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Service Areas */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <LandPlot className="h-4 w-4" />
                  Service Areas
                </Label>
                
                <div className="grid grid-cols-2 gap-6 mt-5">
                  {/* Country selection */}
                  <div className="space-y-3">
                    <Label className="font-normal" htmlFor="serviceCountry">Country</Label>
                    <Select value={selectedCountry} onValueChange={handleCountryChange}>
                      <SelectTrigger className="w-3/4">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Multi-select states */}
                  <div className="space-y-3">
                    <Label className="font-normal" htmlFor="serviceStates">State/Region</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!selectedCountry || availableStates.length === 0}
                          className={`w-3/4 justify-start ${!selectedCountry ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {formData.serviceAreas.length > 0
                            ? `Selected (${formData.serviceAreas.length})`
                            : (!selectedCountry ? 'Select country first' : 'Select states')}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        {availableStates.map((state) => (
                          <DropdownMenuCheckboxItem
                            key={state.code}
                            checked={formData.serviceAreas.includes(state.code)}
                            onCheckedChange={() => toggleStateSelection(state.code)}
                          >
                            {state.name}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Selected chips - moved here to be below State/Region dropdown */}
                    {formData.serviceAreas.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.serviceAreas.map((code) => {
                          const name = availableStates.find((s: { code: string; name: string }) => s.code === code)?.name || code;
                          return (
                            <span key={code} className="px-2 py-1 text-xs bg-gray-100 rounded-full flex items-center gap-1">
                              {name}
                              <button
                                type="button"
                                onClick={() => removeArea(code)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Estimated Delivery Time */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ClockFading className="h-4 w-4" />
                  Estimated Delivery Time
                </Label>
                <Input
                  name="estimatedDeliveryTime"
                  value={formData.estimatedDeliveryTime}
                  onChange={onInput}
                  placeholder="e.g., 1-3 business days"
                  className="w-[250px]"
                />
                <p className="text-xs text-gray-500">Describe your typical delivery window, for example: 1-3 business days.</p>
              </div>

              {/* Pricing */}
              <div className="space-y-2 mt-10">
                <Label className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4" />
                  Pricing Model
                </Label>
                <Select value={formData.pricingModel} onValueChange={handlePricingModelChange}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select pricing model" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICING_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Flat Rate Model configuration */}
                {formData.pricingModel === "Flat Rate Model" && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-600">Formula: Distance × Weight × Rate per kg per km</p>
                    <div className="flex items-center gap-3">
                      <Label className="w-48">Rate (per kg per km)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={formData.pricingConfig?.flatRatePerKgKm ?? ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            pricingConfig: {
                              ...prev.pricingConfig,
                              flatRatePerKgKm: Number(e.target.value || 0),
                            },
                          }))
                        }
                        className="w-64"
                        placeholder="e.g. 0.05"
                      />
                    </div>
                  </div>
                )}

                {/* Tiered by Weight configuration */}
                {formData.pricingModel === "Tiered Rate by Weight" && (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm text-gray-600">Define tiers by weight range. Formula uses rate from the tier: Distance × Weight × Rate</p>
                    <div className="space-y-2">
                      {(formData.pricingConfig?.weightTiers || []).map((tier: WeightTier, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={tier.min ?? 0}
                            onChange={(e) => updateTierField("weight", idx, "min", e.target.value)}
                            className="w-24"
                            placeholder="Min kg"
                          />
                          <span className="text-gray-500">to</span>
                          <Input
                            type="number"
                            min="0"
                            value={tier.max ?? ""}
                            onChange={(e) => updateTierField("weight", idx, "max", e.target.value)}
                            className="w-24"
                            placeholder="Max kg (blank for +)"
                          />
                          <span className="text-gray-500">@</span>
                          <Input
                            type="number"
                            step="0.0001"
                            min="0"
                            value={tier.rate ?? 0}
                            onChange={(e) => updateTierField("weight", idx, "rate", e.target.value)}
                            className="w-32"
                            placeholder="Rate /kg/km"
                          />
                          <Button type="button" variant="outline" onClick={() => removeTier("weight", idx)}>Remove</Button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="secondary" onClick={() => addTier("weight")}>
                      + Add Weight Tier
                    </Button>
                  </div>
                )}

                {/* Tiered by Distance configuration */}
                {formData.pricingModel === "Tiered Rate by Distance" && (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm text-gray-600">Define tiers by distance range. Formula uses rate from the tier: Distance × Weight × Rate</p>
                    <div className="space-y-2">
                      {(formData.pricingConfig?.distanceTiers || []).map((tier: DistanceTier, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={tier.min ?? 0}
                            onChange={(e) => updateTierField("distance", idx, "min", e.target.value)}
                            className="w-24"
                            placeholder="Min km"
                          />
                          <span className="text-gray-500">to</span>
                          <Input
                            type="number"
                            min="0"
                            value={tier.max ?? ""}
                            onChange={(e) => updateTierField("distance", idx, "max", e.target.value)}
                            className="w-24"
                            placeholder="Max km (blank for +)"
                          />
                          <span className="text-gray-500">@</span>
                          <Input
                            type="number"
                            step="0.0001"
                            min="0"
                            value={tier.rate ?? 0}
                            onChange={(e) => updateTierField("distance", idx, "rate", e.target.value)}
                            className="w-32"
                            placeholder="Rate /kg/km"
                          />
                          <Button type="button" variant="outline" onClick={() => removeTier("distance", idx)}>Remove</Button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="secondary" onClick={() => addTier("distance")}>
                      + Add Distance Tier
                    </Button>
                  </div>
                )}

                {/* Pricing summary */}
                {formData.pricingModel && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                    <span className="font-medium">Pricing Summary: </span>
                    {pricingSummaryText(formData.pricingModel as PricingModel, formData.pricingConfig)}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#032320] text-white px-8 py-2 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>

          {/* Right: KYB and tips */}
          <div className="space-y-6">
            {profile && (
              <KYBStatusCard kybStatus={profile.kybStatus} isKybVerified={profile.isKybVerified} formPath="/logistics/kyb-form" />
            )}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                • Add all regions you can serve.
                <br />
                • Keep your profile information up to date.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface PricingConfig {
  flatRatePerKgKm?: number;
  weightTiers?: WeightTier[];
  distanceTiers?: DistanceTier[];
}

// Define the profile shape used by this page
interface LogisticsProfile {
  id: string;
  companyName: string;
  companyAddress: string;
  businessImage?: string;
  contactNo: string;
  serviceAreas: string[];
  transportModes: string[];
  estimatedDeliveryTime?: string | null;
  pricingModel?: PricingModel | "";
  // Store as string[] in DB; parsed to object for UI via parsePricingConfig
  pricingConfig?: string[];
  kybStatus: string;
  isKybVerified: boolean;
  user: { id: string; name: string; email: string; role: string };
}

// Transport and pricing options used in the UI
const TRANSPORT_OPTIONS = ["Truck", "Van", "Refrigerated", "Rail", "Air", "Sea", "Other"] as const;
const PRICING_OPTIONS: PricingModel[] = [
  "Flat Rate Model",
  "Tiered Rate by Weight",
  "Tiered Rate by Distance",
];