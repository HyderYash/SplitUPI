import { PaymentSessionView } from "@/components/payment-session";
export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PaymentSessionView id={id} />;
}
