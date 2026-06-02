'use client'

import { useState, useMemo } from 'react'
import { 
  Clock, 
  Pause, 
  Calendar,
  Flame,
  Trophy,
  BarChart3,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { PLANOS, formatarTempoLegivel } from '@/lib/mock-data'
import { useStudy } from '@/contexts/StudyContext'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

interface EstatisticasProps {
  planoAtivo?: string
  onOpenTimer?: (preenchimento?: { plano?: string; disciplina?: string; topico?: string }) => void
}

type FiltroPeriodo = 'hoje' | 'semana' | 'mes' | 'total' | 'personalizado'

export function Estatisticas({ planoAtivo = 'bb', onOpenTimer }: EstatisticasProps) {
  const { dadosGerais, getDataLocal, getSessoesFiltradas } = useStudy()
  
  const [filtroPlano, setFiltroPlano] = useState<'ativo' | 'todos'>('ativo')
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('semana')
  const [abaDisciplina, setAbaDisciplina] = useState<'tempo' | 'questoes'>('tempo')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  // Dados do plano
  const dadosPlanos = filtroPlano === 'ativo' 
    ? { [planoAtivo]: dadosGerais[planoAtivo] }
    : dadosGerais

  // Sessoes filtradas por periodo usando a funcao do Context
  const sessoesFiltradas = useMemo(() => {
    const planoId = filtroPlano === 'ativo' ? planoAtivo : 'todos'
    return getSessoesFiltradas(planoId, filtroPeriodo, dataInicio, dataFim)
  }, [filtroPlano, planoAtivo, filtroPeriodo, dataInicio, dataFim, getSessoesFiltradas])

  // Focos Recomendados (Piores Resultados)
  const focosRecomendados = useMemo(() => {
    const todosTopicos: any[] = []

    Object.entries(dadosPlanos).forEach(([planoId, plano]) => {
      if (!plano) return
      plano.disciplinas.forEach(disc => {
        disc.topicos.forEach(topico => {
          const totalQuestoes = topico.acertos + topico.erros
          if (totalQuestoes > 0) {
            const aproveitamento = (topico.acertos / totalQuestoes) * 100
            todosTopicos.push({
              planoId,
              disciplinaId: disc.id,
              topicoId: topico.id,
              disciplina: disc.nome,
              topico: topico.nome,
              aproveitamento,
              erros: topico.erros
            })
          }
        })
      })
    })

    return todosTopicos
      .sort((a, b) => a.aproveitamento - b.aproveitamento)
      .slice(0, 3)
  }, [dadosPlanos])

  // Calculos de Totais baseados nas sessoes filtradas
  const totais = useMemo(() => {
    const tempoEstudo = sessoesFiltradas.reduce((acc, s) => acc + s.duracaoSegundos, 0)
    const tempoPausa = sessoesFiltradas.reduce((acc, s) => acc + s.pausaSegundos, 0)
    const acertos = sessoesFiltradas.reduce((acc, s) => acc + s.acertos, 0)
    const erros = sessoesFiltradas.reduce((acc, s) => acc + s.erros, 0)
    
    // Para streak e recordeStreak, pegar do plano
    let streak = 0
    let recordeStreak = 0
    let diasEstudados = 0
    
    Object.values(dadosPlanos).forEach(dados => {
      if (!dados) return
      streak = Math.max(streak, dados.stats.streak)
      recordeStreak = Math.max(recordeStreak, dados.stats.recordeStreak)
      diasEstudados += dados.stats.diasEstudados
    })

    const totalQuestoes = acertos + erros
    const aproveitamento = totalQuestoes > 0 ? ((acertos / totalQuestoes) * 100).toFixed(1) : '0.0'
    const mediaPorDia = diasEstudados > 0 ? Math.round(tempoEstudo / diasEstudados) : 0

    return { tempoEstudo, tempoPausa, acertos, erros, totalQuestoes, aproveitamento, diasEstudados, mediaPorDia, streak, recordeStreak }
  }, [sessoesFiltradas, dadosPlanos])

  // Dados para graficos
  const dadosPizza = [
    { name: 'Acertos', value: totais.acertos, color: '#22C55E' },
    { name: 'Erros', value: totais.erros, color: '#EF4444' },
  ]

  // Grafico de linha - evolucao dos ultimos dias
  const dadosLinha = useMemo(() => {
    const hoje = getDataLocal()
    const hojeDate = new Date(hoje + 'T12:00:00')
    const resultado = []
    
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hojeDate)
      data.setDate(data.getDate() - i)
      const dataStr = data.toISOString().split('T')[0]
      const sessoesNoDia = sessoesFiltradas.filter(s => s.data === dataStr)
      
      resultado.push({
        data: `${data.getDate()}/${data.getMonth() + 1}`,
        acertos: sessoesNoDia.reduce((acc, s) => acc + s.acertos, 0),
        erros: sessoesNoDia.reduce((acc, s) => acc + s.erros, 0)
      })
    }
    
    return resultado
  }, [sessoesFiltradas, getDataLocal])

  // Grafico de barras - tempo por dia
  const dadosSemana = useMemo(() => {
    const hoje = getDataLocal()
    const hojeDate = new Date(hoje + 'T12:00:00')
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
    const resultado = []
    
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hojeDate)
      data.setDate(data.getDate() - i)
      const dataStr = data.toISOString().split('T')[0]
      const sessoesNoDia = sessoesFiltradas.filter(s => s.data === dataStr)
      
      resultado.push({
        dia: diasSemana[data.getDay()],
        estudo: Math.round(sessoesNoDia.reduce((acc, s) => acc + s.duracaoSegundos, 0) / 60),
        pausa: Math.round(sessoesNoDia.reduce((acc, s) => acc + s.pausaSegundos, 0) / 60)
      })
    }
    
    return resultado
  }, [sessoesFiltradas, getDataLocal])

  // Estatisticas por disciplina
  const estatisticasDisciplinas = useMemo(() => {
    const stats: any[] = []
    
    Object.values(dadosPlanos).forEach(dados => {
      if (!dados) return
      dados.disciplinas.forEach(disc => {
        const sessoesDisc = sessoesFiltradas.filter(s => s.disciplinaId === disc.id)
        const tempo = sessoesDisc.reduce((acc, s) => acc + s.duracaoSegundos, 0)
        const acertos = sessoesDisc.reduce((acc, s) => acc + s.acertos, 0)
        const erros = sessoesDisc.reduce((acc, s) => acc + s.erros, 0)
        const percentual = (acertos + erros) > 0 ? (acertos / (acertos + erros)) * 100 : 0
        
        // Evita duplicatas
        if (!stats.find(s => s.id === disc.id)) {
          stats.push({ id: disc.id, nome: disc.nome, cor: disc.cor, tempo, acertos, erros, percentual })
        }
      })
    })
    
    return stats.sort((a, b) => abaDisciplina === 'tempo' ? b.tempo - a.tempo : (b.acertos + b.erros) - (a.acertos + a.erros))
  }, [dadosPlanos, sessoesFiltradas, abaDisciplina])

  // Calendario de constancia
  const calendario = useMemo(() => {
    const dias = []
    const hoje = getDataLocal()
    const hojeDate = new Date(hoje + 'T12:00:00')
    
    for (let i = 29; i >= 0; i--) {
      const data = new Date(hojeDate)
      data.setDate(data.getDate() - i)
      const dataStr = data.toISOString().split('T')[0]
      
      let estudou = false
      Object.values(dadosGerais).forEach(plano => {
        if (plano.sessoes.some(s => s.data === dataStr)) {
          estudou = true
        }
      })
      
      dias.push({ data: dataStr, estudou, isHoje: i === 0 })
    }
    return dias
  }, [getDataLocal, dadosGerais])

  const aplicarFiltroPersonalizado = () => {
    if (!dataInicio || !dataFim) {
      alert("Por favor, selecione a data de inicio e de fim.")
      return
    }
    setFiltroPeriodo('personalizado')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Estatisticas</h1>
        <p className="text-muted-foreground">Acompanhe seu desempenho e evolucao</p>
      </div>

      {/* AREA DE FILTROS */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button onClick={() => setFiltroPlano('ativo')} className={cn("px-3 py-1.5 rounded-md text-sm", filtroPlano === 'ativo' ? "bg-card shadow-sm" : "hover:bg-card/50")}>Plano Ativo</button>
          <button onClick={() => setFiltroPlano('todos')} className={cn("px-3 py-1.5 rounded-md text-sm", filtroPlano === 'todos' ? "bg-card shadow-sm" : "hover:bg-card/50")}>Todos os Planos</button>
        </div>

        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['hoje', 'semana', 'mes', 'total'] as FiltroPeriodo[]).map(periodo => (
            <button 
              key={periodo} 
              onClick={() => setFiltroPeriodo(periodo)} 
              className={cn("px-3 py-1.5 rounded-md text-sm capitalize", filtroPeriodo === periodo ? "bg-primary text-primary-foreground" : "hover:bg-card/50")}
            >
              {periodo === 'hoje' ? 'Hoje' : periodo === 'semana' ? '7 dias' : periodo === 'mes' ? '30 dias' : 'Total'}
            </button>
          ))}
        </div>

        {/* Filtro de Data Personalizado */}
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <input 
            type="date" 
            className="text-sm bg-transparent border-none p-1.5 outline-none"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
          <span className="text-muted-foreground text-sm">ate</span>
          <input 
            type="date" 
            className="text-sm bg-transparent border-none p-1.5 outline-none"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
          <Button 
            size="sm" 
            variant={filtroPeriodo === 'personalizado' ? "default" : "secondary"}
            className="h-8 px-3 text-xs"
            onClick={aplicarFiltroPersonalizado}
          >
            Filtrar
          </Button>
        </div>
      </div>

      {/* BLOCO 1 — TEMPO */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="font-heading text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Tempo de Estudo</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold text-primary">{formatarTempoLegivel(totais.tempoEstudo)}</p><p className="text-sm text-muted-foreground">Tempo de estudo</p></div>
            <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold text-muted-foreground">{formatarTempoLegivel(totais.tempoPausa)}</p><p className="text-sm text-muted-foreground">Tempo pausado</p></div>
            <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold">{formatarTempoLegivel(totais.mediaPorDia)}</p><p className="text-sm text-muted-foreground">Media por dia</p></div>
            <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold">{totais.diasEstudados} dias</p><p className="text-sm text-muted-foreground">Com estudo</p></div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dadosSemana}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="dia" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="estudo" name="Estudo (min)" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pausa" name="Pausa (min)" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* BLOCO 2 — QUESTOES E FOCOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="shadow-sm h-full">
            <CardHeader><CardTitle className="font-heading text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-secondary" /> Desempenho em Questoes</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-muted rounded-lg text-center"><p className="text-xl font-bold">{totais.totalQuestoes}</p><p className="text-xs text-muted-foreground">Total</p></div>
                <div className="p-3 bg-success-light rounded-lg text-center"><p className="text-xl font-bold text-success">{totais.acertos}</p><p className="text-xs text-success">Acertos</p></div>
                <div className="p-3 bg-error-light rounded-lg text-center"><p className="text-xl font-bold text-error">{totais.erros}</p><p className="text-xs text-error">Erros</p></div>
                <div className="p-3 bg-secondary/10 rounded-lg text-center"><p className="text-xl font-bold text-secondary">{totais.aproveitamento}%</p><p className="text-xs text-secondary">Aproveitamento</p></div>
              </div>
              <div className="flex justify-center">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart><Pie data={dadosPizza} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{dadosPizza.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="font-heading text-lg">Evolucao de Acertos/Erros</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dadosLinha}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="data" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip /><Legend />
                  <Line type="monotone" dataKey="acertos" name="Acertos" stroke="#22C55E" strokeWidth={2} />
                  <Line type="monotone" dataKey="erros" name="Erros" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* FOCOS DE ESTUDO */}
          <Card className="border-error-light bg-error/5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2 text-error">
                <Target className="w-5 h-5" /> Focos Recomendados
              </CardTitle>
              <p className="text-xs text-muted-foreground">Revisao urgente baseada nos piores desempenhos</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-2">
                {focosRecomendados.map((foco, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border shadow-sm">
                    <div>
                      <p className="font-bold text-sm text-foreground">{foco.disciplina}</p>
                      <p className="text-xs text-muted-foreground">{foco.topico}</p>
                      <p className="text-xs text-error font-medium mt-1">{foco.aproveitamento.toFixed(1)}% acerto ({foco.erros} erros)</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-error border-error-light hover:bg-error hover:text-white" 
                      onClick={() => onOpenTimer && onOpenTimer({ 
                        plano: foco.planoId, 
                        disciplina: foco.disciplinaId, 
                        topico: foco.topicoId 
                      })}
                    >
                      Estudar
                    </Button>
                  </div>
                ))}
                {focosRecomendados.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum foco de revisao critico.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BLOCO 3 — CONSTANCIA */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="font-heading text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-accent" /> Constancia</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-streak animate-flame-pulse" />
              <span className="font-heading font-bold text-xl text-streak">{totais.streak} dias</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              <span className="text-muted-foreground">Recorde: {totais.recordeStreak} dias</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {calendario.map((dia, index) => (
              <div
                key={index}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono cursor-pointer transition-all hover:scale-110",
                  dia.isHoje && "ring-2 ring-primary",
                  dia.estudou ? "bg-success text-white" : "bg-error-light text-error"
                )}
                title={dia.data}
              >
                {new Date(dia.data + 'T12:00:00').getDate()}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-success" /><span>Estudou</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-error-light border border-error" /><span>Nao estudou</span></div>
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 4 — DISCIPLINAS */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-lg">Estatisticas por Disciplina</CardTitle>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button onClick={() => setAbaDisciplina('tempo')} className={cn("px-3 py-1 rounded-md text-sm", abaDisciplina === 'tempo' ? "bg-card shadow-sm" : "hover:bg-card/50")}>Tempo</button>
              <button onClick={() => setAbaDisciplina('questoes')} className={cn("px-3 py-1 rounded-md text-sm", abaDisciplina === 'questoes' ? "bg-card shadow-sm" : "hover:bg-card/50")}>Questoes</button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {estatisticasDisciplinas.map(disc => (
              <div key={disc.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: disc.cor }} />
                <span className="flex-1 font-medium">{disc.nome}</span>
                {abaDisciplina === 'tempo' ? (
                  <span className="font-mono text-primary">{formatarTempoLegivel(disc.tempo)}</span>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-success">✓ {disc.acertos}</span>
                    <span className="text-error">✗ {disc.erros}</span>
                    <span className="font-mono">{disc.percentual.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
