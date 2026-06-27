import dynamic from 'next/dynamic'

const NewNewsForm = dynamic(() => import('./NewNewsForm'), { ssr: false })

export default function NewNewsPage() {
  return <NewNewsForm />
}
