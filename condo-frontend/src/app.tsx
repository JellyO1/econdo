import { RouterProvider } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from './context/auth-context';
import { router } from './router';

export function App() {
  const auth = useAuth();

  useEffect(() => {
    void router.invalidate();
  }, [auth.status]);

  return <RouterProvider router={router} context={{ auth }} />;
}
