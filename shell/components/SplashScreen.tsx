import React, { useEffect, useMemo } from "react";

import { Dimensions, StyleSheet, Text, View } from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import Animated, {

  Easing,

  cancelAnimation,

  runOnJS,

  useAnimatedStyle,

  useSharedValue,

  withDelay,

  withRepeat,

  withSequence,

  withTiming,

} from "react-native-reanimated";

import { COLORS } from "../constants/config";



export type SplashStatus = "connecting" | "waking" | "retrying" | "ready";



interface SplashScreenProps {

  visible: boolean;

  progress: number;

  status: SplashStatus;

  attempt?: number;

  onHidden?: () => void;

}



const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const PLANET_SIZE = 96;

const RING_W = 190;

const RING_H = 64;

const STAR_COUNT = 42;



const STATUS_COPY: Record<SplashStatus, string> = {

  connecting: "Connecting to Orbit",

  waking: "Waking up the Orbit servers",

  retrying: "Re-establishing link",

  ready: "Entering Orbit",

};



interface StarSpec {

  id: number;

  x: number;

  y: number;

  size: number;

  delay: number;

  duration: number;

}



function createStars(): StarSpec[] {

  const stars: StarSpec[] = [];

  let seed = 7;

  const random = () => {

    seed = (seed * 9301 + 49297) % 233280;

    return seed / 233280;

  };

  for (let i = 0; i < STAR_COUNT; i += 1) {

    stars.push({

      id: i,

      x: random() * SCREEN_W,

      y: random() * SCREEN_H,

      size: 1 + random() * 2.2,

      delay: random() * 2400,

      duration: 1400 + random() * 1800,

    });

  }

  return stars;

}



const Star = React.memo(({ star }: { star: StarSpec }) => {

  const opacity = useSharedValue(0.15);



  useEffect(() => {

    opacity.value = withDelay(

      star.delay,

      withRepeat(

        withSequence(

          withTiming(1, { duration: star.duration, easing: Easing.inOut(Easing.sin) }),

          withTiming(0.15, { duration: star.duration, easing: Easing.inOut(Easing.sin) }),

        ),

        -1,

        false,

      ),

    );

    return () => cancelAnimation(opacity);

  }, [opacity, star.delay, star.duration]);



  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));



  return (

    <Animated.View

      pointerEvents="none"

      style={[

        styles.star,

        { left: star.x, top: star.y, width: star.size, height: star.size, borderRadius: star.size / 2 },

        style,

      ]}

    />

  );

});



const AnimatedDots = () => {

  const d1 = useSharedValue(0.2);

  const d2 = useSharedValue(0.2);

  const d3 = useSharedValue(0.2);



  useEffect(() => {

    const pulse = (delay: number) =>

      withDelay(

        delay,

        withRepeat(

          withSequence(withTiming(1, { duration: 320 }), withTiming(0.2, { duration: 320 }), withTiming(0.2, { duration: 500 })),

          -1,

          false,

        ),

      );

    d1.value = pulse(0);

    d2.value = pulse(180);

    d3.value = pulse(360);

    return () => {

      cancelAnimation(d1);

      cancelAnimation(d2);

      cancelAnimation(d3);

    };

  }, [d1, d2, d3]);



  const s1 = useAnimatedStyle(() => ({ opacity: d1.value }));

  const s2 = useAnimatedStyle(() => ({ opacity: d2.value }));

  const s3 = useAnimatedStyle(() => ({ opacity: d3.value }));



  return (

    <View style={styles.dotsRow}>

      <Animated.Text style={[styles.statusText, s1]}>.</Animated.Text>

      <Animated.Text style={[styles.statusText, s2]}>.</Animated.Text>

      <Animated.Text style={[styles.statusText, s3]}>.</Animated.Text>

    </View>

  );

};



