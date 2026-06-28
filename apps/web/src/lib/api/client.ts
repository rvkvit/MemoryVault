import axios, { type AxiosError } from 'axios'
import type { ApiError } from '@/types/farewell'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '',
  withCredentials: true, // sends the __Host-farewell-session cookie automatically
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
})

// Response interceptor — normalize error shape
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const apiError = error.response?.data

    // Attach a clean message to the error object
    if (apiError?.detail) {
      error.message = apiError.detail
    }

    // Redirect to login on 401
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const slug = window.location.pathname.split('/to/')?.[1]
      if (slug) {
        window.location.href = `/api/v1/auth/login?slug=${slug}`
      }
    }

    return Promise.reject(error)
  },
)

// ── Typed helper wrappers ─────────────────────────────────────────────────────

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await apiClient.get<T>(url, { params })
  return data
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.post<T>(url, body)
  return data
}
