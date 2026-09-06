import React, { useEffect } from "react";

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { Ionicons } from "@expo/vector-icons";

import Animated, {

  Easing,

  cancelAnimation,

  useAnimatedStyle,

  useSharedValue,

  withRepeat,

  withSequence,

  withSpring,

  withTiming,

} from "react-native-reanimated";

import { COLORS } from "../constants/config";



export type OfflineReason = "offline" | "server" | "timeout";



interface OfflineScreenProps {

  reason: OfflineReason;

  retrying: boolean;

  onRetry: () => void;

  attempt?: number;

}



const COPY: Record<OfflineReason, { title: string; description: string; icon: keyof typeof Ionicons.glyphMap }> = {

  offline: {

    title: "You are out of Orbit",

    description: "Check your internet connection. We'll reconnect you the moment you're back in range.",

    icon: "cloud-offline-outline",

  },

  server: {

    title: "Orbit is out of reach",

    description: "The Orbit servers didn't respond. They may be waking up — give it a moment and try again.",

    icon: "planet-outline",

  },

  timeout: {

    title: "Lost signal to Orbit",

    description: "The connection took too long. Your network may be slow or the server is still spinning up.",

    icon: "radio-outline",

  },

};



const AnimatedPressable = Animated.createAnimatedComponent(Pressable);



export default function OfflineScreen({ reason, retrying, onRetry, attempt = 0 }: OfflineScreenProps) {

  const copy = COPY[reason];



  const float = useSharedValue(0);

  const orbitSpin = useSharedValue(0);

  const signalPulse = useSharedValue(0.3);

  const buttonScale = useSharedValue(1);

  const enter = useSharedValue(0);



  useEffect(() => {

    enter.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });

    float.value = withRepeat(

      withSequence(

        withTiming(-8, { duration: 2400, easing: Easing.inOut(Easing.sin) }),

        withTiming(8, { duration: 2400, easing: Easing.inOut(Easing.sin) }),

      ),

      -1,

      true,

    );

    orbitSpin.value = withRepeat(withTiming(360, { duration: 14000, easing: Easing.linear }), -1, false);

    signalPulse.value = withRepeat(

      withSequence(withTiming(1, { duration: 900 }), withTiming(0.3, { duration: 900 })),

      -1,

      false,

    );

    return () => {

      cancelAnimation(float);

      cancelAnimation(orbitSpin);

      cancelAnimation(signalPulse);

    };

  }, [enter, float, orbitSpin, signalPulse]);



  const containerStyle = useAnimatedStyle(() => ({

    opacity: enter.value,

    transform: [{ translateY: (1 - enter.value) * 16 }],

  }));

  const satelliteStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));

  const orbitStyle = useAnimatedStyle(() => ({

    transform: [{ rotateX: "70deg" }, { rotateZ: `${orbitSpin.value}deg` }],

  }));

  const signalStyle = useAnimatedStyle(() => ({ opacity: signalPulse.value }));

  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));



  return (

    <View style={styles.root}>

      <LinearGradient

        colors={["#0f172a", "#0a1024", "#0f172a"]}

        start={{ x: 0, y: 0 }}

        end={{ x: 1, y: 1 }}

        style={StyleSheet.absoluteFill}

      />



      <Animated.View style={[styles.content, containerStyle]}>

        <View style={styles.stage}>

          <Animated.View style={[styles.orbitPath, orbitStyle]} />

          <Animated.View style={[styles.satelliteWrap, satelliteStyle]}>

            <View style={styles.satelliteHalo}>

              <Ionicons name={copy.icon} size={64} color={COLORS.gold} />

            </View>

          </Animated.View>

          <Animated.View style={[styles.signal, styles.signalLeft, signalStyle]} />

          <Animated.View style={[styles.signal, styles.signalRight, signalStyle]} />

          <View style={styles.dot} />

        </View>



        <Text style={styles.title}>{copy.title}</Text>

        <Text style={styles.description}>{copy.description}</Text>



        <AnimatedPressable

          accessibilityRole="button"

          accessibilityLabel="Retry connection"

          disabled={retrying}

          onPressIn={() => {

            buttonScale.value = withSpring(0.96, { damping: 18, stiffness: 260 });

          }}

          onPressOut={() => {

            buttonScale.value = withSpring(1, { damping: 18, stiffness: 260 });

          }}

          onPress={onRetry}

          style={[styles.button, retrying && styles.buttonDisabled, buttonStyle]}

        >

          <LinearGradient

            colors={[COLORS.goldLight, COLORS.gold, COLORS.goldDeep]}

            start={{ x: 0, y: 0 }}

            end={{ x: 1, y: 1 }}

            style={styles.buttonGradient}

          >

            {retrying ? (

              <ActivityIndicator color={COLORS.bg} />

            ) : (

              <>

                <Ionicons name="refresh" size={18} color={COLORS.bg} style={styles.buttonIcon} />

                <Text style={styles.buttonLabel}>Try Again</Text>

              </>

            )}

          </LinearGradient>

        </AnimatedPressable>



        <Text style={styles.footnote}>

          {retrying

            ? "Retrying connection…"

            : attempt > 0

              ? `We'll keep trying automatically • ${attempt} ${attempt === 1 ? "attempt" : "attempts"} so far`

              : "Orbit reconnects automatically when your network returns."}

        </Text>

      </Animated.View>

    </View>

  );

}



