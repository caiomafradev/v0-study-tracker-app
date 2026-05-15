'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X, Play, Pause, Square, Timer, Clock, BookOpen, HelpCircle, 
  Check, Calendar, Volume2, Plus, Minus, Link as LinkIcon, ExternalLink, Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MOCK_DATA, PLANOS, formatarTempo, formatarTempoCompleto } from '@/lib/mock-data'
import { useStudy } from '@/contexts/StudyContext'
import { cn } from '@/lib/utils'

interface ModalEstudoProps {
  isOpen: boolean
  onClose: () => void
  preenchimento?: { plano?: string; disciplina?: string; topico?: string }
}

type EstadoTimer = 'idle' | 'running' | 'paused' | 'finished'
type TipoEstudo = 'teoria' | 'questoes'
type SomAmbiente = 'silencio' | 'chuva' | 'white' | 'brown' | 'jazz' | 'cafeteria'

export function ModalEstudo({ isOpen, onClose, preenchimento }: ModalEstudoProps) {
  // CONTEXT GLOBAL
  const { adicionarSessaoGlobal, atualizarStats, dadosGerais } = useStudy()
  
  // 1. ESTADOS DE SELEÇÃO E MODO
  const [modoRegistro, setModoRegistro] = useState<'timer' | 'manual'>('timer')
  const [planoSelecionado, setPlanoSelecionado] = useState(preenchimento?.plano || 'bb')
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(preenchimento?.disciplina || '')
  const [topicoSelecionado, setTopicoSelecionado] = useState(preenchimento?.topico || '')
  const [tipoEstudo, setTipoEstudo] = useState<TipoEstudo>('teoria')

  // 2. ESTADOS DE TEMPO
  const [estadoTimer, setEstadoTimer] = useState<EstadoTimer>('idle')
  const [tempoEstudoMs, setTempoEstudoMs] = useState(0)
  const [tempoPausaMs, setTempoPausaMs] = useState(0)
  const [timerMinutos, setTimerMinutos] = useState(25)
  const [abaTimer, setAbaTimer] = useState<'cronometro' | 'regressivo'>('cronometro')
  const [minutosManuais, setMinutosManuais] = useState(60) // Para registro passado

  // 3. ESTADOS DE SOM
  const [somAtivo, setSomAtivo] = useState<SomAmbiente>('silencio')
  const [volume, setVolume] = useState(40)

  // 4. ESTADOS DE REGISTRO (Links e Questões)
  const [acertos, setAcertos] = useState(0)
  const [erros, setErros] = useState(0)
  const [linkRevisao, setLinkRevisao] = useState('')
  const [linkQuestoes, setLinkQuestoes] = useState('')
  const [revisoesSelecionadas, setRevisoesSelecionadas] = useState<number[]>([])

  // Refs
  const intervalEstudo = useRef<NodeJS.Timeout | null>(null)
  const intervalPausa = useRef<NodeJS.Timeout | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const sourceNode = useRef<AudioBufferSourceNode | null>(null)
  const gainNode = useRef<GainNode | null>(null)

  const dados = dadosGerais[planoSelecionado] || dadosGerais.bb
  const disciplinas = dados.disciplinas
  const topicos = disciplinas.find(d => d.id === disciplinaSelecionada)?.topicos || []

  useEffect(() => {
    if (preenchimento) {
      if (preenchimento.plano) setPlanoSelecionado(preenchimento.plano)
      if (preenchimento.disciplina) setDisciplinaSelecionada(preenchimento.disciplina)
      if (preenchimento.topico) setTopicoSelecionado(preenchimento.topico)
    }
  }, [preenchimento])

  useEffect(() => {
    return () => {
      if (intervalEstudo.current) clearInterval(intervalEstudo.current)
      if (intervalPausa.current) clearInterval(intervalPausa.current)
      if (audioCtx.current) audioCtx.current.close()
    }
  }, [])

  // FUNÇÕES DO TIMER
  const iniciar = () => {
    setEstadoTimer('running')
    intervalEstudo.current = setInterval(() => setTempoEstudoMs(t => t + 1000), 1000)
    if (somAtivo !== 'silencio') iniciarSom()
  }

  const pausar = () => {
    setEstadoTimer('paused')
    if (intervalEstudo.current) clearInterval(intervalEstudo.current)
    intervalPausa.current = setInterval(() => setTempoPausaMs(t => t + 1000), 1000)
    pararSom()
  }

  const retomar = () => {
    setEstadoTimer('running')
    if (intervalPausa.current) clearInterval(intervalPausa.current)
    intervalEstudo.current = setInterval(() => setTempoEstudoMs(t => t + 1000), 1000)
    if (somAtivo !== 'silencio') iniciarSom()
  }

  const parar = () => {
    setEstadoTimer('finished')
    if (intervalEstudo.current) clearInterval(intervalEstudo.current)
    if (intervalPausa.current) clearInterval(intervalPausa.current)
    pararSom()
  }

  // SINTETIZADOR DE SONS (Web Audio API)
  const iniciarSom = useCallback(() => {
    if (!audioCtx.current) audioCtx.current = new window.AudioContext()
    const ctx = audioCtx.current
    
    gainNode.current = ctx.createGain()
    gainNode.current.gain.value = volume / 100
    gainNode.current.connect(ctx.destination)

    const bufferSize = 2 * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    if (somAtivo === 'brown') {
      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + 0.02 * white) / 1.02
        lastOut = data[i]
        data[i] *= 3.5
      }
    } else if (somAtivo === 'cafeteria' || somAtivo === 'chuva') {
      // Simulação leve para cafeteria/chuva usando ruído filtrado
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5
    } else { // White noise e base para Jazz
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    }

    sourceNode.current = ctx.createBufferSource()
    sourceNode.current.buffer = buffer
    sourceNode.current.loop = true

    if (somAtivo === 'chuva' || somAtivo === 'cafeteria' || somAtivo === 'jazz') {
      const filter = ctx.createBiquadFilter()
      filter.type = somAtivo === 'jazz' ? 'bandpass' : 'lowpass'
      filter.frequency.value = somAtivo === 'cafeteria' ? 800 : 400
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

  useEffect(() => {
    if (gainNode.current) gainNode.current.gain.value = volume / 100
  }, [volume])

  useEffect(() => {
    if (estadoTimer === 'running' && somAtivo !== 'silencio') {
      pararSom()
      iniciarSom()
    } else if (somAtivo === 'silencio') {
      pararSom()
    }
  }, [somAtivo, estadoTimer, iniciarSom])

  const aproveitamento = acertos + erros > 0 ? ((acertos / (acertos + erros)) * 100).toFixed(1) : '0.0'

  // SALVAR NO CONTEXT GLOBAL
  const salvarSessao = () => {
    const tempoFinal = modoRegistro === 'timer' ? Math.floor(tempoEstudoMs / 1000) : minutosManuais * 60
    const pausaFinal = modoRegistro === 'timer' ? Math.floor(tempoPausaMs / 1000) : 0
    
    const sessaoData = {
      disciplinaId: disciplinaSelecionada,
      topicoId: topicoSelecionado,
      tipo: tipoEstudo as 'teoria' | 'questoes',
      duracaoSegundos: tempoFinal,
      pausaSegundos: pausaFinal,
      acertos: tipoEstudo === 'questoes' ? acertos : 0,
      erros: tipoEstudo === 'questoes' ? erros : 0,
      revisoes: revisoesSelecionadas.map(dias => {
        const dataRevisao = new Date()
        dataRevisao.setDate(dataRevisao.getDate() + dias)
        return dataRevisao.toISOString().split('T')[0]
      }),
    }

    // Adiciona a sessão ao Context Global
    adicionarSessaoGlobal(planoSelecionado, sessaoData)
    
    // Atualiza as estatísticas do plano
    atualizarStats(
      planoSelecionado, 
      tempoFinal, 
      tipoEstudo === 'questoes' ? acertos : 0, 
      tipoEstudo === 'questoes' ? erros : 0
    )

    console.log("[v0] Sessão salva no Context Global:", sessaoData)
    resetar()
    onClose()
  }

  const resetar = () => {
    setEstadoTimer('idle')
    setTempoEstudoMs(0)
    setTempoPausaMs(0)
    setAcertos(0)
    setErros(0)
    setLinkRevisao('')
    setLinkQuestoes('')
    setRevisoesSelecionadas([])
    pararSom()
  }

  if (!isOpen) return null

  // COMPONENTES REUTILIZÁVEIS INTERNOS
  const renderFormularioAcertosLinks = () => (
    <div className="space-y-6 mt-6 pt-6 border-t border-border">
      {/* Acertos e Erros (Melhorado com botões) */}
      {tipoEstudo === 'questoes' && (
        <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
          <h4 className="font-heading font-semibold flex items-center gap-2"><HelpCircle className="w-4 h-4 text-primary"/> Desempenho nas Questões</h4>
          <div className="grid grid-cols-2 gap-6">
            {/* Bloco Acertos */}
            <div className="space-y-2">
              <Label className="text-success font-medium">Acertos</Label>
              <div className="flex items-center">
                <Button variant="outline" size="icon" className="rounded-r-none" onClick={() => setAcertos(a => Math.max(0, a - 1))}><Minus className="w-4 h-4" /></Button>
                <Input type="number" value={acertos} onChange={e => setAcertos(Number(e.target.value))} className="rounded-none text-center font-bold text-lg border-x-0" />
                <Button variant="outline" size="icon" className="rounded-l-none" onClick={() => setAcertos(a => a + 1)}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
            {/* Bloco Erros */}
            <div className="space-y-2">
              <Label className="text-error font-medium">Erros</Label>
              <div className="flex items-center">
                <Button variant="outline" size="icon" className="rounded-r-none" onClick={() => setErros(a => Math.max(0, a - 1))}><Minus className="w-4 h-4" /></Button>
                <Input type="number" value={erros} onChange={e => setErros(Number(e.target.value))} className="rounded-none text-center font-bold text-lg border-x-0" />
                <Button variant="outline" size="icon" className="rounded-l-none" onClick={() => setErros(a => a + 1)}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
          <div className="text-center p-2 bg-background rounded border">
            <span className="text-sm text-muted-foreground">Aproveitamento: </span>
            <span className={cn("font-bold", Number(aproveitamento) >= 70 ? "text-success" : "text-error")}>{aproveitamento}%</span>
          </div>
        </div>
      )}

      {/* Links de Estudo */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Link do Material / Revisão</Label>
          <Input type="url" placeholder="https://youtube.com/... ou https://drive..." value={linkRevisao} onChange={e => setLinkRevisao(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Link da Bateria de Questões</Label>
          <Input type="url" placeholder="https://qconcursos.com/..." value={linkQuestoes} onChange={e => setLinkQuestoes(e.target.value)} />
        </div>
      </div>

      {/* Agendamento */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Agendar Revisão</Label>
        <div className="flex flex-wrap gap-2">
          {[1, 7, 15, 30].map(dias => (
            <button
              key={dias}
              onClick={() => setRevisoesSelecionadas(p => p.includes(dias) ? p.filter(d => d !== dias) : [...p, dias])}
              className={cn("px-3 py-1.5 rounded-full text-sm transition-all", revisoesSelecionadas.includes(dias) ? "bg-secondary text-white" : "bg-muted hover:bg-muted/80")}
            >
              +{dias} dia{dias > 1 && 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Botão Salvar Global */}
      <Button onClick={salvarSessao} className="w-full h-12 bg-primary hover:bg-primary/90 text-lg shadow-lg">
        <Save className="w-5 h-5 mr-2" /> Registrar no Servidor
      </Button>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-heading font-bold text-xl">Registrar Estudo</h2>
          <Button variant="ghost" size="icon" onClick={() => { resetar(); onClose(); }}><X className="w-5 h-5" /></Button>
        </div>

        <div className="p-4 space-y-6">
          
          {/* ABAS: TIMER VS MANUAL */}
          {estadoTimer === 'idle' && (
            <Tabs value={modoRegistro} onValueChange={(v) => setModoRegistro(v as 'timer' | 'manual')}>
              <TabsList className="w-full grid grid-cols-2 mb-6">
                <TabsTrigger value="timer">Estudar Agora (Timer)</TabsTrigger>
                <TabsTrigger value="manual">Já Estudei (Manual)</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* SELETORES BÁSICOS (Comum aos dois modos) */}
          {(estadoTimer === 'idle' || modoRegistro === 'manual') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <select value={planoSelecionado} onChange={(e) => { setPlanoSelecionado(e.target.value); setDisciplinaSelecionada(''); setTopicoSelecionado(''); }} className="w-full h-10 px-3 rounded-lg border bg-background">
                    {PLANOS.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Disciplina</Label>
                  <select value={disciplinaSelecionada} onChange={(e) => { setDisciplinaSelecionada(e.target.value); setTopicoSelecionado(''); }} className="w-full h-10 px-3 rounded-lg border bg-background">
                    <option value="">Selecione...</option>
                    {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                  </select>
                </div>
              </div>

              {disciplinaSelecionada && (
                <div className="space-y-2">
                  <Label>Tópico Estudado</Label>
                  <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-2 bg-muted/10">
                    {topicos.map(t => (
                      <button key={t.id} onClick={() => setTopicoSelecionado(t.id)} className={cn("w-full flex items-center gap-3 p-2 rounded-lg text-left text-sm", topicoSelecionado === t.id ? "bg-primary/10 border border-primary text-primary font-medium" : "hover:bg-muted")}>
                        <div className={cn("w-2 h-2 rounded-full", t.concluido ? "bg-success" : "bg-muted-foreground/30")} />
                        {t.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant={tipoEstudo === 'teoria' ? 'default' : 'outline'} onClick={() => setTipoEstudo('teoria')} className={cn("flex-1", tipoEstudo === 'teoria' && "bg-primary")}><BookOpen className="w-4 h-4 mr-2" /> Teoria</Button>
                <Button variant={tipoEstudo === 'questoes' ? 'default' : 'outline'} onClick={() => setTipoEstudo('questoes')} className={cn("flex-1", tipoEstudo === 'questoes' && "bg-secondary")}><HelpCircle className="w-4 h-4 mr-2" /> Questões</Button>
              </div>
            </div>
          )}

          {/* MODO TIMER: CONTROLES */}
          {modoRegistro === 'timer' && (
            <>
              {(estadoTimer === 'idle' || estadoTimer === 'running' || estadoTimer === 'paused') && (
                <Tabs value={abaTimer} onValueChange={(v) => setAbaTimer(v as 'cronometro' | 'regressivo')} className="mt-6">
                  <TabsList className="w-full">
                    <TabsTrigger value="cronometro" className="flex-1"><Clock className="w-4 h-4 mr-2" /> Cronômetro</TabsTrigger>
                    <TabsTrigger value="regressivo" className="flex-1"><Timer className="w-4 h-4 mr-2" /> Regressivo</TabsTrigger>
                  </TabsList>

                  <TabsContent value="cronometro">
                    <div className="text-center py-8">
                      <p className="font-mono text-6xl font-bold text-primary">{formatarTempo(tempoEstudoMs)}</p>
                      {estadoTimer === 'paused' && <p className="mt-4 font-mono text-xl text-muted-foreground animate-pause-pulse">⏸ Pausado há {formatarTempo(tempoPausaMs)}</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="regressivo">
                    {estadoTimer === 'idle' ? (
                      <div className="py-4 space-y-4">
                        <Label>Duração (minutos)</Label>
                        <Input type="number" value={timerMinutos} onChange={e => setTimerMinutos(Number(e.target.value))} className="text-center text-4xl font-mono h-16" />
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="font-mono text-6xl font-bold text-primary">{formatarTempo(Math.max(0, timerMinutos * 60 * 1000 - tempoEstudoMs))}</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}

              {/* Controles de Play/Pause */}
              {estadoTimer !== 'finished' && (
                <div className="flex gap-3 mt-4">
                  {estadoTimer === 'idle' && <Button onClick={iniciar} className="flex-1 h-12 text-lg" disabled={!topicoSelecionado}><Play className="w-5 h-5 mr-2" /> Iniciar</Button>}
                  {estadoTimer === 'running' && (
                    <><Button onClick={pausar} className="flex-1 h-12 bg-amber-500 hover:bg-amber-600"><Pause className="w-5 h-5 mr-2" /> Pausar</Button>
                    <Button onClick={parar} variant="destructive" className="flex-1 h-12"><Square className="w-5 h-5 mr-2" /> Finalizar</Button></>
                  )}
                  {estadoTimer === 'paused' && (
                    <><Button onClick={retomar} className="flex-1 h-12"><Play className="w-5 h-5 mr-2" /> Retomar</Button>
                    <Button onClick={parar} variant="destructive" className="flex-1 h-12"><Square className="w-5 h-5 mr-2" /> Finalizar</Button></>
                  )}
                </div>
              )}

              {/* Sons Ambiente */}
              {(estadoTimer === 'running' || estadoTimer === 'paused') && (
                <div className="space-y-3 mt-6 p-4 bg-muted/50 rounded-lg">
                  <Label className="flex items-center gap-2"><Volume2 className="w-4 h-4" /> Som Ambiente</Label>
                  <div className="flex flex-wrap gap-2">
                    {[{ id: 'silencio', emoji: '🔇', label: 'Silêncio' }, { id: 'chuva', emoji: '🌧️', label: 'Chuva' }, { id: 'white', emoji: '⬜', label: 'Ruído Branco' }, { id: 'brown', emoji: '🟤', label: 'Ruído Marrom' }, { id: 'jazz', emoji: '🎷', label: 'Jazz' }, { id: 'cafeteria', emoji: '☕', label: 'Cafeteria' }].map((som: any) => (
                      <button key={som.id} onClick={() => setSomAtivo(som.id)} className={cn("px-3 py-1.5 rounded-full text-sm", somAtivo === som.id ? "bg-primary text-white" : "bg-background border")}>
                        {som.emoji} {som.label}
                      </button>
                    ))}
                  </div>
                  {somAtivo !== 'silencio' && (
                    <div className="flex items-center gap-3 mt-2">
                      <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="flex-1" />
                    </div>
                  )}
                </div>
              )}

              {/* Formulário pós-timer */}
              {estadoTimer === 'finished' && renderFormularioAcertosLinks()}
            </>
          )}

          {/* MODO MANUAL: REGISTRO DIRETO */}
          {modoRegistro === 'manual' && (
            <div className="mt-6 border-t border-border pt-6 space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="w-4 h-4" /> Tempo Total Estudado (Minutos)</Label>
                <div className="flex items-center">
                  <Button variant="outline" size="icon" className="rounded-r-none h-12 w-12" onClick={() => setMinutosManuais(m => Math.max(5, m - 5))}><Minus className="w-5 h-5" /></Button>
                  <Input type="number" value={minutosManuais} onChange={e => setMinutosManuais(Number(e.target.value))} className="rounded-none text-center font-mono font-bold text-2xl h-12 border-x-0" />
                  <Button variant="outline" size="icon" className="rounded-l-none h-12 w-12" onClick={() => setMinutosManuais(m => m + 5)}><Plus className="w-5 h-5" /></Button>
                </div>
              </div>

              {renderFormularioAcertosLinks()}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
