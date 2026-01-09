"use client";

import { SlideToOpen } from "@/components/ui/slider-button";
import React, { useRef } from "react";

export default function SlideSubmitWrapper() {
  const btnRef = useRef<HTMLButtonElement>(null);
  // We can't access server action pending state here directly unless passed from parent
  // But we can simulate it with local state if needed, or rely on the parent's optimistic update.
  // For now let's just make sure it clicks.
  const [clicked, setClicked] = React.useState(false);

  return (
    <>
      <SlideToOpen
        onUnlock={() => {
          setClicked(true);
          btnRef.current?.click();
        }}
        isLoading={clicked}
      />
      <button ref={btnRef} type="submit" className="hidden" />
    </>
  );
}
