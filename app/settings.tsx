import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Avatar } from "../src/components/Avatar";
import { TextField } from "../src/components/TextField";
import { Button } from "../src/components/Button";
import { useAuth } from "../src/context/AuthContext";
import { getBackend } from "../src/services/backend";
import { pickImages, requestPermission } from "../src/services/imagePicker";
import { colors, fontSize, spacing } from "../src/theme/theme";

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshUser, signOut } = useAuth();

  const [username, setUsername] = useState(user?.username ?? "");
  const [favoritePlace, setFavoritePlace] = useState(user?.favorite_place ?? "");
  const [travelTip, setTravelTip] = useState(user?.travel_tip ?? "");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChangePhoto() {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert("Permission needed", "Please allow photo access.");
      return;
    }
    const picked = await pickImages();
    if (picked[0]) setPhotoUri(picked[0].uri);
  }

  async function onSave() {
    setError(null);
    if (username.trim().length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }
    if (!user) return;
    try {
      setSaving(true);
      await getBackend().updateProfile(user.id, {
        username: username.trim(),
        favorite_place: favoritePlace.trim(),
        travel_tip: travelTip.trim(),
        profilePhotoUri: photoUri,
      });
      await refreshUser();
      Alert.alert("Saved", "Your profile has been updated.");
      router.back();
    } catch (e: any) {
      setError(e?.message ?? "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader
        title="Settings"
        subtitle="Manage your profile"
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.photoSection}>
          <Pressable onPress={onChangePhoto} style={styles.photoPressable}>
            <Avatar
              uri={photoUri ?? user?.profile_photo}
              name={username}
              size={100}
            />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color={colors.textInverse} />
            </View>
          </Pressable>
          <Pressable onPress={onChangePhoto}>
            <Text style={styles.changePhoto}>Change profile photo</Text>
          </Pressable>
        </View>

        <TextField
          label="Username"
          icon="person-outline"
          placeholder="Your username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextField
          label="Favourite place visited"
          icon="heart-outline"
          placeholder="e.g. Kyoto, Japan"
          value={favoritePlace}
          onChangeText={setFavoritePlace}
        />
        <TextField
          label="Top travel tip"
          icon="bulb-outline"
          placeholder="Share your best advice"
          multiline
          value={travelTip}
          onChangeText={setTravelTip}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Save changes" icon="checkmark" onPress={onSave} loading={saving} />
        <Button
          label="Log out"
          icon="log-out-outline"
          variant="ghost"
          onPress={signOut}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  photoSection: { alignItems: "center", gap: spacing.sm },
  photoPressable: { position: "relative" },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.background,
  },
  changePhoto: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
