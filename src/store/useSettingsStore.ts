import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD' | 'JPY';

interface SettingsState {
  currency: CurrencyCode;
  carryForward: number;
  setCurrency: (currency: CurrencyCode) => void;
  setCarryForward: (amount: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: 'INR',
      carryForward: 0,
      setCurrency: (currency) => set({ currency }),
      setCarryForward: (carryForward) => {
        if (typeof carryForward === 'number' && Number.isFinite(carryForward)) {
          set({ carryForward });
        }
      },
    }),
    {
      name: 'ledger-settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);
