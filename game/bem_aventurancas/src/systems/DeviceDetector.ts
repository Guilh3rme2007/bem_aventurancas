export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  hasKeyboard: boolean;
  isTouchPrimary: boolean;
}

export class DeviceDetector {
  static detect(): DeviceInfo {
    const hasTouch = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
    const coarsePointer = typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
    const hoverAvailable = typeof window !== "undefined" &&
      window.matchMedia("(hover: hover)").matches;
    const finePointer = typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches;
    const touchAvailable = hasTouch || coarsePointer;
    // On touch-capable hybrids, keep both modalities available instead of
    // hiding controls based on a mouse/trackpad being the browser's primary pointer.
    const isTouchPrimary = touchAvailable;

    const screenWidth = typeof window !== "undefined"
      ? window.screen.width
      : 0;
    const screenHeight = typeof window !== "undefined"
      ? window.screen.height
      : 0;
    const tabletSized = Math.min(screenWidth, screenHeight) >= 600;
    const isTablet = isTouchPrimary && tabletSized;
    const isMobile = isTouchPrimary && !isTablet;

    return {
      isMobile,
      isTablet,
      isDesktop: !isTouchPrimary,
      hasTouch: touchAvailable,
      // Browser APIs cannot reliably discover a physical keyboard; hover/fine pointers
      // are only hints, while InputManager listens for keyboard input on every device.
      hasKeyboard: !isTouchPrimary || finePointer || hoverAvailable,
      isTouchPrimary,
    };
  }
}
