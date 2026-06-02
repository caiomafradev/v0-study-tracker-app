'use client'

import { useState, useMemo } from 'react'
import { 
  Clock, 
  Pause, 
  Check, 
  Calendar,
  Pencil,
  Trash2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLANOS, formatarTempoLegivel } from '@/lib/mock-data'
import { useStudy } from '@/contexts/StudyContext'
import { cn } from '@/lib/utils'

interface HistoricoProps {
  planoAtivo?: string
}

type FiltroPeriodo = 'hoje' | 'semana' | 'mes' | 'total'

export function Historico({ planoAtivo = 'bb' }: HistoricoProps) {
  const { dadosGerais, getDataLocal, getSessoesFiltradas } = useStudy()
  
  const [filtroPlano, setFiltroPlano] = useState<'ativo' | 'todos'>('ativo')
  const [filtroDisciplina, setFiltroDisciplina] = useState<string>('todas')
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('semana')

  // Obter dados baseado no filtro
  const dadosPlanos = filtroPlano === 'ativo' 
    ? { [planoAtivo]: dadosGerais[planoAtivo] }
    : dadosGerais

  // Combinar todas as sessoes usando o Context
  const todasSessoes = useMemo(() => {
    const sessoes: Array<{
      sessao: ReturnType<typeof getSessoesFiltradas>[0]
      planoId: string
      disciplina: { id: string; nome: string; cor: string }
      topico: { id: string; nome: string }
    }> = []

    Object.entries(dadosPlanos).forEach(([planoId, dados]) => {
      if (!dados) return
      dados.sessoes.forEach(sessao => {
        const disciplina = dados.disciplinas.find(d => d.id === sessao.disciplinaId)
        const topico = disciplina?.topicos.find(t => t.id === sessao.topicoId)
        if (disciplina && topico) {
          sessoes.push({ 
            sessao, 
            planoId, 
            disciplina: { id: disciplina.id, nome: disciplina.nome, cor: disciplina.cor },
            topico: { id: topico.id, nome: topico.nome }
          })
        }
      })
    })

    return sessoes.sort((a, b) => b.sessao.data.localeCompare(a.sessao.data))
  }, [dadosPlanos])

  // Filtrar por periodo usando getDataLocal
  const sessoesFiltradas = useMemo(() => {
    const hoje = getDataLocal()
    const hojeDate = new Date(hoje + 'T12:00:00')
    
    return todasSessoes.filter(({ sessao, disciplina }) => {
      // Filtro de disciplina
      if (filtroDisciplina !== 'todas' && disciplina.id !== filtroDisciplina) {
        return false
      }

      // Filtro de periodo
      const dataSessaoDate = new Date(sessao.data + 'T12:00:00')
      const diffDias = Math.floor((hojeDate.getTime() - dataSessaoDate.getTime()) / (1000 * 60 * 60 * 24))

      switch (filtroPeriodo) {
        case 'hoje':
          return sessao.data === hoje
        case 'semana':
          return diffDias <= 7
        case 'mes':
          return diffDias <= 30
        default:
          return true
      }
    })
  }, [todasSessoes, filtroDisciplina, filtroPeriodo, getDataLocal])

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

  // Disciplinas disponiveis
  const disciplinasDisponiveis = useMemo(() => {
    const disc = new Map<string, string>()
    Object.values(dadosPlanos).forEach(dados => {
      if (!dados) return
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
        <h1 className="text-2xl font-heading font-bold text-foreground">Historico de Estudos</h1>
        <p className="text-muted-foreground">Revise suas sessoes de estudo anteriores</p>
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

        {/* Pills periodo */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['hoje', 'semana', 'mes', 'total'] as FiltroPeriodo[]).map(periodo => (
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
              {periodo === 'semana' && '7 dias'}
              {periodo === 'mes' && '30 dias'}
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
            <p className="text-muted-foreground">Nenhuma sessao encontrada para os filtros selecionados.</p>
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

                {/* Cards de sessao */}
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
                                {sessao.tipo === 'teoria' ? 'TEORIA' : 'QUESTOES'}
                              </Badge>

                              {/* Nome */}
                              <p className="font-heading font-semibold">{disciplina.nome}</p>
                              <p className="text-sm text-muted-foreground">{topico.nome}</p>

                              {/* Metricas */}
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
                                    <span className="text-success font-medium">✓ {sessao.acertos}</span>
                                    <span className="text-error font-medium">✗ {sessao.erros}</span>
                                    {aproveitamento && (
                                      <span className="font-mono font-medium">{aproveitamento}%</span>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Revisao agendada */}
                              {sessao.revisoes.length > 0 && (
                                <div className="mt-2">
                                  <Badge variant="secondary" className="gap-1 text-xs">
                                    <Calendar className="w-3 h-3" />
                                    Revisao: {sessao.revisoes[0]}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {/* Acoes (aparecem no hover) */}
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
