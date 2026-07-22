import { useEffect } from "react";
import { useNavigate } from "react-router";
import { LoginCard } from "../components/LoginCard";
import { getCurrentUser, homeRouteFor } from "../lib/auth";

export function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      navigate(homeRouteFor(currentUser.role), { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <LoginCard />
    </div>
  );
}
