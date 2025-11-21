import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to dashboard or login based on auth
  redirect('/login')
}
