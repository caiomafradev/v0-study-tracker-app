// Dados mockados do Study Tracker
// Estrutura completa de planos, disciplinas, sessões e estatísticas

export const PLANOS = [
  { id: 'bb', nome: 'Banco do Brasil 2025', banca: 'Cesgranrio', cargo: 'Agente de Tecnologia', dataProva: '2025-11-15' },
  { id: 'tjdft', nome: 'TJDFT 2025', banca: 'CEBRASPE', cargo: 'Analista Judiciário', dataProva: '2025-09-20' },
  { id: 'metro', nome: 'METRO-DF 2026', banca: 'IADES', cargo: 'Técnico de TI', dataProva: '2026-03-10' },
]

export const MOCK_DATA: Record<string, PlanoData> = {
  bb: {
    disciplinas: [
      {
        id: 'port', nome: 'Português', cor: '#10B981',
        topicos: [
          { id: 't1', nome: 'Interpretação de Texto', concluido: true, acertos: 45, erros: 12, ultimaRevisao: '2026-05-08' },
          { id: 't2', nome: 'Ortografia e Acentuação', concluido: true, acertos: 38, erros: 8, ultimaRevisao: '2026-05-06' },
          { id: 't3', nome: 'Concordância Verbal', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
          { id: 't4', nome: 'Regência Nominal e Verbal', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
          { id: 't5', nome: 'Coesão e Coerência', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
        ]
      },
      {
        id: 'rl', nome: 'Raciocínio Lógico', cor: '#6366F1',
        topicos: [
          { id: 't6', nome: 'Proposições e Conectivos', concluido: true, acertos: 30, erros: 15, ultimaRevisao: '2026-05-07' },
          { id: 't7', nome: 'Diagramas Lógicos', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
          { id: 't8', nome: 'Sequências e Séries', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
          { id: 't9', nome: 'Probabilidade', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
        ]
      },
      {
        id: 'ti', nome: 'Tecnologia da Informação', cor: '#F59E0B',
        topicos: [
          { id: 't10', nome: 'Banco de Dados — SQL', concluido: true, acertos: 55, erros: 10, ultimaRevisao: '2026-05-09' },
          { id: 't11', nome: 'Redes de Computadores', concluido: true, acertos: 40, erros: 18, ultimaRevisao: '2026-05-05' },
          { id: 't12', nome: 'Segurança da Informação', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
          { id: 't13', nome: 'Sistemas Operacionais', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
          { id: 't14', nome: 'Engenharia de Software', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
        ]
      },
      {
        id: 'mat', nome: 'Matemática Financeira', cor: '#8B5CF6',
        topicos: [
          { id: 't15', nome: 'Juros Simples e Compostos', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
          { id: 't16', nome: 'Porcentagem e Proporção', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
        ]
      },
    ],
    sessoes: [
      { id: 's1', disciplinaId: 'ti', topicoId: 't10', tipo: 'questoes', duracaoSegundos: 2843, pausaSegundos: 135, acertos: 8, erros: 3, data: '2026-05-09', revisoes: ['2026-05-10', '2026-05-16'] },
      { id: 's2', disciplinaId: 'port', topicoId: 't1', tipo: 'teoria', duracaoSegundos: 3600, pausaSegundos: 240, acertos: 0, erros: 0, data: '2026-05-09', revisoes: [] },
      { id: 's3', disciplinaId: 'rl', topicoId: 't6', tipo: 'questoes', duracaoSegundos: 1800, pausaSegundos: 60, acertos: 12, erros: 6, data: '2026-05-08', revisoes: ['2026-05-15'] },
      { id: 's4', disciplinaId: 'ti', topicoId: 't11', tipo: 'questoes', duracaoSegundos: 2400, pausaSegundos: 180, acertos: 15, erros: 5, data: '2026-05-07', revisoes: [] },
      { id: 's5', disciplinaId: 'port', topicoId: 't2', tipo: 'teoria', duracaoSegundos: 1200, pausaSegundos: 0, acertos: 0, erros: 0, data: '2026-05-06', revisoes: [] },
      { id: 's6', disciplinaId: 'ti', topicoId: 't10', tipo: 'questoes', duracaoSegundos: 2100, pausaSegundos: 90, acertos: 18, erros: 4, data: '2026-05-05', revisoes: [] },
      { id: 's7', disciplinaId: 'rl', topicoId: 't6', tipo: 'teoria', duracaoSegundos: 1500, pausaSegundos: 45, acertos: 0, erros: 0, data: '2026-05-04', revisoes: [] },
    ],
    stats: {
      streak: 12,
      recordeStreak: 18,
      diasEstudados: 22,
      diasFalhados: 8,
      tempoTotalSegundos: 171120,
      totalQuestoes: 1727,
      totalAcertos: 1231,
      totalErros: 496,
    }
  },
  tjdft: {
    disciplinas: [
      {
        id: 'dc', nome: 'Direito Constitucional', cor: '#10B981',
        topicos: [
          { id: 'dc1', nome: 'Princípios Fundamentais', concluido: true, acertos: 60, erros: 10, ultimaRevisao: '2026-05-08' },
          { id: 'dc2', nome: 'Direitos e Garantias Fundamentais', concluido: true, acertos: 48, erros: 14, ultimaRevisao: '2026-05-07' },
          { id: 'dc3', nome: 'Organização do Estado', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
          { id: 'dc4', nome: 'Poder Legislativo', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
        ]
      },
      {
        id: 'da', nome: 'Direito Administrativo', cor: '#6366F1',
        topicos: [
          { id: 'da1', nome: 'Princípios da Administração', concluido: true, acertos: 35, erros: 8, ultimaRevisao: '2026-05-06' },
          { id: 'da2', nome: 'Atos Administrativos', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
          { id: 'da3', nome: 'Contratos Administrativos', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
        ]
      },
      {
        id: 'dp', nome: 'Direito Penal', cor: '#F59E0B',
        topicos: [
          { id: 'dp1', nome: 'Aplicação da Lei Penal', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
          { id: 'dp2', nome: 'Crimes contra o Patrimônio', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
        ]
      },
    ],
    sessoes: [
      { id: 'ts1', disciplinaId: 'dc', topicoId: 'dc1', tipo: 'questoes', duracaoSegundos: 3200, pausaSegundos: 200, acertos: 18, erros: 4, data: '2026-05-08', revisoes: [] },
      { id: 'ts2', disciplinaId: 'da', topicoId: 'da1', tipo: 'teoria', duracaoSegundos: 2700, pausaSegundos: 120, acertos: 0, erros: 0, data: '2026-05-07', revisoes: ['2026-05-14'] },
      { id: 'ts3', disciplinaId: 'dc', topicoId: 'dc2', tipo: 'questoes', duracaoSegundos: 1800, pausaSegundos: 60, acertos: 22, erros: 6, data: '2026-05-06', revisoes: [] },
    ],
    stats: {
      streak: 5,
      recordeStreak: 9,
      diasEstudados: 12,
      diasFalhados: 3,
      tempoTotalSegundos: 86400,
      totalQuestoes: 543,
      totalAcertos: 401,
      totalErros: 142,
    }
  },
  metro: {
    disciplinas: [
      {
        id: 'inf', nome: 'Informática', cor: '#F59E0B',
        topicos: [
          { id: 'inf1', nome: 'Redes TCP/IP', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
          { id: 'inf2', nome: 'Sistemas Linux', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
        ]
      },
      {
        id: 'port2', nome: 'Português', cor: '#10B981',
        topicos: [
          { id: 'p1', nome: 'Compreensão de Textos', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
          { id: 'p2', nome: 'Gramática Básica', concluido: false, acertos: 0, erros: 0, ultimaRevisao: null },
        ]
      },
    ],
    sessoes: [],
    stats: {
      streak: 0,
      recordeStreak: 0,
      diasEstudados: 0,
      diasFalhados: 0,
      tempoTotalSegundos: 0,
      totalQuestoes: 0,
      totalAcertos: 0,
      totalErros: 0,
    }
  }
}

// Tipos TypeScript
export interface Topico {
  id: string
  nome: string
  concluido: boolean
  acertos: number
  erros: number
  ultimaRevisao: string | null
}

export interface Disciplina {
  id: string
  nome: string
  cor: string
  topicos: Topico[]
}

export interface Sessao {
  id: string
  disciplinaId: string
  topicoId: string
  tipo: 'teoria' | 'questoes'
  duracaoSegundos: number
  pausaSegundos: number
  acertos: number
  erros: number
  data: string
  revisoes: string[]
}

export interface Stats {
  streak: number
  recordeStreak: number
  diasEstudados: number
  diasFalhados: number
  tempoTotalSegundos: number
  totalQuestoes: number
  totalAcertos: number
  totalErros: number
}

export interface PlanoData {
  disciplinas: Disciplina[]
  sessoes: Sessao[]
  stats: Stats
}

export interface Plano {
  id: string
  nome: string
  banca: string
  cargo: string
  dataProva: string
}

// Hábitos mockados
export const HABITOS_MOCK = [
  { id: 'h1', icone: '🏋️', nome: 'Academia 1h', pontos: 800, ativo: true },
  { id: 'h2', icone: '📚', nome: 'Ler 30 minutos', pontos: 600, ativo: true },
  { id: 'h3', icone: '📖', nome: 'Estudar 2 horas', pontos: 1000, ativo: true },
  { id: 'h4', icone: '❓', nome: 'Fazer 20 questões', pontos: 500, ativo: true },
  { id: 'h5', icone: '🧘', nome: 'Meditação 15min', pontos: 300, ativo: true },
]

export const DESAFIOS_MOCK = [
  { 
    id: 'd1', 
    nome: 'Semana Produtiva', 
    meta: 5000, 
    atual: 3200, 
    prazo: '2026-05-17', 
    recompensa: 'Jantar especial',
    concluido: false 
  },
  { 
    id: 'd2', 
    nome: 'Maratona de Questões', 
    meta: 2000, 
    atual: 2000, 
    prazo: '2026-05-12', 
    recompensa: 'Série nova',
    concluido: true 
  },
]

// Funções de utilidade para fuso horário de Brasília
export const BSB_TZ = 'America/Sao_Paulo'

export const agora = () => new Date(new Date().toLocaleString('en-US', { timeZone: BSB_TZ }))

export const hoje = () => agora().toISOString().split('T')[0]

export const formatarTempo = (ms: number): string => {
  const totalSeg = Math.floor(ms / 1000)
  const h = Math.floor(totalSeg / 3600)
  const m = Math.floor((totalSeg % 3600) / 60)
  const s = totalSeg % 60
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export const formatarTempoLegivel = (segundos: number): string => {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

export const formatarTempoCompleto = (segundos: number): string => {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  if (h > 0) return `${h}h ${m}min ${s}s`
  if (m > 0) return `${m}min ${s}s`
  return `${s}s`
}
