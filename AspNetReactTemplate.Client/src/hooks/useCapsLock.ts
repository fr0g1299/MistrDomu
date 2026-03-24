import { useCallback, useState } from "react";
import type { FocusEvent, KeyboardEvent, ModifierKey } from "react";

type CapsLockEvent = {
  getModifierState?: (key: ModifierKey) => boolean;
};

let lastKnownCapsLockState = false;

function isPasswordInput(
  target: EventTarget | null,
): target is HTMLInputElement {
  return target instanceof HTMLInputElement && target.type === "password";
}

export function useCapsLock() {
  const [isCapsLockOn, setIsCapsLockOn] = useState(lastKnownCapsLockState);
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);

  const handleCapsLock = useCallback(
    (event: CapsLockEvent | KeyboardEvent<HTMLElement>) => {
      const capsLockEnabled = event.getModifierState?.("CapsLock") ?? false;
      lastKnownCapsLockState = capsLockEnabled;
      setIsCapsLockOn(capsLockEnabled);
    },
    [],
  );

  const syncCapsLockState = useCallback(() => {
    setIsCapsLockOn(lastKnownCapsLockState);
  }, []);

  const handleFormFocus = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (isPasswordInput(event.target)) {
        setIsPasswordFieldFocused(true);
      }
      syncCapsLockState();
    },
    [syncCapsLockState],
  );

  const handleFormBlur = useCallback((event: FocusEvent<HTMLElement>) => {
    if (!isPasswordInput(event.relatedTarget)) {
      setIsPasswordFieldFocused(false);
    }
  }, []);

  const formProps = {
    onKeyDown: handleCapsLock,
    onKeyUp: handleCapsLock,
    onFocusCapture: handleFormFocus,
    onBlurCapture: handleFormBlur,
  };

  return {
    isCapsLockOn,
    handleCapsLock,
    syncCapsLockState,
    formProps,
    showCapsLockWarning: isCapsLockOn && isPasswordFieldFocused,
  };
}
