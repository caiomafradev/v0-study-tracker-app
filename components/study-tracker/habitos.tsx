'use client'

import { useState, useEffect, useMemo } from 'react'
import { Flame, Trophy, Plus, Check, Edit2, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStudy } from '@/contexts/StudyContext'
import { cn } from '@/lib/utils'

// Tipos
interface Habito {
  id: string
  nome: string
  icone: string
  pontos: number
  tipo: 'permanente' | 'somente-hoje'
  dataCriacao: string
}

interface Meta {
  id: string
  nome: string
  meta: number
  recompensa: string
  concluida: boolean
}

interface HabitoHistorico {
  [data: string]: string[] // data -> array de habito ids feitos nesse dia
}

// Habitos padrao
const HABITOS_PADRAO: Habito[] = [
  { id: 'hab1', nome: 'Acordar cedo', icone: '🌅', pontos: 100, tipo: 'permanente', dataCriacao: '2026-01-01' },
  { id: 'hab2', nome: 'Estudar 2h+', icone: '📚', pontos: 200, tipo: 'permanente', dataCriacao: '2026-01-01' },
  { id: 'hab3', nome: 'Revisar flashcards', icone: '🃏', pontos: 150, tipo: 'permanente', dataCriacao: '2026-01-01' },
  { id: 'hab4', nome: 'Fazer exercicios', icone: '💪', pontos: 100, tipo: 'permanente', dataCriacao: '2026-01-01' },
  { id: 'hab5', nome: 'Dormir ate 23h', icone: '😴', pontos: 100, tipo: 'permanente', dataCriacao: '2026-01-01' },
]

