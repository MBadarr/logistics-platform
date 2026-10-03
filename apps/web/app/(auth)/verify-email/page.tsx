import { VerifyEmailForm } from "../../../components/auth/verify-email-form";

export default async function VerifyEmailPage({ searchParams }: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;
  return <VerifyEmailForm email={email.slice(0, 254)} />;
}
