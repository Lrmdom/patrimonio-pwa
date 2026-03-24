import type { LoaderFunctionArgs } from "react-router";
import { supabaseAdmin } from "~/auth/utils/supabase";

// Type definition for impactos_ocorrencia table
interface ImpactoOcorrencia {
  id: string;
  ocorrencia_id: number;
  tipo: 'troco_cortado' | 'desvio' | 'zona_barulho' | 'zona_po' | 'condicionamento' | 'sinalizacao';
  descricao: string;
  geom: any;
  properties: Record<string, any>;
  created_at: string;
  updated_at: string;
  ativo: boolean;
  valid_from: string | null;
  valid_to: string | null;
  funcionario_id: number | null;
}

// API endpoint for urban planning constraints (condicionantes)
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
    
    console.log(`🚧 Loading constraints from Supabase for ${year}-${month.toString().padStart(2, '0')}`);
    
    // Calculate date range for the specified month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month
    
    // Query Supabase for constraints in the specified month
    const { data: constraints, error } = await supabaseAdmin
      .from('impactos_ocorrencia')
      .select('*')
      .eq('ativo', true)
      .or(`valid_from.lte.${endDate.toISOString()},valid_from.is.null`)
      .or(`valid_to.gte.${startDate.toISOString()},valid_to.is.null`)
      .returns<ImpactoOcorrencia[]>();
    
    // Query para obter os tipos de condicionantes
    const { data: tipos, error: tiposError } = await supabaseAdmin
      .from('tipos_condicionantes')
      .select('*')
      .eq('ativo', true);
    
    if (error || tiposError) {
      console.error('❌ Error fetching data from Supabase:', error || tiposError);
      return Response.json({ 
        error: (error || tiposError)?.message || "Failed to load constraints",
        constraints: [],
        year,
        month,
        total: 0
      }, { status: 500 });
    }
    
    // Criar mapa de tipos para fácil acesso
    const tiposMap = (tipos || []).reduce((acc, tipo) => {
      acc[tipo.id] = tipo;
      return acc;
    }, {} as Record<string, any>);
    
    console.log(`✅ Found ${constraints?.length || 0} constraints for ${year}-${month.toString().padStart(2, '0')}`);
    
    // Process constraints to match expected format
    const processedConstraints = constraints?.map(constraint => {
      const startDate = new Date(constraint.valid_from || constraint.created_at);
      const endDate = constraint.valid_to ? new Date(constraint.valid_to) : null;
      
      // Mapeamento entre tipos técnicos e nomes dos tipos
      const tipoMapping: Record<string, string> = {
        'zona_barulho': 'Zona de Ruído',
        'zona_po': 'Zona de Poeiras/Fumos',
        'condicionamento': 'Condicionamento Parcial',
        'troco_cortado': 'Corte de Passeio',
        'desvio': 'Sentido Único Temporário',
        'sinalizacao': 'Ponto de Risco'
      };
      
      // Tentar encontrar o tipo pelo mapeamento ou pelo properties.tipo
      let tipoConfig = null;
      const tipoNome = tipoMapping[constraint.tipo] || 
                       (tipos || []).find(t => t.id === constraint.properties?.tipo)?.nome ||
                       (tipos || []).find(t => t.nome === constraint.tipo);
      
      if (tipoNome && typeof tipoNome === 'string') {
        tipoConfig = (tipos || []).find(t => t.nome === tipoNome);
      } else if (tipoNome && typeof tipoNome === 'object') {
        tipoConfig = tipoNome;
      }
      
      return {
        id: constraint.id,
        ocorrencia_id: constraint.ocorrencia_id,
        tipo: constraint.tipo,
        descricao: constraint.descricao,
        geom: constraint.geom,
        properties: constraint.properties || {},
        valid_from: constraint.valid_from,
        valid_to: constraint.valid_to,
        ativo: constraint.ativo,
        created_at: constraint.created_at,
        updated_at: constraint.updated_at,
        funcionario_id: constraint.funcionario_id,
        startDate,
        endDate,
        isMultiDay: constraint.valid_to ? true : false,
        // Campos do tipo de condicionante
        tc_id: tipoConfig?.id,
        tc_nome: tipoConfig?.nome || tipoNome || constraint.tipo,
        tc_cor: tipoConfig?.cor || '#f59e0b',
        tc_peso: tipoConfig?.peso || 2,
        tc_opacidade: tipoConfig?.opacidade || 0.8,
        tc_preenchimento: tipoConfig?.preenchimento,
        tc_padrao_visual: tipoConfig?.padrao_visual || 'solido'
      };
    }) || [];
    
    return Response.json({ 
      constraints: processedConstraints,
      year,
      month,
      total: processedConstraints.length
    });
    
  } catch (error: any) {
    console.error("❌ Error loading constraints:", error);
    return Response.json({ 
      error: error.message || "Failed to load constraints",
      constraints: [],
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      total: 0
    }, { status: 500 });
  }
}
