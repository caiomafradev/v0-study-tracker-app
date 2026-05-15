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
  // CONTEXT GLOBAL
  const { dadosGerais, getDataLocal } = useStudy()
  
  const [filtroPlano, setFiltroPlano] = useState<'ativo' | 'todos'>('ativo')
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('semana')
  const [abaDisciplina, setAbaDisciplina] = useState<'tempo' | 'questoes'>('tempo')
  
  // 1. NOVOS ESTADOS: Datas para o filtro personalizado
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  // Obter dados do plano selecionado (usando Context)
  const dadosPlanos = filtroPlano === 'ativo' 
    ? { [planoAtivo]: dadosGerais[planoAtivo] }
    : dadosGerais

  // 2. LÓGICA DE FOCOS DE ESTUDO (Piores Resultados)
  const focosRecomendados = useMemo(() => {
    let todosTopicos: any[] = [];

    Object.values(dadosPlanos).forEach(plano => {
      plano.disciplinas.forEach(disc => {
        disc.topicos.forEach(topico => {
          const totalQuestoes = topico.acertos + topico.erros;
          if (totalQuestoes > 0) { // Só avalia se já resolveu questões
            const aproveitamento = (topico.acertos / totalQuestoes) * 100;
            todosTopicos.push({
              planoId: plano.id, // Para o Modal saber qual plano abrir
              disciplina: disc.nome,
              topico: topico.nome,
              aproveitamento,
              erros: topico.erros
            });
          }
        });
      });
    });

    // Ordena do menor aproveitamento para o maior e pega os 3 piores
    return todosTopicos
      .sort((a, b) => a.aproveitamento - b.aproveitamento)
      .slice(0, 3);
  }, [dadosPlanos, dadosGerais]);

  // Cálculos de Totais (Mantidos do seu código original)
  const totais = useMemo(() => {
    let tempoEstudo = 0; let tempoPausa = 0; let acertos = 0; let erros = 0
    let diasEstudados = 0; let streak = 0; let recordeStreak = 0

    Object.values(dadosPlanos).forEach(dados => {
      tempoEstudo += dados.stats.tempoTotalSegundos
      acertos += dados.stats.totalAcertos
      erros += dados.stats.totalErros
      diasEstudados += dados.stats.diasEstudados
      streak = Math.max(streak, dados.stats.streak)
      recordeStreak = Math.max(recordeStreak, dados.stats.recordeStreak)
      
      dados.sessoes.forEach(s => { tempoPausa += s.pausaSegundos })
    })

    const totalQuestoes = acertos + erros
    const aproveitamento = totalQuestoes > 0 ? ((acertos / totalQuestoes) * 100).toFixed(1) : '0.0'
    const mediaPorDia = diasEstudados > 0 ? Math.round(tempoEstudo / diasEstudados) : 0

    return { tempoEstudo, tempoPausa, acertos, erros, totalQuestoes, aproveitamento, diasEstudados, mediaPorDia, streak, recordeStreak }
  }, [dadosPlanos, dadosGerais])

  // Dados Mockados para os Gráficos
  const dadosPizza = [
    { name: 'Acertos', value: totais.acertos, color: '#22C55E' },
    { name: 'Erros', value: totais.erros, color: '#EF4444' },
  ]
  const dadosSemana = [
    { dia: 'Seg', estudo: 95, pausa: 12 }, { dia: 'Ter', estudo: 72, pausa: 8 },
    { dia: 'Qua', estudo: 110, pausa: 15 }, { dia: 'Qui', estudo: 85, pausa: 10 },
    { dia: 'Sex', simple: 65, pausa: 5 }, { dia: 'Sáb', estudo: 120, pausa: 18 }, { dia: 'Dom', estudo: 45, pausa: 4 },
  ]
  const dadosLinha = [
    { data: '05/mai', acertos: 12, erros: 4 }, { data: '06/mai', acertos: 8, erros: 2 },
    { data: '07/mai', acertos: 15, erros: 5 }, { data: '08/mai', acertos: 18, erros: 6 }, { data: '09/mai', acertos: 20, erros: 4 },
  ]

  const estatisticasDisciplinas = useMemo(() => {
    const stats: any[] = []
    Object.values(dadosPlanos).forEach(dados => {
      dados.disciplinas.forEach(disc => {
        const sessoesDisc = dados.sessoes.filter(s => s.disciplinaId === disc.id)
        const tempo = sessoesDisc.reduce((acc, s) => acc + s.duracaoSegundos, 0)
        const acertos = disc.topicos.reduce((acc, t) => acc + t.acertos, 0)
        const erros = disc.topicos.reduce((acc, t) => acc + t.erros, 0)
        const percentual = (acertos + erros) > 0 ? (acertos / (acertos + erros)) * 100 : 0
        stats.push({ id: disc.id, nome: disc.nome, cor: disc.cor, tempo, acertos, erros, percentual })
      })
    })
    return stats.sort((a, b) => abaDisciplina === 'tempo' ? b.tempo - a.tempo : b.acertos + b.erros - a.acertos - a.erros)
  }, [dadosPlanos, abaDisciplina, dadosGerais])

  const calendario = useMemo(() => {
    const dias = []; 
    const hoje = getDataLocal()
    const hojeDate = new Date(hoje + 'T12:00:00') // Evita problemas de fuso
    
    for (let i = 29; i >= 0; i--) {
      const data = new Date(hojeDate); 
      data.setDate(data.getDate() - i)
      const dataStr = data.toISOString().split('T')[0]
      
      // Verifica se há sessões neste dia em algum plano
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Estatísticas</h1>
        <p className="text-muted-foreground">Acompanhe seu desempenho e evolução</p>
      </div>

      {/* ÁREA DE FILTROS */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button onClick={() => setFiltroPlano('ativo')} className={cn("px-3 py-1.5 rounded-md text-sm", filtroPlano === 'ativo' ? "bg-card shadow-sm" : "hover:bg-card/50")}>Plano Ativo</button>
          <button onClick={() => setFiltroPlano('todos')} className={cn("px-3 py-1.5 rounded-md text-sm", filtroPlano === 'todos' ? "bg-card shadow-sm" : "hover:bg-card/50")}>Todos os Planos</button>
        </div>

        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['hoje', 'semana', 'mes', 'total'] as FiltroPeriodo[]).map(periodo => (
            <button key={periodo} onClick={() => setFiltroPeriodo(periodo)} className={cn("px-3 py-1.5 rounded-md text-sm capitalize", filtroPeriodo === periodo ? "bg-primary text-primary-foreground" : "hover:bg-card/50")}>
              {periodo}
            </button>
          ))}
        </div>

        {/* 3. UI DO FILTRO DE DATA PERSONALIZADO */}
        {/* 3. UI DO FILTRO DE DATA PERSONALIZADO COM BOTÃO */}
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg border border-transparent focus-within:border-primary/50 transition-colors">
          <input 
            type="date" 
            className="text-sm bg-transparent border-none p-1.5 outline-none cursor-pointer"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
          <span className="text-muted-foreground text-sm font-medium">até</span>
          <input 
            type="date" 
            className="text-sm bg-transparent border-none p-1.5 outline-none cursor-pointer"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
          <Button 
            size="sm" 
            variant={filtroPeriodo === 'personalizado' ? "default" : "secondary"}
            className="h-8 px-3 text-xs"
            onClick={() => {
              if (!dataInicio || !dataFim) {
                alert("Por favor, selecione a data de início e de fim.");
                return;
              }
              // Só ativa o filtro quando o botão é clicado
              setFiltroPeriodo('personalizado');
              
              // ⚠️ DICA PARA O V0: Aqui é onde a função de filtrar os dados 
              // do MOCK_DATA com base nessas datas será chamada no futuro
              console.log(`Filtrando dados entre ${dataInicio} e ${dataFim}`);
            }}
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
            <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold">{formatarTempoLegivel(totais.mediaPorDia)}</p><p className="text-sm text-muted-foreground">Média por dia</p></div>
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

      {/* BLOCO 2 — QUESTÕES E FOCOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="shadow-sm h-full">
            <CardHeader><CardTitle className="font-heading text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-secondary" /> Desempenho em Questões</CardTitle></CardHeader>
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
            <CardHeader><CardTitle className="font-heading text-lg">Evolução de Acertos/Erros</CardTitle></CardHeader>
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

          {/* 4. UI DOS FOCOS DE ESTUDO */}
          <Card className="border-error-light bg-error/5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2 text-error">
                <Target className="w-5 h-5" /> Focos Recomendados
              </CardTitle>
              <p className="text-xs text-muted-foreground">Revisão urgente baseada nos piores desempenhos</p>
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
                    <Button size="sm" variant="outline" className="text-error border-error-light hover:bg-error hover:text-white" onClick={() => onOpenTimer && onOpenTimer({ plano: foco.planoId, disciplina: foco.disciplina, topico: foco.topico })}>
                      Estudar
                    </Button>
                  </div>
                ))}
                {focosRecomendados.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum foco de revisão crítico.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BLOCO 3 — CONSTÂNCIA */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="font-heading text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-accent" /> Constância</CardTitle></CardHeader>
        <CardContent>
          {/* ... Código de Constância (calendário) inalterado ... */}
        </CardContent>
      </Card>
    </div>
  )
}
