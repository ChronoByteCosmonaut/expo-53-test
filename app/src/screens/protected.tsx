import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import ScreenGuardModule from "react-native-screenguard";

const Protected = () => {
  const [cPStatus, setCPStatus] = useState<any>();
  console.log("Preventing");

  const data = {
    backgroundColor: "#222222",
    timeAfterResume: 1000,
  };

  const preventScreenCapture = async () => {
    await ScreenGuardModule.register(data);
  };

  const unregister = async () => {
    await ScreenGuardModule.unregister();
  };

  useEffect(() => {
    preventScreenCapture();
    return () => {
      unregister();
    };
  }, []);
  return (
    <View style={styles.container}>
      <Text style={{ color: cPStatus?.record ? "blue" : "black" }}>
        {"Record Prevent : " + cPStatus?.record}
      </Text>
      <Text style={{ color: cPStatus?.screenshot ? "blue" : "black" }}>
        {"Screenshot Prevent : " + cPStatus?.screenshot}
      </Text>

      <Text>it is Screct View!!</Text>
    </View>
  );
};

export default Protected;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
