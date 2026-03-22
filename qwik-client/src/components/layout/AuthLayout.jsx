import { ChefHat } from "lucide-react";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-400 rounded-2xl mb-4">
            <ChefHat className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title || "Qwik"}</h1>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className="card p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
