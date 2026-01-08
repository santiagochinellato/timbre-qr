"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface GeoGuardProps {
  children: React.ReactNode;
}

export default function GeoGuard({ children }: GeoGuardProps) {
  const [permission, setPermission] = useState<PermissionState | "unknown">("unknown");
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      setPermission(result.state);
      result.onchange = () => {
        setPermission(result.state);
      };
    });
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords(position.coords);
        setPermission("granted");
        // Here we would validate if coords are within allowed range
        // For now we accept any location
      },
      (err) => {
        setError(err.message);
        setPermission("denied");
      },
      { enableHighAccuracy: true }
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-screen space-y-4 bg-black text-white">
        <h2 className="text-xl font-bold text-alert">Location Error</h2>
        <p className="text-white/70">{error}</p>
        <Button onClick={() => window.location.reload()} className="bg-white text-black hover:bg-white/90">Retry</Button>
      </div>
    );
  }

  if (!coords) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-screen space-y-6 bg-black text-white">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Bienvenido a Bellz</h1>
          <p className="text-white/70">Necesitamos verificar que estas en el edificio.</p>
        </div>
        <Button onClick={requestLocation} size="lg" className="w-full max-w-xs bg-white text-black hover:bg-white/90 font-medium rounded-full h-12">
          Verificar Ubicación
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
