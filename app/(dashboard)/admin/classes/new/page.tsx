import dynamic from 'next/dynamic'

const NewClassForm = dynamic(() => import('./NewClassForm'), { ssr: false })

export default function NewClassPage() {
  return <NewClassForm />
}
