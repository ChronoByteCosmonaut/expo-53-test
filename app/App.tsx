import { useCallback, useEffect, useState } from "react";

import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import RootStack from "./src/navigation/RootStack";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { JwtPayload, Session } from "@supabase/supabase-js";
import { supabase } from "./src/utils/supabase";
import AuthStack from "./src/navigation/AuthStack";
import * as SplashScreen from "expo-splash-screen";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Set the animation options. This is optional.
SplashScreen.setOptions({
  fade: true,
});

function App() {
  const [claims, setClaims] = useState<JwtPayload | undefined>();
  const [authLoading, setAuthLoading] = useState(true); // Add auth loading state

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data, error } = await supabase.auth.getClaims();
      if (error) {
        console.error("Error getting initial session:", error);
      } else {
        const claims = data?.claims;
        console.log("🚀 ~ getInitialSession ~ claims:", claims);
        setClaims(claims);
      }
      setAuthLoading(false); // Set loading to false after initial check
    };

    getInitialSession();

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, _session) => {
      console.log("🚀 ~ App ~ _event:", _event);
      supabase.auth.getClaims().then(({ data, error }) => {
        if (error) {
          console.error("Error getting claims:", error);
        } else {
          const claims = data?.claims;
          setClaims(claims);
        }
      });
    });
  }, []);

  const onLayoutRootView = useCallback(async () => {
    console.log("Root layout");
    if (!authLoading) {
      // Hide splash screen when both app and auth are ready
      await SplashScreen.hideAsync();
    }
  }, [authLoading]);

  // Show splash screen while loading
  if (authLoading) {
    return null; // This keeps the splash screen visible
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <KeyboardProvider>
          <SafeAreaProvider onLayout={onLayoutRootView}>
            {claims ? <RootStack /> : <AuthStack />}
          </SafeAreaProvider>
        </KeyboardProvider>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

export default App;
