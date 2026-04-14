import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getApiCondominiumsOptions, getApiOwnersOptions } from '@/api/@tanstack/react-query.gen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Users } from 'lucide-react'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: condominiums, isPending: condoPending } = useQuery(getApiCondominiumsOptions())
  const { data: owners, isPending: ownersPending } = useQuery(getApiOwnersOptions())

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/condominiums">
          <Card className="hover:bg-accent transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Condominiums</CardTitle>
              <Building2 className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              {condoPending
                ? <Skeleton className="h-8 w-12" />
                : <p className="text-3xl font-bold">{condominiums?.length ?? 0}</p>}
            </CardContent>
          </Card>
        </Link>

        <Link to="/owners">
          <Card className="hover:bg-accent transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Owners</CardTitle>
              <Users className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              {ownersPending
                ? <Skeleton className="h-8 w-12" />
                : <p className="text-3xl font-bold">{owners?.length ?? 0}</p>}
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
