import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/settings/')({
  component: () => (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-muted-foreground mt-2">Settings coming soon.</p>
    </div>
  ),
})
