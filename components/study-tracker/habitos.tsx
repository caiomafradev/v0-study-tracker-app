'use client'

import { useState } from 'react'
import { Flame, Trophy, Plus, Check } from 'lucide-react'
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
  // 1. ESTADOS EXISTENTES
  const [habitos, setHabitos] = useState<HabitoMarcado[]>(
    HABITOS_MOCK.map((h, i) => ({ id: h.id, marcado: i < 2, pontuacaoAnimada: false }))
  )
  const [desafios, setDesafios] = useState(DESAFIOS_MOCK)
  const [conquistaVisivel, setConquistaVisivel] = useState(false)
  const [conquistaAtual, setConquistaAtual] = useState<typeof DESAFIOS_MOCK[0] | null>(null)

  // 2. NOVOS ESTADOS PARA O FORMULÁRIO (Essencial para salvar)
  const [modalDesafioAberto, setModalDesafioAberto] = useState(false)
  const [novoDesafio, setNovoDesafio] = useState({
    nome: '', meta: '', recompensa: '', prazo: ''
  })

  // Cálculos de pontos
  const pontosHoje = habitos
    .filter(h => h.marcado)
    .reduce((acc, h) => {
      const habito = HABITOS_MOCK.find(hm => hm.id === h.id)
      return acc + (habito?.pontos || 0)
    }, 0)

  const pontosSemana = 6200 // Mock
  const metaSemana = 8000

  // Funções existentes
  const marcarHabito = (id: string) => {
    setHabitos(prev => prev.map(h => {
      if (h.id === id) {
        if (!h.marcado) {
          setTimeout(() => {
            setHabitos(p => p.map(hb => hb.id === id ? { ...hb, pontuacaoAnimada: false } : hb))
          }, 1000)
          return { ...h, marcado: true, pontuacaoAnimada: true }
        }
        return { ...h, marcado: false }
      }
      return h
    }))
  }

  const verConquista = (desafio: typeof DESAFIOS_MOCK[0]) => {
    setConquistaAtual(desafio)
    setConquistaVisivel(true)
  }

  // 3. FUNÇÃO QUE SALVA O DESAFIO
  const salvarDesafio = () => {
    if (!novoDesafio.nome || !novoDesafio.meta) return // Impede salvar vazio

    const desafioCriado = {
      id: `desafio-${Date.now()}`,
      nome: novoDesafio.nome,
      meta: Number(novoDesafio.meta),
      atual: 0,
      recompensa: novoDesafio.recompensa || 'Surpresa',
      prazo: novoDesafio.prazo || new Date().toISOString(),
      concluido: false
    }

    setDesafios(prev => [...prev, desafioCriado]) // Adiciona à lista
    setNovoDesafio({ nome: '', meta: '', recompensa: '', prazo: '' }) // Limpa formulário
    setModalDesafioAberto(false) // Fecha modal
  }

  const gerarCalendario = () => {
    const semanas = 5; const dias = 7; const calendario = []
    for (let s = 0; s < semanas; s++) {
      const semana = []
      for (let d = 0; d < dias; d++) {
        const pontos = Math.floor(Math.random() * 1500)
        let cor = '#E2E8F0'
        if (pontos > 0 && pontos <= 500) cor = '#86EFAC'
        if (pontos > 500 && pontos <= 1000) cor = '#22C55E'
        if (pontos > 1000) cor = '#15803D'
        semana.push({ pontos, cor })
      }
      calendario.push(semana)
    }
    return calendario
  }

  const calendario = gerarCalendario()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Monitor de Hábitos</h1>
        <p className="text-muted-foreground">Acompanhe seus hábitos diários e conquiste recompensas</p>
      </div>

      {/* Card de pontuação (Omitido marcação detalhada para ser breve, idêntico ao original) */}
      <Card className="shadow-sm bg-gradient-to-r from-success-light to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-heading font-extrabold text-primary">{pontosHoje.toLocaleString()} pts</p>
              <p className="text-muted-foreground">Hoje</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-heading font-bold">{pontosSemana.toLocaleString()} pts</p>
              <p className="text-muted-foreground">Esta semana</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground">Próxima recompensa</span>
              <span className="font-medium">{pontosSemana.toLocaleString()} / {metaSemana.toLocaleString()} pts</span>
            </div>
            <Progress value={(pontosSemana / metaSemana) * 100} className="h-3 [&>div]:bg-accent" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-streak">
            <Flame className="w-5 h-5 animate-flame-pulse" />
            <span className="font-medium">12 dias consecutivos de hábitos!</span>
          </div>
        </CardContent>
      </Card>

      {/* Checklist de hábitos */}
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

      {/* Desafios e Modal de Criação */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg">Desafios em Andamento</h2>
          
          {/* 4. MODAL CONECTADO AOS ESTADOS */}
          <Dialog open={modalDesafioAberto} onOpenChange={setModalDesafioAberto}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Criar Desafio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Novo Desafio</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome do desafio</Label>
                  <Input 
                    placeholder="Ex: Semana Produtiva" 
                    value={novoDesafio.nome} 
                    onChange={e => setNovoDesafio({...novoDesafio, nome: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta de pontos</Label>
                  <Input 
                    type="number" 
                    placeholder="5000" 
                    value={novoDesafio.meta} 
                    onChange={e => setNovoDesafio({...novoDesafio, meta: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recompensa</Label>
                  <Input 
                    placeholder="Ex: Jantar especial" 
                    value={novoDesafio.recompensa} 
                    onChange={e => setNovoDesafio({...novoDesafio, recompensa: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data limite</Label>
                  <Input 
                    type="date" 
                    value={novoDesafio.prazo} 
                    onChange={e => setNovoDesafio({...novoDesafio, prazo: e.target.value})} 
                  />
                </div>
                {/* BOTÃO QUE DISPARA A FUNÇÃO */}
                <Button className="w-full" onClick={salvarDesafio}>Salvar Desafio</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {desafios.map(desafio => {
            const progresso = (desafio.atual / desafio.meta) * 100
            const diasRestantes = Math.ceil((new Date(desafio.prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

            return (
              <Card key={desafio.id} className={cn("shadow-sm", desafio.concluido && "border-success bg-success-light cursor-pointer")} onClick={() => desafio.concluido && verConquista(desafio)}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading font-semibold">{desafio.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {desafio.concluido ? <span className="text-success flex items-center gap-1"><Check className="w-4 h-4" /> Concluído!</span> : `${isNaN(diasRestantes) ? '--' : diasRestantes} dias restantes`}
                      </p>
                    </div>
                    {desafio.concluido ? <Trophy className="w-6 h-6 text-accent" /> : <span className="text-2xl">🔒</span>}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{desafio.atual.toLocaleString()} / {desafio.meta.toLocaleString()} pts</span>
                      <span className="font-medium">{Math.round(progresso)}%</span>
                    </div>
                    <Progress value={progresso} className={cn("h-2", desafio.concluido && "[&>div]:bg-success")} />
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

      {/* Calendário e Overlay de Conquistas continuam iguais */}
      {/* ... (omitidos para não poluir, mantêm exatamente o seu código original) ... */}
    </div>
  )
}