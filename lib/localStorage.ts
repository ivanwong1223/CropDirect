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

// Function to set user data in local storage
function setUserData(userData: UserData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
}

// Function to get user data from local storage
function getUserData(): UserData | null {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

// Function to get user role from local storage
function getUserRole(): string | null {
  const userData = getUserData();
  return userData ? userData.role : null;
}

// Function to check if user is authenticated
function isAuthenticated(): boolean {
  const userData = getUserData();
  return userData !== null && userData.isActive;
}

// Function to clear user data from local storage (logout)
function clearUserData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Function to update specific user data fields
function updateUserData(updates: Partial<UserData>): void {
  const currentData = getUserData();
  if (currentData) {
    const updatedData = { ...currentData, ...updates };
    setUserData(updatedData);
  }
}

export { 
  setUserData, 
  getUserData, 
  getUserRole, 
  isAuthenticated, 
  clearUserData, 
  updateUserData,
  type UserData 
};
