import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();
    const { coordinates, profile = 'walking' } = body;

    // 1. Configuração do OpenRouteService (ORS) para Walking
    if (profile === 'walking' || profile === 'foot-walking') {
      const ORS_API_KEY = process.env.ORS_API_KEY; // Recomendo usar variável de ambiente

      const response = await fetch(
        "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjA2OTJkYjgzOTI1MDRkNTg5YmZlNjVmNDFlZmQzNDIyIiwiaCI6Im11cm11cjY0In0=",
          },
          body: JSON.stringify({
            coordinates: coordinates, // ORS espera [lng, lat]
            preference: "shortest",
          }),
        }
      );

      // No teu routes/api.route.tsx dentro da parte do ORS

const data = await response.json();

if (data.features && data.features.length > 0) {
  // ISTO É O QUE PREVINE AS LINHAS RETAS:
  // O ORS devolve milhares de pequenos pontos que fazem as curvas das ruas.
  // Precisamos de garantir que extraímos a geometria completa.
  const geometry = data.features[0].geometry.coordinates;

  // Inverter para o padrão do Leaflet [lat, lng]
  const routeCoords = geometry.map((c: number[]) => [c[1], c[0]]);

  return {
    features: [{
      geometry: {
        type: "LineString",
        coordinates: routeCoords // Agora com todos os pontos das curvas das ruas
      },
      properties: data.features[0].properties
    }]
  };
}
    }

    // 2. Fallback para OSRM (apenas se for 'driving' ou 'car')
    const osrmProfile = profile === 'car' ? 'driving' : profile;
    const coordString = coordinates.map((c: number[]) => `${c[0]},${c[1]}`).join(';');

    const osrmResponse = await fetch(
      `http://router.project-osrm.org/route/v1/${osrmProfile}/${coordString}?overview=full&geometries=geojson&steps=true`
    );

    const osrmData = await osrmResponse.json();
    const geometry = osrmData.routes?.[0]?.geometry?.coordinates;

    if (geometry) {
      const routeCoords = geometry.map((c: [number, number]) => [c[1], c[0]]);
      return {
        features: [{
          geometry: { coordinates: routeCoords }
        }]
      };
    }

    throw new Error('No route geometry found');

  } catch (error: any) {
    console.error("Proxy error:", error);
    return { error: error.message || "Failed to fetch route" };
  }
}