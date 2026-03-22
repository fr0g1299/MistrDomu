import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LoginForm } from "./LoginForm.tsx";
import { RegisterForm } from "./RegisterForm";

interface AuthDialogProps {
  onLoginSuccess: () => void;
}

export function AuthDialog({ onLoginSuccess }: AuthDialogProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"login" | "register">("login");

  const handleSuccess = () => {
    setOpen(false);
    onLoginSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full px-6 border-primary/50 hover:border-primary"
        >
          Přihlásit se
        </Button>
      </DialogTrigger>

      <DialogContent
        className={`transition-all duration-300 ease-in-out rounded-3xl ${
          view === "login" ? "sm:max-w-100" : "sm:max-w-150"
        }`}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {view === "login" ? "Vítejte zpět" : "Vytvořit nový účet"}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "login" | "register")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Přihlášení</TabsTrigger>
            <TabsTrigger value="register">Registrace</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <LoginForm onLoginSuccess={handleSuccess} />
          </TabsContent>

          <TabsContent value="register">
            <RegisterForm onRegisterSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