export default function SplashScreen({ visible, progress, status, attempt = 0, onHidden }: SplashScreenProps) {

  const stars = useMemo(createStars, []);



  const overlayOpacity = useSharedValue(1);

  const glowScale = useSharedValue(1);

  const glowOpacity = useSharedValue(0.45);

  const ringRotation = useSharedValue(0);

  const moonAngle = useSharedValue(0);

  const planetFloat = useSharedValue(0);

  const progressWidth = useSharedValue(0);

  const textOpacity = useSharedValue(0);

  const textTranslate = useSharedValue(6);



  useEffect(() => {

    glowScale.value = withRepeat(

      withSequence(

        withTiming(1.35, { duration: 1600, easing: Easing.inOut(Easing.quad) }),

        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),

      ),

      -1,

      false,

    );

    glowOpacity.value = withRepeat(

      withSequence(

        withTiming(0.9, { duration: 1600, easing: Easing.inOut(Easing.quad) }),

        withTiming(0.35, { duration: 1600, easing: Easing.inOut(Easing.quad) }),

      ),

      -1,

      false,

    );

    ringRotation.value = withRepeat(withTiming(360, { duration: 9000, easing: Easing.linear }), -1, false);

    moonAngle.value = withRepeat(withTiming(360, { duration: 4200, easing: Easing.linear }), -1, false);

    planetFloat.value = withRepeat(

      withSequence(

        withTiming(-6, { duration: 2200, easing: Easing.inOut(Easing.sin) }),

        withTiming(6, { duration: 2200, easing: Easing.inOut(Easing.sin) }),

      ),

      -1,

      true,

    );

    return () => {

      cancelAnimation(glowScale);

      cancelAnimation(glowOpacity);

      cancelAnimation(ringRotation);

      cancelAnimation(moonAngle);

      cancelAnimation(planetFloat);

    };

  }, [glowOpacity, glowScale, moonAngle, planetFloat, ringRotation]);



  useEffect(() => {

    textOpacity.value = 0;

    textTranslate.value = 6;

    textOpacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });

    textTranslate.value = withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) });

  }, [status, textOpacity, textTranslate]);



  useEffect(() => {

    const clamped = Math.min(1, Math.max(0, progress));

    progressWidth.value = withTiming(clamped, { duration: 380, easing: Easing.out(Easing.cubic) });

  }, [progress, progressWidth]);



  useEffect(() => {

    if (visible) {

      overlayOpacity.value = withTiming(1, { duration: 220 });

      return;

    }

    progressWidth.value = withTiming(1, { duration: 200 });

    overlayOpacity.value = withDelay(

      180,

      withTiming(0, { duration: 520, easing: Easing.inOut(Easing.cubic) }, (finished) => {

        if (finished && onHidden) runOnJS(onHidden)();

      }),

    );

  }, [visible, onHidden, overlayOpacity, progressWidth]);



  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  const glowStyle = useAnimatedStyle(() => ({

    opacity: glowOpacity.value,

    transform: [{ scale: glowScale.value }],

  }));

  const planetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: planetFloat.value }] }));

  const ringStyle = useAnimatedStyle(() => ({

    transform: [{ translateY: planetFloat.value }, { rotateX: "68deg" }, { rotateZ: `${ringRotation.value}deg` }],

  }));

  const moonStyle = useAnimatedStyle(() => {

    const rad = (moonAngle.value * Math.PI) / 180;

    return {

      transform: [

        { translateY: planetFloat.value },

        { translateX: Math.cos(rad) * (RING_W / 2) },

        { translateY: Math.sin(rad) * (RING_H / 2) },

        { scale: 0.75 + ((Math.sin(rad) + 1) / 2) * 0.5 },

      ],

      opacity: 0.55 + ((Math.sin(rad) + 1) / 2) * 0.45,

      zIndex: Math.sin(rad) > 0 ? 3 : 1,

    };

  });

  const progressStyle = useAnimatedStyle(() => ({

    width: `${progressWidth.value * 100}%` as `${number}%`,

  }));

  const textStyle = useAnimatedStyle(() => ({

    opacity: textOpacity.value,

    transform: [{ translateY: textTranslate.value }],

  }));



  return (

    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents={visible ? "auto" : "none"}>

      <LinearGradient

        colors={["#0f172a", "#0b1226", "#0f172a"]}

        start={{ x: 0.1, y: 0 }}

        end={{ x: 0.9, y: 1 }}

        style={StyleSheet.absoluteFill}

      />

      {stars.map((star) => (

        <Star key={star.id} star={star} />

      ))}



      <View style={styles.center}>

        <View style={styles.logoStage}>

          <Animated.View style={[styles.glow, glowStyle]} />

          <Animated.View style={[styles.ring, ringStyle]} />

          <Animated.View style={[styles.planet, planetStyle]}>

            <LinearGradient

              colors={[COLORS.goldLight, COLORS.gold, COLORS.goldDeep]}

              start={{ x: 0.2, y: 0.1 }}

              end={{ x: 0.9, y: 1 }}

              style={styles.planetGradient}

            >

              <View style={styles.planetHighlight} />

              <View style={styles.planetBand} />

              <View style={[styles.planetBand, styles.planetBandLower]} />

            </LinearGradient>

          </Animated.View>

          <Animated.View style={[styles.moon, moonStyle]} />

        </View>



        <Text style={styles.brand}>ORBIT</Text>

        <Text style={styles.tagline}>Break free. Stay connected.</Text>



        <Animated.View style={[styles.statusRow, textStyle]}>

          <Text style={styles.statusText}>{STATUS_COPY[status]}</Text>

          <AnimatedDots />

        </Animated.View>



        {status === "waking" && (

          <Text style={styles.hint}>

            First launch of the day can take up to a minute while the server spins up.

          </Text>

        )}

        {status === "retrying" && attempt > 0 && <Text style={styles.hint}>Attempt {attempt}</Text>}

      </View>



      <View style={styles.progressTrack}>

        <Animated.View style={[styles.progressFill, progressStyle]}>

          <LinearGradient

            colors={[COLORS.goldDeep, COLORS.gold, COLORS.goldLight]}

            start={{ x: 0, y: 0 }}

            end={{ x: 1, y: 0 }}

            style={StyleSheet.absoluteFill}

          />

        </Animated.View>

      </View>

    </Animated.View>

  );

}



