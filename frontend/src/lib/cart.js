import { apiRequest } from "@/lib/api";

export async function addMagazineToCart({ getToken, magazineSlug }) {
  if (!magazineSlug) {
    throw new Error("Magazine is missing.");
  }

  return apiRequest(getToken, "/api/cart", {
    method: "POST",
    body: JSON.stringify({ magazine_slug: magazineSlug }),
  });
}
