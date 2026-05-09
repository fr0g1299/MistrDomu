import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/identity/LoginForm";
import { RegisterForm } from "@/components/identity/RegisterForm";

type AuthView = "login" | "register";

type AuthRequiredDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  title?: string;
  message: string;
  defaultView?: AuthView;
};

// TODO: There are two Auth dialogs, that are practically the same, idk how that happened
export function AuthRequiredDialog({
  open,
  onOpenChange,
  onSuccess,
  title = "Nejste přihlášeni",
  message,
  defaultView = "login",
}: AuthRequiredDialogProps) {
  const [view, setView] = useState<AuthView>(defaultView);

  useEffect(() => {
    if (open) {
      setView(defaultView);
    }
  }, [defaultView, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-150">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {title}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground text-center">{message}</p>

        <Tabs
          value={view}
          onValueChange={(nextView) => setView(nextView as AuthView)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Přihlášení</TabsTrigger>
            <TabsTrigger value="register">Registrace</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <LoginForm onLoginSuccess={onSuccess} />
          </TabsContent>

          <TabsContent value="register">
            <RegisterForm onRegisterSuccess={onSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
