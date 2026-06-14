import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Wine } from "lucide-react";

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/aged-paper.png')" }}></div>
      <div className="w-full max-w-md bg-card border shadow-xl rounded-xl p-8 text-center relative z-10">
        <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6">
          <Wine className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Minha Adega</h1>
        <p className="text-muted-foreground mb-8 text-lg font-serif italic">Seu acervo pessoal de vinhos.</p>
        
        <Button 
          size="lg" 
          className="w-full text-lg py-6" 
          onClick={login}
          data-testid="login-button"
        >
          Entrar com Replit
        </Button>
      </div>
    </div>
  );
}
