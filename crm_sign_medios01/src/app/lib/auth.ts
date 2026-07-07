export type UserRole = "admin" | "supervisor" | "agent";

export interface AuthUser {
  id: string;
  name: string;
  initials: string;
  username: string;
  role: UserRole;
  title: string;
}

export type LoginResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: "invalid_credentials" | "server_error" };

export async function logoutFromBackend(): Promise<void> {
  const token = window.localStorage.getItem('crm_session_token');
  if (!token) {
    return;
  }

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // Ignore logout failures and still clear the client session.
  }
}

export async function loginWithBackend(username: string, password: string): Promise<LoginResult> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return { ok: false, error: 'invalid_credentials' };
    }

    const payload = await response.json();
    const data = payload?.data;
    const user = data?.user;
    const sessionToken = data?.sessionToken;

    if (sessionToken) {
      window.localStorage.setItem('crm_session_token', sessionToken);
    }

    if (!user) {
      return { ok: false, error: 'invalid_credentials' };
    }

    return {
      ok: true,
      user: {
        id: user.id,
        name: user.fullName ?? user.username,
        initials: (user.fullName ?? user.username).split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase(),
        username: user.username,
        role: user.role === 'admin' ? 'admin' : user.role === 'supervisor' ? 'supervisor' : 'agent',
        title: user.role === 'admin' ? 'Administrador del sistema' : user.role === 'supervisor' ? 'Supervisor' : 'Agente',
      },
    };
  } catch {
    return { ok: false, error: 'server_error' };
  }
}

export function homeRouteFor(role: UserRole): string {
  if (role === "agent") {
    return "/agent-home";
  }
  return "/dashboard";
}

const STORAGE_KEY = "crm-signmedios-current-user";

function parseStoredUser(value: string | null): AuthUser | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    return null;
  }
}

export function saveCurrentUser(user: AuthUser, rememberMe: boolean) {
  const serialized = JSON.stringify(user);
  if (rememberMe) {
    localStorage.setItem(STORAGE_KEY, serialized);
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, serialized);
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getCurrentUser(): AuthUser | null {
  return parseStoredUser(sessionStorage.getItem(STORAGE_KEY)) ?? parseStoredUser(localStorage.getItem(STORAGE_KEY));
}

export function hasActiveSession(): boolean {
  return getCurrentUser() !== null;
}

export function isSessionExpired(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const token = window.localStorage.getItem('crm_session_token');
  if (!token) {
    return true;
  }

  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const expiresAt = decoded.exp ?? decoded.iat + 60 * 60 * 8;
    return Date.now() / 1000 >= expiresAt;
  } catch {
    return true;
  }
}

export async function clearCurrentUser() {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem('crm_session_token');
  await logoutFromBackend();
}
