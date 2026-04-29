import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'
import { getApiCondominiumsOptions } from '@/api/@tanstack/react-query.gen'
import { postApiCondominiums } from '@/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Role } from '@/lib/roles'

export const Route = createFileRoute('/_app/condominiums/')({
  component: CondominiumsPage,
})

const condominiumSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  nif: z.string().min(1, 'NIF is required'),
  iban: z.string().min(1, 'IBAN is required'),
})

function NewCondominiumDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)

  const form = useForm({
    defaultValues: { name: '', address: '', nif: '', iban: '' },
    validators: {
      onChange: condominiumSchema,
      onSubmitAsync: async ({ value }) => {
        const { error } = await postApiCondominiums({ body: value })
        if (error) return 'Failed to create condominium.'
        onCreated()
        setOpen(false)
        return undefined
      },
    },
  })

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) form.reset()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Condominium</Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Condominium</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={e => { e.preventDefault(); void form.handleSubmit() }}
            className="space-y-4"
          >
            {(['name', 'address', 'nif', 'iban'] as const).map(field => (
              <form.Field key={field} name={field}>
                {f => (
                  <div className="space-y-2">
                    <Label htmlFor={`new-${field}`}>{field.toUpperCase()}</Label>
                    <Input
                      id={`new-${field}`}
                      value={f.state.value}
                      onChange={e => f.handleChange(e.target.value)}
                      onBlur={f.handleBlur}
                    />
                    {!f.state.meta.isValid && (
                      <p className="text-destructive text-sm">
                        {f.state.meta.errors.map(e => e?.message).join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            ))}

            <form.Subscribe selector={s => s.errorMap.onSubmit}>
              {(error: string | undefined) => error ? <p className="text-destructive text-sm">{error}</p> : null}
            </form.Subscribe>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <form.Subscribe selector={s => s.isSubmitting}>
                {(isSubmitting: boolean) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating…' : 'Create'}
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CondominiumsPage() {
  const { auth } = Route.useRouteContext()
  const isSuperUser = auth.user?.roles.includes(Role.SuperUser) ?? false

  const queryClient = useQueryClient()
  const { data, isPending, isError } = useQuery(getApiCondominiumsOptions())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Condominiums</h1>
        {isSuperUser && (
          <NewCondominiumDialog
            onCreated={() => void queryClient.invalidateQueries({ queryKey: getApiCondominiumsOptions().queryKey })}
          />
        )}
      </div>

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
