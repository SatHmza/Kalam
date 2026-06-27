export const dynamic = 'force-dynamic'

import dynamic from 'next/dynamic'

const NewClassForm = dynamic(() => import('./NewClassForm'), { ssr: false, loading: () => null })

export default function NewClassPage() {
  return <NewClassForm />
}
