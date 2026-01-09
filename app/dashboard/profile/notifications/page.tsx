import { getEmailDigestStatus } from "@/app/actions/user-settings";
import { NotificationsSettings } from "@/components/features/notifications-settings";
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const initialDigest = await getEmailDigestStatus();

  return <NotificationsSettings initialEmailDigest={initialDigest} />;
}
