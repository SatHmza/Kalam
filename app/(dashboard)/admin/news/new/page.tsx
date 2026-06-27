export const dynamic = 'force-dynamic'

import nextDynamic from 'next/dynamic'

const NewNewsForm = nextDynamic(() => import('./NewNewsForm'), { ssr: false, loading: () => null })

export default function NewNewsPage() {
  return <NewNewsForm />
}