const styles = StyleSheet.create({

  overlay: {

    ...StyleSheet.absoluteFillObject,

    backgroundColor: COLORS.bg,

    zIndex: 20,

    elevation: 20,

  },

  star: {

    position: "absolute",

    backgroundColor: "#e2e8f0",

  },

  center: {

    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 32,

  },

  logoStage: {

    width: RING_W + 40,

    height: RING_W + 40,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 28,

  },

  glow: {

    position: "absolute",

    width: PLANET_SIZE * 1.9,

    height: PLANET_SIZE * 1.9,

    borderRadius: PLANET_SIZE,

    backgroundColor: COLORS.gold,

    shadowColor: COLORS.gold,

    shadowOpacity: 0.9,

    shadowRadius: 40,

    shadowOffset: { width: 0, height: 0 },

  },

  ring: {

    position: "absolute",

    width: RING_W,

    height: RING_W,

    borderRadius: RING_W / 2,

    borderWidth: 2,

    borderColor: "rgba(241, 209, 138, 0.75)",

    borderStyle: "solid",

  },

  planet: {

    width: PLANET_SIZE,

    height: PLANET_SIZE,

    borderRadius: PLANET_SIZE / 2,

    overflow: "hidden",

    zIndex: 2,

    elevation: 6,

  },

  planetGradient: {

    flex: 1,

    borderRadius: PLANET_SIZE / 2,

  },

  planetHighlight: {

    position: "absolute",

    top: 12,

    left: 16,

    width: 30,

    height: 18,

    borderRadius: 16,

    backgroundColor: "rgba(255,255,255,0.35)",

    transform: [{ rotate: "-25deg" }],

  },

  planetBand: {

    position: "absolute",

    left: -10,

    right: -10,

    top: PLANET_SIZE * 0.52,

    height: 6,

    borderRadius: 3,

    backgroundColor: "rgba(120, 76, 20, 0.28)",

    transform: [{ rotate: "-8deg" }],

  },

  planetBandLower: {

    top: PLANET_SIZE * 0.7,

    height: 4,

    backgroundColor: "rgba(120, 76, 20, 0.2)",

  },

  moon: {

    position: "absolute",

    width: 12,

    height: 12,

    borderRadius: 6,

    backgroundColor: COLORS.goldLight,

    shadowColor: COLORS.goldLight,

    shadowOpacity: 0.9,

    shadowRadius: 8,

    shadowOffset: { width: 0, height: 0 },

    elevation: 8,

  },

  brand: {

    color: COLORS.text,

    fontSize: 30,

    fontWeight: "800",

    letterSpacing: 10,

    marginLeft: 10,

  },

  tagline: {

    color: COLORS.slate,

    fontSize: 13,

    marginTop: 6,

    letterSpacing: 0.4,

  },

  statusRow: {

    flexDirection: "row",

    alignItems: "flex-end",

    marginTop: 40,

  },

  dotsRow: {

    flexDirection: "row",

  },

  statusText: {

    color: COLORS.gold,

    fontSize: 15,

    fontWeight: "600",

    letterSpacing: 0.6,

  },

  hint: {

    color: COLORS.slateDark,

    fontSize: 12,

    textAlign: "center",

    marginTop: 12,

    lineHeight: 18,

    maxWidth: 280,

  },

  progressTrack: {

    height: 3,

    width: "100%",

    backgroundColor: "rgba(212, 162, 76, 0.15)",

  },

  progressFill: {

    height: "100%",

    overflow: "hidden",

  },

});
