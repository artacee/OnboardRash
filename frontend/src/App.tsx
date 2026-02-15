import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { router } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(18, 18, 30, 0.9)',
            border: '1px solid rgba(248, 250, 252, 0.1)',
            color: '#F8FAFC',
            backdropFilter: 'blur(20px)',
          },
        }}
      />
    </QueryClientProvider>
  )
}