const styles = StyleSheet.create({

  root: {

    ...StyleSheet.absoluteFillObject,

    backgroundColor: COLORS.bg,

    zIndex: 10,

    elevation: 10,

  },

  content: {

    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 32,

  },

  stage: {

    width: 220,

    height: 220,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 24,

  },

  orbitPath: {

    position: "absolute",

    width: 210,

    height: 210,

    borderRadius: 105,

    borderWidth: 1.5,

    borderColor: "rgba(148, 163, 184, 0.22)",

    borderStyle: "dashed",

  },

  satelliteWrap: {

    alignItems: "center",

    justifyContent: "center",

  },

  satelliteHalo: {

    width: 128,

    height: 128,

    borderRadius: 64,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "rgba(212, 162, 76, 0.08)",

    borderWidth: 1,

    borderColor: "rgba(212, 162, 76, 0.28)",

  },

  signal: {

    position: "absolute",

    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: COLORS.danger,

  },

  signalLeft: { left: 28, top: 60 },

  signalRight: { right: 34, bottom: 52 },

  dot: {

    position: "absolute",

    top: 8,

    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: COLORS.goldLight,

  },

  title: {

    color: COLORS.text,

    fontSize: 26,

    fontWeight: "800",

    textAlign: "center",

    letterSpacing: 0.3,

  },

  description: {

    color: COLORS.slate,

    fontSize: 15,

    lineHeight: 22,

    textAlign: "center",

    marginTop: 12,

    maxWidth: 320,

  },

  button: {

    marginTop: 32,

    borderRadius: 999,

    overflow: "hidden",

    minWidth: 200,

    shadowColor: COLORS.gold,

    shadowOpacity: 0.35,

    shadowRadius: 18,

    shadowOffset: { width: 0, height: 8 },

    elevation: 8,

  },

  buttonDisabled: {

    opacity: 0.7,

  },

  buttonGradient: {

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    paddingVertical: 15,

    paddingHorizontal: 28,

    minHeight: 52,

  },

  buttonIcon: {

    marginRight: 8,

  },

  buttonLabel: {

    color: COLORS.bg,

    fontSize: 16,

    fontWeight: "800",

    letterSpacing: 0.4,

  },

  footnote: {

    color: COLORS.slateDark,

    fontSize: 12,

    marginTop: 20,

    textAlign: "center",

  },

});
