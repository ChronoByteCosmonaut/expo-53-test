import { useCallback, useEffect, useState } from "react";

import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import RootStack from "./src/navigation/RootStack";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Session } from "@supabase/supabase-js";
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
  const [session, setSession] = useState<Session | null>(null);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setAppIsReady(true);
    }, 250);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(
        "🚀 ~ supabase.auth.getSession ~ session:",
        session?.user?.email
      );
      setSession(session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🚀 ~ App ~ session:", session?.user?.email);
      setSession(session);
    });
  }, []);
  console.log("We in here");

  const onLayoutRootView = useCallback(() => {
    console.log("Root layout");
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      SplashScreen.hide();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <KeyboardProvider>
          <SafeAreaProvider onLayout={onLayoutRootView}>
            {session && session?.user ? <RootStack /> : <AuthStack />}
          </SafeAreaProvider>
        </KeyboardProvider>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

export default App;
