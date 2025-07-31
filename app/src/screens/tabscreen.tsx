import React from "react";
import { View, Text } from "react-native";
import DynamicTabs, { TabItem } from "../components/DynamicTabs";
import Home from "./home";

// Example usage in your screen component
export default function TabsScreen({ navigation }: any) {
  const tabs: TabItem[] = [
    {
      id: "workouts",
      title: "Workouts",
      content: <Home navigation={navigation} />,
    },
    {
      id: "routines",
      title: "Routines",
      content: <Home navigation={navigation} />,
    },
    {
      id: "favourites",
      title: "Favs",
      content: <Home navigation={navigation} />,
    },
    {
      id: "bip_bop",
      title: "BipBop",
      content: <Home navigation={navigation} />,
    },
    {
      id: "bap_boop",
      title: "BapBoop",
      content: <Home navigation={navigation} />,
    },
  ];

  return (
    <DynamicTabs
      tabs={tabs}
      navigation={navigation}
      maxLoadedTabs={3}
      tabTitle="Workouts"
      tabBarStyle={{ paddingHorizontal: 12 }}
      indicatorStyle={{ backgroundColor: "#222222" }}
      containerStyle={{ backgroundColor: "#fafafa" }}
    />
  );
}
