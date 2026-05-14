'use client'

import { useState, useMemo } from 'react'
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
import { MOCK_DATA, formatarTempoLegivel } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface EditalProps {
  planoAtivo?: string
  onOpenTimer?: (preenchimento?: { plano?: string; disciplina?: string; topico?: string }) => void
}

export function Edital({ planoAtivo = 'bb', onOpenTimer }: EditalProps) {
  // 1. DADOS BASE SEGUROS
  const dados = MOCK_DATA?.[planoAtivo] || MOCK_DATA?.bb || { disciplinas: [], sessoes: [] }

  // 2. ESTADOS
  const [disciplinasLocais, setDisciplinasLocais] = useState<any[]>(dados.disciplinas || [])
  const [disciplinasExpandidas, setDisciplinasExpandidas] = useState<string[]>([])
  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false)
  const [textoImportacao, setTextoImportacao] = useState('')

  // 3. O MOTOR DE IMPORTAÇÃO (Reforçado e à prova de falhas)
  const processarTextoEdital = () => {
    if (!textoImportacao.trim()) return

    const novasDisciplinas: any[] = []
    const cores = ['#10B981', '#6366F1', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4']

    // Passo A: Separar o texto pelas disciplinas (ex: "1. NOME DA MATERIA")
    // Usa uma regex que corta imediatamente antes de um dígito seguido de ponto e espaço.
    const blocosMateria = textoImportacao.split(/(?=\b\d+\.\s+[A-Z])/);

    blocosMateria.forEach(bloco => {
      const txt = bloco.trim();
      if (!txt) return;

      // Pega o nome da disciplina (Até ao primeiro dois pontos)
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

      // Passo B: Separar os tópicos dentro desta disciplina (ex: "1.1 Nome do topico")
      const blocosTopico = conteudoRestante.split(/(?=\b\d+\.\d+\s+)/);

      blocosTopico.forEach(blocoT => {
        const txtT = blocoT.trim();
        if (!txtT) return;

        // Extrai o número do tópico e guarda todo o texto seguinte como sendo o nome
        const matchNum = txtT.match(/^(\d+\.\d+)\s+(.+)/s);
        if (matchNum) {
          const nomeTopico = matchNum[2].trim().replace(/\s+/g, ' '); // Limpa espaços extra
          
          disciplina.topicos.push({
            id: `top-import-${Date.now()}-${Math.random()}`,
            nome: nomeTopico,
            concluido: false,
            acertos: 0,
            erros: 0,
            ultimaRevisao: null
          });
        }
      });

      if (disciplina.topicos.length > 0) {
        novasDisciplinas.push(disciplina);
      }
    });

    if (novasDisciplinas.length === 0) {
      alert("Não foi possível processar. Certifique-se de usar o padrão '1. MATÉRIA: 1.1 Tópico...'");
      return;
    }

    setDisciplinasLocais(prev => [...prev, ...novasDisciplinas]);
    setTextoImportacao('');
    setModalImportacaoAberto(false);
  };

  // 4. CÁLCULOS SEGUROS
  const totalTopicos = disciplinasLocais.reduce((acc, d) => acc + (d?.topicos?.length || 0), 0)
  const topicosConcluidos = disciplinasLocais.reduce(
    (acc, d) => acc + (d?.topicos?.filter((t: any) => t.concluido).length || 0), 0
  )
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
  }, [dados, hoje, disciplinasLocais])

  // 5. INTERAÇÕES
  const toggleDisciplina = (id: string) => {
    setDisciplinasExpandidas(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])
  }

  const toggleTopico = (disciplinaId: string, topicoId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Impede comportamentos estranhos
    e.stopPropagation(); // Impede de abrir/fechar a disciplina ao clicar no checkbox
    
    setDisciplinasLocais(prev => prev.map(disc => {
      if (disc.id === disciplinaId) {
        return {
          ...disc,
          topicos: disc.topicos.map((t: any) => 
            t.id === topicoId ? { ...t, concluido: !t.concluido } : t
          )
        };
      }
      return disc;
    }));
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Edital Verticalizado</h1>
          <p className="text-muted-foreground">Acompanhe o seu progresso no edital</p>
        </div>
        <div className="flex gap-2">
          
          <Dialog open={modalImportacaoAberto} onOpenChange={setModalImportacaoAberto}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
                <Wand2 className="w-4 h-4" /> Importar Texto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-primary"/> Importação Inteligente de Edital
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Cole o texto do edital gerado pela IA ou copiado do PDF:</Label>
                  <p className="text-xs text-muted-foreground">
                    Padrão suportado:<br/> 
                    <strong>1. NOME DA MATÉRIA:</strong> 1.1 Nome do Tópico: detalhes...
                  </p>
                  <textarea 
                    value={textoImportacao}
                    onChange={(e) => setTextoImportacao(e.target.value)}
                    className="w-full h-64 p-3 text-sm rounded-md border border-input bg-background outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Exemplo:&#10;1. DADOS & ANALYTICS: 1.1 Banco de Dados: Conceitos... 1.2 Modelagem de Dados: Conceitual..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setModalImportacaoAberto(false)}>Cancelar</Button>
                  <Button onClick={processarTextoEdital} className="bg-primary hover:bg-primary/90 text-primary-foreground">Processar e Adicionar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4" /> Nova Disciplina
          </Button>
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
          <p className="text-sm text-muted-foreground mt-2">
            {topicosConcluidos} de {totalTopicos} tópicos concluídos
          </p>
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
                    {revisao.atrasado && <Badge variant="destructive" className="mt-1 text-xs">Atrasado</Badge>}
                  </div>
                  <Button size="sm" onClick={() => onOpenTimer?.({ plano: planoAtivo, disciplina: revisao.disciplinaId, topico: revisao.topicoId })} className="bg-secondary hover:bg-secondary/90 text-white">Revisar agora</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* LISTA DE DISCIPLINAS E TÓPICOS */}
      <div className="space-y-4">
        {disciplinasLocais.map((disciplina) => {
          const isExpanded = disciplinasExpandidas.includes(disciplina.id)
          const topsConcluidos = disciplina?.topicos?.filter((t: any) => t.concluido).length || 0
          const totalTops = disciplina?.topicos?.length || 0
          const progresso = totalTops > 0 ? (topsConcluidos / totalTops) * 100 : 0
          
          const tempoTotal = dados?.sessoes
            ?.filter((s: any) => s.disciplinaId === disciplina.id)
            .reduce((acc: number, s: any) => acc + (s.duracaoSegundos || 0), 0) || 0

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
                    {disciplina?.topicos?.map((topico: any) => {
                      const total = (topico.acertos || 0) + (topico.erros || 0)
                      const aproveitamento = total > 0 ? (((topico.acertos || 0) / total) * 100).toFixed(1) : '—'
                      const temRevisao = dados?.sessoes?.some((s: any) => s.topicoId === topico.id && s.revisoes?.some((r: string) => r >= hoje))

                      return (
                        <div key={topico.id} className={cn("px-6 py-3 flex items-center gap-4 transition-colors", topico.concluido && "bg-success-light/50")}>
                          {/* CHECKBOX (Corrigido com event.stopPropagation) */}
                          <button onClick={(e) => toggleTopico(disciplina.id, topico.id, e)} className={cn("w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all", topico.concluido ? "bg-success border-success" : "border-muted-foreground hover:border-primary")}>
                            {topico.concluido && <Check className="w-4 h-4 text-white" />}
                          </button>
                          
                          <span className={cn("flex-1 font-body text-sm md:text-base", topico.concluido && "line-through text-muted-foreground")}>
                            {topico.nome}
                          </span>

                          {temRevisao && <Badge variant="secondary" className="text-xs gap-1 hidden md:flex"><Calendar className="w-3 h-3" /> Revisão</Badge>}

                          <div className="flex items-center gap-4 text-sm flex-shrink-0">
                            <span className="text-success font-medium hidden sm:inline-block">✅ {topico.acertos || 0}</span>
                            <span className="text-error font-medium hidden sm:inline-block">❌ {topico.erros || 0}</span>
                            <span className="font-mono w-14 text-right">{aproveitamento}%</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-4 h-4 text-muted-foreground" /></Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="px-6 py-4 bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="hidden sm:inline-block">Tempo total: <strong className="text-foreground">{formatarTempoLegivel(tempoTotal)}</strong></span>
                    </div>
                    <Button onClick={() => onOpenTimer?.({ plano: planoAtivo, disciplina: disciplina.id })} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                      <BookOpen className="w-4 h-4" /> Estudar
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