import { IceCreamMark } from "@/components/icons";
import { LoginForm } from "@/components/login-form";
import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg ring-1 ring-cream-dark">
        <div className="mb-6 flex items-center gap-3">
          <IceCreamMark className="h-12 w-12" />
          <div>
            <h1 className="font-display text-2xl text-chocolate">Admin login</h1>
            <p className="text-sm text-chocolate/70">Ice Cream Challenge</p>
          </div>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="font-semibold text-strawberry hover:underline">
            Back to the public board
          </Link>
        </p>
      </div>
    </div>
  );
}
