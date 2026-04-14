import { Link } from '@tanstack/react-router'
import { BookOpen, Building2, LayoutDashboard, LogOut, Receipt, Settings, Users } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const navItems = [
  { title: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { title: 'Condominiums', to: '/condominiums', icon: Building2 },
  { title: 'Owners', to: '/owners', icon: Users },
  { title: 'Ledger', to: '/ledger', icon: BookOpen },
  { title: 'Expenses', to: '/expenses', icon: Receipt },
] as const

export function AppSidebar() {
  const { user, logout } = useAuth()

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 font-semibold">
          <Building2 className="size-5" />
          <span>eCondo</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.to}
                      activeProps={{ className: 'bg-sidebar-accent text-sidebar-accent-foreground' }}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-2">
          <Link
            to="/settings"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
          >
            <Settings className="size-4" />
            <span className="truncate">{user?.email}</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 px-0"
            onClick={() => void logout()}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
