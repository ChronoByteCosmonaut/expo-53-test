import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TextInputProps,
} from "react-native";
import React from "react";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
type InputProps = TextInputProps & {
  type: any; // Consider using a more specific type
  label: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  error?: string;
};

function InputElement({
  type,
  value,
  onChangeText,
  onBlur,
  ...textInputProps
}: TextInputProps & {
  type: any;
}) {
  switch (type) {
    case "password":
      return (
        <AnimatedTextInput
          style={styles.input}
          value={value}
          secureTextEntry
          onChangeText={onChangeText}
          onBlur={onBlur}
          {...textInputProps}
        />
      );
    case "text":
      return (
        <AnimatedTextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          {...textInputProps}
        />
      );

    case "number":
      return (
        <AnimatedTextInput
          keyboardType="numbers-and-punctuation"
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          {...textInputProps}
        />
      );

    case "textarea":
      return (
        <AnimatedTextInput
          style={styles.input}
          multiline
          numberOfLines={5}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          {...textInputProps}
        />
      );
    default:
      return (
        <AnimatedTextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          {...textInputProps}
        />
      );
  }
}

const Input = ({
  type,
  label,
  value,
  onChangeText,
  onBlur,
  error,
  ...textInputProps
}: InputProps) => {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <InputElement
        type={type}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        {...textInputProps}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  inputWrapper: {
    gap: 8,
  },
  label: { fontFamily: "Manrope" },
  input: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#eeeeee",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    fontFamily: "Manrope",
  },
});
