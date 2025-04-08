export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export function getStoredUser(): User | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function storeUser(user: User) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem('user');
}
