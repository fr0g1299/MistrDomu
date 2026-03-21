import React, { useState } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiError {
  description: string;
}

export function RegisterForm({
  onRegisterSuccess,
}: {
  onRegisterSuccess: () => void;
}) {
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    if (data.password !== data.confirmPassword) {
      setErrors(["Hesla se neshodují."]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        });

        if (!loginResponse.ok) {
          setErrors([
            "Registrace proběhla, ale automatické přihlášení selhalo. Přihlaste se prosím ručně.",
          ]);
          return;
        }

        window.dispatchEvent(new Event("auth-changed"));
        onRegisterSuccess();
      } else {
        const errData = await response.json();

        if (errData.errors) {
          const allErrors = Object.values(errData.errors).flat() as string[];
          setErrors(allErrors);
        } else if (Array.isArray(errData)) {
          setErrors(errData.map((err: ApiError) => err.description));
        } else {
          setErrors([errData.message || "Registrace selhala."]);
        }
      }
    } catch {
      setErrors(["Chyba připojení k serveru."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input name="firstName" placeholder="Jméno" required />
        <Input name="lastName" placeholder="Příjmení" required />
      </div>

      <div className="relative">
        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          name="email"
          type="email"
          placeholder="Email"
          className="pl-10"
          required
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          name="password"
          type="password"
          placeholder="Heslo"
          className="pl-10"
          required
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          name="confirmPassword"
          type="password"
          placeholder="Potvrzení hesla"
          className="pl-10"
          required
        />
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              {errors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Vytvořit účet
      </Button>
    </form>
  );
}
