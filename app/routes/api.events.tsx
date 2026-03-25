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
    
    // Mock accommodation data
    const mockAccommodation = [
      {
        _id: "aloj-001",
        name: "Hotel Vila Galé",
        type: "Hotel",
        category: "4 Estrelas",
        location: { lat: 37.1256, lng: -7.6543 },
        address: "Praça da República 12, Tavira",
        phone: "+351 281 323 100",
        website: "https://www.vilagale.pt",
        rating: 4.2,
        priceRange: "€€€",
        amenities: ["Piscina", "Spa", "Restaurante", "Wi-Fi", "Ar Condicionado"]
      },
      {
        _id: "aloj-002",
        name: "Quinta da Conceição",
        type: "Agriturismo",
        category: "5 Estrelas",
        location: { lat: 37.1189, lng: -7.6721 },
        address: "Sitio da Conceição, Tavira",
        phone: "+351 281 325 670",
        website: "https://www.quintadaconceicao.pt",
        rating: 4.8,
        priceRange: "€€€€",
        amenities: ["Piscina", "Jardim", "Estacionamento", "Wi-Fi", "Pequeno-almoço"]
      },
      {
        _id: "aloj-003",
        name: "Tavira Guest House",
        type: "Guest House",
        category: "3 Estrelas",
        location: { lat: 37.1314, lng: -7.6456 },
        address: "Rua Dr. Miguel Bombarda 45, Tavira",
        phone: "+351 281 322 890",
        website: "https://www.taviraguesthouse.pt",
        rating: 4.1,
        priceRange: "€€",
        amenities: ["Wi-Fi", "Ar Condicionado", "Cozinha Partilhada"]
      },
      {
        _id: "aloj-004",
        name: "Hotel Alacati",
        type: "Hotel Boutique",
        category: "4 Estrelas",
        location: { lat: 37.1278, lng: -7.6412 },
        address: "Rua José Estêvão 23, Tavira",
        phone: "+351 281 321 450",
        website: "https://www.hotelalacati.pt",
        rating: 4.5,
        priceRange: "€€€",
        amenities: ["Terraço", "Bar", "Wi-Fi", "Ar Condicionado", "Serviço de Quarto"]
      }
    ];
    
    // Mock restaurants data
    const mockRestaurants = [
      {
        _id: "rest-001",
        name: "O Celeiro",
        type: "Restaurante Tradicional",
        cuisine: "Portuguesa",
        location: { lat: 37.1302, lng: -7.6487 },
        address: "Travessa da Misericórdia 8, Tavira",
        phone: "+351 281 325 890",
        rating: 4.3,
        priceRange: "€€€",
        specialties: ["Cataplana de Marisco", "Feijoada de Búzios", "Bacalhau à Braz"],
        openHours: "12:00-15:00, 19:00-23:00"
      },
      {
        _id: "rest-002",
        name: "Beira Rio",
        type: "Restaurante",
        cuisine: "Portuguesa/Mediterrânica",
        location: { lat: 37.1267, lng: -7.6589 },
        address: "Rua da República 1, Tavira",
        phone: "+351 281 321 234",
        rating: 4.4,
        priceRange: "€€€",
        specialties: ["Arroz de Lingueirão", "Lulas Recheadas", "Tarte de Amêndoa"],
        openHours: "12:30-15:30, 19:30-22:30"
      },
      {
        _id: "rest-003",
        name: "Ponto Final",
        type: "Restaurante",
        cuisine: "Internacional",
        location: { lat: 37.1234, lng: -7.6398 },
        address: "Rua Dr. Padre Pereira 68, Tavira",
        phone: "+351 281 324 567",
        rating: 4.2,
        priceRange: "€€",
        specialties: ["Hambúrguer Artesanal", "Saladas Frescas", "Vegan Options"],
        openHours: "08:00-24:00"
      },
      {
        _id: "rest-004",
        name: "A Lota",
        type: "Marisqueira",
        cuisine: "Marisco",
        location: { lat: 37.1219, lng: -7.6428 },
        address: "Avenida 25 de Abril 45, Tavira",
        phone: "+351 281 326 789",
        rating: 4.6,
        priceRange: "€€€",
        specialties: ["Marisco na Cataplana", "Grilled Fish", "Ameijoas à Bulhão Pato"],
        openHours: "12:00-15:00, 19:00-23:00"
      },
      {
        _id: "rest-005",
        name: "Casa do Prego",
        type: "Tasca",
        cuisine: "Portuguesa",
        location: { lat: 37.1321, lng: -7.6453 },
        address: "Rua da Porta do Postigo 12, Tavira",
        phone: "+351 281 327 890",
        rating: 4.1,
        priceRange: "€",
        specialties: ["Prego no Pão", "Bifana", "Petiscos Tradicionais"],
        openHours: "11:00-23:00"
      }
    ];
    
    // Mock nightlife data
    const mockNightlife = [
      {
        _id: "night-001",
        name: "Bar da Ponte",
        type: "Bar",
        location: { lat: 37.1298, lng: -7.6512 },
        address: "Rua da Ponte Antiga 15, Tavira",
        phone: "+351 281 328 901",
        rating: 4.3,
        priceRange: "€€",
        specialties: ["Coquetéis", "Vinhos Locais", "Petiscos"],
        openHours: "18:00-02:00",
        music: "Jazz/Chillout",
        outdoorSeating: true
      },
      {
        _id: "night-002",
        name: "Mojito Bar",
        type: "Cocktail Bar",
        location: { lat: 37.1289, lng: -7.6496 },
        address: "Praça da República 8, Tavira",
        phone: "+351 281 329 012",
        rating: 4.4,
        priceRange: "€€€",
        specialties: ["Mojitos", "Caipirinhas", "Coquetéis Tropicais"],
        openHours: "19:00-03:00",
        music: "Latina/Dance",
        outdoorSeating: true
      },
      {
        _id: "night-003",
        name: "Oasis Club",
        type: "Nightclub",
        location: { lat: 37.1247, lng: -7.6534 },
        address: "Rua Almirante Cândido dos Reis 23, Tavira",
        phone: "+351 281 330 123",
        rating: 4.0,
        priceRange: "€€€",
        specialties: ["Bebidas", "DJ Sets", "Eventos Especiais"],
        openHours: "22:00-04:00",
        music: "Electronic/Top 40",
        outdoorSeating: false
      },
      {
        _id: "night-004",
        name: "Tavira Wine Bar",
        type: "Wine Bar",
        location: { lat: 37.1314, lng: -7.6556 },
        address: "Rua José Pires de Faria 34, Tavira",
        phone: "+351 281 331 234",
        rating: 4.6,
        priceRange: "€€€",
        specialties: ["Vinhos Algarvios", "Queijos Locais", "Tábuas de Charcutaria"],
        openHours: "17:00-01:00",
        music: "Ambiente/Suave",
        outdoorSeating: true
      },
      {
        _id: "night-005",
        name: "Pub da Praça",
        type: "Pub",
        location: { lat: 37.1278, lng: -7.6412 },
        address: "Largo Dr. Francisco Gomes 5, Tavira",
        phone: "+351 281 332 345",
        rating: 4.2,
        priceRange: "€€",
        specialties: ["Cervejas Artesanais", "Petiscos", "Espetáculos Ao Vivo"],
        openHours: "16:00-02:00",
        music: "Rock/Pop",
        outdoorSeating: true
      }
    ];
    
    // Mock urban plans data - Planos Diretores Municipais
    const mockUrbanPlans = [
      // 🏙️ SOLO URBANO
      {
        _id: "plano-urb-001",
        name: "Espaço Urbano Consolidado",
        type: "Solo Urbano",
        category: "consolidado",
        description: "Cidade já construída com infraestruturas consolidadas",
        color: "#8B4513",
        opacity: 0.6,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6520, 37.1290],
            [-7.6515, 37.1295],
            [-7.6508, 37.1298],
            [-7.6502, 37.1295],
            [-7.6500, 37.1290],
            [-7.6505, 37.1285],
            [-7.6512, 37.1283],
            [-7.6518, 37.1285],
            [-7.6520, 37.1290]
          ]]
        },
        regulations: [
          "Densidade: 50-100 hab/ha",
          "Altura: 2-4 pisos",
          "Usos: Misto (residencial, comércio, serviços)",
          "Índice construção: 0.6-0.8"
        ]
      },
      {
        _id: "plano-urb-002",
        name: "Espaço Urbanizável",
        type: "Solo Urbano",
        category: "urbanizavel",
        description: "Áreas de expansão urbana futura",
        color: "#4682B4",
        opacity: 0.5,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6485, 37.1275],
            [-7.6478, 37.1280],
            [-7.6470, 37.1285],
            [-7.6465, 37.1288],
            [-7.6460, 37.1292],
            [-7.6458, 37.1290],
            [-7.6462, 37.1285],
            [-7.6468, 37.1280],
            [-7.6475, 37.1275],
            [-7.6485, 37.1275]
          ]]
        },
        regulations: [
          "Densidade: 30-60 hab/ha",
          "Altura: 2-3 pisos",
          "Usos: Residencial, equipamentos",
          "Lote mínimo: 200-300m²"
        ]
      },
      {
        _id: "plano-urb-003",
        name: "Espaço Central",
        type: "Solo Urbano",
        category: "central",
        description: "Comércio, serviços, maior densidade urbana",
        color: "#FFD700",
        opacity: 0.6,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6535, 37.1305],
            [-7.6530, 37.1310],
            [-7.6525, 37.1312],
            [-7.6520, 37.1310],
            [-7.6518, 37.1305],
            [-7.6520, 37.1300],
            [-7.6525, 37.1298],
            [-7.6530, 37.1300],
            [-7.6535, 37.1305]
          ]]
        },
        regulations: [
          "Densidade: 100-200 hab/ha",
          "Altura: 4-6 pisos",
          "Usos: Comércio, serviços, residencial",
          "Estacionamento: 1 lugar/50m²"
        ]
      },
      {
        _id: "plano-urb-004",
        name: "Espaço Residencial",
        type: "Solo Urbano",
        category: "residencial",
        description: "Zonas predominantemente residenciais",
        color: "#87CEEB",
        opacity: 0.5,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6550, 37.1320],
            [-7.6545, 37.1325],
            [-7.6538, 37.1330],
            [-7.6530, 37.1332],
            [-7.6525, 37.1330],
            [-7.6520, 37.1325],
            [-7.6522, 37.1320],
            [-7.6530, 37.1318],
            [-7.6540, 37.1318],
            [-7.6550, 37.1320]
          ]]
        },
        regulations: [
          "Densidade: 40-80 hab/ha",
          "Altura: 2-3 pisos",
          "Usos: Residencial dominante",
          "Afastamentos: 3m frontal, 1.5m laterais"
        ]
      },
      {
        _id: "plano-urb-005",
        name: "Espaço de Atividades Económicas",
        type: "Solo Urbano",
        category: "economicas",
        description: "Indústria, armazéns, logística",
        color: "#FF6347",
        opacity: 0.5,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6600, 37.1250],
            [-7.6595, 37.1255],
            [-7.6588, 37.1260],
            [-7.6580, 37.1262],
            [-7.6575, 37.1260],
            [-7.6570, 37.1255],
            [-7.6572, 37.1250],
            [-7.6580, 37.1248],
            [-7.6590, 37.1248],
            [-7.6600, 37.1250]
          ]]
        },
        regulations: [
          "Densidade: 10-30 hab/ha",
          "Altura: 1-2 pisos",
          "Usos: Industrial, armazenamento, logística",
          "Afastamentos: 5m frontal, 3m laterais"
        ]
      },
      {
        _id: "plano-urb-006",
        name: "Equipamentos",
        type: "Solo Urbano",
        category: "equipamentos",
        description: "Escolas, hospitais, serviços públicos",
        color: "#9370DB",
        opacity: 0.6,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6545, 37.1275],
            [-7.6540, 37.1280],
            [-7.6535, 37.1282],
            [-7.6530, 37.1280],
            [-7.6528, 37.1275],
            [-7.6530, 37.1270],
            [-7.6535, 37.1268],
            [-7.6540, 37.1270],
            [-7.6545, 37.1275]
          ]]
        },
        regulations: [
          "Usos: Educação, saúde, desporto, cultura",
          "Acessibilidade obrigatória",
          "Estacionamento específico",
          "Áreas verdes envolventes obrigatórias"
        ]
      },
      
      // 🌿 SOLO RÚSTICO
      {
        _id: "plano-rust-001",
        name: "Espaço Agrícola 🌾",
        type: "Solo Rústico",
        category: "agricola",
        description: "Áreas destinadas à atividade agrícola",
        color: "#228B22",
        opacity: 0.4,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6450, 37.1350],
            [-7.6350, 37.1400],
            [-7.6300, 37.1450],
            [-7.6250, 37.1500],
            [-7.6200, 37.1550],
            [-7.6150, 37.1600],
            [-7.6100, 37.1650],
            [-7.6050, 37.1700],
            [-7.6000, 37.1750],
            [-7.5950, 37.1800],
            [-7.5900, 37.1850],
            [-7.5850, 37.1900],
            [-7.5800, 37.1950],
            [-7.5750, 37.2000],
            [-7.5700, 37.2050],
            [-7.5650, 37.2100],
            [-7.5600, 37.2150],
            [-7.5550, 37.2200],
            [-7.5500, 37.2250],
            [-7.5450, 37.2300],
            [-7.5400, 37.2350],
            [-7.5350, 37.2400],
            [-7.5300, 37.2450],
            [-7.5250, 37.2500],
            [-7.5200, 37.2550],
            [-7.5150, 37.2600],
            [-7.5100, 37.2650],
            [-7.5050, 37.2700],
            [-7.5000, 37.2750],
            [-7.4950, 37.2800],
            [-7.4900, 37.2850],
            [-7.4850, 37.2900],
            [-7.4800, 37.2950],
            [-7.4750, 37.3000],
            [-7.4700, 37.3050],
            [-7.4650, 37.3100],
            [-7.4600, 37.3150],
            [-7.4550, 37.3200],
            [-7.4500, 37.3250],
            [-7.4450, 37.3300],
            [-7.4400, 37.3350],
            [-7.4350, 37.3400],
            [-7.4300, 37.3450],
            [-7.4250, 37.3500],
            [-7.4200, 37.3550],
            [-7.4150, 37.3600],
            [-7.4100, 37.3650],
            [-7.4050, 37.3700],
            [-7.4000, 37.3750],
            [-7.3950, 37.3800],
            [-7.3900, 37.3850],
            [-7.3850, 37.3900],
            [-7.3800, 37.3950],
            [-7.3750, 37.4000],
            [-7.3700, 37.4050],
            [-7.3650, 37.4100],
            [-7.3600, 37.4150],
            [-7.3550, 37.4200],
            [-7.3500, 37.4250],
            [-7.3450, 37.4300],
            [-7.3400, 37.4350],
            [-7.3350, 37.4400],
            [-7.3300, 37.4450],
            [-7.3250, 37.4500],
            [-7.3200, 37.4550],
            [-7.3150, 37.4600],
            [-7.3100, 37.4650],
            [-7.3050, 37.4700],
            [-7.3000, 37.4750],
            [-7.2950, 37.4800],
            [-7.2900, 37.4850],
            [-7.2850, 37.4900],
            [-7.2800, 37.4950],
            [-7.2750, 37.5000],
            [-7.2700, 37.5050],
            [-7.2650, 37.5100],
            [-7.2600, 37.5150],
            [-7.2550, 37.5200],
            [-7.2500, 37.5250],
            [-7.2450, 37.5300],
            [-7.2400, 37.5350],
            [-7.2350, 37.5400],
            [-7.2300, 37.5450],
            [-7.2250, 37.5500],
            [-7.2200, 37.5550],
            [-7.2150, 37.5600],
            [-7.2100, 37.5650],
            [-7.2050, 37.5700],
            [-7.2000, 37.5750],
            [-7.1950, 37.5800],
            [-7.1900, 37.5850],
            [-7.1850, 37.5900],
            [-7.1800, 37.5950],
            [-7.1750, 37.6000],
            [-7.1700, 37.6050],
            [-7.1650, 37.6100],
            [-7.1600, 37.6150],
            [-7.1550, 37.6200],
            [-7.1500, 37.6250],
            [-7.1450, 37.6300],
            [-7.1400, 37.6350],
            [-7.1350, 37.6400],
            [-7.1300, 37.6450],
            [-7.1250, 37.6500],
            [-7.1200, 37.6550],
            [-7.1150, 37.6600],
            [-7.1100, 37.6650],
            [-7.1050, 37.6700],
            [-7.1000, 37.6750],
            [-7.0950, 37.6800],
            [-7.0900, 37.6850],
            [-7.0850, 37.6900],
            [-7.0800, 37.6950],
            [-7.0750, 37.7000],
            [-7.0700, 37.7050],
            [-7.0650, 37.7100],
            [-7.0600, 37.7150],
            [-7.0550, 37.7200],
            [-7.0500, 37.7250],
            [-7.0450, 37.7300],
            [-7.0400, 37.7350],
            [-7.0350, 37.7400],
            [-7.0300, 37.7450],
            [-7.0250, 37.7500],
            [-7.0200, 37.7550],
            [-7.0150, 37.7600],
            [-7.0100, 37.7650],
            [-7.0050, 37.7700],
            [-7.0000, 37.7750],
            [-7.6450, 37.1350]
          ]]
        },
        regulations: [
          "Proibido construção não agrícola",
          "Usos: Agricultura, pecuária, agroindústria",
          "Proteção de solos férteis",
          "Manutenção de estruturas agrícolas"
        ]
      },
      {
        _id: "plano-rust-002",
        name: "Espaço Florestal 🌲",
        type: "Solo Rústico",
        category: "florestal",
        description: "Áreas florestais e de produção madeireira",
        color: "#2E8B57",
        opacity: 0.4,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6650, 37.1380],
            [-7.6550, 37.1420],
            [-7.6450, 37.1460],
            [-7.6350, 37.1500],
            [-7.6250, 37.1540],
            [-7.6150, 37.1580],
            [-7.6050, 37.1620],
            [-7.5950, 37.1660],
            [-7.5850, 37.1700],
            [-7.5750, 37.1740],
            [-7.5650, 37.1780],
            [-7.5550, 37.1820],
            [-7.5450, 37.1860],
            [-7.5350, 37.1900],
            [-7.5250, 37.1940],
            [-7.5150, 37.1980],
            [-7.5050, 37.2020],
            [-7.4950, 37.2060],
            [-7.4850, 37.2100],
            [-7.4750, 37.2140],
            [-7.4650, 37.2180],
            [-7.4550, 37.2220],
            [-7.4450, 37.2260],
            [-7.4350, 37.2300],
            [-7.4250, 37.2340],
            [-7.4150, 37.2380],
            [-7.4050, 37.2420],
            [-7.3950, 37.2460],
            [-7.3850, 37.2500],
            [-7.3750, 37.2540],
            [-7.3650, 37.2580],
            [-7.3550, 37.2620],
            [-7.3450, 37.2660],
            [-7.3350, 37.2700],
            [-7.3250, 37.2740],
            [-7.3150, 37.2780],
            [-7.3050, 37.2820],
            [-7.2950, 37.2860],
            [-7.2850, 37.2900],
            [-7.2750, 37.2940],
            [-7.2650, 37.2980],
            [-7.2550, 37.3020],
            [-7.2450, 37.3060],
            [-7.2350, 37.3100],
            [-7.2250, 37.3140],
            [-7.2150, 37.3180],
            [-7.2050, 37.3220],
            [-7.1950, 37.3260],
            [-7.1850, 37.3300],
            [-7.1750, 37.3340],
            [-7.1650, 37.3380],
            [-7.1550, 37.3420],
            [-7.1450, 37.3460],
            [-7.1350, 37.3500],
            [-7.1250, 37.3540],
            [-7.1150, 37.3580],
            [-7.1050, 37.3620],
            [-7.0950, 37.3660],
            [-7.0850, 37.3700],
            [-7.0750, 37.3740],
            [-7.0650, 37.3780],
            [-7.0550, 37.3820],
            [-7.0450, 37.3860],
            [-7.0350, 37.3900],
            [-7.0250, 37.3940],
            [-7.0150, 37.3980],
            [-7.0050, 37.4020],
            [-7.6650, 37.1380]
          ]]
        },
        regulations: [
          "Proibido construção não florestal",
          "Usos: Produção florestal, recreio",
          "Gestão sustentável de recursos",
          "Prevenção de incêndios obrigatória"
        ]
      },
      {
        _id: "plano-rust-003",
        name: "Espaço Natural Protegido",
        type: "Solo Rústico",
        category: "natural",
        description: "Áreas de proteção ambiental e paisagística",
        color: "#32CD32",
        opacity: 0.3,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6700, 37.1400],
            [-7.6600, 37.1450],
            [-7.6500, 37.1500],
            [-7.6400, 37.1550],
            [-7.6300, 37.1600],
            [-7.6200, 37.1650],
            [-7.6100, 37.1700],
            [-7.6000, 37.1750],
            [-7.5900, 37.1800],
            [-7.5800, 37.1850],
            [-7.5700, 37.1900],
            [-7.5600, 37.1950],
            [-7.5500, 37.2000],
            [-7.5400, 37.2050],
            [-7.5300, 37.2100],
            [-7.5200, 37.2150],
            [-7.5100, 37.2200],
            [-7.5000, 37.2250],
            [-7.4900, 37.2300],
            [-7.4800, 37.2350],
            [-7.4700, 37.2400],
            [-7.4600, 37.2450],
            [-7.4500, 37.2500],
            [-7.4400, 37.2550],
            [-7.4300, 37.2600],
            [-7.4200, 37.2650],
            [-7.4100, 37.2700],
            [-7.4000, 37.2750],
            [-7.3900, 37.2800],
            [-7.3800, 37.2850],
            [-7.3700, 37.2900],
            [-7.3600, 37.2950],
            [-7.3500, 37.3000],
            [-7.3400, 37.3050],
            [-7.3300, 37.3100],
            [-7.3200, 37.3150],
            [-7.3100, 37.3200],
            [-7.3000, 37.3250],
            [-7.2900, 37.3300],
            [-7.2800, 37.3350],
            [-7.2700, 37.3400],
            [-7.2600, 37.3450],
            [-7.2500, 37.3500],
            [-7.2400, 37.3550],
            [-7.2300, 37.3600],
            [-7.2200, 37.3650],
            [-7.2100, 37.3700],
            [-7.2000, 37.3750],
            [-7.1900, 37.3800],
            [-7.1800, 37.3850],
            [-7.1700, 37.3900],
            [-7.1600, 37.3950],
            [-7.1500, 37.4000],
            [-7.1400, 37.4050],
            [-7.1300, 37.4100],
            [-7.1200, 37.4150],
            [-7.1100, 37.4200],
            [-7.1000, 37.4250],
            [-7.0900, 37.4300],
            [-7.0800, 37.4350],
            [-7.0700, 37.4400],
            [-7.0600, 37.4450],
            [-7.0500, 37.4500],
            [-7.0400, 37.4550],
            [-7.0300, 37.4600],
            [-7.0200, 37.4650],
            [-7.0100, 37.4700],
            [-7.0000, 37.4750],
            [-7.6700, 37.1400]
          ]]
        },
        regulations: [
          "Proibido construção",
          "Usos: Conservação, educação ambiental",
          "Proteção de habitats e espécies",
          "Acesso condicionado"
        ]
      },
      {
        _id: "plano-rust-004",
        name: "Espaço Agroflorestal",
        type: "Solo Rústico",
        category: "agroflorestal",
        description: "Sistemas integrados agricultura-floresta",
        color: "#8FBC8F",
        opacity: 0.4,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6400, 37.1300],
            [-7.6390, 37.1305],
            [-7.6380, 37.1310],
            [-7.6370, 37.1312],
            [-7.6360, 37.1310],
            [-7.6355, 37.1305],
            [-7.6360, 37.1300],
            [-7.6370, 37.1298],
            [-7.6380, 37.1298],
            [-7.6390, 37.1300],
            [-7.6400, 37.1300]
          ]]
        },
        regulations: [
          "Usos: Agricultura, floresta, pecuária",
          "Proibido construção não agrícola",
          "Manutenção de equilíbrio ecológico",
          "Práticas de conservação obrigatórias"
        ]
      },
      {
        _id: "plano-rust-005",
        name: "Espaço de Exploração de Recursos",
        type: "Solo Rústico",
        category: "recursos",
        description: "Pedreiras, minas, explorações geológicas",
        color: "#A0522D",
        opacity: 0.5,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6750, 37.1250],
            [-7.6740, 37.1255],
            [-7.6730, 37.1260],
            [-7.6720, 37.1262],
            [-7.6710, 37.1260],
            [-7.6705, 37.1255],
            [-7.6710, 37.1250],
            [-7.6720, 37.1248],
            [-7.6730, 37.1248],
            [-7.6740, 37.1250],
            [-7.6750, 37.1250]
          ]]
        },
        regulations: [
          "Usos: Extração de recursos geológicos",
          "Proibido habitação",
          "Plano de recuperação obrigatório",
          "Impacte ambiental obrigatório"
        ]
      },
      
      // 🛑 CONDICIONANTES
{
  "_id": "cond-001",
  "name": "REN - Reserva Ecológica Nacional",
  "type": "Condicionante",
  "category": "ren",
  "description": "Proteção de ecossistemas e valores naturais (Versão Expandida 10x)",
  "color": "#006400",
  "opacity": 0.7,
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [-7.66225, 37.1299],
      [-7.65225, 37.1349],
      [-7.64225, 37.1399],
      [-7.63225, 37.1419],
      [-7.62225, 37.1399],
      [-7.61725, 37.1349],
      [-7.62225, 37.1299],
      [-7.63225, 37.1279],
      [-7.64225, 37.1279],
      [-7.65225, 37.1299],
      [-7.66225, 37.1299]
    ]]
  },
  "regulations": [
    "Proibido construção",
    "Proteção de linhas de água",
    "Manutenção de vegetação ripícola",
    "Acesso condicionado"
  ]
},
      {
        _id: "cond-002",
        name: "RAN - Reserva Agrícola Nacional",
        type: "Condicionante",
        category: "ran",
        description: "Proteção de solos agrícolas férteis",
        color: "#8B4513",
        opacity: 0.6,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6550, 37.1270],
            [-7.6540, 37.1275],
            [-7.6530, 37.1280],
            [-7.6520, 37.1282],
            [-7.6510, 37.1280],
            [-7.6505, 37.1275],
            [-7.6510, 37.1270],
            [-7.6520, 37.1268],
            [-7.6530, 37.1268],
            [-7.6540, 37.1270],
            [-7.6550, 37.1270]
          ]]
        },
        regulations: [
          "Proibido construção não agrícola",
          "Proteção de solos classe A e B",
          "Práticas de conservação obrigatórias",
          "Proibido alteração de uso"
        ]
      },
      {
        _id: "cond-003",
        name: "Domínio Público Hídrico",
        type: "Condicionante",
        category: "hidrico",
        description: "Rios, ribeiras, albufeiras, margens",
        color: "#4682B4",
        opacity: 0.8,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6500, 37.1280],
            [-7.6495, 37.1285],
            [-7.6490, 37.1290],
            [-7.6485, 37.1295],
            [-7.6480, 37.1290],
            [-7.6485, 37.1285],
            [-7.6490, 37.1280],
            [-7.6495, 37.1275],
            [-7.6500, 37.1280]
          ]]
        },
        regulations: [
          "Proibido construção",
          "Margens: 10m (rios pequenos), 30m (rios grandes)",
          "Acesso público garantido",
          "Proteção de qualidade da água"
        ]
      },
      {
        _id: "cond-004",
        name: "Áreas de Risco - Cheias",
        type: "Condicionante",
        category: "cheias",
        description: "Zonas inundáveis e de risco hidrológico",
        color: "#FF4500",
        opacity: 0.7,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6470, 37.1260],
            [-7.6465, 37.1265],
            [-7.6460, 37.1270],
            [-7.6455, 37.1275],
            [-7.6450, 37.1270],
            [-7.6455, 37.1265],
            [-7.6460, 37.1260],
            [-7.6465, 37.1255],
            [-7.6470, 37.1260]
          ]]
        },
        regulations: [
          "Proibido construção",
          "Zonas non aedificandi",
          "Plano de emergência obrigatório",
          "Medidas de mitigação obrigatórias"
        ]
      },
      {
        _id: "cond-005",
        name: "Património Classificado",
        type: "Condicionante",
        category: "patrimonio",
        description: "Monumentos, sítios históricos, conjuntos protegidos",
        color: "#8B0000",
        opacity: 0.6,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6510, 37.1295],
            [-7.6505, 37.1300],
            [-7.6500, 37.1305],
            [-7.6495, 37.1300],
            [-7.6500, 37.1295],
            [-7.6505, 37.1290],
            [-7.6510, 37.1295]
          ]]
        },
        regulations: [
          "Proibido demolições",
          "Obras sujeitas a autorização específica",
          "Manutenção de características originais",
          "Proteção de envolvente"
        ]
      },
      {
        _id: "cond-006",
        name: "Servidões Aeronáuticas",
        type: "Condicionante",
        category: "aeronautica",
        description: "Áreas de proteção de aeródromos e pistas",
        color: "#4B0082",
        opacity: 0.5,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-7.6800, 37.1320],
            [-7.6750, 37.1350],
            [-7.6700, 37.1380],
            [-7.6750, 37.1410],
            [-7.6800, 37.1380],
            [-7.6800, 37.1320]
          ]]
        },
        regulations: [
          "Proibido obstáculos",
          "Altura máxima de construção",
          "Sinalização obrigatória",
          "Restrições de uso"
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
      accommodation: mockAccommodation,
      restaurants: mockRestaurants,
      nightlife: mockNightlife,
      urbanPlans: mockUrbanPlans,
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
