const STORAGE_KEY = "userCredentials";

// Interface for user data structure
interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Function to set store data in local storage
function setStoreData(userData: UserData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
}

// Function to get store data from local storage
function getStoreData(): UserData | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

// Function to get user data from local storage
function getUserData(): UserData | null {
  return getStoreData();
}

// Function to get user role from local storage
function getUserRole(): string | null {
  const userData = getStoreData();
  return userData && userData.role ? userData.role : null;
}

// Function to check if user is authenticated
function isAuthenticated(): boolean {
  const userData = getStoreData();
  return userData !== null && userData.isActive;
}

// Function to clear user data from local storage (logout)
function clearStoreData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// Function to update specific user data fields
function updateStoreData(updates: Partial<UserData>): void {
  const currentData = getStoreData();
  if (currentData) {
    const updatedData = { ...currentData, ...updates };
    setStoreData(updatedData);
  }
}

export { 
  setStoreData, 
  getStoreData, 
  getUserData,
  getUserRole, 
  isAuthenticated, 
  clearStoreData, 
  updateStoreData,
  type UserData 
};
