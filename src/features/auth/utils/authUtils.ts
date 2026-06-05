export interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: "medical-staff" | "hospital-admin" | "super-admin";
  loginAt?: string;
  createdAt?: string;
}

export function normalizeRole(
  role: string | null | undefined,
): UserData["role"] | null {
  if (!role) {
    return null;
  }

  if (role === "medical-staff" || role === "staff") {
    return "medical-staff";
  }

  if (role === "hospital-admin") {
    return "hospital-admin";
  }

  if (role === "super-admin") {
    return "super-admin";
  }

  return null;
}

export const authUtils = {
  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");
    return !!(token && userData);
  },

  // Get current user data
  getCurrentUser(): UserData | null {
    try {
      const userDataStr = localStorage.getItem("userData");
      if (!userDataStr) return null;
      const parsed = JSON.parse(userDataStr) as UserData;
      const role = normalizeRole(parsed.role);
      if (!role) return null;
      return {
        ...parsed,
        role,
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  },

  // Get user role
  getUserRole(): UserData["role"] | null {
    const user = this.getCurrentUser();
    return user?.role || null;
  },

  // Get current auth token
  getAuthToken(): string | null {
    return localStorage.getItem("authToken");
  },

  // Set auth details in storage
  setAuthData(token: string, userData: UserData): void {
    localStorage.setItem("authToken", token);
    localStorage.setItem("userData", JSON.stringify(userData));
  },

  // Clear auth data (logout)
  clearAuth(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("pendingUser");
    localStorage.removeItem("pendingSignUp");
    localStorage.removeItem("pendingEmail");
  },

  // Get redirect path based on role
  getRedirectPath(role: string): string {
    switch (role) {
      case "medical-staff":
        return "/medical-staff/dashboard";
      case "hospital-admin":
        return "/hospital/dashboard";
      case "super-admin":
        return "/hospital/dashboard";
      default:
        return "/auth/login";
    }
  },
};