export function Habitos() {
  const { getDataLocal } = useStudy()
  const dataHoje = getDataLocal()

  // Estados
  const [habitos, setHabitos] = useState<Habito[]>(HABITOS_PADRAO)
  const [historico, setHistorico] = useState<HabitoHistorico>({})
  const [metas, setMetas] = useState<Meta[]>([
    { id: 'meta1', nome: 'Primeira Semana', meta: 1000, recompensa: 'Assistir 1 episodio de serie', concluida: false },
    { id: 'meta2', nome: 'Maratonista', meta: 5000, recompensa: 'Dia de folga', concluida: false },
  ])
  
  const [streakDias, setStreakDias] = useState(12)
  const [editandoStreak, setEditandoStreak] = useState(false)
  const [conquistaVisivel, setConquistaVisivel] = useState(false)
  const [conquistaAtual, setConquistaAtual] = useState<Meta | null>(null)
  
  // Modais
  const [modalNovoHabito, setModalNovoHabito] = useState(false)
  const [modalNovaMeta, setModalNovaMeta] = useState(false)
  const [modalEditarMeta, setModalEditarMeta] = useState<Meta | null>(null)
  
  // Formularios
  const [novoHabito, setNovoHabito] = useState({ nome: '', icone: '✨', pontos: 100, tipo: 'permanente' as const })
  const [novaMeta, setNovaMeta] = useState({ nome: '', meta: '', recompensa: '' })

  // Filtra habitos visiveis hoje (permanentes + somente-hoje criados hoje)
  const habitosHoje = useMemo(() => {
    return habitos.filter(h => 
      h.tipo === 'permanente' || 
      (h.tipo === 'somente-hoje' && h.dataCriacao === dataHoje)
    )
  }, [habitos, dataHoje])

  // Calcula pontos de hoje
  const habitosFeitosHoje = historico[dataHoje] || []
  const pontosHoje = habitosHoje
    .filter(h => habitosFeitosHoje.includes(h.id))
    .reduce((acc, h) => acc + h.pontos, 0)

  // Pontuacao global (soma todos os dias do historico)
  const pontosGlobais = useMemo(() => {
    let total = 0
    Object.entries(historico).forEach(([data, ids]) => {
      ids.forEach(id => {
        const habito = habitos.find(h => h.id === id)
        if (habito) total += habito.pontos
      })
    })
    return total
  }, [historico, habitos])

  // Progresso de habitos hoje
  const totalHabitosHoje = habitosHoje.length
  const habitosConcluidosHoje = habitosFeitosHoje.length
  const progressoHoje = totalHabitosHoje > 0 ? Math.round((habitosConcluidosHoje / totalHabitosHoje) * 100) : 0

  // Verifica se meta foi concluida
  useEffect(() => {
    metas.forEach(meta => {
      if (!meta.concluida && pontosGlobais >= meta.meta) {
        setMetas(prev => prev.map(m => m.id === meta.id ? { ...m, concluida: true } : m))
        setConquistaAtual(meta)
        setConquistaVisivel(true)
      }
    })
  }, [pontosGlobais, metas])

  // Marcar/desmarcar habito
  const toggleHabito = (id: string) => {
    setHistorico(prev => {
      const feitosHoje = prev[dataHoje] || []
      if (feitosHoje.includes(id)) {
        // Desmarca
        return { ...prev, [dataHoje]: feitosHoje.filter(hid => hid !== id) }
      } else {
        // Marca
        return { ...prev, [dataHoje]: [...feitosHoje, id] }
      }
    })
  }

  // Criar novo habito
  const criarHabito = () => {
    if (!novoHabito.nome.trim()) return
    
    const novo: Habito = {
      id: `hab-${Date.now()}`,
      nome: novoHabito.nome.trim(),
      icone: novoHabito.icone || '✨',
      pontos: novoHabito.pontos || 100,
      tipo: novoHabito.tipo,
      dataCriacao: dataHoje
    }
    
    setHabitos(prev => [...prev, novo])
    setNovoHabito({ nome: '', icone: '✨', pontos: 100, tipo: 'permanente' })
    setModalNovoHabito(false)
  }

  // Criar nova meta
  const criarMeta = () => {
    if (!novaMeta.nome.trim() || !novaMeta.meta || !novaMeta.recompensa.trim()) return
    
    const nova: Meta = {
      id: `meta-${Date.now()}`,
      nome: novaMeta.nome.trim(),
      meta: Number(novaMeta.meta),
      recompensa: novaMeta.recompensa.trim(),
      concluida: false
    }
    
    setMetas(prev => [...prev, nova])
    setNovaMeta({ nome: '', meta: '', recompensa: '' })
    setModalNovaMeta(false)
  }

  // Editar meta existente
  const salvarEdicaoMeta = () => {
    if (!modalEditarMeta) return
    
    setMetas(prev => prev.map(m => m.id === modalEditarMeta.id ? modalEditarMeta : m))
    setModalEditarMeta(null)
  }

  return (
    <div className="space-y-6">
      {/* CABECALHO */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Monitor de Habitos</h1>
        <p className="text-muted-foreground">Acompanhe seus habitos diarios e conquiste recompensas</p>
      </div>

      {/* CARTAO DE PONTUACAO GERAL */}
      <Card className="shadow-sm bg-gradient-to-r from-success-light to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-heading font-extrabold text-primary">{pontosHoje.toLocaleString()} pts</p>
              <p className="text-muted-foreground">Ganhos Hoje</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-heading font-bold">{pontosGlobais.toLocaleString()} pts</p>
              <p className="text-muted-foreground">Pontuacao Global</p>
            </div>
          </div>
          
          {/* PROGRESSO DE HABITOS HOJE */}
          <div className="mt-4 p-3 bg-background rounded-lg">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground">Habitos de hoje</span>
              <span className="font-medium">{habitosConcluidosHoje} de {totalHabitosHoje} concluidos — {progressoHoje}%</span>
            </div>
            <Progress value={progressoHoje} className="h-3 [&>div]:bg-primary" />
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-streak">
            <Flame className="w-5 h-5 animate-flame-pulse" />
            {editandoStreak ? (
              <Input 
                type="number" 
                value={streakDias} 
                onChange={e => setStreakDias(Number(e.target.value))}
                onBlur={() => setEditandoStreak(false)}
                autoFocus
                className="w-20 h-7"
              />
            ) : (
              <span className="font-medium flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => setEditandoStreak(true)}>
                {streakDias} dias consecutivos de habitos! <Edit2 className="w-3 h-3 text-muted-foreground" />
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* LISTA DE HABITOS DE HOJE */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg">Habitos de Hoje</h2>
          <Dialog open={modalNovoHabito} onOpenChange={setModalNovoHabito}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Novo Habito
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Novo Habito</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome do habito</Label>
                  <Input 
                    value={novoHabito.nome} 
                    onChange={e => setNovoHabito({...novoHabito, nome: e.target.value})} 
                    placeholder="Ex: Meditar 10 minutos"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icone</Label>
                    <Input 
                      value={novoHabito.icone} 
                      onChange={e => setNovoHabito({...novoHabito, icone: e.target.value})}
                      placeholder="Ex: 🧘"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pontos</Label>
                    <Input 
                      type="number"
                      value={novoHabito.pontos} 
                      onChange={e => setNovoHabito({...novoHabito, pontos: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      variant={novoHabito.tipo === 'permanente' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setNovoHabito({...novoHabito, tipo: 'permanente'})}
                    >
                      Permanente
                    </Button>
                    <Button 
                      type="button"
                      variant={novoHabito.tipo === 'somente-hoje' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setNovoHabito({...novoHabito, tipo: 'somente-hoje'})}
                    >
                      Somente Hoje
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {novoHabito.tipo === 'permanente' 
                      ? 'Aparece todos os dias' 
                      : 'Aparece apenas hoje e some amanha'}
                  </p>
                </div>
                <Button className="w-full" onClick={criarHabito}>Criar Habito</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {habitosHoje.map(habito => {
            const marcadoHoje = habitosFeitosHoje.includes(habito.id)

            return (
              <Card 
                key={habito.id} 
                className={cn("shadow-sm cursor-pointer transition-all hover:shadow-md relative overflow-hidden", marcadoHoje && "bg-success-light")} 
                onClick={() => toggleHabito(habito.id)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habito.icone}</span>
                    <div>
                      <p className={cn("font-medium", marcadoHoje && "line-through text-muted-foreground")}>{habito.nome}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-accent font-medium">+{habito.pontos} pts</p>
                        {habito.tipo === 'somente-hoje' && (
                          <Badge variant="secondary" className="text-xs">Hoje</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all", marcadoHoje ? "bg-success border-success" : "border-muted-foreground hover:border-primary")}>
                    {marcadoHoje && <Check className="w-5 h-5 text-white" />}
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* METAS GLOBAIS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg">Metas Globais</h2>
          <Dialog open={modalNovaMeta} onOpenChange={setModalNovaMeta}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2"><Plus className="w-4 h-4" /> Criar Meta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Nova Meta</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome da meta *</Label>
                  <Input value={novaMeta.nome} onChange={e => setNovaMeta({...novaMeta, nome: e.target.value})} placeholder="Ex: Primeira Semana" />
                </div>
                <div className="space-y-2">
                  <Label>Valor da meta (pontos) *</Label>
                  <Input type="number" value={novaMeta.meta} onChange={e => setNovaMeta({...novaMeta, meta: e.target.value})} placeholder="Ex: 1000" />
                </div>
                <div className="space-y-2">
                  <Label>Recompensa *</Label>
                  <Input value={novaMeta.recompensa} onChange={e => setNovaMeta({...novaMeta, recompensa: e.target.value})} placeholder="Ex: Assistir um filme" />
                </div>
                <Button className="w-full" onClick={criarMeta}>Criar Meta</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metas.map(meta => {
            const progresso = Math.min((pontosGlobais / meta.meta) * 100, 100)

            return (
              <Card key={meta.id} className={cn("shadow-sm", meta.concluida && "border-success bg-success-light")}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold">{meta.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {meta.concluida 
                          ? <span className="text-success flex items-center gap-1"><Check className="w-4 h-4" /> Concluida!</span> 
                          : `Faltam ${(meta.meta - pontosGlobais).toLocaleString()} pts`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!meta.concluida && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); setModalEditarMeta(meta); }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                      {meta.concluida ? <Trophy className="w-6 h-6 text-accent" /> : <span className="text-2xl">🔒</span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{pontosGlobais.toLocaleString()} / {meta.meta.toLocaleString()} pts</span>
                      <span className="font-medium">{Math.round(progresso)}%</span>
                    </div>
                    <Progress value={progresso} className={cn("h-2", meta.concluida && "[&>div]:bg-success")} />
                  </div>
                  <p className="mt-3 text-sm">
                    <span className="text-muted-foreground">Recompensa: </span>
                    <span className="font-medium">{meta.recompensa}</span>
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* MODAL EDITAR META */}
      <Dialog open={!!modalEditarMeta} onOpenChange={() => setModalEditarMeta(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Meta</DialogTitle></DialogHeader>
          {modalEditarMeta && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome da meta</Label>
                <Input 
                  value={modalEditarMeta.nome} 
                  onChange={e => setModalEditarMeta({...modalEditarMeta, nome: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Valor da meta (pontos)</Label>
                <Input 
                  type="number" 
                  value={modalEditarMeta.meta} 
                  onChange={e => setModalEditarMeta({...modalEditarMeta, meta: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Recompensa</Label>
                <Input 
                  value={modalEditarMeta.recompensa} 
                  onChange={e => setModalEditarMeta({...modalEditarMeta, recompensa: e.target.value})} 
                />
              </div>
              <Button className="w-full" onClick={salvarEdicaoMeta}>Salvar Alteracoes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* JANELA DE CONQUISTA (OVERLAY) */}
      {conquistaVisivel && conquistaAtual && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setConquistaVisivel(false)}>
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 2}s`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0'
              }}
            />
          ))}

          <Card className="max-w-md w-full text-center" onClick={e => e.stopPropagation()}>
            <CardContent className="pt-8 pb-6">
              <div className="text-8xl mb-4 animate-trophy-bounce">🏆</div>
              <h2 className="text-2xl font-heading font-bold mb-2">Meta Concluida!</h2>
              <p className="text-muted-foreground mb-4">{conquistaAtual.nome}</p>
              
              <div className="bg-accent/10 rounded-lg p-4 mb-6">
                <p className="text-muted-foreground text-sm">Voce ganhou:</p>
                <p className="text-xl font-bold text-accent">{conquistaAtual.recompensa} 🎁</p>
              </div>

              <Button className="w-full" onClick={() => setConquistaVisivel(false)}>Fechar</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
