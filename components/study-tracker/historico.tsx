'use client'

import { useState, useMemo } from 'react'
import { 
  Clock, 
  Pause, 
  Check, 
  X as XIcon, 
  Calendar,
  Pencil,
  Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MOCK_DATA, PLANOS, formatarTempoLegivel } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface HistoricoProps {
  planoAtivo?: string
}

type FiltroPeriodo = 'hoje' | '7dias' | '30dias' | 'total'

export function Historico({ planoAtivo = 'bb' }: HistoricoProps) {
  const [filtroPlano, setFiltroPlano] = useState<'ativo' | 'todos'>('ativo')
  const [filtroDisciplina, setFiltroDisciplina] = useState<string>('todas')
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('7dias')

  // Obter dados baseado no filtro
  const dadosPlanos = filtroPlano === 'ativo' 
    ? { [planoAtivo]: MOCK_DATA[planoAtivo] }
    : MOCK_DATA

  // Combinar todas as sessões
  const todasSessoes = useMemo(() => {
    const sessoes: Array<{
      sessao: typeof MOCK_DATA.bb.sessoes[0]
      planoId: string
      disciplina: typeof MOCK_DATA.bb.disciplinas[0]
      topico: typeof MOCK_DATA.bb.disciplinas[0]['topicos'][0]
    }> = []

    Object.entries(dadosPlanos).forEach(([planoId, dados]) => {
      dados.sessoes.forEach(sessao => {
        const disciplina = dados.disciplinas.find(d => d.id === sessao.disciplinaId)
        const topico = disciplina?.topicos.find(t => t.id === sessao.topicoId)
        if (disciplina && topico) {
          sessoes.push({ sessao, planoId, disciplina, topico })
        }
      })
    })

    return sessoes.sort((a, b) => b.sessao.data.localeCompare(a.sessao.data))
  }, [dadosPlanos])

  // Filtrar por período
  const sessoesFiltradas = useMemo(() => {
    const hoje = new Date()
    const hojeISO = hoje.toISOString().split('T')[0]
    
    return todasSessoes.filter(({ sessao, disciplina }) => {
      // Filtro de disciplina
      if (filtroDisciplina !== 'todas' && disciplina.id !== filtroDisciplina) {
        return false
      }

      // Filtro de período
      const dataSessao = new Date(sessao.data)
      const diffDias = Math.floor((hoje.getTime() - dataSessao.getTime()) / (1000 * 60 * 60 * 24))

      switch (filtroPeriodo) {
        case 'hoje':
          return sessao.data === hojeISO
        case '7dias':
          return diffDias <= 7
        case '30dias':
          return diffDias <= 30
        default:
          return true
      }
    })
  }, [todasSessoes, filtroDisciplina, filtroPeriodo])

  // Agrupar por data
  const sessoesAgrupadas = useMemo(() => {
    const grupos: Record<string, typeof sessoesFiltradas> = {}
    
    sessoesFiltradas.forEach(item => {
      if (!grupos[item.sessao.data]) {
        grupos[item.sessao.data] = []
      }
      grupos[item.sessao.data].push(item)
    })

    return grupos
  }, [sessoesFiltradas])

  // Calcular totais
  const totais = useMemo(() => {
    const tempoEstudo = sessoesFiltradas.reduce((acc, { sessao }) => acc + sessao.duracaoSegundos, 0)
    const tempoPausa = sessoesFiltradas.reduce((acc, { sessao }) => acc + sessao.pausaSegundos, 0)
    const acertos = sessoesFiltradas.reduce((acc, { sessao }) => acc + sessao.acertos, 0)
    const erros = sessoesFiltradas.reduce((acc, { sessao }) => acc + sessao.erros, 0)
    const total = acertos + erros
    const aproveitamento = total > 0 ? ((acertos / total) * 100).toFixed(1) : '0.0'

    return { tempoEstudo, tempoPausa, acertos, erros, aproveitamento }
  }, [sessoesFiltradas])

  // Disciplinas disponíveis
  const disciplinasDisponiveis = useMemo(() => {
    const disc = new Map<string, string>()
    Object.values(dadosPlanos).forEach(dados => {
      dados.disciplinas.forEach(d => disc.set(d.id, d.nome))
    })
    return Array.from(disc.entries())
  }, [dadosPlanos])

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO + 'T12:00:00')
    const dia = data.getDate().toString().padStart(2, '0')
    const mes = data.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()
    const ano = data.getFullYear().toString().slice(2)
    const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()
    return `${dia} ${mes}/${ano} ${diaSemana}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Histórico de Estudos</h1>
        <p className="text-muted-foreground">Revise suas sessões de estudo anteriores</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        {/* Toggle Plano */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setFiltroPlano('ativo')}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm transition-all",
              filtroPlano === 'ativo' ? "bg-card shadow-sm" : "hover:bg-card/50"
            )}
          >
            Plano Ativo
          </button>
          <button
            onClick={() => setFiltroPlano('todos')}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm transition-all",
              filtroPlano === 'todos' ? "bg-card shadow-sm" : "hover:bg-card/50"
            )}
          >
            Todos os Planos
          </button>
        </div>

        {/* Dropdown Disciplina */}
        <select
          value={filtroDisciplina}
          onChange={(e) => setFiltroDisciplina(e.target.value)}
          className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
        >
          <option value="todas">Todas as disciplinas</option>
          {disciplinasDisponiveis.map(([id, nome]) => (
            <option key={id} value={id}>{nome}</option>
          ))}
        </select>

        {/* Pills período */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['hoje', '7dias', '30dias', 'total'] as FiltroPeriodo[]).map(periodo => (
            <button
              key={periodo}
              onClick={() => setFiltroPeriodo(periodo)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-all",
                filtroPeriodo === periodo 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-card/50"
              )}
            >
              {periodo === 'hoje' && 'Hoje'}
              {periodo === '7dias' && '7 dias'}
              {periodo === '30dias' && '30 dias'}
              {periodo === 'total' && 'Total'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xl font-heading font-bold">{formatarTempoLegivel(totais.tempoEstudo)}</p>
                <p className="text-xs text-muted-foreground">Tempo de estudo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Pause className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-heading font-bold text-muted-foreground">{formatarTempoLegivel(totais.tempoPausa)}</p>
                <p className="text-xs text-muted-foreground">Tempo pausado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-success" />
              <div>
                <p className="text-xl font-heading font-bold text-success">{totais.acertos}</p>
                <p className="text-xs text-muted-foreground">Acertos totais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-secondary">%</span>
              </div>
              <div>
                <p className="text-xl font-heading font-bold">{totais.aproveitamento}%</p>
                <p className="text-xs text-muted-foreground">Aproveitamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista agrupada por data */}
      {Object.keys(sessoesAgrupadas).length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma sessão encontrada para os filtros selecionados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(sessoesAgrupadas).map(([data, sessoes]) => {
            const tempoTotal = sessoes.reduce((acc, { sessao }) => acc + sessao.duracaoSegundos, 0)
            const pausaTotal = sessoes.reduce((acc, { sessao }) => acc + sessao.pausaSegundos, 0)

            return (
              <div key={data}>
                {/* Separador de data */}
                <div className="flex items-center gap-4 mb-3">
                  <span className="font-mono text-sm font-medium text-muted-foreground">
                    {formatarData(data)}
                  </span>
                  <div className="flex-1 border-t border-border" />
                  <span className="text-sm text-muted-foreground">
                    {formatarTempoLegivel(tempoTotal)} estudo | {formatarTempoLegivel(pausaTotal)} pausa
                  </span>
                </div>

                {/* Cards de sessão */}
                <div className="space-y-3">
                  {sessoes.map(({ sessao, planoId, disciplina, topico }) => {
                    const total = sessao.acertos + sessao.erros
                    const aproveitamento = total > 0 
                      ? ((sessao.acertos / total) * 100).toFixed(1)
                      : null

                    return (
                      <Card 
                        key={sessao.id} 
                        className="shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
                        style={{ borderLeftWidth: '4px', borderLeftColor: disciplina.cor }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Badge de tipo */}
                              <Badge 
                                variant="secondary"
                                className={cn(
                                  "mb-2",
                                  sessao.tipo === 'teoria' 
                                    ? "bg-success-light text-success" 
                                    : "bg-secondary/10 text-secondary"
                                )}
                              >
                                {sessao.tipo === 'teoria' ? 'TEORIA' : 'QUESTÕES'}
                              </Badge>

                              {/* Nome */}
                              <p className="font-heading font-semibold">{disciplina.nome}</p>
                              <p className="text-sm text-muted-foreground">{topico.nome}</p>

                              {/* Métricas */}
                              <div className="flex items-center gap-4 mt-3 text-sm">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-primary" />
                                  {formatarTempoLegivel(sessao.duracaoSegundos)}
                                </span>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Pause className="w-4 h-4" />
                                  {formatarTempoLegivel(sessao.pausaSegundos)} pausado
                                </span>
                                {sessao.tipo === 'questoes' && (
                                  <>
                                    <span className="text-success font-medium">✅ {sessao.acertos}</span>
                                    <span className="text-error font-medium">❌ {sessao.erros}</span>
                                    {aproveitamento && (
                                      <span className="font-mono font-medium">{aproveitamento}%</span>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Revisão agendada */}
                              {sessao.revisoes.length > 0 && (
                                <div className="mt-2">
                                  <Badge variant="secondary" className="gap-1 text-xs">
                                    <Calendar className="w-3 h-3" />
                                    Revisão: {sessao.revisoes[0]}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {/* Ações (aparecem no hover) */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="w-4 h-4 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-error">
                                <Trash2 className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
