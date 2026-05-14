'use client'

import { BookOpen, ChevronDown, Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PLANOS } from '@/lib/mock-data'

interface HeaderProps {
  planoAtivo: string
  onPlanoChange: (plano: string) => void
  onAddEstudo: () => void
}

export function Header({ planoAtivo, onPlanoChange, onAddEstudo }: HeaderProps) {
  const planoAtual = PLANOS.find(p => p.id === planoAtivo) || PLANOS[0]

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border shadow-sm z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-xl text-foreground">Study Tracker</span>
        </div>

        {/* Dropdown de Plano */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 font-body">
              <span className="text-lg">📋</span>
              {planoAtual.nome}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-64">
            {PLANOS.map((plano) => (
              <DropdownMenuItem
                key={plano.id}
                onClick={() => onPlanoChange(plano.id)}
                className={plano.id === planoAtivo ? 'bg-success-light text-primary' : ''}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{plano.nome}</span>
                  <span className="text-xs text-muted-foreground">{plano.cargo} • {plano.banca}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Ações */}
        <div className="flex items-center gap-3">
          <Button onClick={onAddEstudo} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Adicionar Estudo
          </Button>
          
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-heading font-bold">
            JS
          </div>
        </div>
      </div>
    </header>
  )
}
