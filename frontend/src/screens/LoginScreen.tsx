import React, { useState } from "react";
import { SafeAreaView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MouseBankerLogo } from "../components/MouseBankerLogo";
import { styles } from "../styles/appStyles";
import { COLORS } from "../theme/colors";

type LoginScreenProps = {
  onLogin: () => void;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.loginScreen}>
        <View style={styles.loginHeader}>
          <MouseBankerLogo />
          <Text style={styles.brandTitle}>EquityMouse</Text>
          <Text style={styles.brandSubtitle}>Smart research starts here</Text>
        </View>

        <View style={styles.formCard}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={COLORS.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={COLORS.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={onLogin} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>Demo mode: any email and password will open the app.</Text>
        </View>

        <View style={styles.footerLinks}>
          <TouchableOpacity>
            <Text style={styles.secondaryLink}>Forgot Password?</Text>
          </TouchableOpacity>
          <Text style={styles.signupText}>
            Don't have an account? <Text style={styles.signupAccent}>Create Account</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
