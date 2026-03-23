import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const yearParam = url.searchParams.get('year');
    const monthParam = url.searchParams.get('month');
    
    // Default to current month if not provided
    const now = new Date();
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    
    // Validate parameters
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return Response.json({ error: "Invalid year or month parameter" }, { status: 400 });
    }
    
    console.log(`📅 Loading MOCK events for ${year}-${month.toString().padStart(2, '0')}`);
    
    // Mock events data - simplified version
    const mockEvents = [
      {
        "_id": "evento-001",
        "titulo": { "pt": "Mercado Tradicional Tavira" },
        "categorias": [
          { "_key": "pt", "value": "Gastronomia" },
          { "_key": "en", "value": "Gastronomy" }
        ],
        "dataInicio": `${year}-03-15T09:00:00.000Z`,
        "dataFim": `${year}-03-15T14:00:00.000Z`,
        "localizacao": { "lat": 37.1289, "lng": -7.6496 },
        "status": [
          { "_key": "pt", "value": "Confirmado" },
          { "_key": "en", "value": "Confirmed" }
        ]
      },
      {
        "_id": "evento-002",
        "titulo": { "pt": "Concerto de Fado na Praça" },
        "categorias": [
          { "_key": "pt", "value": "Música" },
          { "_key": "en", "value": "Music" }
        ],
        "dataInicio": `${year}-03-22T20:00:00.000Z`,
        "dataFim": `${year}-03-22T23:00:00.000Z`,
        "localizacao": { "lat": 37.1321, "lng": -7.6453 },
        "status": [
          { "_key": "pt", "value": "Confirmado" },
          { "_key": "en", "value": "Confirmed" }
        ]
      },
      {
        "_id": "evento-003",
        "titulo": { "pt": "Visita Guiada ao Castelo" },
        "categorias": [
          { "_key": "pt", "value": "Cultura" },
          { "_key": "en", "value": "Culture" }
        ],
        "dataInicio": `${year}-03-28T10:00:00.000Z`,
        "dataFim": `${year}-03-28T12:00:00.000Z`,
        "localizacao": { "lat": 37.1298, "lng": -7.6512 },
        "status": [
          { "_key": "pt", "value": "Confirmado" },
          { "_key": "en", "value": "Confirmed" }
        ]
      },
      {
        "_id": "evento-004",
        "titulo": { "pt": "Workshop de Azulejos" },
        "categorias": [
          { "_key": "pt", "value": "Artes" },
          { "_key": "en", "value": "Arts" }
        ],
        "dataInicio": `${year}-04-05T14:00:00.000Z`,
        "dataFim": `${year}-04-05T17:00:00.000Z`,
        "localizacao": { "lat": 37.1247, "lng": -7.6534 },
        "status": [
          { "_key": "pt", "value": "Confirmado" },
          { "_key": "en", "value": "Confirmed" }
        ]
      },
      {
        "_id": "evento-005",
        "titulo": { "pt": "Passeio de Barco no Gilão" },
        "categorias": [
          { "_key": "pt", "value": "Natureza" },
          { "_key": "en", "value": "Nature" }
        ],
        "dataInicio": `${year}-04-12T16:00:00.000Z`,
        "dataFim": `${year}-04-12T18:00:00.000Z`,
        "localizacao": { "lat": 37.1219, "lng": -7.6428 },
        "status": [
          { "_key": "pt", "value": "Confirmado" },
          { "_key": "en", "value": "Confirmed" }
        ]
      },
      {
        "_id": "evento-006",
        "titulo": { "pt": "Festival de Cinema ao Ar Livre" },
        "categorias": [
          { "_key": "pt", "value": "Cinema" },
          { "_key": "en", "value": "Cinema" }
        ],
        "dataInicio": `${year}-04-19T21:00:00.000Z`,
        "dataFim": `${year}-04-19T23:30:00.000Z`,
        "localizacao": { "lat": 37.1356, "lng": -7.6487 },
        "status": [
          { "_key": "pt", "value": "Confirmado" },
          { "_key": "en", "value": "Confirmed" }
        ]
      },
      {
        "_id": "evento-007",
        "titulo": { "pt": "Tour Gastronómico por Tavira" },
        "categorias": [
          { "_key": "pt", "value": "Gastronomia" },
          { "_key": "en", "value": "Gastronomy" }
        ],
        "dataInicio": `${year}-04-26T18:00:00.000Z`,
        "dataFim": `${year}-04-26T22:00:00.000Z`,
        "localizacao": { "lat": 37.1278, "lng": -7.6412 },
        "status": [
          { "_key": "pt", "value": "Confirmado" },
          { "_key": "en", "value": "Confirmed" }
        ]
      },
      {
        "_id": "evento-008",
        "titulo": { "pt": "Exposição de Arte Local" },
        "categorias": [
          { "_key": "pt", "value": "Artes" },
          { "_key": "en", "value": "Arts" }
        ],
        "dataInicio": `${year}-05-03T10:00:00.000Z`,
        "dataFim": `${year}-05-03T18:00:00.000Z`,
        "localizacao": { "lat": 37.1302, "lng": -7.6487 },
        "status": [
          { "_key": "pt", "value": "Confirmado" },
          { "_key": "en", "value": "Confirmed" }
        ]
      },
      {
        "_id": "evento-009",
        "titulo": { "pt": "Corrida de Santa Maria" },
        "categorias": [
          { "_key": "pt", "value": "Desporto" },
          { "_key": "en", "value": "Sports" }
        ],
        "dataInicio": `${year}-05-10T08:00:00.000Z`,
        "dataFim": `${year}-05-10T11:00:00.000Z`,
        "localizacao": { "lat": 37.1267, "lng": -7.6589 },
        "status": [
          { "_key": "pt", "value": "Confirmado" },
          { "_key": "en", "value": "Confirmed" }
        ]
      },
      {
        "_id": "evento-010",
        "titulo": { "pt": "Noite de Jazz no Rio" },
        "categorias": [
          { "_key": "pt", "value": "Música" },
          { "_key": "en", "value": "Music" }
        ],
        "dataInicio": `${year}-05-17T20:30:00.000Z`,
        "dataFim": `${year}-05-17T23:00:00.000Z`,
        "localizacao": { "lat": 37.1234, "lng": -7.6398 },
        "status": [
          { "_key": "pt", "value": "Confirmado" },
          { "_key": "en", "value": "Confirmed" }
        ]
      },
      {
        "_id": "evento-011",
        "titulo": { "pt": "Feira de Artesanato" },
        "categorias": [
          { "_key": "pt", "value": "Artesanato" },
          { "_key": "en", "value": "Crafts" }
        ],
        "dataInicio": `${year}-05-24T09:00:00.000Z`,
        "dataFim": `${year}-05-24T19:00:00.000Z`,
        "localizacao": { "lat": 37.1314, "lng": -7.6556 },
        "status": [
          { "_key": "pt", "value": "Confirmado" },
          { "_key": "en", "value": "Confirmed" }
        ]
      },
      {
        "_id": "evento-012",
        "titulo": { "pt": "Workshop de Fotografia" },
        "categorias": [
          { "_key": "pt", "value": "Fotografia" },
          { "_key": "en", "value": "Photography" }
        ],
        "dataInicio": `${year}-05-31T15:00:00.000Z`,
        "dataFim": `${year}-05-31T18:00:00.000Z`,
        "localizacao": { "lat": 37.1189, "lng": -7.6523 },
        "status": [
          { "_key": "pt", "value": "Confirmado" },
          { "_key": "en", "value": "Confirmed" }
        ]
      }
    ];
    
    // Filter events by year and month
    const filteredEvents = mockEvents.filter((event: any) => {
      const startDate = new Date(event.dataInicio);
      const endDate = event.dataFim ? new Date(event.dataFim) : startDate;
      
      // Check if event spans the requested month
      const eventStartYear = startDate.getFullYear();
      const eventStartMonth = startDate.getMonth() + 1;
      const eventEndYear = endDate.getFullYear();
      const eventEndMonth = endDate.getMonth() + 1;
      
      const startsInMonth = eventStartYear === year && eventStartMonth === month;
      const endsInMonth = eventEndYear === year && eventEndMonth === month;
      const spansMonth = startDate < new Date(year, month - 1, 1) && endDate >= new Date(year, month, 0, 23, 59, 59);
      
      return startsInMonth || endsInMonth || spansMonth;
    });
    
    // Process events for calendar compatibility
    const processedEvents = filteredEvents.map((event: any) => {
      const startDate = new Date(event.dataInicio);
      const endDate = event.dataFim ? new Date(event.dataFim) : startDate;
      
      return {
        _id: event._id,
        titulo: event.titulo,
        dataInicio: event.dataInicio,
        dataFim: event.dataFim,
        tipo: event.categorias?.[0] ? { _ref: "tipo-" + event.categorias[0].value.toLowerCase(), titulo: event.categorias[0] } : null,
        categorias: event.categorias,
        descricao: { pt: event.titulo.pt },
        endereco: { pt: "Local a definir" },
        localizacao: event.localizacao,
        startDate,
        endDate,
        isMultiDay: event.dataFim ? true : false
      };
    });
    
    console.log(`✅ Found ${processedEvents.length} mock events for ${year}-${month.toString().padStart(2, '0')}`);
    
    return Response.json({ 
      events: processedEvents,
      year,
      month,
      total: processedEvents.length
    });
    
  } catch (error: any) {
    console.error("❌ Error loading events:", error);
    return Response.json({ 
      error: error.message || "Failed to load events",
      events: [],
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      total: 0
    }, { status: 500 });
  }
}
