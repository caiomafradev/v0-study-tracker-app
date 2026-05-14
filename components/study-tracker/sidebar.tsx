'use client'

import { 
  Home, 
  FileText, 
  History, 
  BarChart3, 
  Target,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLANOS } from '@/lib/mock-data'

interface SidebarProps {
  activeItem: string
  onItemClick: (item: string) => void
  planoAtivo?: string
}

const menuItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'edital', label: 'Edital', icon: FileText },
  { id: 'historico', label: 'Histórico', icon: History },
  { id: 'estatisticas', label: 'Estatísticas', icon: BarChart3 },
  { id: 'habitos', label: 'Hábitos', icon: Target },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar({ activeItem, onItemClick, planoAtivo = 'bb' }: SidebarProps) {
  const planoAtual = PLANOS.find(p => p.id === planoAtivo) || PLANOS[0]

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-[220px] bg-card border-r border-border flex flex-col">
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200",
                "hover:bg-sidebar-accent",
                isActive && "bg-success-light border-l-[3px] border-primary text-primary"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className={cn(
                "font-body",
                isActive ? "font-medium text-primary" : "text-foreground"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Rodapé com nome do plano */}
      <div className="p-4 border-t border-border">
        <div className="px-3 py-2 bg-primary/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Plano ativo</p>
          <p className="text-sm font-medium text-primary truncate">{planoAtual.nome}</p>
        </div>
      </div>
    </aside>
  )
}
