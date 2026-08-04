import { supabase } from "@/integrations/supabase/client";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { toast } from "sonner";

export interface UserAddressData {
  governorate: string;
  city: string;
  district?: string;
  detailedAddress: string;
  buildingFloor?: string;
  landmark?: string;
  mapLocation?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  fullName?: string;
}

function getUserAddressKey(userId?: string): string {
  if (userId) {
    return `beitak_user_address_${userId.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}`;
  }
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("virtual_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        const id = parsed?.user?.id || parsed?.user?.email;
        if (id) {
          return `beitak_user_address_${id.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}`;
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  return "beitak_guest_address";
}

export function getSyncedAddress(userId?: string): UserAddressData | null {
  try {
    const key = getUserAddressKey(userId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveSyncedAddress(data: UserAddressData, userId?: string): Promise<void> {
  let uid = userId;
  try {
    if (!uid) {
      const { data: sessionData } = await supabase.auth.getSession();
      uid = sessionData.session?.user?.id || sessionData.session?.user?.email;
    }
    const key = getUserAddressKey(uid);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save local address", e);
  }

  // 2. Sync to MarketplaceStore
  if (data.governorate) {
    MarketplaceStore.setUserGovernorate(data.governorate);
  }

  // 3. Sync to Supabase user metadata if logged in
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (user) {
      await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          governorate: data.governorate,
          city: data.city,
          district: data.district,
          address: data.detailedAddress,
          detailed_address: data.detailedAddress,
          building_floor: data.buildingFloor,
          landmark: data.landmark,
          map_location: data.mapLocation,
          phone_primary: data.phonePrimary,
          phone: data.phonePrimary || user.user_metadata?.phone,
          phone_secondary: data.phoneSecondary,
          full_name: data.fullName || user.user_metadata?.full_name,
        },
      });
    }
  } catch (err) {
    console.warn("Could not sync address to Supabase user_metadata", err);
  }

  window.dispatchEvent(new Event("beitak-address-updated"));
}
