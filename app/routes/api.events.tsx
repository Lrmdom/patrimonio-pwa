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
    
    console.log(`📅 Loading real events for ${year}-${month.toString().padStart(2, '0')}`);
    
    // Real events data from Sanity structure
    const realEvents = [
      {
        "_id": "05bbf566-07c2-46d1-ad7e-401cab0dc00a",
        "titulo": { "pt": "Festival de Teatro de Rua" },
        "categorias": [
          { "_key": "pt", "value": "Teatro" },
          { "_key": "en", "value": "Theater" }
        ],
        "configRecorrencia": {
          "tipo": "anual",
          "dataInicio": "2026-03-25T10:00:00.000Z",
          "dataFim": "2026-03-27T22:00:00.000Z"
        },
        "dataUnica": null,
        "ehRecorrente": true,
        "localizacao": null,
        "status": [
          { "_key": "pt", "value": "Planeado" },
          { "_key": "en", "value": "Planned" }
        ]
      },
      {
        "_id": "16384e54-d4c6-48ce-b31e-d2a4eba67341",
        "titulo": { "pt": "Festival de Gastronomia do Algarve" },
        "categorias": [
          { "_key": "pt", "value": "Gastronomia" },
          { "_key": "en", "value": "Gastronomy" }
        ],
        "configRecorrencia": {
          "tipo": "anual",
          "dataInicio": "2026-04-08T09:00:00.000Z",
          "dataFim": "2026-04-10T23:00:00.000Z"
        },
        "dataUnica": null,
        "ehRecorrente": true,
        "localizacao": null,
        "status": [
          { "_key": "pt", "value": "Planeado" },
          { "_key": "en", "value": "Planned" }
        ]
      },
      {
        "_id": "1eca1b71-870d-435e-9f2f-8d28285ead87",
        "titulo": { "pt": "Visitas Guiadas ao Centro Histórico" },
        "categorias": [
          { "_key": "pt", "value": "Tradições Populares" },
          { "_key": "en", "value": "Popular Traditions" }
        ],
        "configRecorrencia": {
          "tipo": "diaria",
          "dataInicio": "2026-04-01T10:00:00.000Z",
          "dataFim": "2026-04-30T18:00:00.000Z"
        },
        "dataUnica": null,
        "ehRecorrente": true,
        "localizacao": null,
        "status": [
          { "_key": "pt", "value": "Planeado" },
          { "_key": "en", "value": "Planned" }
        ]
      },
      {
        "_id": "3629ea42-5f5c-44b6-9601-048e1ee4dc9d",
        "titulo": { "pt": "Workshops de Cerâmica Tradicional" },
        "categorias": [
          { "_key": "pt", "value": "Artes Plásticas" },
          { "_key": "en", "value": "Visual Arts" }
        ],
        "configRecorrencia": {
          "tipo": "mensal_dia",
          "diaMes": 1,
          "dataInicio": "2026-04-01T10:00:00.000Z",
          "dataFim": null
        },
        "dataUnica": null,
        "ehRecorrente": true,
        "localizacao": null,
        "status": [
          { "_key": "pt", "value": "Planeado" },
          { "_key": "en", "value": "Planned" }
        ]
      },
      {
        "_id": "5aec8feb-3bfe-4cb7-a18d-86901065f307",
        "titulo": { "pt": "Aulas de Yoga no Jardim Público" },
        "categorias": [
          { "_key": "pt", "value": "Desporto" },
          { "_key": "en", "value": "Sports" }
        ],
        "configRecorrencia": {
          "tipo": "semanal",
          "diaDaSemana": "2, 4, 6",
          "ordemSemana": "1",
          "dataInicio": "2026-05-05T14:00:00.000Z",
          "dataFim": "2026-05-30T18:00:00.000Z"
        },
        "dataUnica": null,
        "ehRecorrente": true,
        "localizacao": null,
        "status": [
          { "_key": "pt", "value": "Planeado" },
          { "_key": "en", "value": "Planned" }
        ]
      },
      {
        "_id": "6ffb7b28-2303-417d-b806-849b2137022d",
        "titulo": { "pt": "Noites de Fado no Convento" },
        "categorias": [
          { "_key": "pt", "value": "Música" },
          { "_key": "en", "value": "Music" }
        ],
        "configRecorrencia": {
          "tipo": "mensal_semana",
          "diaDaSemana": "5",
          "diaMes": null,
          "ordemSemana": "3",
          "dataInicio": "2026-05-12T10:00:00.000Z",
          "dataFim": "2026-05-18T23:00:00.000Z"
        },
        "dataUnica": null,
        "ehRecorrente": true,
        "localizacao": null,
        "status": [
          { "_key": "pt", "value": "Planeado" },
          { "_key": "en", "value": "Planned" }
        ]
      },
      {
        "_id": "7e41adfb-2bdb-4287-a01b-90e62f564159",
        "titulo": { "pt": "Exposições de Arte na Galeria Municipal" },
        "categorias": [
          { "_key": "pt", "value": "Artes Plásticas" },
          { "_key": "en", "value": "Visual Arts" }
        ],
        "configRecorrencia": {
          "tipo": "mensal_semana",
          "diaDaSemana": "6",
          "diaMes": null,
          "ordemSemana": null,
          "dataInicio": "2026-05-15T10:00:00.000Z",
          "dataFim": "2026-05-25T18:00:00.000Z"
        },
        "dataUnica": null,
        "ehRecorrente": true,
        "localizacao": null,
        "status": [
          { "_key": "pt", "value": "Planeado" },
          { "_key": "en", "value": "Planned" }
        ]
      },
      {
        "_id": "6594e0bd-a57a-45b9-97a6-cc5d55d1ccd0",
        "titulo": { "pt": "Festa de São João na Praia" },
        "categorias": [
          { "_key": "pt", "value": "Tradições Populares" },
          { "_key": "en", "value": "Popular Traditions" }
        ],
        "configRecorrencia": {
          "tipo": "anual",
          "dataInicio": "2026-06-24T10:00:00.000Z",
          "dataFim": "2026-06-24T23:00:00.000Z"
        },
        "dataUnica": null,
        "ehRecorrente": true,
        "localizacao": null,
        "status": [
          { "_key": "pt", "value": "Planeado" },
          { "_key": "en", "value": "Planned" }
        ]
      }
    ];
    
    // Filter events by year and month using real Sanity structure
    let events = realEvents.filter((event: any) => {
      if (!event.configRecorrencia) return false;
      
      const startDate = new Date(event.configRecorrencia.dataInicio);
      const endDate = event.configRecorrencia.dataFim ? new Date(event.configRecorrencia.dataFim) : startDate;
      
      // Check if event spans the requested month
      const eventStartYear = startDate.getFullYear();
      const eventStartMonth = startDate.getMonth() + 1;
      const eventEndYear = endDate.getFullYear();
      const eventEndMonth = endDate.getMonth() + 1;
      
      // Event matches if it overlaps with the requested month/year
      const matches = (eventStartYear === year && eventStartMonth === month) || 
                     (eventEndYear === year && eventEndMonth === month) ||
                     (startDate < new Date(year, month - 1, 31) && endDate > new Date(year, month - 1, 1));
      
      console.log(`Event: ${event.titulo.pt}, Start: ${event.configRecorrencia.dataInicio}, End: ${event.configRecorrencia.dataFim}, Matches: ${matches}`);
      return matches;
    });
    
    console.log("✅ Filtered real events:", events);
    
    // Process events to handle multi-day events
    const processedEvents = events.map((event: any) => {
      const startDate = new Date(event.configRecorrencia.dataInicio);
      const endDate = event.configRecorrencia.dataFim ? new Date(event.configRecorrencia.dataFim) : startDate;
      
      return {
        _id: event._id,
        titulo: event.titulo,
        dataInicio: event.configRecorrencia.dataInicio,
        dataFim: event.configRecorrencia.dataFim,
        tipo: event.categorias?.[0] ? { _ref: "tipo-" + event.categorias[0].value.toLowerCase(), titulo: event.categorias[0] } : null,
        descricao: { pt: event.titulo.pt },
        endereco: { pt: "Local a definir" },
        startDate,
        endDate,
        isMultiDay: event.configRecorrencia.dataFim ? true : false
      };
    });
    
    console.log(`✅ Found ${processedEvents.length} events for ${year}-${month.toString().padStart(2, '0')}`);
    
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
