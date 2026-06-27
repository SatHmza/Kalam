export const dynamic = 'force-dynamic'

import nextDynamic from 'next/dynamic'

const NewEventForm = nextDynamic(() => import('./NewEventForm'), { ssr: false, loading: () => null })

export default function NewEventPage() {
  return <NewEventForm />
}
