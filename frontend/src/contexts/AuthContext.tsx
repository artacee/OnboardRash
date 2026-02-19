/**
 * AuthContext — Simple authentication state management
 * 
 * Provides login/logout functionality and auth status
 * to the entire app via React Context.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface User {
  username: string
  role?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (username?: string, role?: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Persist auth across page refreshes
    return sessionStorage.getItem('onboardrash_auth') === 'true'
  })

  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('onboardrash_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = useCallback((username?: string, role?: string) => {
    setIsAuthenticated(true)
    sessionStorage.setItem('onboardrash_auth', 'true')
    if (username) {
      const userData = { username, role: role || 'admin' }
      setUser(userData)
      sessionStorage.setItem('onboardrash_user', JSON.stringify(userData))
    }
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    setUser(null)
    sessionStorage.removeItem('onboardrash_auth')
    sessionStorage.removeItem('onboardrash_user')
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
