'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  ChevronDown, ChevronUp, Check, ExternalLink, BookOpen, 
  Plus, Calendar, Wand2 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MOCK_DATA, formatarTempoLegivel } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface EditalProps {
  planoAtivo?: string
  onOpenTimer?: (preenchimento?: { plano?: string; disciplina?: string; topico?: string }) => void
}

export function Edital({ planoAtivo = 'bb', onOpenTimer }: EditalProps) {
  // 1. DADOS BASE
  const dados = MOCK_DATA?.[planoAtivo] || MOCK_DATA?.bb || { disciplinas: [], sessoes: [] }

  // 2. ESTADOS
  const [disciplinasLocais, setDisciplinasLocais] = useState<any[]>([])
  const [disciplinasExpandidas, setDisciplinasExpandidas] = useState<string[]>([])
  
  // Estados para importação IA
  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false)
  const [textoImportacao, setTextoImportacao] = useState('')

  // NOVO: Estados para adição manual
  const [modalNovaDisciplina, setModalNovaDisciplina] = useState(false)
  const [nomeNovaDisciplina, setNomeNovaDisciplina] = useState('')
  const [addTopicoEm, setAddTopicoEm] = useState<string | null>(null) // Guarda qual disciplina está recebendo um tópico novo
  const [nomeNovoTopico, setNomeNovoTopico] = useState('')

  // 3. ISOLAMENTO DE CONCURSO (O Segredo do isolamento)
  // Toda vez que o planoAtivo mudar, limpa e recarrega só as matérias dele
  useEffect(() => {
    const dadosDoPlano = MOCK_DATA?.[planoAtivo] || MOCK_DATA?.bb || { disciplinas: [], sessoes: [] }
    setDisciplinasLocais(dadosDoPlano.disciplinas || [])
    setDisciplinasExpandidas([]) // Fecha os menus abertos
  }, [planoAtivo])

  // 4. FUNÇÕES DE CRIAÇÃO MANUAL
  const salvarNovaDisciplina = () => {
    if (!nomeNovaDisciplina.trim()) return;
    const cores = ['#10B981', '#6366F1', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
    
    const novaDisciplina = {
      id: `disc-manual-${Date.now()}`,
      nome: nomeNovaDisciplina.trim(),
      cor: cores[disciplinasLocais.length % cores.length],
      topicos: [] // Nasce vazia
    };

    setDisciplinasLocais(prev => [...prev, novaDisciplina]);
    setNomeNovaDisciplina('');
    setModalNovaDisciplina(false);
  }

  const salvarNovoTopico = (disciplinaId: string) => {
    if (!nomeNovoTopico.trim()) return;
    
    setDisciplinasLocais(prev => prev.map(d => {
      if (d.id === disciplinaId) {
        return {
          ...d,
          topicos: [...d.topicos, {
            id: `top-manual-${Date.now()}`,
            nome: nomeNovoTopico.trim(),
            concluido: false,
            acertos: 0,
            erros: 0,
            ultimaRevisao: null
          }]
        };
      }
      return d;
    }));
    
    setNomeNovoTopico('');
    setAddTopicoEm(null);
  }

  // 5. IMPORTAÇÃO INTELIGENTE (IA)
  const processarTextoEdital = () => {
    if (!textoImportacao.trim()) return

    const novasDisciplinas: any[] = []
    const cores = ['#10B981', '#6366F1', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4']
    const blocosMateria = textoImportacao.split(/(?=\b\d+\.\s+[A-Z])/);

    blocosMateria.forEach(bloco => {
      const txt = bloco.trim();
      if (!txt) return;

      const matchDisc = txt.match(/^\d+\.\s+([^:]+)/);
      if (!matchDisc) return;

      const nomeDisciplina = matchDisc[1].trim();
      const conteudoRestante = txt.substring(matchDisc[0].length + (txt.includes(':') ? 1 : 0));

      const disciplina = {
        id: `disc-import-${Date.now()}-${Math.random()}`,
        nome: nomeDisciplina,
        cor: cores[novasDisciplinas.length % cores.length],
        topicos: [] as any[]
      };

      const blocosTopico = conteudoRestante.split(/(?=\b\d+\.\d+\s+)/);

      blocosTopico.forEach(blocoT => {
        const txtT = blocoT.trim();
        if (!txtT) return;

        const matchNum = txtT.match(/^(\d+\.\d+)\s+(.+)/s);
        if (matchNum) {
          disciplina.topicos.push({
            id: `top-import-${Date.now()}-${Math.random()}`,
            nome: matchNum[2].trim().replace(/\s+/g, ' '),
            concluido: false,
            acertos: 0,
            erros: 0,
            ultimaRevisao: null
          });
        }
      });

      if (disciplina.topicos.length > 0) novasDisciplinas.push(disciplina);
    });

    if (novasDisciplinas.length === 0) {
      alert("Não foi possível processar. Certifique-se de usar o padrão '1. MATÉRIA: 1.1 Tópico...'");
      return;
    }

    setDisciplinasLocais(prev => [...prev, ...novasDisciplinas]);
    setTextoImportacao('');
    setModalImportacaoAberto(false);
  };

  // 6. CÁLCULOS SEGUROS
  const totalTopicos = disciplinasLocais.reduce((acc, d) => acc + (d?.topicos?.length || 0), 0)
  const topicosConcluidos = disciplinasLocais.reduce((acc, d) => acc + (d?.topicos?.filter((t: any) => t.concluido).length || 0), 0)
  const progressoGeral = totalTopicos > 0 ? Math.round((topicosConcluidos / totalTopicos) * 100) : 0

  const hoje = new Date().toISOString().split('T')[0]
  const revisoesHoje = useMemo(() => {
    const revisoes: any[] = []
    dados?.sessoes?.forEach((sessao: any) => {
      sessao?.revisoes?.forEach((dataRevisao: string) => {
        if (dataRevisao <= hoje) {
          const disciplina = disciplinasLocais.find(d => d.id === sessao.disciplinaId)
          const topico = disciplina?.topicos?.find((t: any) => t.id === sessao.topicoId)
          if (topico && disciplina) {
            revisoes.push({ topico: topico.nome, disciplina: disciplina.nome, disciplinaId: disciplina.id, topicoId: topico.id, atrasado: dataRevisao < hoje })
          }
        }
      })
    })
    return revisoes
  }, [dados, hoje, disciplinasLocais])

  // 7. INTERAÇÕES DE UI
  const toggleDisciplina = (id: string) => setDisciplinasExpandidas(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])

  const toggleTopico = (disciplinaId: string, topicoId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDisciplinasLocais(prev => prev.map(disc => {
      if (disc.id === disciplinaId) {
        return { ...disc, topicos: disc.topicos.map((t: any) => t.id === topicoId ? { ...t, concluido: !t.concluido } : t) };
      }
      return disc;
    }));
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Edital Verticalizado</h1>
          <p className="text-muted-foreground">Progresso do concurso ativo</p>
        </div>
        <div className="flex gap-2">
          
          {/* MODAL IMPORTAÇÃO (IA) */}
          <Dialog open={modalImportacaoAberto} onOpenChange={setModalImportacaoAberto}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
                <Wand2 className="w-4 h-4" /> Importar Texto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Importação Inteligente de Edital</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <textarea 
                  value={textoImportacao} onChange={(e) => setTextoImportacao(e.target.value)}
                  className="w-full h-64 p-3 text-sm rounded-md border border-input bg-background"
                  placeholder="Exemplo: 1. MATÉRIA: 1.1 Tópico..."
                />
                <Button onClick={processarTextoEdital} className="w-full bg-primary hover:bg-primary/90 text-white">Processar e Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* MODAL NOVA DISCIPLINA MANUAL */}
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
                    onKeyDown={(e) => e.key === 'Enter' && salvarNovaDisciplina()}
                  />
                </div>
                <Button onClick={salvarNovaDisciplina} className="w-full">Salvar Disciplina</Button>
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
          <p className="text-sm text-muted-foreground mt-2">{topicosConcluidos} de {totalTopicos} tópicos</p>
        </CardContent>
      </Card>

      {/* REVISÕES */}
      {revisoesHoje.length > 0 && (
        <Card className="shadow-sm border-secondary/30 bg-secondary/5">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" /> Revisões de Hoje
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
        {disciplinasLocais.map((disciplina) => {
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
                  <span className="text-sm text-muted-foreground hidden sm:inline-block">{topsConcluidos}/{totalTops} tópicos</span>
                  <div className="w-32 hidden sm:block"><Progress value={progresso} className="h-2" /></div>
                  <span className="font-mono text-sm">{Math.round(progresso)}%</span>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border">
                  <div className="divide-y divide-border/50">
                    
                    {/* Tópicos */}
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
                            <span className="text-success font-medium hidden sm:inline-block">✅ {topico.acertos || 0}</span>
                            <span className="text-error font-medium hidden sm:inline-block">❌ {topico.erros || 0}</span>
                            <span className="font-mono w-14 text-right">{aproveitamento}%</span>
                          </div>
                        </div>
                      )
                    })}

                    {/* NOVO: Adição de Tópico Manual In-line */}
                    <div className="px-6 py-3 bg-muted/10 flex items-center gap-2">
                      {addTopicoEm === disciplina.id ? (
                        <div className="flex w-full gap-2 items-center">
                          <Input 
                            autoFocus
                            placeholder="Nome do novo tópico..." 
                            className="h-8 flex-1"
                            value={nomeNovoTopico}
                            onChange={(e) => setNomeNovoTopico(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && salvarNovoTopico(disciplina.id)}
                          />
                          <Button size="sm" onClick={() => salvarNovoTopico(disciplina.id)}>Salvar</Button>
                          <Button size="sm" variant="ghost" onClick={() => setAddTopicoEm(null)}>Cancelar</Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-muted-foreground w-full justify-start gap-2" onClick={() => setAddTopicoEm(disciplina.id)}>
                          <Plus className="w-4 h-4" /> Adicionar Tópico Manualmente
                        </Button>
                      )}
                    </div>

                  </div>

                  {/* Rodapé da Disciplina */}
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