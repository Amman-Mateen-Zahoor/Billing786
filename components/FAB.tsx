import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  onPress: () => void;
  label?: string;
}

const FAB: React.FC<Props> = ({ onPress, label = "Create Invoice" }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.inner}>
        <Text style={styles.plus}>+</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    bottom: 26,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  inner: {
    backgroundColor: "#0b74de",
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  plus: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginRight: 8,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default FAB;
