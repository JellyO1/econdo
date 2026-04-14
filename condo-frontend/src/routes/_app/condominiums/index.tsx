import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getApiCondominiumsOptions } from '@/api/@tanstack/react-query.gen'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const Route = createFileRoute('/_app/condominiums/')({
  component: CondominiumsPage,
})

function CondominiumsPage() {
  const { data, isPending, isError } = useQuery(getApiCondominiumsOptions())

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Condominiums</h1>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load condominiums.</AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>NIF</TableHead>
            <TableHead>IBAN</TableHead>
            <TableHead>Admins</TableHead>
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
            : data?.map(c => (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell>
                    <Link to="/condominiums/$condominiumId" params={{ condominiumId: String(c.id) }} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.address}</TableCell>
                  <TableCell className="font-mono text-sm">{c.nif}</TableCell>
                  <TableCell className="font-mono text-sm">{c.iban}</TableCell>
                  <TableCell>{c.admins.length}</TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}
