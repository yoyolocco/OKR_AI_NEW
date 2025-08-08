import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Rocket } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp, user, loading } = useAuth(); // user ve loading durumlarını da al
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      // Kullanıcı giriş yapmışsa ve yükleme bitmişse ana sayfaya yönlendir
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Email state:", email);
    console.log("handleLogin tetiklendi.");
    console.log("Email:", email, "Password:", password);
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Eksik Bilgi",
        description: "Lütfen e-posta ve şifre alanlarını doldurun.",
      });
      return;
    }
    setIsSubmitting(true);
    const { data, error } = await signIn(email, password);
    if (error) {
      console.error("Giriş hatası:", error);
      toast({
        variant: "destructive",
        title: "Giriş Başarısız",
        description: error.message || "Bir şeyler ters gitti",
      });
    } else if (data.user) {
      console.log("Giriş başarılı:", data.user);
      toast({
        title: "Giriş Başarılı!",
        description: "Hoş geldiniz!",
      });
      // Yönlendirme useEffect tarafından yapılacak
    }
    setIsSubmitting(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Eksik Bilgi",
        description: "Lütfen e-posta ve şifre alanlarını doldurun.",
      });
      return;
    }
    setIsSubmitting(true);
    const { data, error } = await signUp(email, password);
    if (!error && data.user) {
      toast({
        title: "Kayıt Başarılı!",
        description: "Giriş yapmadan önce lütfen e-postanızı doğrulayın.",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-dark">
      <div className="w-full max-w-md p-8 space-y-8 glassmorphism rounded-xl">
        <div className="text-center">
            <Rocket className="mx-auto h-12 w-12 text-brand-cyan" />
            <h1 className="mt-6 text-3xl font-extrabold text-white">
            OKR-AI'ye Hoş Geldiniz
            </h1>
            <p className="mt-2 text-gray-400">Giriş yapın veya yeni hesap oluşturun</p>
        </div>
        <form className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <Label htmlFor="email-address" className="sr-only">
                Email adresi
              </Label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="bg-slate-700 border-brand-cyan/30"
                placeholder="Email adresi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password"className="sr-only">
                Şifre
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="bg-slate-700 border-brand-cyan/30 mt-4"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="font-medium text-brand-cyan hover:text-brand-cyan-light" onClick={(e) => { e.preventDefault(); toast({ title: "🚧 Bu özellik henüz tamamlanmadı!", description: "Ama endişelenmeyin! Bir sonraki isteminizde talep edebilirsiniz! 🚀" }); }}>
                Şifrenizi mi unuttunuz?
              </a>
            </div>
          </div>

          <div>
            <Button onClick={handleLogin} type="submit" className="w-full bg-brand-cyan text-brand-dark hover:bg-brand-cyan/90" disabled={isSubmitting}>
              {isSubmitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </Button>
             <Button onClick={handleSignUp} variant="outline" className="w-full mt-4 border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10" disabled={isSubmitting}>
              {isSubmitting ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;