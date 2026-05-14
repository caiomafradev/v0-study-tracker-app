'use client'

/**
 * STUDY TRACKER - Página Principal
 * 
 * Este é o componente raiz que gerencia a navegação entre telas
 * e o estado global da aplicação.
 */

import { useState } from 'react'
import { Header } from '@/components/study-tracker/header'
import { Sidebar } from '@/components/study-tracker/sidebar'
import { Dashboard } from '@/components/study-tracker/dashboard'
import { ModalEstudo } from '@/components/study-tracker/modal-estudo'
import { Edital } from '@/components/study-tracker/edital'
import { Historico } from '@/components/study-tracker/historico'
import { Estatisticas } from '@/components/study-tracker/estatisticas'
import { Habitos } from '@/components/study-tracker/habitos'
import { Settings, LogOut, User, Bell, Calendar, Palette } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PLANOS, MOCK_DATA } from '@/lib/mock-data'

// Tipo para o preenchimento da modal
interface PreenchimentoModal {
  plano?: string
  disciplina?: string
  topico?: string
}

export default function StudyTrackerPage() {
  // Estado do plano ativo
  const [planoAtivo, setPlanoAtivo] = useState('bb')
  
  // Estado da tela/seção ativa
  const [telaAtiva, setTelaAtiva] = useState('home')
  
  // Estado da modal de estudo
  const [modalEstudoAberto, setModalEstudoAberto] = useState(false)
  
  // Estado para pré-preenchimento da modal
  const [preenchimentoModal, setPreenchimentoModal] = useState<PreenchimentoModal | undefined>(undefined)

  /**
   * Abre a modal de estudo, opcionalmente com campos pré-preenchidos.
   */
  const abrirModalEstudo = (preenchimento?: PreenchimentoModal) => {
    setPreenchimentoModal(preenchimento)
    setModalEstudoAberto(true)
  }

  /**
   * Fecha a modal e limpa o preenchimento
   */
  const fecharModalEstudo = () => {
    setModalEstudoAberto(false)
    setPreenchimentoModal(undefined)
  }

  /**
   * Componente de Configurações
   */
  const Configuracoes = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua conta e preferências</p>
      </div>

      {/* Conta Google */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Conta Google
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-heading font-bold text-2xl">
              JS
            </div>
            <div>
              <p className="font-medium">João Silva</p>
              <p className="text-sm text-muted-foreground">joaosilva@gmail.com</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Badge variant="secondary" className="gap-1">
              ✅ Logado via Google OAuth
            </Badge>
            <Badge variant="secondary" className="gap-1">
              ✅ Google Agenda conectado
            </Badge>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="text-muted-foreground">
              Desconectar do Agenda
            </Button>
            <Button variant="destructive" className="gap-2">
              <LogOut className="w-4 h-4" />
              Sair da conta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Estudo */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alertas de Estudo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Ativar lembrete diário por email</Label>
              <p className="text-sm text-muted-foreground">Receba um lembrete para estudar</p>
            </div>
            <Switch />
          </div>

          <div className="space-y-2">
            <Label>Horário do lembrete</Label>
            <Input type="time" defaultValue="20:00" className="w-32" />
            <p className="text-xs text-muted-foreground">Horário de Brasília (UTC-3)</p>
          </div>

          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Criar evento recorrente no Google Agenda
          </Button>
        </CardContent>
      </Card>

      {/* Planos de Concurso */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Planos de Concurso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PLANOS.map(plano => (
            <div 
              key={plano.id}
              className="p-3 border border-border rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{plano.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {plano.cargo} • {plano.banca} • Prova: {new Date(plano.dataProva).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Badge variant={plano.id === planoAtivo ? 'default' : 'secondary'}>
                {plano.id === planoAtivo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          ))}
          
          <Button variant="outline" className="w-full gap-2">
            + Novo Concurso
          </Button>
        </CardContent>
      </Card>

      {/* Preferências */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Preferências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Modo escuro</Label>
              <p className="text-sm text-muted-foreground">Em breve</p>
            </div>
            <Switch disabled />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Idioma</Label>
              <p className="text-sm text-muted-foreground">Português (Brasil)</p>
            </div>
            <Badge variant="secondary">PT-BR</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Fuso horário</Label>
              <p className="text-sm text-muted-foreground">America/Sao_Paulo — Brasília</p>
            </div>
            <Badge variant="secondary">UTC-3</Badge>
          </div>

          <div className="pt-4 border-t border-border">
            <Button variant="destructive" className="w-full">
              Redefinir todos os dados
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Esta ação não pode ser desfeita
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  /**
   * Renderiza a tela ativa com base no estado
   */
  const renderTela = () => {
    switch (telaAtiva) {
      case 'home':
        return <Dashboard planoAtivo={planoAtivo} />
      
      case 'edital':
        return <Edital planoAtivo={planoAtivo} onOpenTimer={abrirModalEstudo} />
      
      case 'historico':
        return <Historico planoAtivo={planoAtivo} />
      
      case 'estatisticas':
        return <Estatisticas planoAtivo={planoAtivo} onOpenTimer={abrirModalEstudo} />
      
      case 'habitos':
        return <Habitos />
      
      case 'configuracoes':
        return <Configuracoes />
      
      default:
        return <Dashboard planoAtivo={planoAtivo} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header com botão de adicionar estudo */}
      <Header 
        planoAtivo={planoAtivo}
        onPlanoChange={setPlanoAtivo}
        onAddEstudo={() => abrirModalEstudo()}
      />
      
      {/* Sidebar de navegação */}
      <Sidebar 
        activeItem={telaAtiva}
        onItemClick={setTelaAtiva}
        planoAtivo={planoAtivo}
      />

      {/* Área de conteúdo principal */}
      <main className="pt-16 pl-[220px]">
        <div className="p-6">
          {renderTela()}
        </div>
      </main>

      {/* Modal de Estudo */}
      <ModalEstudo 
        isOpen={modalEstudoAberto}
        onClose={fecharModalEstudo}
        preenchimento={preenchimentoModal}
      />
    </div>
  )
}
