import dynamic from 'next/dynamic'

const NewUserForm = dynamic(() => import('./NewUserForm'), { ssr: false })

export default function NewUserPage() {
  return <NewUserForm />
}
