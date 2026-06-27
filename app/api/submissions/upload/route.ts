import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireAuth, err } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  const { session, res } = await requireAuth(['student'])
  if (res) return res

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const materialId = formData.get('materialId') as string

  if (!file) return err('Aucun fichier')

  const MAX_BYTES = 10 * 1024 * 1024
  if (file.size > MAX_BYTES) return err('Fichier trop volumineux (max 10 Mo)', 413)

  const { schoolId, id: studentId } = session!.user
  const pathname = `${schoolId}/submissions/${materialId}/${studentId}-${Date.now()}-${file.name}`

  const blob = await put(pathname, file, { access: 'public' })

  return NextResponse.json({ url: blob.url, sizeKb: Math.round(file.size / 1024) })
}
