import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'
import {
  getApiCondominiumsByIdOptions,
  getApiFractionsOptions,
  getApiUsersOptions,
  deleteApiCondominiumsByIdMutation,
  postApiCondominiumsByIdAdminsByUserIdMutation,
  deleteApiCondominiumsByIdAdminsByUserIdMutation,
  deleteApiFractionsByIdMutation,
} from '@/api/@tanstack/react-query.gen'
import {
  putApiCondominiumsById,
  postApiFractions,
  putApiFractionsById,
} from '@/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Role } from '@/lib/roles'
import type { FractionDto, CondominiumDto } from '@/api'

export const Route = createFileRoute('/_app/condominiums/$condominiumId')({
  component: CondominiumDetailPage,
})

const condoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  nif: z.string().min(1, 'NIF is required'),
  iban: z.string().min(1, 'IBAN is required'),
})

const fractionSchema = z.object({
  block: z.string(),
  floor: z.string().min(1, 'Floor is required'),
  letter: z.string().min(1, 'Letter is required'),
  permilage: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
})

// ── Edit Condominium Dialog ──────────────────────────────────────────────────

function EditCondominiumDialog({
  condominium,
  onSaved,
}: {
  condominium: CondominiumDto
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)

  const form = useForm({
    defaultValues: {
      name: condominium.name,
      address: condominium.address,
      nif: condominium.nif,
      iban: condominium.iban,
    },
    validators: {
      onChange: condoSchema,
      onSubmitAsync: async ({ value }) => {
        const { error } = await putApiCondominiumsById({
          path: { id: Number(condominium.id) },
          body: value,
        })
        if (error) return 'Failed to update condominium.'
        onSaved()
        setOpen(false)
        return undefined
      },
    },
  })

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Edit</Button>
      <Dialog open={open} onOpenChange={next => { setOpen(next); if (!next) form.reset() }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Condominium</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); void form.handleSubmit() }} className="space-y-4">
            {(['name', 'address', 'nif', 'iban'] as const).map(field => (
              <form.Field key={field} name={field}>
                {f => (
                  <div className="space-y-2">
                    <Label htmlFor={`edit-condo-${field}`}>{field.toUpperCase()}</Label>
                    <Input
                      id={`edit-condo-${field}`}
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <form.Subscribe selector={s => s.isSubmitting}>
                {(isSubmitting: boolean) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Save'}
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

// ── Fraction Dialog (shared for Add and Edit) ────────────────────────────────

function FractionDialog({
  condominiumId,
  fraction,
  onSaved,
  trigger,
}: {
  condominiumId: number
  fraction?: FractionDto
  onSaved: () => void
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const isEdit = !!fraction

  const form = useForm({
    defaultValues: {
      block: fraction?.block ?? '',
      floor: fraction?.floor ?? '',
      letter: fraction?.letter ?? '',
      permilage: fraction ? String(fraction.permilage) : '',
    },
    validators: {
      onChange: fractionSchema,
      onSubmitAsync: async ({ value }) => {
        const body = {
          block: value.block || null,
          floor: value.floor,
          letter: value.letter,
          permilage: Number(value.permilage),
        }
        const { error } = isEdit
          ? await putApiFractionsById({ path: { id: Number(fraction!.id) }, body })
          : await postApiFractions({ body: { condominiumId, ...body } })
        if (error) return isEdit ? 'Failed to update fraction.' : 'Failed to add fraction.'
        onSaved()
        setOpen(false)
        return undefined
      },
    },
  })

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Dialog open={open} onOpenChange={next => { setOpen(next); if (!next) form.reset() }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isEdit ? 'Edit Fraction' : 'Add Fraction'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); void form.handleSubmit() }} className="space-y-4">
            <form.Field name="block">
              {f => (
                <div className="space-y-2">
                  <Label htmlFor="frac-block">Block</Label>
                  <Input id="frac-block" value={f.state.value} onChange={e => f.handleChange(e.target.value)} onBlur={f.handleBlur} placeholder="Optional" />
                </div>
              )}
            </form.Field>
            <form.Field name="floor">
              {f => (
                <div className="space-y-2">
                  <Label htmlFor="frac-floor">Floor</Label>
                  <Input id="frac-floor" value={f.state.value} onChange={e => f.handleChange(e.target.value)} onBlur={f.handleBlur} />
                  {!f.state.meta.isValid && <p className="text-destructive text-sm">{f.state.meta.errors.map(e => e?.message).join(', ')}</p>}
                </div>
              )}
            </form.Field>
            <form.Field name="letter">
              {f => (
                <div className="space-y-2">
                  <Label htmlFor="frac-letter">Letter</Label>
                  <Input id="frac-letter" value={f.state.value} onChange={e => f.handleChange(e.target.value)} onBlur={f.handleBlur} />
                  {!f.state.meta.isValid && <p className="text-destructive text-sm">{f.state.meta.errors.map(e => e?.message).join(', ')}</p>}
                </div>
              )}
            </form.Field>
            <form.Field name="permilage">
              {f => (
                <div className="space-y-2">
                  <Label htmlFor="frac-permilage">Permilage (‰)</Label>
                  <Input id="frac-permilage" type="number" step="0.001" value={f.state.value} onChange={e => f.handleChange(e.target.value)} onBlur={f.handleBlur} />
                  {!f.state.meta.isValid && <p className="text-destructive text-sm">{f.state.meta.errors.map(e => e?.message).join(', ')}</p>}
                </div>
              )}
            </form.Field>
            <form.Subscribe selector={s => s.errorMap.onSubmit}>
              {(error: string | undefined) => error ? <p className="text-destructive text-sm">{error}</p> : null}
            </form.Subscribe>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <form.Subscribe selector={s => s.isSubmitting}>
                {(isSubmitting: boolean) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (isEdit ? 'Saving…' : 'Adding…') : (isEdit ? 'Save' : 'Add')}
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

// ── Main page ────────────────────────────────────────────────────────────────

function CondominiumDetailPage() {
  const { condominiumId } = Route.useParams()
  const { auth } = Route.useRouteContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const id = Number(condominiumId)
  const isSuperUser = auth.user?.roles.includes(Role.SuperUser) ?? false
  const isAdmin = auth.user?.roles.includes(Role.Admin) ?? false
  const canManage = isSuperUser || isAdmin

  const condoQueryOpts = getApiCondominiumsByIdOptions({ path: { id } })
  const fractionsQueryOpts = getApiFractionsOptions({ query: { condominiumId: id } })

  const { data: condominium, isPending, isError } = useQuery(condoQueryOpts)
  const { data: fractions, isPending: fractionsPending } = useQuery(fractionsQueryOpts)
  const { data: users } = useQuery({ ...getApiUsersOptions(), enabled: isSuperUser })

  // Delete condominium
  const [deleteCondoOpen, setDeleteCondoOpen] = useState(false)
  const deleteCondo = useMutation({
    ...deleteApiCondominiumsByIdMutation(),
    onSuccess: () => void navigate({ to: '/condominiums' }),
  })

  // Assign admin
  const [assignAdminOpen, setAssignAdminOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const assignAdmin = useMutation({
    ...postApiCondominiumsByIdAdminsByUserIdMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: condoQueryOpts.queryKey })
      setAssignAdminOpen(false)
      setSelectedUserId('')
    },
  })
  const removeAdmin = useMutation({
    ...deleteApiCondominiumsByIdAdminsByUserIdMutation(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: condoQueryOpts.queryKey }),
  })

  // Delete fraction
  const [deleteFracId, setDeleteFracId] = useState<number | null>(null)
  const deleteFraction = useMutation({
    ...deleteApiFractionsByIdMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fractionsQueryOpts.queryKey })
      setDeleteFracId(null)
    },
  })

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load condominium.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isPending ? <Skeleton className="h-8 w-48" /> : condominium?.name}
        </h1>
        {canManage && condominium && (
          <div className="flex gap-2">
            <EditCondominiumDialog
              condominium={condominium}
              onSaved={() => void queryClient.invalidateQueries({ queryKey: condoQueryOpts.queryKey })}
            />
            {isSuperUser && (
              <Button variant="destructive" onClick={() => setDeleteCondoOpen(true)}>Delete</Button>
            )}
          </div>
        )}
      </div>

      {/* Info cards */}
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

      {/* Admins — SuperUser only */}
      {isSuperUser && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Admins</h2>
            <Button variant="outline" size="sm" onClick={() => setAssignAdminOpen(true)}>Assign Admin</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending
                ? Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                : condominium?.admins.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-muted-foreground text-sm">No admins assigned.</TableCell>
                      </TableRow>
                    )
                  : condominium?.admins.map(admin => (
                      <TableRow key={admin.userId}>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAdmin.mutate({ path: { id, userId: admin.userId } })}
                            disabled={removeAdmin.isPending}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Fractions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Fractions</h2>
          {canManage && (
            <FractionDialog
              condominiumId={id}
              onSaved={() => void queryClient.invalidateQueries({ queryKey: fractionsQueryOpts.queryKey })}
              trigger={<Button variant="outline" size="sm">Add Fraction</Button>}
            />
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Block</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Letter</TableHead>
              <TableHead>Permilage</TableHead>
              <TableHead>Payment Status</TableHead>
              {canManage && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fractionsPending
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: canManage ? 6 : 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : fractions?.map(f => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Link to="/fractions/$fractionId" params={{ fractionId: String(f.id) }} className="hover:underline">
                        {f.block ?? '—'}
                      </Link>
                    </TableCell>
                    <TableCell>{f.floor}</TableCell>
                    <TableCell>{f.letter}</TableCell>
                    <TableCell className="font-mono text-sm">{Number(f.permilage).toFixed(1)} ‰</TableCell>
                    <TableCell>{f.paymentStatus}</TableCell>
                    {canManage && (
                      <TableCell className="text-right space-x-1">
                        <FractionDialog
                          condominiumId={id}
                          fraction={f}
                          onSaved={() => void queryClient.invalidateQueries({ queryKey: fractionsQueryOpts.queryKey })}
                          trigger={<Button variant="ghost" size="sm">Edit</Button>}
                        />
                        <Button variant="ghost" size="sm" onClick={() => setDeleteFracId(Number(f.id))}>
                          Delete
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Condominium Dialog */}
      <Dialog open={deleteCondoOpen} onOpenChange={setDeleteCondoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Condominium</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{condominium?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCondoOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteCondo.isPending}
              onClick={() => deleteCondo.mutate({ path: { id } })}
            >
              {deleteCondo.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Admin Dialog */}
      <Dialog open={assignAdminOpen} onOpenChange={setAssignAdminOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Admin</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user…" />
              </SelectTrigger>
              <SelectContent>
                {users?.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignAdminOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedUserId || assignAdmin.isPending}
              onClick={() => assignAdmin.mutate({ path: { id, userId: selectedUserId } })}
            >
              {assignAdmin.isPending ? 'Assigning…' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Fraction Dialog */}
      <Dialog open={deleteFracId !== null} onOpenChange={open => { if (!open) setDeleteFracId(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Fraction</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this fraction? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFracId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteFraction.isPending}
              onClick={() => { if (deleteFracId !== null) deleteFraction.mutate({ path: { id: deleteFracId } }) }}
            >
              {deleteFraction.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
