import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  View,
  AppState,
  Button,
  Text,
  Dimensions,
  Platform,
} from "react-native";
import { z } from "zod";
import { Button as NativeIosButton, Picker } from "@expo/ui/swift-ui";
import { Button as NativeAndroidButton } from "@expo/ui/jetpack-compose";
import { ContextMenu } from "@expo/ui/swift-ui";

import { supabase } from "../utils/supabase";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import Input from "../components/Input";
import { zodResolver } from "@hookform/resolvers/zod";
// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "georgi@borndigital.be",
      password: "27017878389653Gg*",
    },
    mode: "onSubmit", // This enables real-time validation
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data?.email,
      password: data?.password,
    });
    if (error) Alert.alert(error.message);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.verticallySpaced}>
        <Text style={styles.heading}>Login</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              type={"text"}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              label="Email address*"
              placeholder={"email@address.com"}
              error={errors?.email?.message}
              autoCapitalize="none"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              type={"password"}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              label="Password*"
              autoCapitalize="none"
              placeholder={"email@address.com"}
              error={errors?.password?.message}
            />
          )}
        />
      </View>
      <Button
        title="Sign in"
        disabled={loading}
        onPress={handleSubmit(onSubmit)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    width: "100%",
    padding: 24,
    gap: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  verticallySpaced: {
    width: "100%",
    gap: 24,
  },
  heading: {
    fontFamily: "Manrope",
    fontSize: Dimensions.get("window").width * 0.072,
    fontWeight: "500",
    color: "#222222",
  },
});
