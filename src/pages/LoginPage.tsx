import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { login, fetchMe } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

const LOGIN_CAROUSEL_IMAGES = [
  "/login-page-1.jpg",
  "/login-page-2.jpg",
  "/login-page-3.jpg",
  "/login-page-4.jpg",
];

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard";
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Sign-in page is always dark; restore store theme when leaving
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      const theme = useUiStore.getState().theme;
      document.documentElement.classList.toggle("dark", theme === "dark");
    };
  }, []);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    const t = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % LOGIN_CAROUSEL_IMAGES.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  async function onSubmit(values: LoginForm) {
    try {
      const data = await login(values);
      setAuth(
        { ...data.user, mobile: null, is_active: true, Tenant: undefined } as import("@/types").User,
        data.token
      );
      const { user } = await fetchMe();
      setAuth(user);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Login failed";
      setError("root", { message: message ?? "Invalid email or password" });
    }
  }

  const gradientBg = [
    "radial-gradient(ellipse 120% 100% at 100% 50%, #6EF09A 0%, transparent 45%, #0A3D20 100%)",
    "linear-gradient(135deg, #A8F5BC 0%, #0D5C2F 100%)",
  ].join(", ");

  return (
    <div
      className="relative flex min-h-screen"
      style={{ background: gradientBg }}
    >
      {/* Left: form */}
      <div className="relative z-0 flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        <Card
          className={cn(
            "w-full max-w-lg overflow-hidden rounded-2xl border-0",
            "bg-card/98 shadow-2xl backdrop-blur-md",
            "ring-1 ring-border/40 ring-black/5 dark:ring-white/5",
            "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)]"
          )}
        >
          <CardHeader className="space-y-3 pb-4 pt-8 text-center">
            <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-2xl bg-muted/50 p-2 ring-1 ring-border/30">
              <img
                src="/digi-prishi-logo.webp"
                alt="Digi Krishi"
                className="h-full w-full rounded-xl object-contain"
              />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
              Digi Krishi
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Sign in to your tenant account
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10 pt-1">
            <form
              method="post"
              action="#"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              autoComplete="on"
            >
              {errors.root && (
                <p className="text-sm text-destructive">{errors.root.message}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your Email here..."
                  autoComplete="email"
                  className="h-11"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••••••"
                    autoComplete="current-password"
                    className="h-11 pr-10"
                    {...register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-10 rounded-l-none text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="h-11 w-full text-base" loading={isSubmitting}>
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right: image carousel (higher z so images sit on top of gradient) */}
      <div className="relative z-10 hidden w-0 flex-1 overflow-hidden rounded-l-[2.5rem] shadow-2xl lg:block lg:w-[50%]">
        {LOGIN_CAROUSEL_IMAGES.map((src, i) => (
          <div
            key={src}
            className={cn(
              "absolute inset-0 z-10 bg-cover bg-center bg-no-repeat transition-opacity duration-700",
              i === carouselIndex ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            style={{ backgroundImage: `url(${src})` }}
            aria-hidden={i !== carouselIndex}
          />
        ))}
        {/* Gradient overlay for readability if needed */}
        <div className="absolute inset-0 bg-gradient-to-l from-background/20 to-transparent pointer-events-none" />
        {/* Carousel indicators */}
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {LOGIN_CAROUSEL_IMAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCarouselIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === carouselIndex
                  ? "w-6 bg-primary"
                  : "w-2 bg-primary/40 hover:bg-primary/60"
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
