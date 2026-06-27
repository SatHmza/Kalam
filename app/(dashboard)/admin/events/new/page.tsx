import dynamic from 'next/dynamic'

const NewEventForm = dynamic(() => import('./NewEventForm'), { ssr: false })

export default function NewEventPage() {
  return <NewEventForm />
}
