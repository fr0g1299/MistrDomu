import React, { useState } from "react";
import { AlertTriangle, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCapsLock } from "../../hooks/useCapsLock";

export function LoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { formProps, showCapsLockWarning } = useCapsLock();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (response.ok) {
        window.dispatchEvent(new Event("auth-changed"));
        onLoginSuccess();
      } else {
        const errData = await response.json().catch(() => ({}));

        if (errData.errors) {
          const allErrors = Object.values(errData.errors).flat() as string[];
          setErrors(allErrors);
        } else if (errData.message) {
          setErrors([errData.message]);
        } else {
          setErrors(["Neplatné přihlašovací údaje."]);
        }
      }
    } catch {
      setErrors(["Chyba při spojení se serverem."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      {...formProps}
      className="space-y-4"
    >
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
        {showCapsLockWarning && (
          <p className="absolute right-3 top-3 text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Caps Lock je zapnutý!
          </p>
        )}
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
        Přihlásit se
      </Button>
    </form>
  );
}
