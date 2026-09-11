const USER_ID_KEY = "aura.user_id";
const COMPANION_ID_KEY = "aura.companion_id";
const COMPANION_NAME_KEY = "aura.companion_name";

export const storage = {
  getUserId: (): string | null => localStorage.getItem(USER_ID_KEY),
  setUserId: (id: string) => localStorage.setItem(USER_ID_KEY, id),

  getCompanionId: (): string | null => localStorage.getItem(COMPANION_ID_KEY),
  setCompanionId: (id: string) => localStorage.setItem(COMPANION_ID_KEY, id),

  getCompanionName: (): string | null => localStorage.getItem(COMPANION_NAME_KEY),
  setCompanionName: (name: string) => localStorage.setItem(COMPANION_NAME_KEY, name),

  clearAll: () => {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(COMPANION_ID_KEY);
    localStorage.removeItem(COMPANION_NAME_KEY);
  },
};
