import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getApiCondominiumsByIdOptions, getApiFractionsOptions } from '@/api/@tanstack/react-query.gen'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const Route = createFileRoute('/_app/condominiums/$condominiumId')({
  component: CondominiumDetailPage,
})

function CondominiumDetailPage() {
  const { condominiumId } = Route.useParams()
  const id = Number(condominiumId)

  const { data: condominium, isPending, isError } = useQuery(
    getApiCondominiumsByIdOptions({ path: { id } })
  )
  const { data: fractions, isPending: fractionsPending } = useQuery(
    getApiFractionsOptions({ query: { condominiumId: id } })
  )

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load condominium.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {isPending ? <Skeleton className="h-8 w-48" /> : condominium?.name}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(['address', 'nif', 'iban'] as const).map(field => (
          <Card key={field}>
            <CardHeader className="pb-1">
              <CardTitle className="text-muted-foreground text-xs uppercase tracking-wide">{field}</CardTitle>
            </CardHeader>
            <CardContent>
              {isPending
                ? <Skeleton className="h-5 w-32" />
                : <p className="font-mono text-sm">{condominium?.[field]}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Fractions</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Block</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Letter</TableHead>
              <TableHead>Permilage</TableHead>
              <TableHead>Payment Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fractionsPending
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : fractions?.map(f => (
                  <TableRow key={f.id} className="cursor-pointer">
                    <TableCell>
                      <Link to="/fractions/$fractionId" params={{ fractionId: String(f.id) }} className="hover:underline">
                        {f.block ?? '—'}
                      </Link>
                    </TableCell>
                    <TableCell>{f.floor}</TableCell>
                    <TableCell>{f.letter}</TableCell>
                    <TableCell className="font-mono text-sm">{Number(f.permilage).toFixed(1)} ‰</TableCell>
                    <TableCell>{f.paymentStatus}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
