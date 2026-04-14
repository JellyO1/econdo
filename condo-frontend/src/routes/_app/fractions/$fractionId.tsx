import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getApiFractionsByIdOptions, getApiFractionsByIdOwnersOptions, getApiQuotaConfigsOptions } from '@/api/@tanstack/react-query.gen'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const Route = createFileRoute('/_app/fractions/$fractionId')({
  component: FractionDetailPage,
})

function FractionDetailPage() {
  const { fractionId } = Route.useParams()
  const id = Number(fractionId)

  const { data: fraction, isPending, isError } = useQuery(getApiFractionsByIdOptions({ path: { id } }))
  const { data: owners, isPending: ownersPending } = useQuery(getApiFractionsByIdOwnersOptions({ path: { id } }))
  const { data: quotaConfigs, isPending: quotaPending } = useQuery(getApiQuotaConfigsOptions({ query: { fractionId: id } }))

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load fraction.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {isPending
            ? <Skeleton className="h-8 w-32" />
            : `${fraction?.block ? `${fraction.block} ` : ''}${fraction?.floor}${fraction?.letter}`}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-muted-foreground text-xs uppercase tracking-wide">Permilage</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? <Skeleton className="h-5 w-16" /> : <p className="font-mono text-sm">{Number(fraction?.permilage).toFixed(1)} ‰</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-muted-foreground text-xs uppercase tracking-wide">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? <Skeleton className="h-5 w-20" /> : <p>{fraction?.paymentStatus}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Owners</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Principal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ownersPending
              ? Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 2 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : owners?.map(o => (
                  <TableRow key={o.ownerId}>
                    <TableCell className="font-medium">{o.ownerName}</TableCell>
                    <TableCell>
                      {o.isPrincipal && <Badge>Principal</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Quota Configs</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Monthly Value</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotaPending
              ? Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : quotaConfigs?.map(q => (
                  <TableRow key={q.id}>
                    <TableCell className="font-mono text-sm">{Number(q.monthlyValue).toFixed(2)} €</TableCell>
                    <TableCell>{new Date(q.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{q.endDate ? new Date(q.endDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{q.isActive && <Badge>Active</Badge>}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
