'use client'

import { useState } from 'react'
import { 
  Flame,
  Trophy,
  Plus,
  Check,
  X
} from 'lucide-react'
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

  // Calcular pontos do dia
  const pontosHoje = habitos
    .filter(h => h.marcado)
    .reduce((acc, h) => {
      const habito = HABITOS_MOCK.find(hm => hm.id === h.id)
      return acc + (habito?.pontos || 0)
    }, 0)

  const pontosSemana = 6200 // Mock
  const metaSemana = 8000

  // Marcar hábito
  const marcarHabito = (id: string) => {
    setHabitos(prev => prev.map(h => {
      if (h.id === id) {
        if (!h.marcado) {
          // Mostrar animação de pontos
          setTimeout(() => {
            setHabitos(p => p.map(hb => 
              hb.id === id ? { ...hb, pontuacaoAnimada: false } : hb
            ))
          }, 1000)
          return { ...h, marcado: true, pontuacaoAnimada: true }
        }
        return { ...h, marcado: false }
      }
      return h
    }))
  }

  // Ver conquista
  const verConquista = (desafio: typeof DESAFIOS_MOCK[0]) => {
    setConquistaAtual(desafio)
    setConquistaVisivel(true)
  }

  // Gerar calendário GitHub style
  const gerarCalendario = () => {
    const semanas = 5
    const dias = 7
    const calendario = []
    
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

      {/* Card de pontuação */}
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
            <Plus className="w-4 h-4" />
            Gerenciar Hábitos
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {HABITOS_MOCK.map(habito => {
            const estado = habitos.find(h => h.id === habito.id)
            const marcado = estado?.marcado || false
            const animando = estado?.pontuacaoAnimada || false

            return (
              <Card 
                key={habito.id}
                className={cn(
                  "shadow-sm cursor-pointer transition-all hover:shadow-md relative overflow-hidden",
                  marcado && "bg-success-light"
                )}
                onClick={() => marcarHabito(habito.id)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habito.icone}</span>
                    <div>
                      <p className={cn(
                        "font-medium",
                        marcado && "line-through text-muted-foreground"
                      )}>
                        {habito.nome}
                      </p>
                      <p className="text-sm text-accent font-medium">+{habito.pontos} pts</p>
                    </div>
                  </div>
                  
                  <button
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                      marcado 
                        ? "bg-success border-success" 
                        : "border-muted-foreground hover:border-primary"
                    )}
                  >
                    {marcado && <Check className="w-5 h-5 text-white" />}
                  </button>

                  {/* Animação de pontos */}
                  {animando && (
                    <div className="absolute top-2 right-12 animate-float-up">
                      <Badge className="bg-accent text-accent-foreground">
                        +{habito.pontos} pts 🎯
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Desafios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg">Desafios em Andamento</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Desafio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Desafio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome do desafio</Label>
                  <Input placeholder="Ex: Semana Produtiva" />
                </div>
                <div className="space-y-2">
                  <Label>Meta de pontos</Label>
                  <Input type="number" placeholder="5000" />
                </div>
                <div className="space-y-2">
                  <Label>Recompensa</Label>
                  <Input placeholder="Ex: Jantar especial" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Data início</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data fim</Label>
                    <Input type="date" />
                  </div>
                </div>
                <Button className="w-full">Criar Desafio</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {desafios.map(desafio => {
            const progresso = (desafio.atual / desafio.meta) * 100
            const diasRestantes = Math.ceil(
              (new Date(desafio.prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            )

            return (
              <Card 
                key={desafio.id}
                className={cn(
                  "shadow-sm",
                  desafio.concluido && "border-success bg-success-light cursor-pointer"
                )}
                onClick={() => desafio.concluido && verConquista(desafio)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading font-semibold">{desafio.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {desafio.concluido ? (
                          <span className="text-success flex items-center gap-1">
                            <Check className="w-4 h-4" /> Concluído!
                          </span>
                        ) : (
                          `${diasRestantes} dias restantes`
                        )}
                      </p>
                    </div>
                    {desafio.concluido ? (
                      <Trophy className="w-6 h-6 text-accent" />
                    ) : (
                      <span className="text-2xl">🔒</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{desafio.atual.toLocaleString()} / {desafio.meta.toLocaleString()} pts</span>
                      <span className="font-medium">{Math.round(progresso)}%</span>
                    </div>
                    <Progress 
                      value={progresso} 
                      className={cn("h-2", desafio.concluido && "[&>div]:bg-success")} 
                    />
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

      {/* Calendário de hábitos */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Histórico de Hábitos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(dia => (
              <div key={dia} className="flex-1 text-center text-xs text-muted-foreground mb-1">
                {dia}
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {calendario.map((semana, s) => (
              <div key={s} className="flex gap-1">
                {semana.map((dia, d) => (
                  <div
                    key={d}
                    className="flex-1 aspect-square rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: dia.cor }}
                    title={`${dia.pontos} pts`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
            <span>Menos</span>
            {['#E2E8F0', '#86EFAC', '#22C55E', '#15803D'].map(cor => (
              <div 
                key={cor}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: cor }}
              />
            ))}
            <span>Mais</span>
          </div>
        </CardContent>
      </Card>

      {/* Overlay de conquista */}
      {conquistaVisivel && conquistaAtual && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setConquistaVisivel(false)}
        >
          {/* Confetti */}
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
              <h2 className="text-2xl font-heading font-bold mb-2">Desafio Concluído!</h2>
              <p className="text-muted-foreground mb-4">{conquistaAtual.nome}</p>
              
              <div className="bg-accent/10 rounded-lg p-4 mb-6">
                <p className="text-muted-foreground text-sm">Você ganhou:</p>
                <p className="text-xl font-bold text-accent">{conquistaAtual.recompensa} 🎁</p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setConquistaVisivel(false)}
                >
                  Fechar
                </Button>
                <Button className="flex-1 gap-2">
                  <Plus className="w-4 h-4" />
                  Próximo Desafio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
