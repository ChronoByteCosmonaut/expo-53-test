import React from "react";
import DynamicTabs, { TabItem } from "../components/DynamicTabs";
import Home from "./home";

// Example usage in your screen component
export default function TabsScreen({ navigation }: any) {
  const tabs: TabItem[] = [
    {
      id: "workouts",
      title: "Workouts",

      needsScrollHandler: true,
      content: (scrollHandler) => (
        <Home
          navigation={navigation}
          onScroll={scrollHandler} // Pass the scroll handler here
        />
      ),
    },
    {
      id: "routines",
      title: "Routines",
      needsScrollHandler: true,

      content: (scrollHandler) => (
        <Home
          navigation={navigation}
          onScroll={scrollHandler} // Pass the scroll handler here
        />
      ),
    },
    {
      id: "favourites",
      title: "Favs",
      content: (scrollHandler) => (
        <Home
          navigation={navigation}
          onScroll={scrollHandler} // Pass the scroll handler here
        />
      ),
      needsScrollHandler: true,
    },
    {
      id: "bip_bop",
      title: "BipBop",
      content: (scrollHandler) => (
        <Home
          navigation={navigation}
          onScroll={scrollHandler} // Pass the scroll handler here
        />
      ),
      needsScrollHandler: true,
    },
    {
      id: "bap_boop",
      title: "BapBoop",
      content: (scrollHandler) => (
        <Home
          navigation={navigation}
          onScroll={scrollHandler} // Pass the scroll handler here
        />
      ),
      needsScrollHandler: true,
    },
  ];

  return (
    <DynamicTabs
      tabs={tabs}
      navigation={navigation}
      maxLoadedTabs={3}
      tabTitle="Workouts"
    />
  );
}
