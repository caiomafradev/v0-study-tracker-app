'use client'

import { useState, useMemo } from 'react'
import { 
  Clock, 
  BarChart3, 
  FileText, 
  Flame, 
  ChevronRight,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PLANOS, formatarTempoLegivel } from '@/lib/mock-data'
import { useStudy } from '@/contexts/StudyContext'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DashboardProps {
  planoAtivo?: string
  onOpenTimer?: () => void
}

export function Dashboard({ planoAtivo = 'bb', onOpenTimer }: DashboardProps) {
  const { dadosGerais, getDataLocal } = useStudy()
  const [bannerVisivel, setBannerVisivel] = useState(true)
  
  const dados = dadosGerais[planoAtivo] || dadosGerais.bb
  const planoInfo = PLANOS.find(p => p.id === planoAtivo) || PLANOS[0]

  // Calcular metricas
  const tempoTotal = formatarTempoLegivel(dados.stats.tempoTotalSegundos)
  const desempenho = dados.stats.totalQuestoes > 0 
    ? ((dados.stats.totalAcertos / dados.stats.totalQuestoes) * 100).toFixed(1)
    : '0.0'
  
  // Calcular progresso do edital
  const totalTopicos = dados.disciplinas.reduce((acc, d) => acc + d.topicos.length, 0)
  const topicosConcluidos = dados.disciplinas.reduce(
    (acc, d) => acc + d.topicos.filter(t => t.concluido).length, 0
  )
  const progressoEdital = totalTopicos > 0 ? Math.round((topicosConcluidos / totalTopicos) * 100) : 0

  // Verifica se estudou hoje
  const hoje = getDataLocal()
  const estudouHoje = dados.sessoes.some(s => s.data === hoje)

  // Gerar calendario de 30 dias usando getDataLocal
  const calendario = useMemo(() => {
    const dias = []
    const hojeStr = getDataLocal()
    const hojeDate = new Date(hojeStr + 'T12:00:00')
    
    for (let i = 29; i >= 0; i--) {
      const data = new Date(hojeDate)
      data.setDate(data.getDate() - i)
      const dataISO = data.toISOString().split('T')[0]
      const sessoesNoDia = dados.sessoes.filter(s => s.data === dataISO)
      
      dias.push({
        data: dataISO,
        estudou: sessoesNoDia.length > 0,
        tempoSegundos: sessoesNoDia.reduce((acc, s) => acc + s.duracaoSegundos, 0),
        isHoje: i === 0
      })
    }
    return dias
  }, [dados.sessoes, getDataLocal])

  // Dados do grafico semanal baseados nas sessoes reais
  const dadosGrafico = useMemo(() => {
    const hojeStr = getDataLocal()
    const hojeDate = new Date(hojeStr + 'T12:00:00')
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
    const resultado = []
    
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hojeDate)
      data.setDate(data.getDate() - i)
      const dataISO = data.toISOString().split('T')[0]
      const sessoesNoDia = dados.sessoes.filter(s => s.data === dataISO)
      const minutos = Math.round(sessoesNoDia.reduce((acc, s) => acc + s.duracaoSegundos, 0) / 60)
      
      resultado.push({
        dia: diasSemana[data.getDay()],
        minutos
      })
    }
    
    return resultado
  }, [dados.sessoes, getDataLocal])

  // Calcular estatisticas por disciplina
  const estatisticasDisciplinas = useMemo(() => {
    return dados.disciplinas.map(disc => {
      const sessoesDisc = dados.sessoes.filter(s => s.disciplinaId === disc.id)
      const tempo = sessoesDisc.reduce((acc, s) => acc + s.duracaoSegundos, 0)
      const acertos = disc.topicos.reduce((acc, t) => acc + t.acertos, 0)
      const erros = disc.topicos.reduce((acc, t) => acc + t.erros, 0)
      const total = acertos + erros
      const percentual = total > 0 ? ((acertos / total) * 100).toFixed(1) : '—'
      const topicosConcluidos = disc.topicos.filter(t => t.concluido).length
      const progresso = disc.topicos.length > 0 ? (topicosConcluidos / disc.topicos.length) * 100 : 0

      return {
        ...disc,
        tempo: formatarTempoLegivel(tempo),
        acertos,
        erros,
        percentual,
        progresso
      }
    })
  }, [dados])

  return (
    <div className="space-y-6">
      {/* Banner de alerta - so mostra se NAO estudou hoje */}
      {bannerVisivel && !estudouHoje && dados.stats.streak > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-amber-800 font-body">
              Voce ainda nao estudou hoje! Nao perca seu streak de <strong>{dados.stats.streak} dias</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={onOpenTimer}>
              Estudar agora <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setBannerVisivel(false)}
              className="text-amber-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Cards de metricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-foreground">{tempoTotal}</p>
                <p className="text-sm text-muted-foreground">tempo total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-foreground">{desempenho}%</p>
                <p className="text-sm text-muted-foreground">{dados.stats.totalQuestoes.toLocaleString()} questoes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-foreground">{progressoEdital}%</p>
                <div className="w-24 mt-1">
                  <Progress value={progressoEdital} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-error-light flex items-center justify-center">
                <Flame className="w-6 h-6 text-streak animate-flame-pulse" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-streak">{dados.stats.streak} dias</p>
                <p className="text-sm text-muted-foreground">recorde: {dados.stats.recordeStreak}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendario de constancia */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Calendario de Constancia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {calendario.map((dia, index) => (
              <div
                key={index}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono cursor-pointer
                  transition-all duration-200 hover:scale-110
                  ${dia.isHoje ? 'ring-2 ring-primary animate-pulse-border' : ''}
                  ${dia.estudou ? 'bg-success text-white' : 'bg-error-light text-error'}
                `}
                title={`${dia.data}${dia.estudou ? ` - ${formatarTempoLegivel(dia.tempoSegundos)}` : ''}`}
              >
                {new Date(dia.data + 'T12:00:00').getDate()}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-success" />
              <span>Estudou</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-error-light border border-error" />
              <span>Nao estudou</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de disciplinas */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Progresso por Disciplina</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Disciplina</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tempo</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Acertos</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Erros</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">%</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {estatisticasDisciplinas.map((disc) => (
                  <tr key={disc.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: disc.cor }} 
                        />
                        <span className="font-medium">{disc.nome}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">{disc.tempo}</td>
                    <td className="py-3 px-4 text-center text-success font-medium">{disc.acertos}</td>
                    <td className="py-3 px-4 text-center text-error font-medium">{disc.erros}</td>
                    <td className="py-3 px-4 text-center font-medium">{disc.percentual}%</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={disc.progresso} 
                          className="h-2 w-24"
                        />
                        <span className="text-sm text-muted-foreground">{Math.round(disc.progresso)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Metas da semana e grafico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Metas */}
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Meta de tempo</span>
                <span className="text-sm font-medium">{formatarTempoLegivel(dados.stats.tempoTotalSegundos)} / 10h</span>
              </div>
              <Progress value={Math.min((dados.stats.tempoTotalSegundos / 36000) * 100, 100)} className="h-3" />
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Meta de questoes</span>
                <span className="text-sm font-medium">{dados.stats.totalQuestoes} / 50</span>
              </div>
              <Progress value={Math.min((dados.stats.totalQuestoes / 50) * 100, 100)} className="h-3 [&>div]:bg-secondary" />
            </CardContent>
          </Card>
        </div>

        {/* Grafico semanal */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Estudo da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="dia" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value} min`, 'Tempo']}
                />
                <Bar dataKey="minutos" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
