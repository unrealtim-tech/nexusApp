import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { NexusCareLogo } from "@/shared/components/ui/NexusCareLogo";
import { ArrowLeft } from "lucide-react";
import { authUtils, normalizeRole } from "../utils/authUtils";
import {
  sendLoginOtp,
  verifyLoginOtp,
  AuthUserResponse,
} from "../services/authApi";
import {
  sendClinicianRegistrationOtp,
  verifyClinicianRegistrationOtp,
} from "@/features/onboarding/services/onboardingApi";

export function OtpVerify() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const pendingEmail = localStorage.getItem("pendingEmail");
    const pendingPhone = localStorage.getItem("pendingPhone");

    if (!pendingEmail && !pendingPhone) {
      navigate("/auth/login");
      return;
    }

    setPhoneNumber(pendingEmail || pendingPhone || "");

    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Focus first input
    inputRefs.current[0]?.focus();

    return () => clearInterval(timer);
  }, [navigate]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) return;

    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (error) setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (value && index === 5 && newOtp.every((digit) => digit !== "")) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");

    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();

      // Auto-verify after paste
      setTimeout(() => {
        handleVerifyOtp(pastedData);
      }, 100);
    }
  };

  const mapBackendUserToUserData = (user: AuthUserResponse) => {
    const role = normalizeRole(user.role);
    if (!role) {
      throw new Error("Unsupported user role received from server");
    }

    return {
      id: user.id,
      fullName: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role,
      loginAt: user.last_login_at ?? new Date().toISOString(),
      createdAt: user.created_at,
    };
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const codeToVerify = otpCode || otp.join("");

    if (codeToVerify.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    const pendingEmail = localStorage.getItem("pendingEmail");
    const pendingPhone = localStorage.getItem("pendingPhone");

    setIsLoading(true);
    setError("");

    try {
      const selectedRole = localStorage.getItem("selectedRole");

      if (pendingEmail && selectedRole === "health-worker") {
        const response = await verifyClinicianRegistrationOtp(
          pendingEmail,
          codeToVerify,
        );
        const userData = {
          id: response.clinician_id,
          fullName: "Healthcare Professional",
          email: pendingEmail,
          role: "medical-staff" as const,
          loginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        authUtils.setAuthData(response.access_token, userData);
        localStorage.setItem("clinicianId", response.clinician_id);
        localStorage.removeItem("pendingEmail");
        localStorage.removeItem("emailVerified");

        navigate("/auth/onboarding/professional-profile");
        return;
      }

      if (pendingEmail) {
        const response = await verifyLoginOtp(pendingEmail, codeToVerify);
        const userData = mapBackendUserToUserData(response.user);
        authUtils.setAuthData(response.access_token, userData);
        localStorage.setItem("refreshToken", response.refresh_token);
        localStorage.removeItem("pendingEmail");
        localStorage.removeItem("emailVerified");

        const redirectPath = authUtils.getRedirectPath(userData.role);
        navigate(redirectPath);
        return;
      }

      if (pendingPhone) {
        // Preserve legacy phone OTP behavior until phone login is backed by API.
        localStorage.setItem("emailVerified", "true");
        localStorage.removeItem("pendingPhone");
        navigate("/auth/role-selection");
        return;
      }

      setError("Unable to verify OTP. Please restart the login process.");
    } catch (error) {
      console.error("OTP verification error:", error);
      const msg =
        (error as Error)?.message || "Verification failed. Please try again.";
      if (msg.toLowerCase().includes("user not found")) {
        setError(
          "We could not find an account for this email. Please sign up or try a different email.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    const pendingEmail = localStorage.getItem("pendingEmail");
    const selectedRole = localStorage.getItem("selectedRole");

    setCanResend(false);
    setResendTimer(60);
    setError("");

    try {
      if (pendingEmail && selectedRole === "health-worker") {
        await sendClinicianRegistrationOtp(pendingEmail);
      } else if (pendingEmail) {
        await sendLoginOtp(pendingEmail);
      } else {
        // Preserve legacy phone OTP resend behavior until phone login is backed by API.
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("Resend error:", error);
      setError(
        (error as Error)?.message || "Unable to resend OTP. Please try again.",
      );
      setCanResend(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3FAFF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate("/auth/login")}
          className="flex items-center space-x-2 text-onboarding-textSecondary hover:text-onboarding-textPrimary mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <NexusCareLogo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-onboarding-textPrimary mb-2">
            Verify Identity
          </h1>
          <p className="text-onboarding-textSecondary">
            We've sent a 6-digit code to{" "}
            <span className="font-semibold text-onboarding-textPrimary">
              {phoneNumber}
            </span>
          </p>
        </div>

        {/* OTP Verification Card */}
        <Card className="bg-white border-slate-100 shadow-md rounded-2xl">
          <CardContent className="p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyOtp();
              }}
              className="space-y-8"
            >
              {/* OTP Input Fields */}
              <div className="space-y-4">
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500 text-center">
                  Enter Verification Code
                </label>

                <div className="flex justify-center space-x-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all ${
                        error
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : digit
                            ? "border-secondary-500 bg-secondary-50"
                            : "border-slate-200"
                      }`}
                      maxLength={1}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-sm text-red-600 text-center flex items-center justify-center space-x-1">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </p>
                )}
              </div>

              {/* Verify Button */}
              <Button
                type="submit"
                disabled={isLoading || otp.some((digit) => !digit)}
                isLoading={isLoading}
                className="w-full rounded-lg bg-gradient-to-r from-onboarding-primaryGreen to-onboarding-primaryBlue py-3 text-sm font-semibold uppercase tracking-widest text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify & Continue"}
              </Button>
            </form>

            {/* Resend Code */}
            <div className="mt-6 text-center">
              {canResend ? (
                <button
                  onClick={handleResendOtp}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Resend Code
                </button>
              ) : (
                <p className="text-sm text-slate-500">
                  Resend code in{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.floor(resendTimer / 60)}:
                    {(resendTimer % 60).toString().padStart(2, "0")}
                  </span>
                </p>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                Didn't receive the code?{" "}
                <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Contact Support
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
