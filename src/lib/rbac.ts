import { MarketplaceStore } from "@/lib/marketplaceStore";
import type { User as SbUser } from "@supabase/supabase-js";

export const SUPER_ADMIN_EMAIL = "habibaali552005@gmail.com";
export const SUPER_ADMIN_PHONE = "01008856838";

export type UserRoleType = "visitor" | "buyer" | "seller" | "super_admin";

/**
 * Strictly verifies if the user is the Super Admin.
 * ONLY habibaali552005@gmail.com or verified phone 01008856838 can be Super Admin.
 * No other account can EVER become Super Admin.
 */
export function checkIsSuperAdmin(
  user:
    | SbUser
    | {
        email?: string | null;
        phone?: string | null;
        user_metadata?: Record<string, unknown>;
        phone_confirmed_at?: string | null;
      }
    | null
    | undefined,
): boolean {
  if (!user) return false;

  const email = (user.email || "").toLowerCase().trim();
  if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  const phone = (
    user.phone ||
    user.user_metadata?.phone ||
    user.user_metadata?.phone_number ||
    ""
  ).replace(/\s+/g, "");

  const isPhoneMatch =
    phone === SUPER_ADMIN_PHONE ||
    phone === `+2${SUPER_ADMIN_PHONE}` ||
    phone.endsWith(SUPER_ADMIN_PHONE);

  const isPhoneVerified = !!(
    user.phone_confirmed_at ||
    user.user_metadata?.phone_verified ||
    user.user_metadata?.verified
  );

  if (isPhoneMatch && isPhoneVerified) {
    return true;
  }

  return false;
}

/**
 * Verifies if user has Seller access (Approved Seller or Super Admin).
 */
export function checkIsSeller(user: SbUser | null, dbRoles?: string[]): boolean {
  if (!user) return false;
  if (checkIsSuperAdmin(user)) return true;

  const email = (user.email || "").toLowerCase().trim();

  // Check user_metadata
  if (
    user.user_metadata?.role === "seller" ||
    user.user_metadata?.role === "vendor" ||
    user.user_metadata?.is_seller === true
  ) {
    return true;
  }

  // Check database roles if provided
  if (dbRoles && (dbRoles.includes("seller") || dbRoles.includes("vendor"))) {
    return true;
  }

  // Check registered sellers store list
  const sellers = MarketplaceStore.getSellers();
  const matchedSeller = sellers.find(
    (s) => (s.email && s.email.toLowerCase().trim() === email) || s.userId === user.id,
  );

  return !!matchedSeller;
}

/**
 * Gets the active seller ID for the authenticated user.
 */
export function getAuthenticatedSellerId(user: SbUser | null): string {
  if (!user) return "";
  const email = (user.email || "").toLowerCase().trim();
  const sellers = MarketplaceStore.getSellers();
  const matchedSeller = sellers.find(
    (s) => (s.email && s.email.toLowerCase().trim() === email) || s.userId === user.id,
  );
  if (matchedSeller) return matchedSeller.id;
  if (checkIsSuperAdmin(user)) return "seller-habiba";
  return "";
}

/**
 * Evaluates the exact user role based on authenticated identity.
 */
export function getUserRole(user: SbUser | null, dbRoles?: string[]): UserRoleType {
  if (!user) return "visitor";
  if (checkIsSuperAdmin(user)) return "super_admin";
  if (checkIsSeller(user, dbRoles)) return "seller";
  return "buyer";
}
