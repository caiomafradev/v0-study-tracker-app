'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { MOCK_DATA, type PlanoData, type Sessao } from '@/lib/mock-data'

interface StudyContextType {
  dadosGerais: Record<string, PlanoData>
  getDataLocal: () => string
  adicionarSessaoGlobal: (planoId: string, novaSessao: Omit<Sessao, 'id' | 'data'>) => void
  atualizarStats: (planoId: string, tempoSegundos: number, acertos: number, erros: number) => void
}

const StudyContext = createContext<StudyContextType | undefined>(undefined)

export function StudyProvider({ children }: { children: ReactNode }) {
  const [dadosGerais, setDadosGerais] = useState<Record<string, PlanoData>>(
    // Deep clone para evitar mutação do MOCK_DATA original
    JSON.parse(JSON.stringify(MOCK_DATA))
  )

  // Retorna a data atual ajustada para o fuso horário local no formato 'YYYY-MM-DD'
  const getDataLocal = useCallback((): string => {
    const agora = new Date()
    const offset = agora.getTimezoneOffset() * 60000 // offset em milissegundos
    const dataLocal = new Date(agora.getTime() - offset)
    return dataLocal.toISOString().split('T')[0]
  }, [])

  // Adiciona uma nova sessão ao plano especificado
  const adicionarSessaoGlobal = useCallback((planoId: string, novaSessao: Omit<Sessao, 'id' | 'data'>) => {
    setDadosGerais(prev => {
      const plano = prev[planoId]
      if (!plano) {
        console.error(`[StudyContext] Plano não encontrado: ${planoId}`)
        return prev
      }

      const sessaoCompleta: Sessao = {
        ...novaSessao,
        id: `s${Date.now()}`,
        data: getDataLocal(),
      }

      return {
        ...prev,
        [planoId]: {
          ...plano,
          sessoes: [...plano.sessoes, sessaoCompleta],
        },
      }
    })
  }, [getDataLocal])

  // Atualiza as estatísticas do plano após uma sessão
  const atualizarStats = useCallback((planoId: string, tempoSegundos: number, acertos: number, erros: number) => {
    setDadosGerais(prev => {
      const plano = prev[planoId]
      if (!plano) return prev

      const hoje = getDataLocal()
      const sessoesHoje = plano.sessoes.filter(s => s.data === hoje)
      const estudouHoje = sessoesHoje.length > 0

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
            diasEstudados: estudouHoje ? plano.stats.diasEstudados : plano.stats.diasEstudados + 1,
            streak: estudouHoje ? plano.stats.streak : plano.stats.streak + 1,
            recordeStreak: Math.max(plano.stats.recordeStreak, plano.stats.streak + 1),
          },
        },
      }
    })
  }, [getDataLocal])

  return (
    <StudyContext.Provider value={{ dadosGerais, getDataLocal, adicionarSessaoGlobal, atualizarStats }}>
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
