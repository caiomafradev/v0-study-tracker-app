'use client'

import { useState, useMemo } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  Check, 
  ExternalLink, 
  BookOpen,
  Plus,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { MOCK_DATA, formatarTempoLegivel } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface EditalProps {
  planoAtivo?: string
  onOpenTimer?: (preenchimento?: { plano?: string; disciplina?: string; topico?: string }) => void
}

export function Edital({ planoAtivo = 'bb', onOpenTimer }: EditalProps) {
  const [disciplinasExpandidas, setDisciplinasExpandidas] = useState<string[]>([])
  const dados = MOCK_DATA[planoAtivo] || MOCK_DATA.bb

  // Calcular progresso geral
  const totalTopicos = dados.disciplinas.reduce((acc, d) => acc + d.topicos.length, 0)
  const topicosConcluidos = dados.disciplinas.reduce(
    (acc, d) => acc + d.topicos.filter(t => t.concluido).length, 0
  )
  const progressoGeral = totalTopicos > 0 ? Math.round((topicosConcluidos / totalTopicos) * 100) : 0

  // Revisões de hoje
  const hoje = new Date().toISOString().split('T')[0]
  const revisoesHoje = useMemo(() => {
    const revisoes: Array<{ topico: string; disciplina: string; disciplinaId: string; topicoId: string; atrasado: boolean }> = []
    
    dados.sessoes.forEach(sessao => {
      sessao.revisoes.forEach(dataRevisao => {
        if (dataRevisao <= hoje) {
          const disciplina = dados.disciplinas.find(d => d.id === sessao.disciplinaId)
          const topico = disciplina?.topicos.find(t => t.id === sessao.topicoId)
          if (topico && disciplina) {
            revisoes.push({
              topico: topico.nome,
              disciplina: disciplina.nome,
              disciplinaId: disciplina.id,
              topicoId: topico.id,
              atrasado: dataRevisao < hoje
            })
          }
        }
      })
    })
    
    return revisoes
  }, [dados, hoje])

  const toggleDisciplina = (id: string) => {
    setDisciplinasExpandidas(prev => 
      prev.includes(id) 
        ? prev.filter(d => d !== id)
        : [...prev, id]
    )
  }

  const handleEstudarDisciplina = (disciplinaId: string) => {
    onOpenTimer?.({ plano: planoAtivo, disciplina: disciplinaId })
  }

  const handleRevisar = (disciplinaId: string, topicoId: string) => {
    onOpenTimer?.({ plano: planoAtivo, disciplina: disciplinaId, topico: topicoId })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Edital Verticalizado</h1>
          <p className="text-muted-foreground">Acompanhe seu progresso no edital</p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Nova Disciplina
        </Button>
      </div>

      {/* Progresso geral */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading font-semibold text-lg">Progresso Geral</span>
            <span className="text-2xl font-heading font-bold text-primary">{progressoGeral}%</span>
          </div>
          <Progress value={progressoGeral} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {topicosConcluidos} de {totalTopicos} tópicos concluídos
          </p>
        </CardContent>
      </Card>

      {/* Revisões de hoje */}
      {revisoesHoje.length > 0 && (
        <Card className="shadow-sm border-secondary/30 bg-secondary/5">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              Revisões de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {revisoesHoje.map((revisao, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    revisao.atrasado ? "bg-error-light" : "bg-card"
                  )}
                >
                  <div>
                    <p className="font-medium">{revisao.topico}</p>
                    <p className="text-sm text-muted-foreground">{revisao.disciplina}</p>
                    {revisao.atrasado && (
                      <Badge variant="destructive" className="mt-1 text-xs">Atrasado</Badge>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleRevisar(revisao.disciplinaId, revisao.topicoId)}
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    Revisar agora
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de disciplinas */}
      <div className="space-y-4">
        {dados.disciplinas.map((disciplina) => {
          const isExpanded = disciplinasExpandidas.includes(disciplina.id)
          const topicosConcluidos = disciplina.topicos.filter(t => t.concluido).length
          const progresso = (topicosConcluidos / disciplina.topicos.length) * 100
          const tempoTotal = dados.sessoes
            .filter(s => s.disciplinaId === disciplina.id)
            .reduce((acc, s) => acc + s.duracaoSegundos, 0)

          return (
            <Card key={disciplina.id} className="shadow-sm overflow-hidden">
              {/* Cabeçalho da disciplina */}
              <button
                onClick={() => toggleDisciplina(disciplina.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: disciplina.cor }}
                  />
                  <span className="font-heading font-semibold text-lg">{disciplina.nome}</span>
                </div>
                
                <div className="flex items-center gap-6">
                  <span className="text-sm text-muted-foreground">
                    {topicosConcluidos}/{disciplina.topicos.length} tópicos
                  </span>
                  <div className="w-32">
                    <Progress value={progresso} className="h-2" />
                  </div>
                  <span className="font-mono text-sm">{Math.round(progresso)}%</span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Conteúdo expandido */}
              {isExpanded && (
                <div className="border-t border-border">
                  <div className="divide-y divide-border/50">
                    {disciplina.topicos.map((topico) => {
                      const total = topico.acertos + topico.erros
                      const aproveitamento = total > 0 
                        ? ((topico.acertos / total) * 100).toFixed(1)
                        : '—'
                      
                      // Verificar se tem revisão agendada
                      const temRevisao = dados.sessoes.some(
                        s => s.topicoId === topico.id && s.revisoes.some(r => r >= hoje)
                      )

                      return (
                        <div 
                          key={topico.id}
                          className={cn(
                            "px-6 py-3 flex items-center gap-4 transition-colors",
                            topico.concluido && "bg-success-light"
                          )}
                        >
                          {/* Checkbox */}
                          <button
                            className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                              topico.concluido 
                                ? "bg-success border-success" 
                                : "border-muted-foreground hover:border-primary"
                            )}
                          >
                            {topico.concluido && <Check className="w-4 h-4 text-white" />}
                          </button>

                          {/* Nome */}
                          <span className={cn(
                            "flex-1 font-body",
                            topico.concluido && "line-through text-muted-foreground"
                          )}>
                            {topico.nome}
                          </span>

                          {/* Badge de revisão */}
                          {temRevisao && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Calendar className="w-3 h-3" />
                              Revisão
                            </Badge>
                          )}

                          {/* Métricas */}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-success font-medium">✅ {topico.acertos}</span>
                            <span className="text-error font-medium">❌ {topico.erros}</span>
                            <span className="font-mono w-14 text-center">{aproveitamento}%</span>
                            <span className="text-muted-foreground w-24 text-right">
                              {topico.ultimaRevisao || '—'}
                            </span>
                          </div>

                          {/* Link externo */}
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Rodapé da disciplina */}
                  <div className="px-6 py-4 bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Tempo total: <strong className="text-foreground">{formatarTempoLegivel(tempoTotal)}</strong></span>
                      <span>•</span>
                      <span>{topicosConcluidos}/{disciplina.topicos.length} tópicos concluídos</span>
                    </div>
                    <Button 
                      onClick={() => handleEstudarDisciplina(disciplina.id)}
                      className="gap-2 bg-primary hover:bg-primary/90"
                    >
                      <BookOpen className="w-4 h-4" />
                      Estudar esta disciplina
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* FAB flutuante */}
      <button
        onClick={() => onOpenTimer?.()}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        title="Registrar estudo"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}
