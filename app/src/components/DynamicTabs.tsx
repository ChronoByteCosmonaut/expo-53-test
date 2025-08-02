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
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  SharedValue,
  Extrapolation,
  withSpring,
} from "react-native-reanimated";
import { runOnJS, runOnUI } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Entypo from "@expo/vector-icons/Entypo";

// Types
export interface TabItem {
  id: string;
  title: string;
  content: React.ReactNode | ((scrollHandler?: any) => React.ReactNode);
  needsScrollHandler?: boolean;
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
function DynamicTabs({ tabs, maxLoadedTabs = 2, tabTitle }: DynamicTabsProps) {
  const [loadedTabs, setLoadedTabs] = useState<Set<number>>(new Set([0, 1]));
  console.log("🚀 ~ DynamicTabs ~ loadedTabs:", loadedTabs);
  const containerRef = useRef<ScrollView>(null);
  const headingRef = useRef<Animated.View>(null);
  const [activeTab, setActiveTab] = useState(0);
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [headingHeight, setHeadingHeight] = useState<number>(0);
  const { width } = useWindowDimensions();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);

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
    scrollY.value = withSpring(0);
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

  const innerScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      "worklet";
      scrollY.value = event.contentOffset.y;
    },
  });

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

  const renderTabContent = (index: number): React.ReactNode => {
    if (!loadedTabs.has(index)) return null;

    const tab = tabs[index];
    if (!tab) return null;

    const { content, needsScrollHandler } = tab;

    // Check if content is a function
    if (typeof content === "function") {
      // Pass the innerScrollHandler if the tab needs it
      return (
        content(needsScrollHandler ? innerScrollHandler : undefined) || null
      );
    }

    // Content is already a ReactNode
    return content || null;
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
    headingRef.current?.measure((x, y, width, height, pageX, pageY) => {
      console.log("Heading height:", height);
      setHeadingHeight(height);
    });
  }, []);

  useLayoutEffect(() => {
    accessoryViewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      console.log("🚀 ~ DynamicTabs ~ height:", height);
      setHeaderHeight(height);
    });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    "worklet";
    const interpolatedHeadingHeight = interpolate(
      scrollY.value,
      [0, Platform.OS === "ios" ? headingHeight * 1.128 : headerHeight],
      [0, headingHeight + 16],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY: -interpolatedHeadingHeight }],
    };
  }, [headingHeight, headerHeight, insets.top]);

  const headingAnimatedStyle = useAnimatedStyle(() => {
    "worklet";

    const interpolatedOpacity = interpolate(
      scrollY.value,
      [0, Platform.OS === "ios" ? headingHeight * 1.128 : headerHeight],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity: interpolatedOpacity,
    };
  }, [headingHeight, headerHeight]);

  const paddingTopStyle = useAnimatedStyle(() => {
    "worklet";
    const interpolatedPaddingTop = interpolate(
      scrollY.value,
      [0, Platform.OS === "ios" ? headingHeight * 1.128 : headerHeight],
      [headerHeight, headerHeight - headingHeight - 16],
      Extrapolation.CLAMP
    );

    return {
      paddingTop: interpolatedPaddingTop,
    };
  }, [headingHeight, headerHeight]);

  return (
    <View style={[styles.container]}>
      <Animated.View
        ref={accessoryViewRef}
        style={[
          {
            width: "100%",
            gap: 16,
            position: "absolute",
            paddingTop: insets.top,
            left: 0,
            zIndex: 10,
            right: 0,
            height: "auto",
          },
          headerAnimatedStyle,
        ]}
      >
        <Animated.View
          ref={headingRef}
          style={[
            {
              flexDirection: "row",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 12,
            },
            headingAnimatedStyle,
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

        <ScrollView
          horizontal
          bounces={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabBar]}
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
            />
          ))}
          <Indicator
            measurements={measurements}
            scrollX={scrollX}
            tabsLength={tabs.length}
          />
        </ScrollView>
      </Animated.View>

      {/* Content Container */}

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        automaticallyAdjustContentInsets
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[paddingTopStyle]}
        style={[{}, paddingTopStyle]}
      >
        {tabs.map((_, index) => (
          <Animated.View key={`content_${index}`} style={[{ width, flex: 1 }]}>
            {renderTabContent(index)}
          </Animated.View>
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
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    position: "relative",
    paddingBottom: 12,
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
