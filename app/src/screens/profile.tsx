import { Button, StyleSheet, Text, View } from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../utils/supabase";

const Profile = () => {
  const insets = useSafeAreaInsets();

  async function signOut() {
    await supabase.auth?.signOut();
  }

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top }}>
        <Text>Signed in with Instant through Clerk!</Text>
        <Button onPress={() => signOut()} title="Sign out" />
      </View>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  spaceY4: {
    marginVertical: 16,
  },
  spaceX4: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
  },
  contentSection: {
    backgroundColor: "white",
    opacity: 0.8,
    padding: 12,
    borderRadius: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
});
