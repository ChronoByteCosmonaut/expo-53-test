import React, {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  SharedValue,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Entypo from "@expo/vector-icons/Entypo";
import { FlashList } from "@shopify/flash-list";
import { LazyLegendList } from "@legendapp/list";

// Types
export interface TabItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface TabProps {
  index: number;
  title: string;
  onTabPress: (index: number) => void;
  activeTab: number;
  style?: any;
}

interface IndicatorProps {
  measurements: Measurement[];
  scrollX: SharedValue<number>;
  tabsLength: number;
  style?: any;
}

interface DynamicTabsProps {
  tabs: TabItem[];
  navigation?: any;
  maxLoadedTabs?: number;
  tabBarStyle?: any;
  tabStyle?: any;
  tabTitle?: string;
  tabTextStyle?: any;
  activeTabTextStyle?: any;
  indicatorStyle?: any;
  containerStyle?: any;
  contentContainerStyle?: any;
}

type Measurement = { x: number; y: number; width: number; height: number };

// Tab Component
const Tab = forwardRef<View, TabProps>(
  ({ index, title, onTabPress, activeTab, style }, ref) => {
    const isActive = activeTab === index;

    return (
      <Pressable
        ref={ref}
        onPress={() => onTabPress(index)}
        style={[styles.tabButton, style]}
      >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
          {title}
        </Text>
      </Pressable>
    );
  }
);

const Indicator = React.memo(
  ({ measurements, scrollX, tabsLength, style }: IndicatorProps) => {
    const { width } = useWindowDimensions();

    const animatedStyle = useAnimatedStyle(() => {
      "worklet";

      if (!measurements || measurements.length === 0) {
        return { opacity: 0 };
      }

      const inputRange = [];
      const widthOutputRange = [];
      const translateOutputRange = [];

      for (let i = 0; i < tabsLength; i++) {
        inputRange.push(i * width);
        widthOutputRange.push(measurements[i]?.width || 0);
        translateOutputRange.push(measurements[i]?.x || 0);
      }

      const indicatorWidth = interpolate(
        scrollX.value,
        inputRange,
        widthOutputRange,
        "clamp"
      );

      const translateX = interpolate(
        scrollX.value,
        inputRange,
        translateOutputRange,
        "extend"
      );

      return {
        opacity: 1,
        width: indicatorWidth,
        transform: [{ translateX }],
      };
    }, [measurements, width, tabsLength]);

    if (!measurements || measurements.length === 0) {
      return null;
    }

    return (
      <Animated.View style={[styles.tabIndicator, style, animatedStyle]} />
    );
  }
);

// Main Component
function DynamicTabs({
  tabs,
  maxLoadedTabs = 2,
  tabBarStyle,
  tabStyle,
  tabTitle,
  indicatorStyle,
  containerStyle,
  contentContainerStyle,
}: DynamicTabsProps) {
  const [loadedTabs, setLoadedTabs] = useState<Set<number>>(new Set([0]));
  const containerRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState(0);
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);
  const { width } = useWindowDimensions();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  const accessoryViewRef = useRef<Animated.View>(null);

  const tabRefs = useRef<React.RefObject<View>[]>(
    tabs.map(() => React.createRef<View>() as React.RefObject<View>)
  );

  const updateActiveTab = (index: number) => {
    setActiveTab(index);
    setLoadedTabs((prev) => {
      if (prev.has(index)) return prev;
      const arr = Array.from(prev);
      if (maxLoadedTabs <= arr.length) arr.shift();
      arr.push(index);
      return new Set(arr);
    });
  };

  const scrollActiveTabInCenter = (index: number) => {
    if (measurements.length > 0 && containerRef.current) {
      const tabMeasurement = measurements[index];
      if (tabMeasurement) {
        const tabCenter = tabMeasurement.x + tabMeasurement.width / 2;
        const scrollToX = Math.max(0, tabCenter - width / 2);

        containerRef.current.scrollTo({
          x: scrollToX,
          animated: true,
        });
      }
    }
  };

  const onTabPress = (index: number) => {
    scrollRef.current?.scrollTo({ x: width * index, animated: true });
    scrollActiveTabInCenter(index);
    updateActiveTab(index);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      "worklet";
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      "worklet";
      const index = Math.round(event.contentOffset.x / width);
      runOnJS(updateActiveTab)(index);
      runOnJS(scrollActiveTabInCenter)(index);
    },
  });

  const renderTabContent = (index: number) => {
    if (!loadedTabs.has(index)) return null;
    return tabs[index]?.content || null;
  };

  useEffect(() => {
    if (!containerRef?.current || tabs.length === 0) return;

    const measureTabs = () => {
      let m: Measurement[] = [];
      let measured = 0;

      tabs.forEach((_, index) => {
        const ref = tabRefs.current[index];
        if (ref?.current) {
          ref.current.measureLayout(
            containerRef.current!,
            (x, y, width, height) => {
              m[index] = { x, y, width, height };
              measured++;

              if (measured === tabs.length) {
                setMeasurements([...m]);
              }
            },
            () => {
              // Handle error if needed
            }
          );
        }
      });
    };

    // Small delay to ensure layout is complete
    const timer = setTimeout(measureTabs, 100);
    return () => clearTimeout(timer);
  }, [tabs.length]);

  useLayoutEffect(() => {
    accessoryViewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setHeaderHeight(height);
    });
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
        },
        containerStyle,
      ]}
    >
      <View
        ref={accessoryViewRef}
        style={{
          width: "100%",
          gap: 12,
          // position: "absolute",
          // top: insets.top,
          // left: 0,
          // zIndex: 10,
          // right: 0,
          // backgroundColor: "red",
          height: "auto",
        }}
      >
        {/* HEADER TOP TEXT + ACCESSORY BUTTONS */}
        <Animated.View
          style={[
            {
              flexDirection: "row",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 12,
            },
          ]}
        >
          <Text
            style={{ fontFamily: "Manrope", fontSize: 24, fontWeight: "600" }}
          >
            {tabTitle}
          </Text>
          <Pressable>
            <Entypo name="dots-three-vertical" size={24} color="black" />
          </Pressable>
        </Animated.View>

        {/* TABS RENDER HERE */}
        <ScrollView
          horizontal
          bounces={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabBar, tabBarStyle]}
          ref={containerRef}
        >
          {tabs.map((tab, index) => (
            <Tab
              ref={tabRefs.current[index]}
              key={`tab_${tab.id}_${index}`}
              title={tab.title}
              index={index}
              activeTab={activeTab}
              onTabPress={onTabPress}
              style={tabStyle}
            />
          ))}
          <Indicator
            measurements={measurements}
            scrollX={scrollX}
            tabsLength={tabs.length}
            style={indicatorStyle}
          />
        </ScrollView>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        // contentContainerStyle={[{ paddingTop: headerHeight }]}
        style={contentContainerStyle}
      >
        {tabs.map((_, index) => (
          <View key={`content_${index}`} style={{ width, flex: 1 }}>
            {renderTabContent(index)}
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

export default React.memo(DynamicTabs);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: -2,
    backgroundColor: "#fafafa",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    position: "relative",
    marginBottom: 12,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  tabText: {
    fontSize: 16,
    fontFamily: "Manrope",
    color: "#777",
    fontWeight: "700",
  },
  activeTabText: {
    color: "#ffffff",
  },
  tabIndicator: {
    height: "100%",
    zIndex: -1,
    borderRadius: 16,
    backgroundColor: "#222",
    position: "absolute",
    top: 0,
    left: 0,
  },
});

// import React, { forwardRef, useEffect, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   useWindowDimensions,
//   Pressable,
//   ScrollView,
// } from "react-native";
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   useAnimatedScrollHandler,
//   interpolate,
//   runOnJS,
//   SharedValue,
// } from "react-native-reanimated";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import Home from "./home";

// const TABS = [
//   { title: "Workouts", ref: React.createRef<View>() },
//   { title: "Nutrition", ref: React.createRef<View>() },
//   { title: "Favourites", ref: React.createRef<View>() },
// ];

// const Tab = forwardRef<
//   View,
//   {
//     index: number;
//     title: string;
//     onTabPress: any;
//     activeTab: number;
//   }
// >(({ index, title, onTabPress, activeTab }, ref) => {
//   const isActive = activeTab === index;

//   return (
//     <Pressable
//       ref={ref}
//       onLayout={(e) => {
//         console.log("E:", e.nativeEvent?.layout?.width);
//       }}
//       onPress={() => onTabPress(index)}
//       style={[styles.tabButton]}
//     >
//       <Text style={[styles.tabText, isActive && styles.activeTabText]}>
//         {title}
//       </Text>
//     </Pressable>
//   );
// });

// type Measurement = { x: number; y: number; width: number; height: number };

// interface IndicatorProps {
//   measurements: Measurement[];
//   scrollX: SharedValue<number>;
// }

// const Indicator = React.memo(({ measurements, scrollX }: IndicatorProps) => {
//   const { width } = useWindowDimensions();

//   const animatedStyle = useAnimatedStyle(() => {
//     "worklet";
//     // Don't animate if measurements aren't ready
//     if (!measurements || measurements.length === 0) {
//       return {
//         opacity: 0,
//       };
//     }

//     const inputRange = [];
//     const widthOutputRange = [];
//     const translateOutputRange = [];

//     for (let i = 0; i < TABS.length; i++) {
//       inputRange.push(i * width);
//       widthOutputRange.push(measurements[i]?.width);
//       translateOutputRange.push(measurements[i]?.x);
//     }

//     const indicatorWidth = interpolate(
//       scrollX.value,
//       inputRange,
//       widthOutputRange,
//       "clamp"
//     );

//     const translateX = interpolate(
//       scrollX.value,
//       inputRange,
//       translateOutputRange,
//       "clamp"
//     );

//     return {
//       opacity: 1,
//       width: indicatorWidth,
//       transitionProperty: "width",
//       transform: [{ translateX }],
//     };
//   }, [measurements, width]);

//   // Don't render anything if measurements aren't ready
//   if (!measurements || measurements.length === 0) {
//     return null;
//   }

//   return <Animated.View style={[styles.tabIndicator, animatedStyle]} />;
// });

// export default function TabsScreen({ navigation }: any) {
//   const [loadedTabs, setLoadedTabs] = useState<Set<number>>(new Set([0]));
//   const containerRef = useRef<ScrollView>(null);
//   const [activeTab, setActiveTab] = useState(0);
//   const insets = useSafeAreaInsets();
//   const { width } = useWindowDimensions();
//   const scrollRef = useRef<Animated.ScrollView>(null);
//   const scrollX = useSharedValue(0);
//   const [measurements, setMeasurements] = useState<Measurement[]>([]);

//   const updateActiveTab = (index: number) => {
//     setActiveTab(index);
//     setLoadedTabs((prev) => {
//       if (prev.has(index)) return prev;
//       const arr = Array.from(prev);
//       if (arr.length >= 2) arr.shift();
//       arr.push(index);
//       return new Set(arr);
//     });
//   };

//   const scrollActiveTabInCenter = (index: number) => {
//     // Scroll the tab into view if needed

//     if (measurements.length > 0 && containerRef.current) {
//       const tabMeasurement = measurements[index];
//       if (tabMeasurement) {
//         // Calculate the position to center the tab
//         const tabCenter = tabMeasurement.x + tabMeasurement.width / 2;
//         const containerWidth = width; // or get actual container width
//         const scrollToX = Math.max(0, tabCenter - containerWidth / 2);

//         containerRef.current.scrollTo({
//           x: scrollToX,
//           animated: true,
//         });
//       }
//     }
//   };

//   const onTabPress = (index: number) => {
//     scrollRef.current?.scrollTo({ x: width * index, animated: true });
//     scrollActiveTabInCenter(index);
//     updateActiveTab(index);
//   };

//   const scrollHandler = useAnimatedScrollHandler({
//     onScroll: (event) => {
//       "worklet";
//       scrollX.value = event.contentOffset.x;
//     },

//     onMomentumEnd: (event) => {
//       "worklet";
//       const index = Math.round(event.contentOffset.x / width);
//       runOnJS(updateActiveTab)(index);
//       runOnJS(scrollActiveTabInCenter)(index);
//     },
//   });

//   const renderTabContent = (index: number) => {
//     if (!loadedTabs.has(index)) return null;
//     switch (index) {
//       case 0:
//         return <Home navigation={navigation} />;
//       case 1:
//         return (
//           <View style={{ flex: 1, backgroundColor: "#fff" }}>
//             <Text>Second tab</Text>
//           </View>
//         );
//       case 2:
//         return (
//           <View style={{ flex: 1, backgroundColor: "#fff" }}>
//             <Text>Third tab</Text>
//           </View>
//         );
//       default:
//         return null;
//     }
//   };

//   useEffect(() => {
//     if (!containerRef?.current) return;
//     let m: Measurement[] = [];
//     TABS.forEach((tab) => {
//       tab.ref?.current?.measureLayout(
//         containerRef?.current,
//         (x, y, width, height) => {
//           m.push({
//             x,
//             y,
//             width,
//             height,
//           });

//           if (m.length === TABS.length) {
//             setMeasurements(m);
//           }
//         }
//       );
//     });
//   }, [containerRef, TABS]);

//   return (
//     <View
//       style={[
//         styles.container,
//         {
//           paddingTop: insets.top,
//         },
//       ]}
//     >
//       <View style={{ width: "100%", height: "auto" }}>
//         <ScrollView
//           horizontal
//           bounces={false}
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.tabBar}
//           ref={containerRef}
//         >
//           {TABS.map((tab, index) => {
//             return (
//               <Tab
//                 ref={tab?.ref}
//                 key={`tab_${index}`}
//                 title={tab?.title}
//                 index={index}
//                 activeTab={activeTab}
//                 onTabPress={onTabPress}
//               />
//             );
//           })}
//           <Indicator measurements={measurements} scrollX={scrollX} />
//         </ScrollView>
//       </View>

//       <Animated.ScrollView
//         ref={scrollRef}
//         horizontal
//         pagingEnabled
//         onScroll={scrollHandler}
//         scrollEventThrottle={16}
//         showsHorizontalScrollIndicator={false}
//       >
//         {TABS.map((_, index) => (
//           <View key={index} style={{ width, flex: 1 }}>
//             {renderTabContent(index)}
//           </View>
//         ))}
//       </Animated.ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     zIndex: -2,
//     backgroundColor: "#fafafa",
//   },
//   tabBar: {
//     flexDirection: "row",
//     paddingHorizontal: 12,
//     position: "relative",
//     marginBottom: 12,
//   },
//   tabButton: {
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     alignItems: "center",
//   },
//   tabText: {
//     fontSize: 16,
//     fontFamily: "Manrope",
//     color: "#777",
//     fontWeight: "700",
//   },
//   activeTabText: {
//     color: "#ffffff",
//   },
//   tabIndicator: {
//     height: "100%",
//     zIndex: -1,
//     borderRadius: 16,
//     backgroundColor: "#222",
//     position: "absolute",
//     top: 0,
//     left: 0,
//   },
// });
