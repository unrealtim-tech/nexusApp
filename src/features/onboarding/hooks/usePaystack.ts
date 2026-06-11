import { useQuery, useMutation } from "@tanstack/react-query";
import {
  fetchNigerianBanks,
  resolveAccount,
  type PaystackBank,
} from "@/features/onboarding/services/paystackApi";

// ─── Bank list (cached, fetched once) ────────────────────────────────────

export interface UseNigerianBanksResult {
  banks: PaystackBank[];
  isFallback: boolean;
  isLoading: boolean;
}

export function useNigerianBanks(): UseNigerianBanksResult {
  const { data, isLoading } = useQuery({
    queryKey: ["paystack", "banks", "nigeria"],
    queryFn: fetchNigerianBanks,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
    // Never throws — always resolves with { banks, isFallback }
  });

  return {
    banks: data?.banks ?? [],
    isFallback: data?.isFallback ?? false,
    isLoading,
  };
}

// ─── Account resolution ───────────────────────────────────────────────────

export function useResolveAccount() {
  return useMutation({
    mutationFn: ({
      accountNumber,
      bankCode,
    }: {
      accountNumber: string;
      bankCode: string;
    }) => resolveAccount(accountNumber, bankCode),
  });
}
