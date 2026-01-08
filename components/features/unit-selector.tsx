"use client";
import { useActionState, useEffect } from "react";
import { ringDoorbell } from "@/app/actions/ring-doorbell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const units = ["101", "102", "103", "201", "202", "203", "301", "302", "PH"];

export default function UnitSelector({ image, onReset }: { image: string, onReset: () => void }) {
  const [state, formAction, isPending] = useActionState(ringDoorbell, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state]);

  const handleSubmit = async (formData: FormData) => {
    // Intercept submission to convert Base64 image to Blob
    if (image?.startsWith("data:")) {
       try {
         const res = await fetch(image);
         const blob = await res.blob();
         const file = new File([blob], "visitor.jpg", { type: "image/jpeg" });
         formData.set("image", file); // Replace the string with the file
       } catch (e) {
         console.error("Failed to convert image", e);
         toast.error("Failed to process image");
         return;
       }
    }
    formAction(formData);
  };

  return (
    <form action={handleSubmit} className="space-y-6 w-full">
      {/* We still keep this as fallback or simple reference, but formData.set overwrites it */}
      <input type="hidden" name="image_base64_fallback" value={image} /> 
      
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-secondary uppercase tracking-wider text-xs">Select Apartment</label>
        <div className="grid grid-cols-3 gap-3">
           {units.map(u => (
             <label key={u} className="cursor-pointer group relative">
               <input type="radio" name="unit" value={u} className="peer sr-only" required />
               <div className="
                 h-12 flex items-center justify-center rounded-xl border border-text-secondary/10 bg-surface 
                 font-mono text-lg font-medium text-text-primary
                 transition-all duration-200
                 group-hover:border-text-secondary/30
                 peer-checked:border-action peer-checked:bg-action peer-checked:text-surface peer-checked:shadow-md
               ">
                 {u}
               </div>
             </label>
           ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onReset} 
          disabled={isPending}
          className="flex-1"
        >
           Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-[2] text-base" 
          size="lg"
          disabled={isPending}
        >
           {isPending ? "Connecting..." : "Ring Bell"}
        </Button>
      </div>
    </form>
  );
}
