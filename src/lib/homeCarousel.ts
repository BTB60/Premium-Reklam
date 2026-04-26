import { getBackendOrigin } from "@/lib/restApiBase";

export type HomeCarouselSlide = {
  id: string;
  title: string;
  description: string;
  image: string;
};

const HOME_CAROUSEL_KEY = "premium_home_carousel_slides";
const PROXY_API_BASE = "/api/backend";
const DIRECT_API_BASE = `${getBackendOrigin()}/api`;
const MAX_CAROUSEL_IMAGE_WIDTH = 1600;
const MAX_CAROUSEL_IMAGE_HEIGHT = 900;

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("decor_current_user");
    if (raw) {
      const parsed = JSON.parse(raw) as { token?: string };
      if (parsed.token) return { Authorization: `Bearer ${parsed.token}` };
    }
    const sub = sessionStorage.getItem("premium_subadmin_jwt");
    if (sub) {
      const parsed = JSON.parse(sub) as { token?: string };
      if (parsed.token) return { Authorization: `Bearer ${parsed.token}` };
    }
  } catch {
    /* ignore */
  }
  return {};
}

function normalizeSlide(row: any, index: number): HomeCarouselSlide {
  return {
    id: String(row?.id ?? `slide-${index}`),
    title: String(row?.title ?? ""),
    description: String(row?.description ?? ""),
    image: String(row?.image ?? ""),
  };
}

function svgData(title: string, subtitle: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color}"/>
      <stop offset="1" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#g)"/>
  <circle cx="960" cy="110" r="180" fill="rgba(255,255,255,.08)"/>
  <circle cx="150" cy="560" r="210" fill="rgba(255,255,255,.06)"/>
  <text x="80" y="315" fill="white" font-family="Arial, sans-serif" font-size="72" font-weight="800">${title}</text>
  <text x="84" y="385" fill="rgba(255,255,255,.82)" font-family="Arial, sans-serif" font-size="34">${subtitle}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const defaultHomeCarouselSlides: HomeCarouselSlide[] = [
  {
    id: "premium",
    title: "Premium Reklam",
    description: "Professional reklam və dekor xidmətləri",
    image: svgData("Premium Reklam", "Professional reklam və dekor xidmətləri", "#D90429"),
  },
  {
    id: "fast",
    title: "Sürətli Xidmət",
    description: "Sifarişləriniz daha rahat idarə olunur",
    image: svgData("Sürətli Xidmət", "Sifarişləriniz daha rahat idarə olunur", "#EF476F"),
  },
  {
    id: "quality",
    title: "Keyfiyyət Zəmanəti",
    description: "İstehsalat və təhvil prosesinə nəzarət",
    image: svgData("Keyfiyyət Zəmanəti", "İstehsalat və təhvil prosesinə nəzarət", "#7C3AED"),
  },
];

/**
 * Yalnız brauzer keşi (serverdən uğurlu yükləmə / saxlamadan sonra doldurulur).
 * Qlobal mənbə API-dir — köhnə lokal məzmunu “həqiqət” saymayın.
 */
export function getHomeCarouselSlides(): HomeCarouselSlide[] {
  if (typeof window === "undefined") return defaultHomeCarouselSlides;
  try {
    const raw = localStorage.getItem(HOME_CAROUSEL_KEY);
    if (!raw) return defaultHomeCarouselSlides;
    const parsed = JSON.parse(raw) as HomeCarouselSlide[];
    const valid = Array.isArray(parsed)
      ? parsed.filter((s) => s?.id && s?.title && s?.image)
      : [];
    return valid.length > 0 ? valid : defaultHomeCarouselSlides;
  } catch {
    return defaultHomeCarouselSlides;
  }
}

/** SSR və ilk paint üçün sabit default (lokal keşdən asılı deyil). */
export function getHydrationHomeCarouselSlides(): HomeCarouselSlide[] {
  return defaultHomeCarouselSlides.map((s) => ({ ...s }));
}

export function saveHomeCarouselSlides(slides: HomeCarouselSlide[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HOME_CAROUSEL_KEY, JSON.stringify(slides));
  window.dispatchEvent(new Event("premium:home-carousel-changed"));
}

export async function fetchHomeCarouselSlides(admin = false): Promise<HomeCarouselSlide[]> {
  const res = await fetch(`${PROXY_API_BASE}/home-carousel${admin ? "/admin" : ""}`, {
    headers: admin ? authHeader() : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Karusel slaydları yüklənmədi");
  const data = await res.json();
  const rows = Array.isArray(data) ? data : [];
  const slides = rows.map(normalizeSlide).filter((s) => s.title && s.image);
  return slides.length > 0 ? slides : defaultHomeCarouselSlides;
}

export async function loadHomeCarouselSlides(admin = false): Promise<HomeCarouselSlide[]> {
  try {
    const slides = await fetchHomeCarouselSlides(admin);
    saveHomeCarouselSlides(slides);
    return slides;
  } catch {
    // API əlçatan deyilsə köhnə keşi sil — növbəti uğurlu yükləmədə yalnız DB göstərilsin
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(HOME_CAROUSEL_KEY);
      } catch {
        /* ignore */
      }
    }
    return defaultHomeCarouselSlides.map((s) => ({ ...s }));
  }
}

export async function saveHomeCarouselSlidesRemote(slides: HomeCarouselSlide[]): Promise<HomeCarouselSlide[]> {
  const payload = JSON.stringify(
    slides.map((slide, index) => ({
      title: slide.title,
      description: slide.description,
      image: slide.image,
      sortOrder: index,
      isActive: true,
    }))
  );

  const res = await fetch(`${DIRECT_API_BASE}/home-carousel`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: payload,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Karusel saxlanmadı");
  }
  const data = await res.json();
  const saved = Array.isArray(data) ? data.map(normalizeSlide).filter((s) => s.title && s.image) : slides;
  saveHomeCarouselSlides(saved.length > 0 ? saved : slides);
  return saved.length > 0 ? saved : slides;
}

export function resetHomeCarouselSlides(): HomeCarouselSlide[] {
  if (typeof window !== "undefined") {
    localStorage.removeItem(HOME_CAROUSEL_KEY);
    window.dispatchEvent(new Event("premium:home-carousel-changed"));
  }
  return defaultHomeCarouselSlides;
}

function imageToCanvasDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(
          1,
          MAX_CAROUSEL_IMAGE_WIDTH / img.width,
          MAX_CAROUSEL_IMAGE_HEIGHT / img.height
        );
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas dəstəklənmir");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const qualities = [0.82, 0.72, 0.62, 0.52];
        let best = canvas.toDataURL("image/jpeg", qualities[0]);
        for (const q of qualities) {
          const next = canvas.toDataURL("image/jpeg", q);
          best = next;
          // Keep each slide comfortably below serverless/proxy body limits.
          if (next.length < 900_000) break;
        }
        resolve(best);
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Şəkil oxunmadı"));
    };
    img.src = url;
  });
}

export async function fileToDataUrl(file: File): Promise<string> {
  if (typeof window !== "undefined" && file.type.startsWith("image/")) {
    try {
      return await imageToCanvasDataUrl(file);
    } catch {
      // Fallback below preserves previous behavior if canvas conversion fails.
    }
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
