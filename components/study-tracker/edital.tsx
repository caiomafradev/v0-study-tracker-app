'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  ChevronDown, ChevronUp, Check, BookOpen, 
  Plus, Calendar, Wand2, RotateCcw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useStudy } from '@/contexts/StudyContext'
import { formatarTempoLegivel } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface EditalProps {
  planoAtivo?: string
  onOpenTimer?: (preenchimento?: { plano?: string; disciplina?: string; topico?: string }) => void
}

export function Edital({ planoAtivo = 'bb', onOpenTimer }: EditalProps) {
  const { dadosGerais, getDataLocal, atualizarTopico, ciclosEstudo, salvarCicloEstudo } = useStudy()
  
  // Dados do plano ativo (sempre do Context)
  const dados = dadosGerais[planoAtivo] || dadosGerais.bb

  // Estados locais para UI
  const [disciplinasExpandidas, setDisciplinasExpandidas] = useState<string[]>([])
  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false)
  const [textoImportacao, setTextoImportacao] = useState('')
  const [modalNovaDisciplina, setModalNovaDisciplina] = useState(false)
  const [nomeNovaDisciplina, setNomeNovaDisciplina] = useState('')
  const [addTopicoEm, setAddTopicoEm] = useState<string | null>(null)
  const [nomeNovoTopico, setNomeNovoTopico] = useState('')
  
  // Estados para Ciclo de Estudos
  const [modalCicloAberto, setModalCicloAberto] = useState(false)
  const [cicloTemp, setCicloTemp] = useState<Array<{ disciplinaId: string; minutos: number }>>([])

  // Carregar ciclo existente quando abrir modal
  useEffect(() => {
    if (modalCicloAberto) {
      const cicloExistente = ciclosEstudo[planoAtivo]
      if (cicloExistente && cicloExistente.length > 0) {
        setCicloTemp(cicloExistente)
      } else {
        // Inicializa vazio
        setCicloTemp(dados.disciplinas.map(d => ({ disciplinaId: d.id, minutos: 0 })))
      }
    }
  }, [modalCicloAberto, planoAtivo, ciclosEstudo, dados.disciplinas])

  // Reset ao trocar plano
  useEffect(() => {
    setDisciplinasExpandidas([])
  }, [planoAtivo])

  // Calculos de progresso
  const totalTopicos = dados.disciplinas.reduce((acc, d) => acc + (d?.topicos?.length || 0), 0)
  const topicosConcluidos = dados.disciplinas.reduce((acc, d) => acc + (d?.topicos?.filter((t: any) => t.concluido).length || 0), 0)
  const progressoGeral = totalTopicos > 0 ? Math.round((topicosConcluidos / totalTopicos) * 100) : 0

  // Revisoes de hoje usando getDataLocal
  const hoje = getDataLocal()
  const revisoesHoje = useMemo(() => {
    const revisoes: any[] = []
    dados?.sessoes?.forEach((sessao: any) => {
      sessao?.revisoes?.forEach((dataRevisao: string) => {
        if (dataRevisao <= hoje) {
          const disciplina = dados.disciplinas.find(d => d.id === sessao.disciplinaId)
          const topico = disciplina?.topicos?.find((t: any) => t.id === sessao.topicoId)
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

  // Funcoes de UI
  const toggleDisciplina = (id: string) => setDisciplinasExpandidas(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])

  const toggleTopico = (disciplinaId: string, topicoId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const topico = dados.disciplinas
      .find(d => d.id === disciplinaId)
      ?.topicos.find(t => t.id === topicoId)
    
    if (topico) {
      atualizarTopico(planoAtivo, disciplinaId, topicoId, { concluido: !topico.concluido })
    }
  }

  // Ciclo de Estudos
  const gerarCicloAutomatico = () => {
    setCicloTemp(dados.disciplinas.map(d => ({ disciplinaId: d.id, minutos: 45 })))
  }

  const ajustarTempoCiclo = (disciplinaId: string, delta: number) => {
    setCicloTemp(prev => prev.map(item => {
      if (item.disciplinaId === disciplinaId) {
        const novoValor = Math.max(15, item.minutos + delta)
        return { ...item, minutos: novoValor }
      }
      return item
    }))
  }

  const salvarCiclo = () => {
    salvarCicloEstudo(planoAtivo, cicloTemp.filter(c => c.minutos > 0))
    setModalCicloAberto(false)
  }

  const tempoTotalCiclo = cicloTemp.reduce((acc, c) => acc + c.minutos, 0)

  return (
    <div className="space-y-6">
      {/* CABECALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Edital Verticalizado</h1>
          <p className="text-muted-foreground">Progresso do concurso ativo</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          
          {/* BOTAO CICLO DE ESTUDOS */}
          <Dialog open={modalCicloAberto} onOpenChange={setModalCicloAberto}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-accent text-accent hover:bg-accent/10">
                <RotateCcw className="w-4 h-4" /> Ciclo de Estudos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configurar Ciclo de Estudos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* Botao Gerar Automaticamente */}
                <Button onClick={gerarCicloAutomatico} variant="outline" className="w-full gap-2">
                  <Wand2 className="w-4 h-4" /> Gerar Automaticamente (45min cada)
                </Button>

                {/* Lista de Disciplinas */}
                <div className="space-y-3">
                  {dados.disciplinas.map(disc => {
                    const cicloItem = cicloTemp.find(c => c.disciplinaId === disc.id)
                    const minutos = cicloItem?.minutos || 0
                    
                    return (
                      <div key={disc.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: disc.cor }} />
                        <span className="flex-1 font-medium text-sm">{disc.nome}</span>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0"
                            onClick={() => ajustarTempoCiclo(disc.id, -15)}
                            disabled={minutos <= 0}
                          >
                            -
                          </Button>
                          <span className="w-16 text-center font-mono">{minutos}min</span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0"
                            onClick={() => ajustarTempoCiclo(disc.id, 15)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Barra colorida proporcional */}
                {tempoTotalCiclo > 0 && (
                  <div className="space-y-2">
                    <div className="flex h-4 rounded-full overflow-hidden">
                      {cicloTemp.filter(c => c.minutos > 0).map(c => {
                        const disc = dados.disciplinas.find(d => d.id === c.disciplinaId)
                        const percentual = (c.minutos / tempoTotalCiclo) * 100
                        return (
                          <div 
                            key={c.disciplinaId}
                            style={{ width: `${percentual}%`, backgroundColor: disc?.cor || '#ccc' }}
                            title={`${disc?.nome}: ${c.minutos}min`}
                          />
                        )
                      })}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      Tempo total do ciclo: <strong>{formatarTempoLegivel(tempoTotalCiclo * 60)}</strong>
                    </p>
                  </div>
                )}

                <Button onClick={salvarCiclo} className="w-full bg-primary hover:bg-primary/90">
                  Salvar Ciclo
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* MODAL IMPORTACAO (IA) */}
          <Dialog open={modalImportacaoAberto} onOpenChange={setModalImportacaoAberto}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
                <Wand2 className="w-4 h-4" /> Importar Texto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Importacao Inteligente de Edital</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <textarea 
                  value={textoImportacao} 
                  onChange={(e) => setTextoImportacao(e.target.value)}
                  className="w-full h-64 p-3 text-sm rounded-md border border-input bg-background"
                  placeholder="Exemplo: 1. MATERIA: 1.1 Topico..."
                />
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Processar e Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* MODAL NOVA DISCIPLINA */}
          <Dialog open={modalNovaDisciplina} onOpenChange={setModalNovaDisciplina}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4" /> Nova Disciplina
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar Disciplina Manualmente</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome da Disciplina</Label>
                  <Input 
                    placeholder="Ex: Direito Constitucional" 
                    value={nomeNovaDisciplina}
                    onChange={(e) => setNomeNovaDisciplina(e.target.value)}
                  />
                </div>
                <Button className="w-full">Salvar Disciplina</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* PROGRESSO GERAL */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading font-semibold text-lg">Progresso Geral</span>
            <span className="text-2xl font-heading font-bold text-primary">{progressoGeral}%</span>
          </div>
          <Progress value={progressoGeral} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">{topicosConcluidos} de {totalTopicos} topicos</p>
        </CardContent>
      </Card>

      {/* CICLO ATIVO */}
      {ciclosEstudo[planoAtivo] && ciclosEstudo[planoAtivo].length > 0 && (
        <Card className="shadow-sm border-accent/30 bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-accent" /> Ciclo de Estudos Ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-3 rounded-full overflow-hidden mb-2">
              {ciclosEstudo[planoAtivo].map(c => {
                const disc = dados.disciplinas.find(d => d.id === c.disciplinaId)
                const total = ciclosEstudo[planoAtivo].reduce((acc, x) => acc + x.minutos, 0)
                const percentual = (c.minutos / total) * 100
                return (
                  <div 
                    key={c.disciplinaId}
                    style={{ width: `${percentual}%`, backgroundColor: disc?.cor || '#ccc' }}
                    title={`${disc?.nome}: ${c.minutos}min`}
                  />
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {ciclosEstudo[planoAtivo].map(c => {
                const disc = dados.disciplinas.find(d => d.id === c.disciplinaId)
                return (
                  <Badge key={c.disciplinaId} variant="secondary" className="gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: disc?.cor }} />
                    {disc?.nome}: {c.minutos}min
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* REVISOES */}
      {revisoesHoje.length > 0 && (
        <Card className="shadow-sm border-secondary/30 bg-secondary/5">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" /> Revisoes de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {revisoesHoje.map((revisao, index) => (
                <div key={index} className={cn("flex items-center justify-between p-3 rounded-lg", revisao.atrasado ? "bg-error-light" : "bg-card")}>
                  <div>
                    <p className="font-medium">{revisao.topico}</p>
                    <p className="text-sm text-muted-foreground">{revisao.disciplina}</p>
                  </div>
                  <Button size="sm" onClick={() => onOpenTimer?.({ plano: planoAtivo, disciplina: revisao.disciplinaId, topico: revisao.topicoId })} className="bg-secondary text-white">Revisar</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* LISTA DE DISCIPLINAS */}
      <div className="space-y-4">
        {dados.disciplinas.map((disciplina) => {
          const isExpanded = disciplinasExpandidas.includes(disciplina.id)
          const topsConcluidos = disciplina?.topicos?.filter((t: any) => t.concluido).length || 0
          const totalTops = disciplina?.topicos?.length || 0
          const progresso = totalTops > 0 ? (topsConcluidos / totalTops) * 100 : 0
          const tempoTotal = dados?.sessoes?.filter((s: any) => s.disciplinaId === disciplina.id).reduce((acc: number, s: any) => acc + (s.duracaoSegundos || 0), 0) || 0

          return (
            <Card key={disciplina.id} className="shadow-sm overflow-hidden">
              <button onClick={() => toggleDisciplina(disciplina.id)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: disciplina.cor }} />
                  <span className="font-heading font-semibold text-lg">{disciplina.nome}</span>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <span className="text-sm text-muted-foreground hidden sm:inline-block">{topsConcluidos}/{totalTops} topicos</span>
                  <div className="w-32 hidden sm:block"><Progress value={progresso} className="h-2" /></div>
                  <span className="font-mono text-sm">{Math.round(progresso)}%</span>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border">
                  <div className="divide-y divide-border/50">
                    {disciplina?.topicos?.map((topico: any) => {
                      const total = (topico.acertos || 0) + (topico.erros || 0)
                      const aproveitamento = total > 0 ? (((topico.acertos || 0) / total) * 100).toFixed(1) : '—'
                      
                      return (
                        <div key={topico.id} className={cn("px-6 py-3 flex items-center gap-4 transition-colors", topico.concluido && "bg-success-light/50")}>
                          <button onClick={(e) => toggleTopico(disciplina.id, topico.id, e)} className={cn("w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all", topico.concluido ? "bg-success border-success" : "border-muted-foreground hover:border-primary")}>
                            {topico.concluido && <Check className="w-4 h-4 text-white" />}
                          </button>
                          <span className={cn("flex-1 font-body text-sm md:text-base", topico.concluido && "line-through text-muted-foreground")}>{topico.nome}</span>
                          <div className="flex items-center gap-4 text-sm flex-shrink-0">
                            <span className="text-success font-medium hidden sm:inline-block">✓ {topico.acertos || 0}</span>
                            <span className="text-error font-medium hidden sm:inline-block">✗ {topico.erros || 0}</span>
                            <span className="font-mono w-14 text-right">{aproveitamento}%</span>
                          </div>
                        </div>
                      )
                    })}

                    {/* Adicao de Topico Manual */}
                    <div className="px-6 py-3 bg-muted/10 flex items-center gap-2">
                      {addTopicoEm === disciplina.id ? (
                        <div className="flex w-full gap-2 items-center">
                          <Input 
                            autoFocus
                            placeholder="Nome do novo topico..." 
                            className="h-8 flex-1"
                            value={nomeNovoTopico}
                            onChange={(e) => setNomeNovoTopico(e.target.value)}
                          />
                          <Button size="sm">Salvar</Button>
                          <Button size="sm" variant="ghost" onClick={() => setAddTopicoEm(null)}>Cancelar</Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-muted-foreground w-full justify-start gap-2" onClick={() => setAddTopicoEm(disciplina.id)}>
                          <Plus className="w-4 h-4" /> Adicionar Topico Manualmente
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Rodape da Disciplina */}
                  <div className="px-6 py-4 bg-muted/30 flex items-center justify-between">
                    <span className="hidden sm:inline-block text-sm text-muted-foreground">Tempo total: <strong className="text-foreground">{formatarTempoLegivel(tempoTotal)}</strong></span>
                    <Button onClick={() => onOpenTimer?.({ plano: planoAtivo, disciplina: disciplina.id })} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                      <BookOpen className="w-4 h-4" /> Estudar Disciplina
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
