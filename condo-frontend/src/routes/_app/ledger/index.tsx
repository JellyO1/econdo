import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getApiLedgerEntriesOptions } from '@/api/@tanstack/react-query.gen'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const Route = createFileRoute('/_app/ledger/')({
  component: LedgerPage,
})

function LedgerPage() {
  const { data, isPending, isError } = useQuery(getApiLedgerEntriesOptions())

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ledger</h1>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load ledger entries.</AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Owner</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending
            ? Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            : data?.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.principalOwnerName}</TableCell>
                  <TableCell>{e.type}</TableCell>
                  <TableCell className="font-mono text-sm">{Number(e.amount).toFixed(2)} €</TableCell>
                  <TableCell>{new Date(e.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === 'Paid' ? 'default' : 'secondary'}>
                      {e.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}
