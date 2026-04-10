"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/apiService";

type ExpertHelperCardProps = {
  manualId: string | undefined;
};

export function ExpertHelperCard({ manualId }: ExpertHelperCardProps) {
  const { user, isExpert } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;

  const [helperEnrollLoading, setHelperEnrollLoading] = useState(false);
  const [helperStatusLoading, setHelperStatusLoading] = useState(false);
  const [helperAlreadyEnrolled, setHelperAlreadyEnrolled] = useState(false);

  useEffect(() => {
    const parsedManualId = Number(manualId);
    if (
      !userId ||
      !isExpert ||
      !Number.isInteger(parsedManualId) ||
      parsedManualId <= 0
    ) {
      setHelperAlreadyEnrolled(false);
      setHelperStatusLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchHelperStatus = async () => {
      setHelperStatusLoading(true);

      try {
        const manuals = await apiService.getManualsForExpert(userId);
        if (isCancelled) return;

        setHelperAlreadyEnrolled(
          manuals.some((manual) => manual.manualId === parsedManualId),
        );
      } catch {
        if (!isCancelled) {
          setHelperAlreadyEnrolled(false);
        }
      } finally {
        if (!isCancelled) {
          setHelperStatusLoading(false);
        }
      }
    };

    fetchHelperStatus();

    return () => {
      isCancelled = true;
    };
  }, [manualId, userId, isExpert]);

  const handleToggleHelperEnrollment = useCallback(async () => {
    const parsedManualId = Number(manualId);
    if (!Number.isInteger(parsedManualId) || parsedManualId <= 0) {
      return;
    }

    if (!userId) {
      toast.error("Nepodařilo se určit vaše uživatelské ID.");
      return;
    }

    setHelperEnrollLoading(true);

    try {
      if (helperAlreadyEnrolled) {
        await apiService.removeManualFromExpert(parsedManualId, userId);
        setHelperAlreadyEnrolled(false);
        toast.success("Byli jste odhlášeni jako pomocník pro tento návod.");
      } else {
        await apiService.registerAsManualHelper(parsedManualId, userId);
        setHelperAlreadyEnrolled(true);
        toast.success("Byli jste zapsáni jako pomocník pro tento návod.");
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : helperAlreadyEnrolled
            ? "Nepodařilo se odhlásit jako pomocník."
            : "Nepodařilo se zapsat jako pomocník.",
      );
    } finally {
      setHelperEnrollLoading(false);
    }
  }, [manualId, userId, helperAlreadyEnrolled]);

  if (!isExpert) {
    return null;
  }

  return (
    <Card className="mb-6 py-4 gap-3">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold">Expert pomocník</CardTitle>
          <CardDescription>
            Pokud chcete pomáhat s tímto návodem, zapište se jako pomocník.
          </CardDescription>
        </div>
        <Button
          type="button"
          onClick={handleToggleHelperEnrollment}
          disabled={helperEnrollLoading || helperStatusLoading}
          variant={helperAlreadyEnrolled ? "secondary" : "default"}
        >
          {helperStatusLoading ? (
            "Kontroluji stav..."
          ) : helperAlreadyEnrolled ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Odhlásit se jako pomocník
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Zapsat se jako pomocník
            </span>
          )}
        </Button>
      </CardHeader>

      {helperAlreadyEnrolled && (
        <CardContent>
          <Button
            type="button"
            variant="link"
            className="h-auto px-0 text-sm cursor-pointer"
            onClick={() => navigate("/manual-help-management")}
          >
            Přejít do správy mých návodů
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
