import { getCardsServer } from "@/shared/lib/getCards";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const cards = await getCardsServer();

  return <DashboardClient initialCards={cards} />;
}
