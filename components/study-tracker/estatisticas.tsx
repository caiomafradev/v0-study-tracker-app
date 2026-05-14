'use client'

import { useState, useMemo } from 'react'
import { 
  Clock, 
  Pause, 
  Calendar,
  Flame,
  Trophy,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MOCK_DATA, PLANOS, formatarTempoLegivel } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'

interface EstatisticasProps {
  planoAtivo?: string
  onOpenTimer?: (preenchimento?: { plano?: string; disciplina?: string; topico?: string }) => void
}

type FiltroPeriodo = 'hoje' | 'semana' | 'mes' | 'total'

export function Estatisticas({ planoAtivo = 'bb', onOpenTimer }: EstatisticasProps) {
  const [filtroPlano, setFiltroPlano] = useState<'ativo' | 'todos'>('ativo')
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('semana')
  const [abaDisciplina, setAbaDisciplina] = useState<'tempo' | 'questoes'>('tempo')

  // Obter dados
  const dadosPlanos = filtroPlano === 'ativo' 
    ? { [planoAtivo]: MOCK_DATA[planoAtivo] }
    : MOCK_DATA

  // Calcular totais
  const totais = useMemo(() => {
    let tempoEstudo = 0
    let tempoPausa = 0
    let acertos = 0
    let erros = 0
    let diasEstudados = 0
    let streak = 0
    let recordeStreak = 0

    Object.values(dadosPlanos).forEach(dados => {
      tempoEstudo += dados.stats.tempoTotalSegundos
      acertos += dados.stats.totalAcertos
      erros += dados.stats.totalErros
      diasEstudados += dados.stats.diasEstudados
      streak = Math.max(streak, dados.stats.streak)
      recordeStreak = Math.max(recordeStreak, dados.stats.recordeStreak)
      
      dados.sessoes.forEach(s => {
        tempoPausa += s.pausaSegundos
      })
    })

    const totalQuestoes = acertos + erros
    const aproveitamento = totalQuestoes > 0 ? ((acertos / totalQuestoes) * 100).toFixed(1) : '0.0'
    const mediaPorDia = diasEstudados > 0 ? Math.round(tempoEstudo / diasEstudados) : 0

    return { 
      tempoEstudo, 
      tempoPausa, 
      acertos, 
      erros, 
      totalQuestoes, 
      aproveitamento,
      diasEstudados,
      mediaPorDia,
      streak,
      recordeStreak
    }
  }, [dadosPlanos])

  // Dados para gráfico de pizza
  const dadosPizza = [
    { name: 'Acertos', value: totais.acertos, color: '#22C55E' },
    { name: 'Erros', value: totais.erros, color: '#EF4444' },
  ]

  // Dados para gráfico de barras por dia
  const dadosSemana = [
    { dia: 'Seg', estudo: 95, pausa: 12 },
    { dia: 'Ter', estudo: 72, pausa: 8 },
    { dia: 'Qua', estudo: 110, pausa: 15 },
    { dia: 'Qui', estudo: 85, pausa: 10 },
    { dia: 'Sex', estudo: 65, pausa: 5 },
    { dia: 'Sáb', estudo: 120, pausa: 18 },
    { dia: 'Dom', estudo: 45, pausa: 4 },
  ]

  // Dados para gráfico de linha
  const dadosLinha = [
    { data: '05/mai', acertos: 12, erros: 4 },
    { data: '06/mai', acertos: 8, erros: 2 },
    { data: '07/mai', acertos: 15, erros: 5 },
    { data: '08/mai', acertos: 18, erros: 6 },
    { data: '09/mai', acertos: 20, erros: 4 },
  ]

  // Estatísticas por disciplina
  const estatisticasDisciplinas = useMemo(() => {
    const stats: Array<{
      id: string
      nome: string
      cor: string
      tempo: number
      acertos: number
      erros: number
      percentual: number
    }> = []

    Object.values(dadosPlanos).forEach(dados => {
      dados.disciplinas.forEach(disc => {
        const sessoesDisc = dados.sessoes.filter(s => s.disciplinaId === disc.id)
        const tempo = sessoesDisc.reduce((acc, s) => acc + s.duracaoSegundos, 0)
        const acertos = disc.topicos.reduce((acc, t) => acc + t.acertos, 0)
        const erros = disc.topicos.reduce((acc, t) => acc + t.erros, 0)
        const total = acertos + erros
        const percentual = total > 0 ? (acertos / total) * 100 : 0

        const existing = stats.find(s => s.id === disc.id)
        if (existing) {
          existing.tempo += tempo
          existing.acertos += acertos
          existing.erros += erros
          existing.percentual = existing.acertos + existing.erros > 0 
            ? (existing.acertos / (existing.acertos + existing.erros)) * 100 
            : 0
        } else {
          stats.push({ id: disc.id, nome: disc.nome, cor: disc.cor, tempo, acertos, erros, percentual })
        }
      })
    })

    return stats.sort((a, b) => abaDisciplina === 'tempo' ? b.tempo - a.tempo : b.acertos + b.erros - a.acertos - a.erros)
  }, [dadosPlanos, abaDisciplina])

  // Gerar calendário de 30 dias
  const calendario = useMemo(() => {
    const dias = []
    const hoje = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const data = new Date(hoje)
      data.setDate(data.getDate() - i)
      const estudou = Math.random() > 0.3 // Mock
      
      dias.push({
        data: data.toISOString().split('T')[0],
        estudou,
        isHoje: i === 0
      })
    }
    return dias
  }, [])

  // Calcular constância
  const diasEstudados = calendario.filter(d => d.estudou).length
  const constancia = Math.round((diasEstudados / 30) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Estatísticas</h1>
        <p className="text-muted-foreground">Acompanhe seu desempenho e evolução</p>
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
            Plano Ativo ({PLANOS.find(p => p.id === planoAtivo)?.nome.split(' ')[0]})
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

        {/* Pills período */}
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
              {periodo === 'semana' && 'Esta Semana'}
              {periodo === 'mes' && 'Este Mês'}
              {periodo === 'total' && 'Total'}
            </button>
          ))}
        </div>
      </div>

      {/* BLOCO 1 — TEMPO */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Tempo de Estudo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-heading font-bold text-primary">{formatarTempoLegivel(totais.tempoEstudo)}</p>
              <p className="text-sm text-muted-foreground">Tempo de estudo</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-heading font-bold text-muted-foreground">{formatarTempoLegivel(totais.tempoPausa)}</p>
              <p className="text-sm text-muted-foreground">Tempo pausado</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-heading font-bold">{formatarTempoLegivel(totais.mediaPorDia)}</p>
              <p className="text-sm text-muted-foreground">Média por dia</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-heading font-bold">{totais.diasEstudados} dias</p>
              <p className="text-sm text-muted-foreground">Com estudo</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dadosSemana}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="dia" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="estudo" name="Estudo (min)" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pausa" name="Pausa (min)" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* BLOCO 2 — QUESTÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              Desempenho em Questões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xl font-bold">{totais.totalQuestoes}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="p-3 bg-success-light rounded-lg text-center">
                <p className="text-xl font-bold text-success">{totais.acertos}</p>
                <p className="text-xs text-success">Acertos</p>
              </div>
              <div className="p-3 bg-error-light rounded-lg text-center">
                <p className="text-xl font-bold text-error">{totais.erros}</p>
                <p className="text-xs text-error">Erros</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg text-center">
                <p className="text-xl font-bold text-secondary">{totais.aproveitamento}%</p>
                <p className="text-xs text-secondary">Aproveitamento</p>
              </div>
            </div>

            <div className="flex justify-center">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={dadosPizza}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dadosPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center font-mono text-lg font-bold mt-2">{totais.totalQuestoes} questões</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Evolução de Acertos/Erros</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dadosLinha}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="data" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="acertos" name="Acertos" stroke="#22C55E" strokeWidth={2} />
                <Line type="monotone" dataKey="erros" name="Erros" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* BLOCO 3 — CONSTÂNCIA */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            Constância
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-heading font-bold">{diasEstudados} dias</p>
              <p className="text-sm text-muted-foreground">Estudados</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-heading font-bold">{30 - diasEstudados} dias</p>
              <p className="text-sm text-muted-foreground">Perdidos</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-heading font-bold">{constancia}%</p>
              <p className="text-sm text-muted-foreground">Constância</p>
            </div>
            <div className="p-4 bg-error-light rounded-lg">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-streak animate-flame-pulse" />
                <p className="text-2xl font-heading font-bold text-streak">{totais.streak} dias</p>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Recorde: {totais.recordeStreak}
              </p>
            </div>
          </div>

          {/* Calendário */}
          <div className="flex gap-2 flex-wrap">
            {calendario.map((dia, index) => (
              <div
                key={index}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono cursor-pointer",
                  "transition-all duration-200 hover:scale-110",
                  dia.isHoje && "ring-2 ring-primary animate-pulse-border",
                  dia.estudou ? "bg-success text-white" : "bg-error-light text-error"
                )}
                title={dia.data}
              >
                {new Date(dia.data).getDate()}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 4 — POR DISCIPLINA */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-lg">Desempenho por Disciplina</CardTitle>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setAbaDisciplina('tempo')}
                className={cn(
                  "px-3 py-1 rounded-md text-sm",
                  abaDisciplina === 'tempo' ? "bg-card shadow-sm" : ""
                )}
              >
                Por Tempo
              </button>
              <button
                onClick={() => setAbaDisciplina('questoes')}
                className={cn(
                  "px-3 py-1 rounded-md text-sm",
                  abaDisciplina === 'questoes' ? "bg-card shadow-sm" : ""
                )}
              >
                Por Questões
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {estatisticasDisciplinas.map((disc) => {
              const valor = abaDisciplina === 'tempo' 
                ? disc.tempo 
                : disc.acertos + disc.erros
              const maxValor = Math.max(...estatisticasDisciplinas.map(d => 
                abaDisciplina === 'tempo' ? d.tempo : d.acertos + d.erros
              ))
              const porcentagem = maxValor > 0 ? (valor / maxValor) * 100 : 0
              
              // Cor baseada no aproveitamento
              let corBarra = disc.cor
              if (abaDisciplina === 'questoes') {
                if (disc.percentual >= 70) corBarra = '#22C55E'
                else if (disc.percentual >= 50) corBarra = '#F59E0B'
                else corBarra = '#EF4444'
              }

              return (
                <div key={disc.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: disc.cor }}
                      />
                      <span className="font-medium">{disc.nome}</span>
                    </div>
                    <span className="font-mono">
                      {abaDisciplina === 'tempo' 
                        ? formatarTempoLegivel(disc.tempo)
                        : `${disc.acertos + disc.erros} questões (${disc.percentual.toFixed(0)}%)`
                      }
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${porcentagem}%`,
                        backgroundColor: corBarra
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 5 — PROGRESSO DO EDITAL (apenas quando "Todos os Planos") */}
      {filtroPlano === 'todos' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Progresso por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {PLANOS.map(plano => {
                const dados = MOCK_DATA[plano.id]
                const totalTopicos = dados.disciplinas.reduce((acc, d) => acc + d.topicos.length, 0)
                const concluidos = dados.disciplinas.reduce(
                  (acc, d) => acc + d.topicos.filter(t => t.concluido).length, 0
                )
                const progresso = totalTopicos > 0 ? (concluidos / totalTopicos) * 100 : 0

                return (
                  <div key={plano.id} className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{plano.nome}</span>
                      <span className="text-sm text-muted-foreground">
                        {concluidos}/{totalTopicos} tópicos
                      </span>
                    </div>
                    <Progress value={progresso} className="h-2" />
                    <p className="text-right text-sm font-mono mt-1">{Math.round(progresso)}%</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
