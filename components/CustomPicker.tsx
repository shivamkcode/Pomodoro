import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";

interface ScrollablePickerProps {
  initialValue: number;
  options: number[];
  onValueChange: (value: number) => void;
}

const ScrollablePicker: React.FC<ScrollablePickerProps> = ({
  initialValue,
  options,
  onValueChange,
}) => {
  const [selectedValue, setSelectedValue] = useState(initialValue);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleValueChange = (value: number) => {
    setSelectedValue(value);
    onValueChange(value);
    setDropdownVisible(false);
  };

  const renderItem = ({ item }: { item: number }) => (
    <Pressable style={styles.item} onPress={() => handleValueChange(item)}>
      <Text style={styles.itemText}>{item}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setDropdownVisible(!dropdownVisible)}
      >
        <Text style={styles.buttonText}>{selectedValue}</Text>
      </TouchableOpacity>
      {dropdownVisible && (
        <View style={styles.dropdown}>
          <FlatList
            data={options}
            renderItem={renderItem}
            keyExtractor={(item) => item.toString()}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: 140,
  },
  button: {
    backgroundColor: "#EFF1FA",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: 140,
  },
  buttonText: {
    color: "#1E213F",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  dropdown: {
    position: "absolute",
    width: 140,
    backgroundColor: "#EFF1FA",
    borderRadius: 10,
    paddingTop: 5,
    top: 45,
    zIndex: 1000
  },
  item: {
    padding: 10,
    marginHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  itemText: {
    fontSize: 18,
    textAlign: "center",
  },
});

export default ScrollablePicker;

