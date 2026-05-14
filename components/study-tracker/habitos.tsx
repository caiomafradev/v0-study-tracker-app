'use client'

import { useState, useEffect } from 'react'
import { Flame, Trophy, Plus, Check, Edit2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HABITOS_MOCK, DESAFIOS_MOCK } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface HabitoEstado {
  id: string
  ultimaDataFeito: string | null
  pontuacaoAnimada: boolean
}

export function Habitos() {
  // 1. CONFIGURAÇÕES DE DATA (Marco zero e Reset Automático)
  const dataInicioSistema = '2026-05-10' // A partir desta data o sistema contabiliza o histórico
  
  // Guardamos a data de hoje no formato YYYY-MM-DD
  const [dataHoje, setDataHoje] = useState(() => new Date().toISOString().split('T')[0])

  // Verifica a cada minuto se a meia-noite já passou para atualizar o ecrã automaticamente
  useEffect(() => {
    const intervalo = setInterval(() => {
      setDataHoje(new Date().toISOString().split('T')[0])
    }, 60000)
    return () => clearInterval(intervalo)
  }, [])

  // 2. ESTADOS DA APLICAÇÃO
  // Substituímos o "marcado: boolean" pela data em que foi feito
  const [habitos, setHabitos] = useState<HabitoEstado[]>(
    HABITOS_MOCK.map((h, i) => ({ 
      id: h.id, 
      ultimaDataFeito: i === 0 ? dataHoje : null, // Apenas o primeiro começa marcado hoje como exemplo
      pontuacaoAnimada: false 
    }))
  )
  
  const [desafios, setDesafios] = useState(DESAFIOS_MOCK)
  const [conquistaVisivel, setConquistaVisivel] = useState(false)
  const [conquistaAtual, setConquistaAtual] = useState<typeof DESAFIOS_MOCK[0] | null>(null)

  const [modalDesafioAberto, setModalDesafioAberto] = useState(false)
  const [novoDesafio, setNovoDesafio] = useState({ nome: '', meta: '', recompensa: '', prazo: '' })

  const [streakDias, setStreakDias] = useState(12)
  const [editandoStreak, setEditandoStreak] = useState(false)

  // 3. CÁLCULOS DE PONTUAÇÃO
  // Soma os pontos apenas dos hábitos que têm a data de hoje
  const pontosHoje = habitos
    .filter(h => h.ultimaDataFeito === dataHoje)
    .reduce((acc, h) => {
      const habitoMock = HABITOS_MOCK.find(hm => hm.id === h.id)
      return acc + (habitoMock?.pontos || 0)
    }, 0)

  // A pontuação global soma o histórico com o que o utilizador ganhou hoje
  const pontosBaseHistorico = 4800 
  const pontosTotaisGlobais = pontosBaseHistorico + pontosHoje 
  const metaSemana = 8000

  // 4. FUNÇÕES DE INTERAÇÃO
  const marcarHabito = (id: string) => {
    setHabitos(prev => prev.map(h => {
      if (h.id === id) {
        const jaFoiMarcadoHoje = h.ultimaDataFeito === dataHoje
        
        if (!jaFoiMarcadoHoje) {
          // Marca com a data de hoje e ativa a animação
          setTimeout(() => {
            setHabitos(p => p.map(hb => hb.id === id ? { ...hb, pontuacaoAnimada: false } : hb))
          }, 1000)
          return { ...h, ultimaDataFeito: dataHoje, pontuacaoAnimada: true }
        }
        
        // Se já estava marcado hoje, desmarca (limpa a data)
        return { ...h, ultimaDataFeito: null } 
      }
      return h
    }))
  }

  const verConquista = (desafio: typeof DESAFIOS_MOCK[0]) => {
    setConquistaAtual(desafio)
    setConquistaVisivel(true)
  }

  const guardarDesafio = () => {
    if (!novoDesafio.nome || !novoDesafio.meta) return

    const desafioCriado = {
      id: `desafio-${Date.now()}`,
      nome: novoDesafio.nome,
      meta: Number(novoDesafio.meta),
      atual: 0, // Ignorado na renderização, pois usamos os pontos globais
      recompensa: novoDesafio.recompensa || 'Surpresa',
      prazo: novoDesafio.prazo || new Date().toISOString(),
      concluido: false
    }

    setDesafios(prev => [...prev, desafioCriado])
    setNovoDesafio({ nome: '', meta: '', recompensa: '', prazo: '' })
    setModalDesafioAberto(false)
  }

  // Gera o calendário estilo GitHub de forma didática
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
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Monitor de Hábitos</h1>
        <p className="text-muted-foreground">Acompanhe os seus hábitos diários e conquiste recompensas</p>
      </div>

      {/* CARTÃO DE PONTUAÇÃO GERAL */}
      <Card className="shadow-sm bg-gradient-to-r from-success-light to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-heading font-extrabold text-primary">{pontosHoje.toLocaleString()} pts</p>
              <p className="text-muted-foreground">Ganhos Hoje</p>
            </div>
            <div className="text-right">
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

      {/* LISTA DE HÁBITOS DE HOJE */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg">Hábitos de Hoje</h2>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Gerir Hábitos
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {HABITOS_MOCK.map(habito => {
            const estado = habitos.find(h => h.id === habito.id)
            const marcadoHoje = estado?.ultimaDataFeito === dataHoje
            const animando = estado?.pontuacaoAnimada || false

            return (
              <Card key={habito.id} className={cn("shadow-sm cursor-pointer transition-all hover:shadow-md relative overflow-hidden", marcadoHoje && "bg-success-light")} onClick={() => marcarHabito(habito.id)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habito.icone}</span>
                    <div>
                      <p className={cn("font-medium", marcadoHoje && "line-through text-muted-foreground")}>{habito.nome}</p>
                      <p className="text-sm text-accent font-medium">+{habito.pontos} pts</p>
                    </div>
                  </div>
                  <button className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all", marcadoHoje ? "bg-success border-success" : "border-muted-foreground hover:border-primary")}>
                    {marcadoHoje && <Check className="w-5 h-5 text-white" />}
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

      {/* DESAFIOS E METAS GLOBAIS */}
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
                <Button className="w-full" onClick={guardarDesafio}>Guardar Desafio</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {desafios.map(desafio => {
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

      {/* CALENDÁRIO HISTÓRICO */}
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
              <div key={cor} className="w-3 h-3 rounded-sm" style={{ backgroundColor: cor }} />
            ))}
            <span>Mais</span>
          </div>
        </CardContent>
      </Card>

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
              <h2 className="text-2xl font-heading font-bold mb-2">Desafio Concluído!</h2>
              <p className="text-muted-foreground mb-4">{conquistaAtual.nome}</p>
              
              <div className="bg-accent/10 rounded-lg p-4 mb-6">
                <p className="text-muted-foreground text-sm">Ganhou:</p>
                <p className="text-xl font-bold text-accent">{conquistaAtual.recompensa} 🎁</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConquistaVisivel(false)}>Fechar</Button>
                <Button className="flex-1 gap-2"><Plus className="w-4 h-4" /> Próximo Desafio</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}