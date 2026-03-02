import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();
    const coordinates = body.coordinates; // array of [lng, lat]
    const profile = body.profile || 'walking'; // default to walking

    // Build OSRM coordinate string: lng,lat;lng,lat
    const coordString = coordinates.map((c: number[]) => `${c[0]},${c[1]}`).join(';');

    const osrmResponse = await fetch(
      `http://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson`
    );

    if (!osrmResponse.ok) {
      throw new Error(`OSRM API error: ${osrmResponse.status}`);
    }

    const data = await osrmResponse.json();

    // Transform OSRM response to match expected ORS format
    const geometry = data.routes?.[0]?.geometry?.coordinates;
    if (geometry) {
      // OSRM returns [lng, lat], but we need [lat, lng] for the map
      const routeCoords: [number, number][] = geometry.map((c: [number, number]) => [c[1], c[0]]);
      
      // Return in ORS-like format
      return {
        features: [{
          geometry: {
            coordinates: routeCoords
          }
        }]
      };
    } else {
      throw new Error('No route geometry');
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return { error: "Failed to fetch route" };
  }
}
