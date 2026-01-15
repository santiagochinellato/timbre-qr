import { db } from "@/db";
import { buildings, units } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import PublicDoorbell from "@/components/public-doorbell";

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const building = await db.query.buildings.findFirst({
    where: eq(buildings.slug, slug),
  });

  if (!building) notFound();

  return (
    <PublicDoorbell propertyId={building.id} propertyName={building.name} />
  );
}
