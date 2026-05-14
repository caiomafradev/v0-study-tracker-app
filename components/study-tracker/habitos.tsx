'use client'

import { useState } from 'react'
import { Flame, Trophy, Plus, Check, Edit2 } from 'lucide-react' // Adicionado Edit2
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HABITOS_MOCK, DESAFIOS_MOCK } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface HabitoMarcado {
  id: string
  marcado: boolean
  pontuacaoAnimada: boolean
}

export function Habitos() {
  const [habitos, setHabitos] = useState<HabitoMarcado[]>(
    HABITOS_MOCK.map((h, i) => ({ id: h.id, marcado: i < 2, pontuacaoAnimada: false }))
  )
  const [desafios, setDesafios] = useState(DESAFIOS_MOCK)
  const [conquistaVisivel, setConquistaVisivel] = useState(false)
  const [conquistaAtual, setConquistaAtual] = useState<typeof DESAFIOS_MOCK[0] | null>(null)

  // ESTADOS DO MODAL DE DESAFIOS
  const [modalDesafioAberto, setModalDesafioAberto] = useState(false)
  const [novoDesafio, setNovoDesafio] = useState({ nome: '', meta: '', recompensa: '', prazo: '' })

  // NOVO: ESTADO DO STREAK EDITÁVEL
  const [streakDias, setStreakDias] = useState(12)
  const [editandoStreak, setEditandoStreak] = useState(false)

  // 1. LÓGICA DE PONTOS DINÂMICOS
  // Calcula os pontos ganhos APENAS HOJE
  const pontosHoje = habitos
    .filter(h => h.marcado)
    .reduce((acc, h) => {
      const habito = HABITOS_MOCK.find(hm => hm.id === h.id)
      return acc + (habito?.pontos || 0)
    }, 0)

  // Pontos Globais = (Um valor histórico que vem do banco) + Pontos ganhos hoje
  const pontosBaseHistorico = 4800 // Exemplo: pontos que você já tinha ontem
  const pontosTotaisGlobais = pontosBaseHistorico + pontosHoje 
  const metaSemana = 8000

  // 2. FUNÇÃO DE MARCAR HÁBITO (Inalterada, mas agora reflete globalmente)
  const marcarHabito = (id: string) => {
    setHabitos(prev => prev.map(h => {
      if (h.id === id) {
        if (!h.marcado) {
          setTimeout(() => {
            setHabitos(p => p.map(hb => hb.id === id ? { ...hb, pontuacaoAnimada: false } : hb))
          }, 1000)
          return { ...h, marcado: true, pontuacaoAnimada: true }
        }
        return { ...h, marcado: false } // Desmarcar retira os pontos automaticamente
      }
      return h
    }))
  }

  const verConquista = (desafio: typeof DESAFIOS_MOCK[0]) => {
    setConquistaAtual(desafio)
    setConquistaVisivel(true)
  }

  const salvarDesafio = () => {
    if (!novoDesafio.nome || !novoDesafio.meta) return

    const desafioCriado = {
      id: `desafio-${Date.now()}`,
      nome: novoDesafio.nome,
      meta: Number(novoDesafio.meta),
      atual: 0, // Será ignorado, pois usaremos os pontos globais
      recompensa: novoDesafio.recompensa || 'Surpresa',
      prazo: novoDesafio.prazo || new Date().toISOString(),
      concluido: false
    }

    setDesafios(prev => [...prev, desafioCriado])
    setNovoDesafio({ nome: '', meta: '', recompensa: '', prazo: '' })
    setModalDesafioAberto(false)
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Monitor de Hábitos</h1>
        <p className="text-muted-foreground">Acompanhe seus hábitos diários e conquiste recompensas</p>
      </div>

      {/* CARD DE PONTUAÇÃO */}
      <Card className="shadow-sm bg-gradient-to-r from-success-light to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-heading font-extrabold text-primary">{pontosHoje.toLocaleString()} pts</p>
              <p className="text-muted-foreground">Ganhos Hoje</p>
            </div>
            <div className="text-right">
              {/* Mostra o total dinâmico atualizado em tempo real */}
              <p className="text-2xl font-heading font-bold">{pontosTotaisGlobais.toLocaleString()} pts</p>
              <p className="text-muted-foreground">Pontuação Global</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground">Próxima recompensa</span>
              <span className="font-medium">{pontosTotaisGlobais.toLocaleString()} / {metaSemana.toLocaleString()} pts</span>
            </div>
            <Progress value={(pontosTotaisGlobais / metaSemana) * 100} className="h-3 [&>div]:bg-accent" />
          </div>
          
          {/* STREAK EDITÁVEL */}
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
                {streakDias} dias consecutivos de hábitos! <Edit2 className="w-3 h-3 text-muted-foreground" />
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CHECKLIST DE HÁBITOS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg">Hábitos de Hoje</h2>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Gerenciar Hábitos
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {HABITOS_MOCK.map(habito => {
            const estado = habitos.find(h => h.id === habito.id)
            const marcado = estado?.marcado || false
            const animando = estado?.pontuacaoAnimada || false

            return (
              <Card key={habito.id} className={cn("shadow-sm cursor-pointer transition-all hover:shadow-md relative overflow-hidden", marcado && "bg-success-light")} onClick={() => marcarHabito(habito.id)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habito.icone}</span>
                    <div>
                      <p className={cn("font-medium", marcado && "line-through text-muted-foreground")}>{habito.nome}</p>
                      <p className="text-sm text-accent font-medium">+{habito.pontos} pts</p>
                    </div>
                  </div>
                  <button className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all", marcado ? "bg-success border-success" : "border-muted-foreground hover:border-primary")}>
                    {marcado && <Check className="w-5 h-5 text-white" />}
                  </button>
                  {animando && (
                    <div className="absolute top-2 right-12 animate-float-up">
                      <Badge className="bg-accent text-accent-foreground">+{habito.pontos} pts 🎯</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* DESAFIOS (AGORA BASEADOS NA PONTUAÇÃO GLOBAL) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg">Metas Globais (Desafios)</h2>
          <Dialog open={modalDesafioAberto} onOpenChange={setModalDesafioAberto}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2"><Plus className="w-4 h-4" /> Criar Desafio</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Novo Desafio</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2"><Label>Nome do desafio</Label><Input value={novoDesafio.nome} onChange={e => setNovoDesafio({...novoDesafio, nome: e.target.value})} /></div>
                <div className="space-y-2"><Label>Meta de pontos (Global)</Label><Input type="number" value={novoDesafio.meta} onChange={e => setNovoDesafio({...novoDesafio, meta: e.target.value})} /></div>
                <div className="space-y-2"><Label>Recompensa</Label><Input value={novoDesafio.recompensa} onChange={e => setNovoDesafio({...novoDesafio, recompensa: e.target.value})} /></div>
                <Button className="w-full" onClick={salvarDesafio}>Salvar Desafio</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {desafios.map(desafio => {
            // 3. LÓGICA DE DESAFIOS CUMULATIVOS
            // Usa a pontuação global para preencher a barra de progresso
            const progresso = Math.min((pontosTotaisGlobais / desafio.meta) * 100, 100)
            const isConcluido = pontosTotaisGlobais >= desafio.meta

            return (
              <Card key={desafio.id} className={cn("shadow-sm", isConcluido && "border-success bg-success-light cursor-pointer")} onClick={() => isConcluido && verConquista(desafio)}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading font-semibold">{desafio.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {isConcluido ? <span className="text-success flex items-center gap-1"><Check className="w-4 h-4" /> Desbloqueado!</span> : `Faltam ${desafio.meta - pontosTotaisGlobais} pts`}
                      </p>
                    </div>
                    {isConcluido ? <Trophy className="w-6 h-6 text-accent" /> : <span className="text-2xl">🔒</span>}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{pontosTotaisGlobais.toLocaleString()} / {desafio.meta.toLocaleString()} pts</span>
                      <span className="font-medium">{Math.round(progresso)}%</span>
                    </div>
                    <Progress value={progresso} className={cn("h-2", isConcluido && "[&>div]:bg-success")} />
                  </div>
                  <p className="mt-3 text-sm">
                    <span className="text-muted-foreground">Recompensa: </span>
                    <span className="font-medium">{desafio.recompensa}</span>
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
