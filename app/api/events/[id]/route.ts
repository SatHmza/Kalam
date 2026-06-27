export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, res } = await requireAuth(['admin'])
  if (res) return res
  const { schoolId } = session!.user

  const event = await db.event.findFirst({ where: { id: params.id, schoolId } })
  if (!event) return err('Non trouvé', 404)

  await db.event.delete({ where: { id: params.id } })
  return ok({ deleted: true })
}
