// src/hooks/useClickOutside.ts
import { useEffect, RefObject } from "react";

export function useClickOutside(
    ref: RefObject<HTMLElement>,
    handler: () => void,
) {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            // If click is outside the ref element, run the handler
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler();
        };

        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);

        // Cleanup function to remove listeners
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}
