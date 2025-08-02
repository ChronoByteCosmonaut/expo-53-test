import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Controller, SubmitHandler, useForm } from "react-hook-form";
import Feather from "@expo/vector-icons/Feather";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Input from "../components/Input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../utils/supabase";

const offset = { closed: 0, opened: 24 };

const workoutFormSchema = z.object({
  title: z.string().min(2).max(50),
  notes: z.string().max(256),
});

type WorkoutFormData = z.infer<typeof workoutFormSchema>;

// Mutation function
const createWorkout = async (
  workoutData: WorkoutFormData & {
    userId: string;
  }
) => {
  const { data, error } = await supabase
    .from("workouts")
    .insert([
      {
        title: workoutData.title,
        notes: workoutData.notes,
        created_by: workoutData?.userId,
      },
    ])
    .select() // This returns the inserted row
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const AddWorkout = () => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const getUserIdFromSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user?.id;
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      title: "",
      notes: "",
    },
    mode: "onSubmit", // This enables real-time validation
  });

  // React Query mutation
  const createWorkoutMutation = useMutation({
    mutationFn: createWorkout,
    onSuccess: (data) => {
      console.log("Workout created successfully:", data);

      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      reset();
    },
    onError: (error) => {
      console.error("Error creating workout:", error);
    },
  });

  const onSubmit: SubmitHandler<WorkoutFormData> = async (data) => {
    console.log("Form submitted:", data);

    const userId = await getUserIdFromSession();
    if (!userId) return;

    const transformedData = {
      ...data,
      userId,
    };
    // Handle form submission here
    createWorkoutMutation.mutate(transformedData);
  };

  const StickyFooter = () => {
    return (
      <KeyboardStickyView style={{ width: "100%" }} offset={offset}>
        <View style={{ width: "100%" }}>
          <Pressable
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.72 : !isValid ? 0.56 : 1,
              },
              styles.submitButton,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid}
          >
            <Text style={styles.submitButtonText}>Save workout</Text>
            <Feather
              name="save"
              style={{ position: "absolute", right: 24, top: "50%" }}
              size={24}
              color="#ffffff"
            />
          </Pressable>
        </View>
      </KeyboardStickyView>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets?.bottom }]}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentInsetAdjustmentBehavior="automatic"
        style={{ width: "100%" }}
        contentContainerStyle={{
          gap: 16,
          paddingTop: 16,
          paddingHorizontal: 16,
        }}
      >
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              type={"text"}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              label="Title*"
              placeholder={"Title of your workout..."}
              error={errors?.title?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              type={"textarea"}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              label="Notes"
              placeholder={"Some extra notes..."}
              error={errors?.title?.message}
            />
          )}
        />
      </KeyboardAwareScrollView>
      <StickyFooter />
    </View>
  );
};

export default AddWorkout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  submitButton: {
    marginHorizontal: 24,
    marginVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "#222222",
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: "row",
    borderRadius: 8,
  },
  submitButtonText: {
    fontFamily: "Manrope",
    fontWeight: "500",
    color: "#fafafa",
  },
});
