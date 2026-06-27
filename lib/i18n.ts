import fr from '@/messages/fr.json'
import ar from '@/messages/ar.json'

type Messages = typeof fr
type Lang = 'fr' | 'ar'

const messages: Record<Lang, Messages> = { fr, ar }

export function getT(lang: string): (key: string) => string {
  const locale = (lang === 'ar' ? 'ar' : 'fr') as Lang
  const m = messages[locale]
  return (key: string) => {
    const parts = key.split('.')
    let val: unknown = m
    for (const p of parts) val = (val as Record<string, unknown>)?.[p]
    return (typeof val === 'string' ? val : key)
  }
}

export function dir(lang: string): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr'
}
