"use client";

import { SlideToOpen } from "@/components/ui/slider-button";
import { useRef } from "react";

export default function SlideSubmitWrapper() {
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <SlideToOpen onUnlock={() => btnRef.current?.click()} />
      <button ref={btnRef} type="submit" className="hidden" />
    </>
  );
}
