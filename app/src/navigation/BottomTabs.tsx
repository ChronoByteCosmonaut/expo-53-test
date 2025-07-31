import { createNativeBottomTabNavigator } from "@bottom-tabs/react-navigation";
import * as React from "react";
import Home from "../screens/home";
import Profile from "../screens/profile";
import { Platform } from "react-native";
import TabsScreen from "../screens/tabscreen";
const Tab = createNativeBottomTabNavigator();

export default function BottomTabs() {
  const profileAndroid = require("../../assets/profile_android.svg");
  const homeAndroid = require("../../assets/home_android.svg");

  return (
    <Tab.Navigator
      scrollEdgeAppearance="opaque"
      tabBarStyle={
        Platform.OS === "android" ? { backgroundColor: "#ffffff" } : undefined
      }
      tabLabelStyle={{
        fontFamily: "Manrope",
      }}
      rippleColor={"#fafafa"}
      activeIndicatorColor={"#eeeeee"}
      translucent
      tabBarActiveTintColor={"#222222"}
      tabBarInactiveTintColor={"#999999"}
    >
      <Tab.Screen
        name="Home"
        component={TabsScreen}
        options={{
          tabBarIcon:
            Platform.OS === "ios"
              ? () => ({ sfSymbol: "house" })
              : () => homeAndroid,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon:
            Platform.OS === "ios"
              ? () => ({ sfSymbol: "person" })
              : () => profileAndroid,
        }}
      />
    </Tab.Navigator>
  );
}
