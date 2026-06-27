export const dynamic = 'force-dynamic'

import nextDynamic from 'next/dynamic'

const NewUserForm = nextDynamic(() => import('./NewUserForm'), { ssr: false, loading: () => null })

export default function NewUserPage() {
  return <NewUserForm />
}
