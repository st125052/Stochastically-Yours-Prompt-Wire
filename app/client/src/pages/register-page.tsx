import { RegisterForm } from "@/components/auth/register-form";

export function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-100 to-zinc-200 dark:from-gray-900 dark:to-gray-950 p-4">
      <div className="absolute inset-0 bg-[url('/mesh-gradient.png')] bg-cover bg-center bg-no-repeat opacity-10 dark:opacity-20" />
      <RegisterForm />
    </div>
  );
}
