export const dynamic = 'force-dynamic'

import nextDynamic from 'next/dynamic'

const NewClassForm = nextDynamic(() => import('./NewClassForm'), { ssr: false, loading: () => null })

export default function NewClassPage() {
  return <NewClassForm />
}
