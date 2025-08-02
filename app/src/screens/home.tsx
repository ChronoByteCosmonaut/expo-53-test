import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useBottomTabBarHeight } from "react-native-bottom-tabs";

import { StatusBar } from "expo-status-bar";
import { useWorkouts } from "../utils/useWorkouts";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { SharedValue } from "react-native-reanimated";

const AnimatedFlashList =
  Animated.createAnimatedComponent<FlashListProps<any>>(FlashList);

const Home = ({
  navigation,
  onScroll,
}: {
  navigation: any;
  onScroll?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | SharedValue<
        ((event: NativeSyntheticEvent<NativeScrollEvent>) => void) | undefined
      >
    | undefined;
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useWorkouts();

  // Function to handle refresh - resets to first page using queryClient
  const handleRefresh = async () => {
    queryClient.setQueryData(["workouts"], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.slice(0, 1), // Keep only first page
        pageParams: oldData.pageParams.slice(0, 1), // Keep only first page param
      };
    });

    await refetch();
  };

  const workouts = data?.pages.flatMap((page) => page.workouts) || [];
  console.log("LENGTH:", workouts?.length);
  return (
    <View style={[styles.container]}>
      <StatusBar style="dark" />

      <AnimatedFlashList
        onScroll={onScroll}
        data={[...workouts]}
        onEndReached={() => fetchNextPage()}
        keyExtractor={(item, index) => index.toString()}
        onEndReachedThreshold={0.128}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            style={{ position: "relative" }}
            refreshing={isLoading}
            onRefresh={() => handleRefresh()}
          />
        }
        contentContainerStyle={{
          paddingTop: 24,
          paddingBottom: Platform.OS === "ios" ? tabBarHeight : 0,
        }}
        ListFooterComponent={() => {
          if (isFetchingNextPage) {
            return (
              <View
                style={{
                  width: "100%",
                  paddingHorizontal: 12,
                  paddingTop: 16,
                  paddingBottom: insets.bottom,
                }}
              >
                <ActivityIndicator size="small" />
              </View>
            );
          } else if (!hasNextPage && (!isLoading || isFetchingNextPage)) {
            return (
              <View
                style={{
                  width: "100%",
                  paddingHorizontal: 12,
                  paddingTop: 16,
                  paddingBottom: insets.bottom,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Manrope",
                    fontWeight: "400",
                    fontSize: width * 0.04,
                  }}
                >
                  That's all...
                </Text>
              </View>
            );
          }
        }}
        style={{ width: "100%", position: "relative" }}
        renderItem={({ item, index }) => {
          return (
            <View style={styles.workoutItem}>
              <Text style={styles.workoutTitle}>{item?.title}</Text>
              <Text style={styles.workoutNotes}>{item?.notes}</Text>
            </View>
          );
        }}
      />

      <Pressable
        onPress={() => navigation?.navigate("addWorkout")}
        style={({ pressed }) => [
          styles.addButton,
          {
            opacity: pressed ? 0.64 : 1,
            bottom: Platform.OS === "ios" ? tabBarHeight + 16 : 16,
          },
        ]}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
      </Pressable>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    width: "100%",
  },
  listHeader: {
    paddingHorizontal: 12,
    width: "100%",
    paddingBottom: 24,
    backgroundColor: "#ffffff",
  },
  listHeaderTitle: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "600",
  },
  workoutItem: {
    backgroundColor: "#f2f2f2",
    padding: 24,
    borderRadius: 16,
    marginHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  workoutTitle: {
    fontSize: 16,
    fontFamily: "Manrope",
    fontWeight: "500",
  },
  workoutNotes: {
    fontSize: 14,
    fontFamily: "Manrope",
    fontWeight: "400",
    color: "#999999",
  },
  addButton: {
    position: "absolute",
    right: 16,
    padding: 16,
    borderRadius: 32,
    backgroundColor: "#222222",
    shadowColor: "rgba(34, 34, 34, 0.48)",
    elevation: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.48,
    shadowRadius: 16,
  },
});
