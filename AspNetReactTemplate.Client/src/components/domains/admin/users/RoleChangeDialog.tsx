import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Role } from "@/types/auth";

type PendingRoleChange = {
  userId: number;
  userName: string;
  currentRole: Role;
  nextRole: Role;
  confirmationStep: number;
};

type RoleChangeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleChange: PendingRoleChange | null;
  savingId: number | null;
  onConfirm: () => Promise<void>;
};

export function RoleChangeDialog({
  open,
  onOpenChange,
  roleChange,
  savingId,
  onConfirm,
}: RoleChangeDialogProps) {
  if (!roleChange) {
    return null;
  }

  const isAdminRoleChange =
    roleChange.nextRole === Role.Admin || roleChange.currentRole === Role.Admin;
  const isExpertRoleRemoval =
    roleChange.currentRole === Role.Expert &&
    roleChange.nextRole !== Role.Expert;
  const isExpertToAdminChange =
    roleChange.currentRole === Role.Expert &&
    roleChange.nextRole === Role.Admin;
  const requiresDoubleConfirmation =
    Boolean(roleChange) && (isAdminRoleChange || isExpertRoleRemoval);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {roleChange.confirmationStep === 2
              ? isExpertRoleRemoval
                ? "Potvrzení odebrání role Expert"
                : "Potvrzení Admin role"
              : isExpertRoleRemoval
                ? "Potvrzení změny role Expert"
                : "Potvrzení změny role"}
          </DialogTitle>
          {/* This whole dialog's `ul` is triggering hydration warnings in the console so it's all red.
            But I can't care to fix it, so maybe in the future someone will lol.
            It's because `ul` cannot be a direct descendant of <p>, which is created by the DialogDescription */}
          <DialogDescription>
            {roleChange.confirmationStep === 1 ? (
              <>
                <p className="mb-2">
                  Chcete změnit roli uživatele{" "}
                  <strong>{roleChange.userName}</strong>?
                </p>
                <p className="text-sm">
                  Z: <strong>{roleChange.currentRole}</strong> → Na:{" "}
                  <strong>{roleChange.nextRole}</strong>
                </p>
                {requiresDoubleConfirmation && !isExpertToAdminChange && (
                  <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    ⚠️ <strong>Upozornění!</strong>{" "}
                    {isExpertRoleRemoval
                      ? "Tímto se odebere role Expert a smažou se všechna přiřazení tohoto uživatele k návodům."
                      : "Jedná se o změnu Admin role. Tato akce vyžaduje dodatečné potvrzení."}
                  </div>
                )}
                {isExpertToAdminChange && (
                  <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    ⚠️ <strong>Upozornění!</strong> Přechod z Expert na Admin je
                    citlivá změna. Uživatel získá plná administrátorská práva a
                    zároveň přijde o všechna přiřazení experta k návodům.
                  </div>
                )}
              </>
            ) : isExpertToAdminChange ? (
              <>
                <p className="mb-3 font-semibold text-destructive">
                  ⚠️ Souhrn změny z Expert na Admin
                </p>
                <p className="mb-2">
                  Opravdu chcete změnit roli uživatele{" "}
                  <strong>{roleChange.userName}</strong>?
                </p>
                <p className="mb-3 text-sm">
                  Z: <strong>{roleChange.currentRole}</strong> → Na:{" "}
                  <strong>{roleChange.nextRole}</strong>
                </p>
                <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/15 p-3">
                  <p className="text-sm font-semibold text-destructive">
                    Tato změna provede vše níže:
                  </p>
                  <ul className="list-disc space-y-1 ps-5 text-sm text-destructive">
                    <li>Uživatel získá administrátorská práva.</li>
                    <li>Bude moci spravovat uživatele, návody i nástroje.</li>
                    <li>
                      Současně se smažou všechna jeho expertní přiřazení k
                      návodům.
                    </li>
                    <li>
                      Expert přiřazení nebude možné vrátit bez ručního
                      znovupřiřazení.
                    </li>
                  </ul>
                </div>
              </>
            ) : isExpertRoleRemoval ? (
              <>
                <p className="mb-3 font-semibold text-destructive">
                  ⚠️ Finální potvrzení odebrání role Expert
                </p>
                <p className="mb-2">
                  Opravdu chcete změnit roli uživatele{" "}
                  <strong>{roleChange.userName}</strong>?
                </p>
                <p className="mb-3 text-sm">
                  Z: <strong>{roleChange.currentRole}</strong> → Na:{" "}
                  <strong>{roleChange.nextRole}</strong>
                </p>
                <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/15 p-3">
                  <p className="text-sm font-semibold text-destructive">
                    Tato akce smaže všechna přiřazení experta k návodům:
                  </p>
                  <ul className="list-disc space-y-1 ps-5 text-sm text-destructive">
                    <li>Uživatel přestane být vedený jako expert</li>
                    <li>Budou odstraněna všechna jeho přiřazení k návodům</li>
                    <li>
                      Přiřazení nebude možné obnovit bez ručního znovupřiřazení
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <p className="mb-3 font-semibold text-destructive">
                  ⚠️ Finální potvrzení změny Admin role
                </p>
                <p className="mb-2">
                  Opravdu chcete změnit roli uživatele{" "}
                  <strong>{roleChange.userName}</strong>?
                </p>
                <p className="mb-3 text-sm">
                  Z: <strong>{roleChange.currentRole}</strong> → Na:{" "}
                  <strong>{roleChange.nextRole}</strong>
                </p>
                <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/15 p-3">
                  <p className="text-sm font-semibold text-destructive">
                    Admin má zpřístupněnou správu systému, což zahrnuje:
                  </p>
                  <ul className="list-disc space-y-1 ps-5 text-sm text-destructive">
                    <li>Správu všech uživatelů a jejich rolí</li>
                    <li>Správu návodů a přiřazení expertů</li>
                    <li>Správu nástrojů v systému</li>
                  </ul>
                </div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Zrušit
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={savingId !== null}
            variant={
              isAdminRoleChange || isExpertRoleRemoval
                ? "destructive"
                : "default"
            }
          >
            {savingId !== null ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Ukládám...
              </>
            ) : roleChange.confirmationStep === 2 ? (
              isExpertToAdminChange ? (
                "Potvrzuji změnu Expert → Admin"
              ) : isExpertRoleRemoval ? (
                "Potvrzuji odebrání role Expert"
              ) : (
                "Potvrzuji změnu Admin role"
              )
            ) : (
              "Potvrdit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
