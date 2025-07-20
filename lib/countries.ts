// Countries and states data for the seller sign-up form
export interface Country {
  code: string;
  name: string;
  states: State[];
}

export interface State {
  code: string;
  name: string;
}

export const countriesData: Country[] = [
  {
    code: "MY",
    name: "Malaysia",
    states: [
      { code: "JHR", name: "Johor" },
      { code: "KDH", name: "Kedah" },
      { code: "KTN", name: "Kelantan" },
      { code: "KUL", name: "Kuala Lumpur" },
      { code: "LBN", name: "Labuan" },
      { code: "MLK", name: "Malacca" },
      { code: "NSN", name: "Negeri Sembilan" },
      { code: "PHG", name: "Pahang" },
      { code: "PNG", name: "Penang" },
      { code: "PRK", name: "Perak" },
      { code: "PLS", name: "Perlis" },
      { code: "PJY", name: "Putrajaya" },
      { code: "SBH", name: "Sabah" },
      { code: "SWK", name: "Sarawak" },
      { code: "SGR", name: "Selangor" },
      { code: "TRG", name: "Terengganu" }
    ]
  },
  {
    code: "SG",
    name: "Singapore",
    states: [
      { code: "SG-01", name: "Central Singapore" },
      { code: "SG-02", name: "North East" },
      { code: "SG-03", name: "North West" },
      { code: "SG-04", name: "South East" },
      { code: "SG-05", name: "South West" }
    ]
  },
  {
    code: "IN",
    name: "India",
    states: [
      { code: "AP", name: "Andhra Pradesh" },
      { code: "AR", name: "Arunachal Pradesh" },
      { code: "AS", name: "Assam" },
      { code: "BR", name: "Bihar" },
      { code: "CG", name: "Chhattisgarh" },
      { code: "DL", name: "Delhi" },
      { code: "GA", name: "Goa" },
      { code: "GJ", name: "Gujarat" },
      { code: "HR", name: "Haryana" },
      { code: "HP", name: "Himachal Pradesh" },
      { code: "JK", name: "Jammu and Kashmir" },
      { code: "JH", name: "Jharkhand" },
      { code: "KA", name: "Karnataka" },
      { code: "KL", name: "Kerala" },
      { code: "MP", name: "Madhya Pradesh" },
      { code: "MH", name: "Maharashtra" },
      { code: "MN", name: "Manipur" },
      { code: "ML", name: "Meghalaya" },
      { code: "MZ", name: "Mizoram" },
      { code: "NL", name: "Nagaland" },
      { code: "OR", name: "Odisha" },
      { code: "PB", name: "Punjab" },
      { code: "RJ", name: "Rajasthan" },
      { code: "SK", name: "Sikkim" },
      { code: "TN", name: "Tamil Nadu" },
      { code: "TS", name: "Telangana" },
      { code: "TR", name: "Tripura" },
      { code: "UP", name: "Uttar Pradesh" },
      { code: "UK", name: "Uttarakhand" },
      { code: "WB", name: "West Bengal" }
    ]
  }
];

/**
 * Get all available countries
 * @returns Array of countries
 */
export const getCountries = (): Country[] => {
  return countriesData;
};

/**
 * Get states for a specific country
 * @param countryCode - The country code to get states for
 * @returns Array of states for the specified country
 */
export const getStatesByCountry = (countryCode: string): State[] => {
  const country = countriesData.find(c => c.code === countryCode);
  return country ? country.states : [];
};

/**
 * Get country name by country code
 * @param countryCode - The country code
 * @returns Country name or empty string if not found
 */
export const getCountryName = (countryCode: string): string => {
  const country = countriesData.find(c => c.code === countryCode);
  return country ? country.name : "";
};

/**
 * Get state name by country code and state code
 * @param countryCode - The country code
 * @param stateCode - The state code
 * @returns State name or empty string if not found
 */
export const getStateName = (countryCode: string, stateCode: string): string => {
  const states = getStatesByCountry(countryCode);
  const state = states.find(s => s.code === stateCode);
  return state ? state.name : "";
};
