'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  X, 
  Play, 
  Pause, 
  Square, 
  Timer,
  Clock,
  BookOpen,
  HelpCircle,
  Check,
  Calendar,
  Volume2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MOCK_DATA, PLANOS, formatarTempo, formatarTempoCompleto } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface ModalEstudoProps {
  isOpen: boolean
  onClose: () => void
  preenchimento?: {
    plano?: string
    disciplina?: string
    topico?: string
  }
}

type EstadoTimer = 'idle' | 'running' | 'paused' | 'finished'
type TipoEstudo = 'teoria' | 'questoes'
type SomAmbiente = 'silencio' | 'chuva' | 'white' | 'brown' | 'jazz' | 'cafeteria'

export function ModalEstudo({ isOpen, onClose, preenchimento }: ModalEstudoProps) {
  // Estados de seleção
  const [planoSelecionado, setPlanoSelecionado] = useState(preenchimento?.plano || 'bb')
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(preenchimento?.disciplina || '')
  const [topicoSelecionado, setTopicoSelecionado] = useState(preenchimento?.topico || '')
  const [tipoEstudo, setTipoEstudo] = useState<TipoEstudo>('teoria')
  
  // Estados do timer
  const [estadoTimer, setEstadoTimer] = useState<EstadoTimer>('idle')
  const [tempoEstudoMs, setTempoEstudoMs] = useState(0)
  const [tempoPausaMs, setTempoPausaMs] = useState(0)
  const [timerMinutos, setTimerMinutos] = useState(25)
  const [abaTimer, setAbaTimer] = useState<'cronometro' | 'regressivo'>('cronometro')
  
  // Estados de som
  const [somAtivo, setSomAtivo] = useState<SomAmbiente>('silencio')
  const [volume, setVolume] = useState(40)
  
  // Estados pós-sessão
  const [acertos, setAcertos] = useState(0)
  const [erros, setErros] = useState(0)
  const [revisoesSelecionadas, setRevisoesSelecionadas] = useState<number[]>([])
  
  // Refs
  const intervalEstudo = useRef<NodeJS.Timeout | null>(null)
  const intervalPausa = useRef<NodeJS.Timeout | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const sourceNode = useRef<AudioBufferSourceNode | null>(null)
  const gainNode = useRef<GainNode | null>(null)

  // Dados
  const dados = MOCK_DATA[planoSelecionado] || MOCK_DATA.bb
  const disciplinas = dados.disciplinas
  const disciplinaAtual = disciplinas.find(d => d.id === disciplinaSelecionada)
  const topicos = disciplinaAtual?.topicos || []

  // Atualizar com preenchimento
  useEffect(() => {
    if (preenchimento) {
      if (preenchimento.plano) setPlanoSelecionado(preenchimento.plano)
      if (preenchimento.disciplina) setDisciplinaSelecionada(preenchimento.disciplina)
      if (preenchimento.topico) setTopicoSelecionado(preenchimento.topico)
    }
  }, [preenchimento])

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalEstudo.current) clearInterval(intervalEstudo.current)
      if (intervalPausa.current) clearInterval(intervalPausa.current)
      if (audioCtx.current) audioCtx.current.close()
    }
  }, [])

  // Funções do timer
  const iniciar = () => {
    setEstadoTimer('running')
    intervalEstudo.current = setInterval(() => {
      setTempoEstudoMs(t => t + 1000)
    }, 1000)
    if (somAtivo !== 'silencio') iniciarSom()
  }

  const pausar = () => {
    setEstadoTimer('paused')
    if (intervalEstudo.current) clearInterval(intervalEstudo.current)
    intervalPausa.current = setInterval(() => {
      setTempoPausaMs(t => t + 1000)
    }, 1000)
    pararSom()
  }

  const retomar = () => {
    setEstadoTimer('running')
    if (intervalPausa.current) clearInterval(intervalPausa.current)
    intervalEstudo.current = setInterval(() => {
      setTempoEstudoMs(t => t + 1000)
    }, 1000)
    if (somAtivo !== 'silencio') iniciarSom()
  }

  const parar = () => {
    setEstadoTimer('finished')
    if (intervalEstudo.current) clearInterval(intervalEstudo.current)
    if (intervalPausa.current) clearInterval(intervalPausa.current)
    pararSom()
  }

  // Funções de áudio
  const iniciarSom = useCallback(() => {
    if (!audioCtx.current) {
      audioCtx.current = new AudioContext()
    }
    
    const ctx = audioCtx.current
    gainNode.current = ctx.createGain()
    gainNode.current.gain.value = volume / 100
    gainNode.current.connect(ctx.destination)

    // Criar som baseado no tipo selecionado
    const bufferSize = 2 * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    if (somAtivo === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
    } else if (somAtivo === 'brown') {
      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + 0.02 * white) / 1.02
        lastOut = data[i]
        data[i] *= 3.5
      }
    } else if (somAtivo === 'chuva') {
      // White noise filtrado
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5
      }
    } else {
      // Outros sons - usar white noise base
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3
      }
    }

    sourceNode.current = ctx.createBufferSource()
    sourceNode.current.buffer = buffer
    sourceNode.current.loop = true
    
    if (somAtivo === 'chuva') {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 400
      filter.Q.value = 0.5
      sourceNode.current.connect(filter)
      filter.connect(gainNode.current)
    } else {
      sourceNode.current.connect(gainNode.current)
    }
    
    sourceNode.current.start()
  }, [somAtivo, volume])

  const pararSom = () => {
    if (sourceNode.current) {
      sourceNode.current.stop()
      sourceNode.current = null
    }
  }

  // Atualizar volume
  useEffect(() => {
    if (gainNode.current) {
      gainNode.current.gain.value = volume / 100
    }
  }, [volume])

  // Mudar som
  useEffect(() => {
    if (estadoTimer === 'running' && somAtivo !== 'silencio') {
      pararSom()
      iniciarSom()
    } else if (somAtivo === 'silencio') {
      pararSom()
    }
  }, [somAtivo, estadoTimer, iniciarSom])

  // Calcular aproveitamento
  const aproveitamento = acertos + erros > 0 
    ? ((acertos / (acertos + erros)) * 100).toFixed(1)
    : '0.0'

  // Calcular datas de revisão
  const calcularRevisoes = () => {
    const hoje = new Date()
    return revisoesSelecionadas.map(dias => {
      const data = new Date(hoje)
      data.setDate(data.getDate() + dias)
      return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    })
  }

  // Salvar sessão
  const salvarSessao = () => {
    // Aqui salvaria no estado global
    alert('Sessão salva com sucesso!')
    resetar()
    onClose()
  }

  // Resetar estado
  const resetar = () => {
    setEstadoTimer('idle')
    setTempoEstudoMs(0)
    setTempoPausaMs(0)
    setAcertos(0)
    setErros(0)
    setRevisoesSelecionadas([])
    pararSom()
  }

  const handleClose = () => {
    resetar()
    onClose()
  }

  if (!isOpen) return null

  const sonsDisponiveis: { id: SomAmbiente; emoji: string; label: string }[] = [
    { id: 'silencio', emoji: '🔇', label: 'Silêncio' },
    { id: 'chuva', emoji: '🌧️', label: 'Chuva' },
    { id: 'white', emoji: '⬜', label: 'White Noise' },
    { id: 'brown', emoji: '🟤', label: 'Brown Noise' },
    { id: 'jazz', emoji: '🎷', label: 'Jazz' },
    { id: 'cafeteria', emoji: '☕', label: 'Cafeteria' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-heading font-bold text-xl">Registrar Estudo</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {estadoTimer === 'idle' && (
            <>
              {/* Seleção de plano */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="text-lg">📋</span> Plano
                </Label>
                <select
                  value={planoSelecionado}
                  onChange={(e) => {
                    setPlanoSelecionado(e.target.value)
                    setDisciplinaSelecionada('')
                    setTopicoSelecionado('')
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                >
                  {PLANOS.map(plano => (
                    <option key={plano.id} value={plano.id}>{plano.nome}</option>
                  ))}
                </select>
              </div>

              {/* Seleção de disciplina */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="text-lg">📚</span> Disciplina
                </Label>
                <select
                  value={disciplinaSelecionada}
                  onChange={(e) => {
                    setDisciplinaSelecionada(e.target.value)
                    setTopicoSelecionado('')
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                >
                  <option value="">Selecione uma disciplina</option>
                  {disciplinas.map(disc => (
                    <option key={disc.id} value={disc.id}>{disc.nome}</option>
                  ))}
                </select>
              </div>

              {/* Seleção de tópico */}
              {disciplinaSelecionada && (
                <div className="space-y-2">
                  <Label>Escolha o tópico que vai estudar:</Label>
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                    {topicos.map(topico => (
                      <button
                        key={topico.id}
                        onClick={() => setTopicoSelecionado(topico.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all",
                          topicoSelecionado === topico.id 
                            ? "bg-success-light border border-primary" 
                            : "hover:bg-muted"
                        )}
                      >
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          topico.concluido ? "bg-success" : "bg-muted-foreground/30"
                        )} />
                        <span className={cn(
                          "flex-1",
                          topico.concluido && "line-through text-muted-foreground"
                        )}>
                          {topico.nome}
                        </span>
                        {topico.concluido && <Check className="w-4 h-4 text-success" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggle tipo de estudo */}
              <div className="space-y-2">
                <Label>Tipo de estudo</Label>
                <div className="flex gap-2">
                  <Button
                    variant={tipoEstudo === 'teoria' ? 'default' : 'outline'}
                    onClick={() => setTipoEstudo('teoria')}
                    className={cn(
                      "flex-1 gap-2",
                      tipoEstudo === 'teoria' && "bg-primary"
                    )}
                  >
                    <BookOpen className="w-4 h-4" />
                    Teoria
                  </Button>
                  <Button
                    variant={tipoEstudo === 'questoes' ? 'default' : 'outline'}
                    onClick={() => setTipoEstudo('questoes')}
                    className={cn(
                      "flex-1 gap-2",
                      tipoEstudo === 'questoes' && "bg-secondary"
                    )}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Questões
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Timer */}
          {(estadoTimer === 'idle' || estadoTimer === 'running' || estadoTimer === 'paused') && (
            <Tabs value={abaTimer} onValueChange={(v) => setAbaTimer(v as 'cronometro' | 'regressivo')}>
              <TabsList className="w-full">
                <TabsTrigger value="cronometro" className="flex-1 gap-2">
                  <Clock className="w-4 h-4" />
                  Cronômetro
                </TabsTrigger>
                <TabsTrigger value="regressivo" className="flex-1 gap-2">
                  <Timer className="w-4 h-4" />
                  Timer Regressivo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cronometro" className="mt-4">
                {/* Display do tempo */}
                <div className="text-center py-8">
                  <p className="font-mono text-6xl font-bold text-primary">
                    {formatarTempo(tempoEstudoMs)}
                  </p>
                  {estadoTimer === 'paused' && (
                    <p className="mt-4 font-mono text-xl text-muted-foreground animate-pause-pulse">
                      ⏸ Pausado há {formatarTempo(tempoPausaMs)}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="regressivo" className="mt-4">
                {estadoTimer === 'idle' ? (
                  <div className="space-y-4">
                    <Label>Duração (minutos)</Label>
                    <Input
                      type="number"
                      value={timerMinutos}
                      onChange={(e) => setTimerMinutos(Number(e.target.value))}
                      min={1}
                      max={180}
                      className="text-center text-2xl font-mono"
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="font-mono text-6xl font-bold text-primary">
                      {formatarTempo(Math.max(0, timerMinutos * 60 * 1000 - tempoEstudoMs))}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Sons ambiente */}
          {(estadoTimer === 'running' || estadoTimer === 'paused') && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Som Ambiente
              </Label>
              <div className="flex flex-wrap gap-2">
                {sonsDisponiveis.map(som => (
                  <button
                    key={som.id}
                    onClick={() => setSomAtivo(som.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm transition-all",
                      somAtivo === som.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {som.emoji} {som.label}
                  </button>
                ))}
              </div>
              {somAtivo !== 'silencio' && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Volume</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-10">{volume}%</span>
                </div>
              )}
            </div>
          )}

          {/* Controles do timer */}
          {estadoTimer !== 'finished' && (
            <div className="flex gap-3">
              {estadoTimer === 'idle' && (
                <Button 
                  onClick={iniciar} 
                  className="flex-1 h-12 text-lg bg-primary hover:bg-primary/90"
                  disabled={!disciplinaSelecionada || !topicoSelecionado}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Iniciar
                </Button>
              )}
              
              {estadoTimer === 'running' && (
                <>
                  <Button onClick={pausar} className="flex-1 h-12 bg-amber-500 hover:bg-amber-600">
                    <Pause className="w-5 h-5 mr-2" />
                    Pausar
                  </Button>
                  <Button onClick={parar} variant="destructive" className="flex-1 h-12">
                    <Square className="w-5 h-5 mr-2" />
                    Parar
                  </Button>
                </>
              )}
              
              {estadoTimer === 'paused' && (
                <>
                  <Button onClick={retomar} className="flex-1 h-12 bg-primary hover:bg-primary/90">
                    <Play className="w-5 h-5 mr-2" />
                    Retomar
                  </Button>
                  <Button onClick={parar} variant="destructive" className="flex-1 h-12">
                    <Square className="w-5 h-5 mr-2" />
                    Parar
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Formulário pós-sessão */}
          {estadoTimer === 'finished' && (
            <div className="space-y-6">
              <h3 className="font-heading font-bold text-lg">Sessão Finalizada!</h3>
              
              {/* Resumo */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-muted">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-sm text-muted-foreground">Tempo de estudo</p>
                    <p className="font-mono font-bold">{formatarTempoCompleto(Math.floor(tempoEstudoMs / 1000))}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted">
                  <CardContent className="p-4 text-center">
                    <Pause className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Tempo pausado</p>
                    <p className="font-mono font-bold text-muted-foreground">{formatarTempoCompleto(Math.floor(tempoPausaMs / 1000))}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Acertos e erros */}
              {tipoEstudo === 'questoes' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Acertos</Label>
                      <Input
                        type="number"
                        value={acertos}
                        onChange={(e) => setAcertos(Number(e.target.value))}
                        min={0}
                        className="text-center text-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Erros</Label>
                      <Input
                        type="number"
                        value={erros}
                        onChange={(e) => setErros(Number(e.target.value))}
                        min={0}
                        className="text-center text-xl"
                      />
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Aproveitamento: </span>
                    <span className="font-bold text-xl">{aproveitamento}%</span>
                  </div>
                </div>
              )}

              {/* Agendamento de revisão */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Agendar Revisão (Spaced Repetition)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[1, 7, 15, 30].map(dias => (
                    <button
                      key={dias}
                      onClick={() => {
                        setRevisoesSelecionadas(prev => 
                          prev.includes(dias) 
                            ? prev.filter(d => d !== dias)
                            : [...prev, dias]
                        )
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm transition-all",
                        revisoesSelecionadas.includes(dias)
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      +{dias} dia{dias > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
                {revisoesSelecionadas.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Revisões agendadas: {calcularRevisoes().join(', ')}
                  </p>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <Button onClick={salvarSessao} className="flex-1 h-12 bg-primary hover:bg-primary/90">
                  <Check className="w-5 h-5 mr-2" />
                  Salvar Sessão
                </Button>
              </div>
              
              <Button variant="outline" className="w-full gap-2">
                <Calendar className="w-4 h-4" />
                Adicionar ao Google Agenda
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
