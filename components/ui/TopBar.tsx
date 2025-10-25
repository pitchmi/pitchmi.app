import React from "react";
import {
  View, TextInput, Pressable, Text, StyleSheet, FlatList,
  type StyleProp, type ViewStyle, type TextStyle
} from "react-native";

type Suggestion = { id: string; title: string; description?: string };

type Props = {
  style?: StyleProp<ViewStyle>;       // <- CONTENEDOR (View)
  inputStyle?: StyleProp<TextStyle>;  // <- INPUT (Text)
  query: string;
  setQuery: (s: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  suggestions?: Suggestion[];
  onPick?: (id: string) => void;
  onFocusInput?: () => void;
};

const C = "#3d4e5e";

export default function TopBar(props: Props) {
  const {
    style, inputStyle, query, setQuery,
    placeholder = "Buscar…", onSubmit,
    suggestions = [], onPick, onFocusInput,
  } = props;

  return (
    <View style={[styles.box, style]}>
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor="rgba(61,78,94,0.6)"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        onFocus={onFocusInput}
      />
      {suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => onPick?.(item.id)} style={styles.sugRow}>
                <Text numberOfLines={1} style={styles.sugTitle}>{item.title}</Text>
                {!!item.description && (
                  <Text numberOfLines={1} style={styles.sugDesc}>{item.description}</Text>
                )}
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width:"100%", borderRadius:14, paddingHorizontal:14, paddingVertical:10, backgroundColor:"#fff" },
  input: { minHeight:32, fontSize:15, color:C },
  dropdown: { marginTop:6, borderRadius:12, backgroundColor:"#fff", overflow:"hidden" },
  sugRow: { paddingVertical:10, paddingHorizontal:12 },
  sugTitle: { color:C, fontWeight:"700" },
  sugDesc: { color:"rgba(61,78,94,0.8)", fontSize:12 },
});
