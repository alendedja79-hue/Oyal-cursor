import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, fontSize, shadow } from "../theme/theme";

interface Props<T extends string> {
  label?: string;
  value: T | null;
  options: readonly T[];
  placeholder?: string;
  onChange: (value: T) => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Select<T extends string>({
  label,
  value,
  options,
  placeholder = "Select…",
  onChange,
  icon,
}: Props<T>) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        style={styles.field}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={colors.textMuted}
            style={{ marginRight: spacing.sm }}
          />
        ) : null}
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            {label ? <Text style={styles.sheetTitle}>{label}</Text> : null}
            {options.map((opt) => {
              const selected = opt === value;
              return (
                <Pressable
                  key={opt}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    marginLeft: spacing.xs,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  value: { flex: 1, fontSize: fontSize.md, color: colors.text },
  placeholder: { color: colors.textMuted },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
    ...shadow.card,
  },
  sheetTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  optionSelected: { backgroundColor: colors.surfaceMuted },
  optionText: { fontSize: fontSize.md, color: colors.text },
  optionTextSelected: { color: colors.primary, fontWeight: "700" },
});
