import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getApiOwnersOptions } from '@/api/@tanstack/react-query.gen'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const Route = createFileRoute('/_app/owners/')({
  component: OwnersPage,
})

function OwnersPage() {
  const { data, isPending, isError } = useQuery(getApiOwnersOptions())

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Owners</h1>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load owners.</AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>NIF</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Contact</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending
            ? Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            : data?.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell className="font-mono text-sm">{o.nif}</TableCell>
                  <TableCell>{o.email}</TableCell>
                  <TableCell>{o.contact}</TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}
