import { useCallback, useEffect, useState } from "react";

import { apiService } from "@/lib/apiService";

type UseExpertStandbyVisibilityArgs = {
  isAuthenticated: boolean;
  isExpert: boolean;
  userId?: number;
};

export function useExpertStandbyVisibility({
  isAuthenticated,
  isExpert,
  userId,
}: UseExpertStandbyVisibilityArgs) {
  const [showExpertStandbyButton, setShowExpertStandbyButton] = useState(false);

  const refreshExpertStandbyButton = useCallback(async () => {
    if (!isAuthenticated || !isExpert || !userId) {
      setShowExpertStandbyButton(false);
      return;
    }

    try {
      const manuals = await apiService.getManualsForExpert(userId);
      setShowExpertStandbyButton(manuals.length > 0);
    } catch {
      setShowExpertStandbyButton(false);
    }
  }, [isAuthenticated, isExpert, userId]);

  useEffect(() => {
    void refreshExpertStandbyButton();
  }, [refreshExpertStandbyButton]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleHeaderRefresh = () => {
      void refreshExpertStandbyButton();
    };

    window.addEventListener("header:refresh", handleHeaderRefresh);

    return () => {
      window.removeEventListener("header:refresh", handleHeaderRefresh);
    };
  }, [isAuthenticated, refreshExpertStandbyButton]);

  return {
    showExpertStandbyButton,
  };
}
