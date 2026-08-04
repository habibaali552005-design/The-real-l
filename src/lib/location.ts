import { EGYPT_GOVERNORATES } from "@/types";
import { toast } from "sonner";

export interface DetectedLocationResult {
  lat: number;
  lng: number;
  governorate?: string;
  city?: string;
  road?: string;
  formattedAddress: string;
}

// Map Nominatim/osm result to Egyptian Governorate names
function mapToEgyptianGovernorate(rawName: string): string | undefined {
  if (!rawName) return undefined;
  const normalized = rawName.trim().toLowerCase();
  for (const gov of EGYPT_GOVERNORATES) {
    if (gov === "جميع المحافظات" || gov === "الكل") continue;
    const govNorm = gov.toLowerCase();
    if (normalized.includes(govNorm) || govNorm.includes(normalized)) {
      return gov;
    }
  }
  if (normalized.includes("cairo") || normalized.includes("قاهرة")) return "القاهرة";
  if (normalized.includes("giza") || normalized.includes("جيزة")) return "الجيزة";
  if (
    normalized.includes("alex") ||
    normalized.includes("أسكندرية") ||
    normalized.includes("إسكندرية")
  )
    return "الإسكندرية";
  if (normalized.includes("mansoura") || normalized.includes("دقهلية")) return "الدقهلية";
  if (normalized.includes("sharqia") || normalized.includes("شرقية")) return "الشرقية";
  if (normalized.includes("qalyubia") || normalized.includes("قليوبية")) return "القليوبية";
  if (normalized.includes("gharbeyya") || normalized.includes("غربية")) return "الغربية";
  if (normalized.includes("monufia") || normalized.includes("منوفية")) return "المنوفية";
  if (normalized.includes("beheira") || normalized.includes("بحيرة")) return "البحيرة";
  if (normalized.includes("ismailia") || normalized.includes("إسماعيلية")) return "الإسماعيلية";
  if (normalized.includes("suez") || normalized.includes("سويس")) return "السويس";
  if (normalized.includes("port said") || normalized.includes("بور سعيد")) return "بورسعيد";
  if (normalized.includes("damietta") || normalized.includes("دمياط")) return "دمياط";
  if (normalized.includes("faiyum") || normalized.includes("فيوم")) return "الفيوم";
  if (normalized.includes("beni suef") || normalized.includes("بني سويف")) return "بني سويف";
  if (normalized.includes("minya") || normalized.includes("منيا")) return "المنيا";
  if (normalized.includes("asyut") || normalized.includes("أسيوط")) return "أسيوط";
  if (normalized.includes("sohag") || normalized.includes("سوهاج")) return "سوهاج";
  if (normalized.includes("qena") || normalized.includes("قنا")) return "قنا";
  if (normalized.includes("luxor") || normalized.includes("أقصر")) return "الأقصر";
  if (normalized.includes("aswan") || normalized.includes("أسوان")) return "أسوان";
  if (
    normalized.includes("red sea") ||
    normalized.includes("بحر أحمر") ||
    normalized.includes("hurghada")
  )
    return "البحر الأحمر";
  if (normalized.includes("sinai") || normalized.includes("سيناء")) return "جنوب سيناء";
  if (normalized.includes("matrouh") || normalized.includes("مطروح")) return "مطروح";
  return undefined;
}

export async function requestCurrentLocation(): Promise<DetectedLocationResult> {
  return new Promise((resolve) => {
    const handleSuccess = async (lat: number, lng: number) => {
      let rawGov = "";
      let rawCity = "";
      let rawRoad = "";
      let formattedAddress = `موقع محدد: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      // 1. Try Nominatim OpenStreetMap reverse geocode
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ar`,
          {
            headers: { "User-Agent": "BeitakMarketplaceApp/1.0" },
          },
        );
        if (response.ok) {
          const data = await response.json();
          const addr = data.address || {};
          rawGov = addr.state || addr.region || addr.governorate || addr.city || "";
          rawCity = addr.city || addr.town || addr.village || addr.suburb || addr.district || "";
          rawRoad = addr.road || addr.neighbourhood || addr.pedestrian || "";
          if (data.display_name) formattedAddress = data.display_name;
        }
      } catch {
        // Fallback to BigDataCloud reverse geocode
      }

      // 2. Fallback to BigDataCloud client reverse geocode if Nominatim missed city/gov
      if (!rawGov) {
        try {
          const bdcRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`,
          );
          if (bdcRes.ok) {
            const bdcData = await bdcRes.json();
            rawGov = bdcData.principalSubdivision || bdcData.city || "";
            rawCity = bdcData.locality || bdcData.city || "";
            if (bdcData.localityInfo?.informative) {
              const roadInfo = bdcData.localityInfo.informative.find(
                (i: { name: string }) => i.name,
              );
              if (roadInfo) rawRoad = roadInfo.name;
            }
          }
        } catch {
          // ignore
        }
      }

      const matchedGov = mapToEgyptianGovernorate(rawGov) || "القاهرة";
      resolve({
        lat,
        lng,
        governorate: matchedGov,
        city: rawCity || "القاهرة",
        road: rawRoad,
        formattedAddress,
      });
    };

    if (!navigator.geolocation) {
      toast.error("خدمة تحديد الموقع الجغرافي غير مدعومة مباشرة، تم ضبط الموقع الافتراضي للمحافظة");
      return resolve({
        lat: 30.0444,
        lng: 31.2357,
        governorate: "القاهرة",
        city: "القاهرة",
        road: "وسط البلد",
        formattedAddress: "القاهرة، وسط البلد (تحديد افتراضي)",
      });
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleSuccess(position.coords.latitude, position.coords.longitude);
      },
      async (error) => {
        console.warn("Geolocation permission or position error, using fallback IP location", error);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("تم رفض الإذن للوصول للموقع الجغرافي. يرجى تفعيل الموقع من إعدادات المتصفح.");
        } else {
          toast.info(
            "لم نتمكن من التقاط الإحداثيات الدقيقة عبر GPS، تم تحديد الموقع التقريبي عبر الشبكة.",
          );
        }
        // Fallback attempt: fetch IP location from free ipapi / ip-api
        try {
          const ipRes = await fetch("https://ipapi.co/json/");
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            const lat = ipData.latitude || 30.0444;
            const lng = ipData.longitude || 31.2357;
            const matchedGov = mapToEgyptianGovernorate(ipData.region || ipData.city) || "القاهرة";
            return resolve({
              lat,
              lng,
              governorate: matchedGov,
              city: ipData.city || "القاهرة",
              road: "",
              formattedAddress: `${matchedGov}، ${ipData.city || "مدينة القاهرة"} (موقع تقريبي)`,
            });
          }
        } catch {
          // Default Cairo coordinates fallback
        }

        resolve({
          lat: 30.0444,
          lng: 31.2357,
          governorate: "القاهرة",
          city: "القاهرة",
          road: "وسط البلد",
          formattedAddress: "القاهرة، مصر",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      },
    );
  });
}
