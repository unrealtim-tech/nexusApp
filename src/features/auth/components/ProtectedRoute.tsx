import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { normalizeRole } from "../utils/authUtils";

// ---------------------------------------------------------------------------
// PublicRoute – redirect authenticated users away from guest-only pages
// (login, register, onboarding, etc.) to their role-specific dashboard.
// ---------------------------------------------------------------------------
interface PublicRouteProps {
  children: React.ReactNode;
}

interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  loginAt?: string;
  createdAt?: string;
}

function getDashboardForRole(role: string | null): string {
  if (role === "medical-staff") return "/medical-staff/dashboard";
  if (role === "hospital-admin" || role === "super-admin")
    return "/hospital/dashboard";
  return "/auth/login";
}

export function PublicRoute({ children }: PublicRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userDataStr = localStorage.getItem("userData");

    if (authToken && userDataStr) {
      try {
        const isMockToken =
          authToken.startsWith("token_") ||
          authToken.startsWith("temp_token_");
        const isJwtToken = authToken.split(".").length === 3;

        if (isMockToken || isJwtToken) {
          const userData: UserData = JSON.parse(userDataStr);
          const normalizedRole = normalizeRole(userData.role);
          setRedirectTo(getDashboardForRole(normalizedRole));
        }
      } catch {
        // Corrupt data – clear it and let the user stay on the public page
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      }
    }

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "medical-staff" | "hospital-admin";
}

interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  loginAt?: string;
  createdAt?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authToken = localStorage.getItem("authToken");
        const userDataStr = localStorage.getItem("userData");

        if (!authToken || !userDataStr) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const userData: UserData = JSON.parse(userDataStr);
        const normalizedRole = normalizeRole(userData.role);

        console.log("ProtectedRoute auth check:", {
          authToken: authToken.substring(0, 20) + "...",
          userData,
          normalizedRole,
          requiredRole,
          currentPath: location.pathname,
        });

        // Validate token format (basic check)
        const isMockToken = authToken.startsWith("token_") || authToken.startsWith("temp_token_");
        const isJwtToken = authToken.split(".").length === 3;
        if (!isMockToken && !isJwtToken) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("userData");
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setUserRole(normalizedRole);
      } catch (error) {
        console.error("Auth validation error:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && userRole !== requiredRole) {
    // Redirect to appropriate dashboard based on user's actual role
    if (userRole === "medical-staff") {
      return <Navigate to="/medical-staff/dashboard" replace />;
    } else if (userRole === "hospital-admin" || userRole === "super-admin") {
      return <Navigate to="/hospital/dashboard" replace />;
    } else {
      // Fallback: redirect to login if role is unknown
      return <Navigate to="/auth/login" replace />;
    }
  }

  return <>{children}</>;
}
