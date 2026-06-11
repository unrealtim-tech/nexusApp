/**
 * Paystack API service — bank list & account resolution.
 *
 * ⚠️  The secret key is used directly from the client for this implementation.
 *     In production, proxy these calls through your backend to avoid
 *     exposing sk_live_* keys in the browser.
 */

const PAYSTACK_BASE = "https://api.paystack.co";

// ─── Types ────────────────────────────────────────────────────────────────

export interface PaystackBank {
  id: number;
  name: string;
  code: string;
  slug: string;
  longcode: string;
  type: string;
  is_deleted: boolean;
  active: boolean;
}

export interface ResolvedAccount {
  account_number: string;
  account_name: string;
  bank_id: number;
}

export interface BanksResult {
  banks: PaystackBank[];
  isFallback: boolean;
}

// ─── Fallback: popular Nigerian banks ─────────────────────────────────────
// Used when the Paystack /bank endpoint is unavailable (e.g., no API key set,
// CORS error, or network failure). Live verification is disabled in this mode.

export const FALLBACK_BANKS: PaystackBank[] = [
  { id: 1,  name: "Access Bank",                    code: "044", slug: "access-bank",         longcode: "044150149", type: "nuban", is_deleted: false, active: true },
  { id: 2,  name: "Guaranty Trust Bank",             code: "058", slug: "guaranty-trust-bank", longcode: "058152036", type: "nuban", is_deleted: false, active: true },
  { id: 3,  name: "United Bank For Africa",          code: "033", slug: "united-bank-for-africa", longcode: "033153513", type: "nuban", is_deleted: false, active: true },
  { id: 4,  name: "First Bank of Nigeria",           code: "011", slug: "first-bank-of-nigeria", longcode: "011151003", type: "nuban", is_deleted: false, active: true },
  { id: 5,  name: "Zenith Bank",                     code: "057", slug: "zenith-bank",         longcode: "057150013", type: "nuban", is_deleted: false, active: true },
  { id: 6,  name: "Union Bank of Nigeria",           code: "032", slug: "union-bank-of-nigeria", longcode: "032080474", type: "nuban", is_deleted: false, active: true },
  { id: 7,  name: "Stanbic IBTC Bank",               code: "221", slug: "stanbic-ibtc-bank",   longcode: "221159522", type: "nuban", is_deleted: false, active: true },
  { id: 8,  name: "Sterling Bank",                   code: "232", slug: "sterling-bank",        longcode: "232090405", type: "nuban", is_deleted: false, active: true },
  { id: 9,  name: "Fidelity Bank",                   code: "070", slug: "fidelity-bank",        longcode: "070150003", type: "nuban", is_deleted: false, active: true },
  { id: 10, name: "Ecobank Nigeria",                 code: "050", slug: "ecobank-nigeria",      longcode: "050150010", type: "nuban", is_deleted: false, active: true },
  { id: 11, name: "Polaris Bank",                    code: "076", slug: "polaris-bank",         longcode: "076151006", type: "nuban", is_deleted: false, active: true },
  { id: 12, name: "First City Monument Bank (FCMB)", code: "214", slug: "fcmb",                 longcode: "214150018", type: "nuban", is_deleted: false, active: true },
  { id: 13, name: "Wema Bank",                       code: "035", slug: "wema-bank",            longcode: "035150103", type: "nuban", is_deleted: false, active: true },
  { id: 14, name: "Keystone Bank",                   code: "082", slug: "keystone-bank",        longcode: "082150017", type: "nuban", is_deleted: false, active: true },
  { id: 15, name: "Heritage Bank",                   code: "030", slug: "heritage-bank",        longcode: "030159992", type: "nuban", is_deleted: false, active: true },
  { id: 16, name: "Kuda Bank",                       code: "090267", slug: "kuda",              longcode: "090267",    type: "nuban", is_deleted: false, active: true },
  { id: 17, name: "Opay (OPay Digital Services)",    code: "999992", slug: "opay",              longcode: "999992",    type: "nuban", is_deleted: false, active: true },
  { id: 18, name: "PalmPay",                         code: "999991", slug: "palmpay",           longcode: "999991",    type: "nuban", is_deleted: false, active: true },
];

// ─── Headers ──────────────────────────────────────────────────────────────

function paystackHeaders(): HeadersInit {
  const key = import.meta.env.VITE_PAYSTACK_SECRET_KEY as string | undefined;
  if (!key) {
    throw new Error("VITE_PAYSTACK_SECRET_KEY is not set.");
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function hasApiKey(): boolean {
  const key = import.meta.env.VITE_PAYSTACK_SECRET_KEY as string | undefined;
  return !!key && key.trim().length > 0;
}

// ─── Fetch Nigerian bank list (with fallback) ─────────────────────────────

export async function fetchNigerianBanks(): Promise<BanksResult> {
  if (!hasApiKey()) {
    return { banks: FALLBACK_BANKS, isFallback: true };
  }

  try {
    const res = await fetch(
      `${PAYSTACK_BASE}/bank?currency=NGN&perPage=100&use_cursor=false`,
      { headers: paystackHeaders() },
    );

    if (!res.ok) {
      console.warn(`Paystack /bank returned ${res.status} — using fallback bank list.`);
      return { banks: FALLBACK_BANKS, isFallback: true };
    }

    const json = await res.json();
    const live = (json.data as PaystackBank[]).filter((b) => b.active && !b.is_deleted);

    if (!live.length) {
      return { banks: FALLBACK_BANKS, isFallback: true };
    }

    return { banks: live, isFallback: false };
  } catch (err) {
    console.warn("Paystack /bank fetch failed — using fallback bank list.", err);
    return { banks: FALLBACK_BANKS, isFallback: true };
  }
}

// ─── Resolve account number ───────────────────────────────────────────────

export async function resolveAccount(
  accountNumber: string,
  bankCode: string,
): Promise<ResolvedAccount> {
  // Will throw if no key — callers in fallback mode must not invoke this.
  const params = new URLSearchParams({ account_number: accountNumber, bank_code: bankCode });

  const res = await fetch(`${PAYSTACK_BASE}/bank/resolve?${params}`, {
    headers: paystackHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Account resolution failed (${res.status})`);
  }

  const json = await res.json();
  return json.data as ResolvedAccount;
}
