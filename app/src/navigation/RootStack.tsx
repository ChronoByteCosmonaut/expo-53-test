import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabs from "./BottomTabs";
import AddWorkout from "../screens/add_workout";
import Protected from "../screens/protected";
import { Pressable, View } from "react-native";
const Stack = createNativeStackNavigator();

export default function RootStack() {
  return (
    <Stack.Navigator screenOptions={{}}>
      <Stack.Screen
        name="Root"
        options={{
          headerShown: false,

          headerTitleStyle: { fontFamily: "Manrope" },
        }}
        component={BottomTabs}
      />
      <Stack.Screen
        name="addWorkout"
        options={{
          title: "Add workout",
          headerTitleStyle: {
            fontFamily: "Manrope",
            fontWeight: "500",
          },
          headerBackTitleStyle: {
            fontFamily: "Manrope",
          },
        }}
        component={AddWorkout}
      />
      <Stack.Screen name="protected" component={Protected} />
    </Stack.Navigator>
  );
}
