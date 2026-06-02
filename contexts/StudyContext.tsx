'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { MOCK_DATA, type PlanoData, type Sessao } from '@/lib/mock-data'

interface CicloItem {
  disciplinaId: string
  minutos: number
}

interface StudyContextType {
  dadosGerais: Record<string, PlanoData>
  ciclosEstudo: Record<string, CicloItem[]>
  getDataLocal: () => string
  adicionarSessaoGlobal: (planoId: string, novaSessao: Omit<Sessao, 'id' | 'data'>) => void
  atualizarStats: (planoId: string, tempoSegundos: number, acertos: number, erros: number) => void
  getSessoesFiltradas: (planoId: string | 'todos', filtro: FiltroPeriodo, dataInicio?: string, dataFim?: string) => Sessao[]
  salvarCicloEstudo: (planoId: string, ciclo: CicloItem[]) => void
  atualizarTopico: (planoId: string, disciplinaId: string, topicoId: string, updates: { concluido?: boolean; acertos?: number; erros?: number }) => void
}

type FiltroPeriodo = 'hoje' | 'semana' | 'mes' | 'total' | 'personalizado'

const StudyContext = createContext<StudyContextType | undefined>(undefined)

export function StudyProvider({ children }: { children: ReactNode }) {
  const [dadosGerais, setDadosGerais] = useState<Record<string, PlanoData>>(
    JSON.parse(JSON.stringify(MOCK_DATA))
  )
  const [ciclosEstudo, setCiclosEstudo] = useState<Record<string, CicloItem[]>>({})

  // Retorna a data atual ajustada para o fuso horario local no formato 'YYYY-MM-DD'
  const getDataLocal = useCallback((): string => {
    const agora = new Date()
    const offset = agora.getTimezoneOffset() * 60000
    const dataLocal = new Date(agora.getTime() - offset)
    return dataLocal.toISOString().split('T')[0]
  }, [])

  // Adiciona uma nova sessao ao plano especificado
  const adicionarSessaoGlobal = useCallback((planoId: string, novaSessao: Omit<Sessao, 'id' | 'data'>) => {
    const dataHoje = getDataLocal()
    
    setDadosGerais(prev => {
      const plano = prev[planoId]
      if (!plano) {
        console.error(`[StudyContext] Plano nao encontrado: ${planoId}`)
        return prev
      }

      const sessaoCompleta: Sessao = {
        ...novaSessao,
        id: `s${Date.now()}`,
        data: dataHoje,
      }

      // Atualiza os acertos/erros no topico tambem
      const novasDisciplinas = plano.disciplinas.map(disc => {
        if (disc.id === novaSessao.disciplinaId) {
          return {
            ...disc,
            topicos: disc.topicos.map(t => {
              if (t.id === novaSessao.topicoId) {
                return {
                  ...t,
                  acertos: t.acertos + (novaSessao.acertos || 0),
                  erros: t.erros + (novaSessao.erros || 0),
                  ultimaRevisao: dataHoje
                }
              }
              return t
            })
          }
        }
        return disc
      })

      return {
        ...prev,
        [planoId]: {
          ...plano,
          disciplinas: novasDisciplinas,
          sessoes: [...plano.sessoes, sessaoCompleta],
        },
      }
    })
  }, [getDataLocal])

  // Atualiza as estatisticas do plano apos uma sessao
  const atualizarStats = useCallback((planoId: string, tempoSegundos: number, acertos: number, erros: number) => {
    const hoje = getDataLocal()
    
    setDadosGerais(prev => {
      const plano = prev[planoId]
      if (!plano) return prev

      // Verifica se ja estudou hoje ANTES de adicionar a sessao atual
      const sessoesHojeAntes = plano.sessoes.filter(s => s.data === hoje)
      const jaEstudouHoje = sessoesHojeAntes.length > 0

      return {
        ...prev,
        [planoId]: {
          ...plano,
          stats: {
            ...plano.stats,
            tempoTotalSegundos: plano.stats.tempoTotalSegundos + tempoSegundos,
            totalQuestoes: plano.stats.totalQuestoes + acertos + erros,
            totalAcertos: plano.stats.totalAcertos + acertos,
            totalErros: plano.stats.totalErros + erros,
            diasEstudados: jaEstudouHoje ? plano.stats.diasEstudados : plano.stats.diasEstudados + 1,
            streak: jaEstudouHoje ? plano.stats.streak : plano.stats.streak + 1,
            recordeStreak: Math.max(plano.stats.recordeStreak, jaEstudouHoje ? plano.stats.streak : plano.stats.streak + 1),
          },
        },
      }
    })
  }, [getDataLocal])

  // Filtra sessoes por periodo
  const getSessoesFiltradas = useCallback((planoId: string | 'todos', filtro: FiltroPeriodo, dataInicio?: string, dataFim?: string): Sessao[] => {
    const hoje = getDataLocal()
    const hojeDate = new Date(hoje + 'T12:00:00')
    
    // Coleta sessoes de um ou todos os planos
    let sessoes: Sessao[] = []
    if (planoId === 'todos') {
      Object.values(dadosGerais).forEach(plano => {
        sessoes = [...sessoes, ...plano.sessoes]
      })
    } else {
      sessoes = dadosGerais[planoId]?.sessoes || []
    }

    // Aplica filtro de periodo
    return sessoes.filter(sessao => {
      switch (filtro) {
        case 'hoje':
          return sessao.data === hoje
        case 'semana': {
          const dataInicioSemana = new Date(hojeDate)
          dataInicioSemana.setDate(dataInicioSemana.getDate() - 7)
          const dataInicioStr = dataInicioSemana.toISOString().split('T')[0]
          return sessao.data >= dataInicioStr && sessao.data <= hoje
        }
        case 'mes': {
          const dataInicioMes = new Date(hojeDate)
          dataInicioMes.setDate(dataInicioMes.getDate() - 30)
          const dataInicioMesStr = dataInicioMes.toISOString().split('T')[0]
          return sessao.data >= dataInicioMesStr && sessao.data <= hoje
        }
        case 'personalizado':
          if (!dataInicio || !dataFim) return true
          return sessao.data >= dataInicio && sessao.data <= dataFim
        case 'total':
        default:
          return true
      }
    })
  }, [dadosGerais, getDataLocal])

  // Salva ciclo de estudos para um plano
  const salvarCicloEstudo = useCallback((planoId: string, ciclo: CicloItem[]) => {
    setCiclosEstudo(prev => ({
      ...prev,
      [planoId]: ciclo
    }))
  }, [])

  // Atualiza um topico especifico
  const atualizarTopico = useCallback((planoId: string, disciplinaId: string, topicoId: string, updates: { concluido?: boolean; acertos?: number; erros?: number }) => {
    setDadosGerais(prev => {
      const plano = prev[planoId]
      if (!plano) return prev

      return {
        ...prev,
        [planoId]: {
          ...plano,
          disciplinas: plano.disciplinas.map(disc => {
            if (disc.id === disciplinaId) {
              return {
                ...disc,
                topicos: disc.topicos.map(t => {
                  if (t.id === topicoId) {
                    return { ...t, ...updates }
                  }
                  return t
                })
              }
            }
            return disc
          })
        }
      }
    })
  }, [])

  return (
    <StudyContext.Provider value={{ 
      dadosGerais, 
      ciclosEstudo,
      getDataLocal, 
      adicionarSessaoGlobal, 
      atualizarStats,
      getSessoesFiltradas,
      salvarCicloEstudo,
      atualizarTopico
    }}>
      {children}
    </StudyContext.Provider>
  )
}

export function useStudy() {
  const context = useContext(StudyContext)
  if (context === undefined) {
    throw new Error('useStudy deve ser usado dentro de um StudyProvider')
  }
  return context
}
