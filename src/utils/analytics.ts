export interface AppAnalytics {
  cardsGenerated: number;
  emailsChecked: number;
  identitiesGenerated: number;
  proxiesChecked: number;
}

export const getAnalytics = (): AppAnalytics => {
  try {
    const saved = localStorage.getItem("aerox_analytics");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        cardsGenerated: parsed.cardsGenerated || 0,
        emailsChecked: parsed.emailsChecked || 0,
        identitiesGenerated: parsed.identitiesGenerated || 0,
        proxiesChecked: parsed.proxiesChecked || 0,
      };
    }
  } catch (e) {
    console.warn("Could not read analytics", e);
  }
  return { cardsGenerated: 0, emailsChecked: 0, identitiesGenerated: 0, proxiesChecked: 0 };
};

export const incrementAnalytic = (key: keyof AppAnalytics, amount = 1) => {
  try {
    const current = getAnalytics();
    current[key] += amount;
    localStorage.setItem("aerox_analytics", JSON.stringify(current));
    // Trigger window event so active screens can refresh instantly
    window.dispatchEvent(new Event("aerox_analytics_updated"));
  } catch (e) {
    console.warn("Could not increment analytics", e);
  }
};
