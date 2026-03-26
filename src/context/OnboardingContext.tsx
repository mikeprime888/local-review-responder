'use client';
import { createContext, useContext, useState } from 'react';

const OnboardingContext = createContext({
  isOnboarding: false,
  setIsOnboarding: (_: boolean) => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isOnboarding, setIsOnboarding] = useState(false);
  return (
    <OnboardingContext.Provider value={{ isOnboarding, setIsOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
