import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useAuth } from '@/context/auth-context'
import { postAccountLogin } from '@/api'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

function LoginPage() {
  const { refresh } = useAuth()
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: loginSchema,
      onSubmitAsync: async ({ value }) => {
        const { error } = await postAccountLogin({
          body: value,
          query: { useCookies: true },
        })
        if (error) {
          const detail = (error as Record<string, unknown>)['detail']
          return typeof detail === 'string' ? detail : 'Invalid email or password.'
        }
        await refresh()
        void navigate({ to: '/dashboard' })
        return undefined
      },
    },
  })

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Enter your credentials to access eCondo</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={e => {
            e.preventDefault()
            void form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field
            name="email"
          >
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  type="email"
                  autoComplete="email"
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {!field.state.meta.isValid && (
                  <p className="text-destructive text-sm">{field.state.meta.errors.map((e) => e?.message).join(', ')}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="password"
          >
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Password</Label>
                <Input
                  id={field.name}
                  type="password"
                  autoComplete="current-password"
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {!field.state.meta.isValid && (
                  <p className="text-destructive text-sm">{field.state.meta.errors.map((e) => e?.message).join(', ')}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={state => state.errorMap.onSubmit}>
            {error => error ? <p className="text-destructive text-sm">{String(error)}</p> : null}
          </form.Subscribe>

          <form.Subscribe selector={state => state.isSubmitting}>
            {isSubmitting => (
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  )
}
