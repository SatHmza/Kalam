'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [lang, setLang] = useState<'fr' | 'ar'>('fr')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError('')
    const res = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (res?.error) {
      setError(lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Email ou mot de passe incorrect')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Language toggle */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setLang('fr')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${lang === 'fr' ? 'bg-primary text-white' : 'bg-white text-muted-foreground border'}`}
        >
          FR
        </button>
        <button
          onClick={() => setLang('ar')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${lang === 'ar' ? 'bg-primary text-white' : 'bg-white text-muted-foreground border'}`}
        >
          AR
        </button>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl">
            {lang === 'ar' ? 'مرحباً بكم في كلام' : 'Bienvenue sur Kalam'}
          </CardTitle>
          <CardDescription>
            {lang === 'ar' ? 'سجّل دخولك إلى فضائك' : 'Connectez-vous à votre espace'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                {lang === 'ar' ? 'البريد الإلكتروني' : 'Adresse email'}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@ecole.ma"
                autoComplete="email"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {lang === 'ar' ? 'كلمة المرور' : 'Mot de passe'}
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {lang === 'ar' ? 'تسجيل الدخول' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
