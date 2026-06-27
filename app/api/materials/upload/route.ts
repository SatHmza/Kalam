export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireAuth, err } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  const { session, res } = await requireAuth(['teacher', 'admin'])
  if (res) return res

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const classSubjectId = formData.get('classSubjectId') as string

  if (!file) return err('Aucun fichier')

  const MAX_BYTES = 25 * 1024 * 1024
  if (file.size > MAX_BYTES) return err('Fichier trop volumineux (max 25 Mo)', 413)

  const { schoolId } = session!.user
  const pathname = `${schoolId}/materials/${classSubjectId}/${Date.now()}-${file.name}`

  const blob = await put(pathname, file, { access: 'public' })

  return NextResponse.json({ url: blob.url, sizeKb: Math.round(file.size / 1024) })
}
