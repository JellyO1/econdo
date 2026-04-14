import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/expenses/')({
  component: () => (
    <div>
      <h1 className="text-2xl font-semibold">Expenses</h1>
      <p className="text-muted-foreground mt-2">Expense tracking coming soon.</p>
    </div>
  ),
})
