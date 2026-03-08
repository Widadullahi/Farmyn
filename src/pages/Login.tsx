import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";
import farmLinkLogo from "@/assets/farmlink-logo.png";
import heroImage from "@/assets/hero-farm.jpg";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  const [email, setEmail] = useState("ada@buyer.ng");
  const [password, setPassword] = useState("demo1234");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = login(email, password);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    navigate("/");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-10 inline-flex items-center gap-2">
            <img src={farmLinkLogo} alt="FarmLink" className="h-8 w-8" />
            <span className="font-display text-lg font-bold text-foreground">
              Farm<span className="text-primary">Link</span>
            </span>
          </Link>

          <h1 className="font-display text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Demo accounts are preloaded so you can test flows without paying for backend auth yet.
          </p>

          <div className="mt-4 rounded-xl border border-border bg-accent/40 p-4 text-sm">
            <p className="font-semibold text-foreground">Demo buyer</p>
            <p className="mt-1 text-muted-foreground">Email: `ada@buyer.ng` • Password: `demo1234`</p>
            <p className="mt-2 font-semibold text-foreground">Demo seller</p>
            <p className="mt-1 text-muted-foreground">Email: `ngozi@farmlink.ng` • Password: `demo1234`</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email address</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <Button type="submit" className="w-full gap-2">
              Log in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">Create account</Link>
          </p>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <img src={heroImage} alt="Nigerian farm" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-foreground/20" />
        <div className="absolute bottom-12 left-12 right-12 rounded-3xl bg-background/10 p-6 backdrop-blur">
          <blockquote className="text-lg font-medium leading-relaxed text-primary-foreground">
            “Local-first auth and workflow simulation let us validate product-market fit before spending on external infrastructure.”
          </blockquote>
          <div className="mt-4">
            <p className="text-sm font-semibold text-primary-foreground">FarmLink MVP</p>
            <p className="text-xs text-primary-foreground/70">PRD-aligned prototype environment</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
