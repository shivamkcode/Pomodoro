import { useCallback, useEffect, useRef, useState } from "react";
import "regenerator-runtime/runtime";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Image,
  Pressable,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  LayoutChangeEvent,
} from "react-native";
import "./styles.css";
import { Picker } from "@react-native-picker/picker";
import Canvas from "react-native-canvas";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from "@expo-google-fonts/space-mono";
import {
  RobotoSlab_700Bold,
  RobotoSlab_400Regular,
} from "@expo-google-fonts/roboto-slab";
import {
  EncodeSans_400Regular,
  EncodeSans_700Bold,
} from "@expo-google-fonts/encode-sans";

SplashScreen.preventAutoHideAsync();

const Pomodoro = () => {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timer, setTimer] = useState<NodeJS.Timeout>();
  const [paused, setPaused] = useState(true);
  const [started, setStarted] = useState(false);
  const [reset, setReset] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedButton, setSelectedButton] = useState("pomodoro");

  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);

  const [font, setFont] = useState("kumbh sans");
  const [color, setColor] = useState("#F87070");

  const [tempPomodoroTime, setTempPomodoroTime] = useState(pomodoroTime);
  const [tempShortBreakTime, setTempShortBreakTime] = useState(shortBreakTime);
  const [tempLongBreakTime, setTempLongBreakTime] = useState(longBreakTime);
  const [tempFont, setTempFont] = useState(font);
  const [tempColor, setTempColor] = useState(color);

  const [shouldBlink, setShouldBlink] = useState(true);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const toggleSettings = () => setShowSettings(!showSettings);

  let [fontsLoaded, fontError] = useFonts({
    "space mono bold": SpaceMono_700Bold,
    "roboto slab bold": RobotoSlab_700Bold,
    "kumbh sans bold": EncodeSans_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const getCustomizations = async () => {
      const savedCustomizations = await AsyncStorage.getItem("customizations");
      if (savedCustomizations) {
        const parsedCustomizations = JSON.parse(savedCustomizations);
        setTempPomodoroTime(parsedCustomizations.tempPomodoroTime);
        setTempShortBreakTime(parsedCustomizations.tempShortBreakTime);
        setTempLongBreakTime(parsedCustomizations.tempLongBreakTime);
        setFont(parsedCustomizations.tempFont);
        setColor(parsedCustomizations.tempColor);
        setTempFont(parsedCustomizations.tempFont);
        setTempColor(parsedCustomizations.tempColor);
        setSelectedButton(parsedCustomizations.selectedButton);
        setSecondsLeft(parsedCustomizations.secondsLeft);
        setStarted(parsedCustomizations.setStarted);
      } else {
        setTempPomodoroTime(60);
        setTempShortBreakTime(shortBreakTime);
        setTempLongBreakTime(longBreakTime);
        setFont("kumbh sans");
        setColor("F87070");
        setTempFont(font);
        setTempColor(color);
        setSelectedButton("pomodoro");
        setSecondsLeft(25 * 60);
        setStarted(false);
      }
    };

    getCustomizations();
  }, []);

  useEffect(() => {
    const saveCustomizations = async () => {
      try {
        await AsyncStorage.setItem(
          "customizations",
          JSON.stringify({
            tempPomodoroTime,
            tempShortBreakTime,
            tempLongBreakTime,
            tempFont,
            tempColor,
            selectedButton,
            secondsLeft,
            started,
          })
        );
      } catch (error) {
        console.log("Error saving customizations to AsyncStorage:", error);
      }
    };

    saveCustomizations();
  }, [
    tempPomodoroTime,
    tempShortBreakTime,
    tempLongBreakTime,
    tempFont,
    tempColor,
    selectedButton,
    secondsLeft,
  ]);

  useEffect(() => {
    if (secondsLeft <= 10 && secondsLeft > 0) {
      const interval = setInterval(() => {
        setShouldBlink((shouldBlink) => !shouldBlink);
      }, 800);
      return () => clearInterval(interval);
    } else {
      setShouldBlink(true);
    }
  }, [seconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (started && !paused) {
        setSecondsLeft((secondsLeft) => secondsLeft - 1);
      }
      if (secondsLeft === 0) {
        clearInterval(timer);
      }
    }, 1000);
    setTimer(timer);
  }, [paused, started]);

  useEffect(() => {
    if (secondsLeft === 0) {
      clearInterval(timer);
      setStarted(true);
    }
  }, [timer, secondsLeft]);

  useEffect(() => {
    return () => clearInterval(timer);
  }, [timer]);

  const canvasRef = useRef<Canvas>(null);

  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { layout } = event.nativeEvent
    if (canvasRef?.current) {
      canvasRef.current.height = layout.height
      canvasRef.current.width = layout.width
    }
  }

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.height = 248;

      const drawTimerStrip = (remainingTime: number) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const percentageRemaining = remainingTime / (tempPomodoroTime * 60);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const startAngle = -0.5 * Math.PI;
        const endAngle = 2 * Math.PI * percentageRemaining - 0.5 * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = color;
        ctx.lineWidth = 10;
        ctx.stroke();
      };

      drawTimerStrip(secondsLeft);

      const timerInterval = setInterval(() => {
        if (started && !paused) {
          drawTimerStrip(secondsLeft - 1);
        }
        if (secondsLeft === 0) {
          clearInterval(timerInterval);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }, 1000);

      return () => clearInterval(timerInterval);
    } else console.log("error loading canvas");
  }, [paused, started, secondsLeft, color]);

  const handleClick = (time: number, label: string) => {
    setSecondsLeft(time * 60);
    setSelectedButton(label);
  };

  async function playAudio() {
    try {
      const { sound } = await Audio.Sound.createAsync({
        uri: "https://ranjeet.blr1.cdn.digitaloceanspaces.com/Pomodoro-Assets/tone.mp3",
      });
      await sound.playAsync();
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }

  useEffect(() => {
    if (secondsLeft === 0) {
      playAudio();
    }
  }, [secondsLeft]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: StatusBar.currentHeight,
        backgroundColor: '#1E213F'
      }}
      onLayout={onLayoutRootView}
    >
      <StatusBar backgroundColor="#1E213F" barStyle="light-content" />
      <View className=" h-screen flex gap-12 items-center py-8 px-6">
        <Text
          style={{ fontFamily: `${font} bold` }}
          className="text-white text-2xl font-bold"
        >
          pomodoro
        </Text>
        <View className="h-16 bg-slate-900 rounded-full flex-row justify-center items-center p-2 gap-0">
          <Pressable
            onPress={() => handleClick(tempPomodoroTime, "pomodoro")}
            className="p-[12px] h-12 rounded-3xl flex justify-center items-center"
            style={{
              backgroundColor:
                selectedButton === "pomodoro" ? color : "transparent",
            }}
          >
            <Text style={{color: selectedButton === "pomodoro" ? "#1E213F" : "#D7E0FF", fontFamily: `${font} bold`, letterSpacing: font === "space mono" ? -1.5 : 0 }}>pomodoro</Text>
          </Pressable>

          <Pressable
            className="px-[20px] h-12 rounded-3xl flex justify-center items-center"
            onPress={() => handleClick(tempShortBreakTime, "short break")}
            style={{
              backgroundColor:
                selectedButton === "short break" ? color : "transparent",
            }}
          >
            <Text
              style={{
                color: selectedButton === "short break" ? "#1E213F" : "#D7E0FF",fontFamily: `${font} bold`, letterSpacing: font === "space mono" ? -1.5 : 0
              }}
            >
              short break
            </Text>
          </Pressable>

          <Pressable
            className="px-[20px] h-12 rounded-3xl flex justify-center items-center"
            onPress={() => handleClick(tempLongBreakTime, "long break")}
            style={{
              backgroundColor:
                selectedButton === "long break" ? color : "transparent",
            }}
          >
            <Text
              style={{
                color: selectedButton === "long break" ? "#1E213F" : "#D7E0FF",fontFamily: `${font} bold`, letterSpacing: font === "space mono" ? -1.5 : 0
              }}
            >
              long break
            </Text>
          </Pressable>
        </View>
        <LinearGradient
          colors={["#0E112A", "#2E325A"]}
          start={[0, 0]}
          end={[1, 1]}
          style={{
            elevation: 10,
            shadowColor: "#121530",
            shadowOffset: { width: 50, height: 50 },
            shadowOpacity: 0.5,
            shadowRadius: 100,
          }}
          className="w-[300px] h-[300px] rounded-full flex justify-center items-center"
        >
          <View className="w-[268px] h-[268px] bg-slate-900 rounded-full flex justify-center items-center">
            <View onLayout={onContainerLayout} className="w-[248px] h-[248px] flex items-center">
              <Canvas
                style={{
                  position: "absolute",
                }}
                ref={canvasRef}
              />
              <View className="w-full h-full mt-2 flex justify-center items-center">
                <Text
                  style={{
                    fontFamily: `${font} bold`,
                    letterSpacing: font === "space mono" ? -5 : 0
                  }}
                  className={`${shouldBlink ? "opacity-100" : "opacity-0"} text-[#D7E0FF] text-7xl font-bold mt-4 tracking-tighter`}
                >
                  {minutes >= 10 ? `${minutes}` : "0" + minutes}:
                  {seconds >= 10 ? `${seconds}` : "0" + seconds}
                </Text>
                <View>
                  {!started && !reset && (
                    <Pressable
                      onPress={() => {
                        setStarted(true);
                        setPaused(false);
                        setReset(false);
                      }}
                    >
                      <Text
                        style={{ fontFamily: `${font} bold` }}
                        className="text-[#D7E0FF] text-base font-bold tracking-[13.12px] uppercase"
                      >
                        Start
                      </Text>
                    </Pressable>
                  )}
                  {started && !paused && secondsLeft !== 0 && (
                    <Pressable
                      onPress={() => {
                        setPaused(true);
                      }}
                    >
                      <Text
                        style={{ fontFamily: `${font} bold` }}
                        className="text-[#D7E0FF] text-base font-bold tracking-[13.12px] uppercase"
                      >
                        Pause
                      </Text>
                    </Pressable>
                  )}
                  {started && paused && secondsLeft !== 0 && (
                    <Pressable
                      onPress={() => {
                        setPaused(false);
                      }}
                    >
                      <Text
                        style={{ fontFamily: `${font} bold` }}
                        className="text-[#D7E0FF] text-base font-bold tracking-[13.12px] uppercase"
                      >
                        Resume
                      </Text>
                    </Pressable>
                  )}
                  {secondsLeft === 0 && (
                    <Pressable
                      onPress={() => {
                        setSecondsLeft(
                          (selectedButton === "pomodoro"
                            ? tempPomodoroTime
                            : selectedButton === "short break"
                            ? tempShortBreakTime
                            : tempLongBreakTime) * 60
                        );
                        setReset(true);
                        setStarted(false);
                      }}
                    >
                      <Text
                        style={{ fontFamily: `${font} bold` }}
                        className="text-[#D7E0FF] text-base font-bold tracking-[13.12px] uppercase"
                      >
                        Restart
                      </Text>
                    </Pressable>
                  )}
                  {reset && !started && (
                    <Pressable
                      onPress={() => {
                        setStarted(true);
                        setPaused(false);
                        setReset(false);
                      }}
                    >
                      <Text
                        style={{ fontFamily: `${font} bold` }}
                        className="text-[#D7E0FF] text-base font-bold tracking-[13.12px] uppercase"
                      >
                        Start
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
        <Pressable
          className="bg-white [#1E213F] w-5 h-5"
          onPress={toggleSettings}
        >
          <Image
            source={{
              uri: "https://ranjeet.blr1.cdn.digitaloceanspaces.com/Pomodoro-Assets/icon-settings.svg",
            }}
            style={{ width: 20, height: 20 }}
          />
        </Pressable>

        {showSettings && (
          <View className="w-[328px] h-[550px] bg-white rounded-3xl z-50 absolute left-1/2 -translate-x-40 top-20 p-6">
            <View className="flex flex-row justify-between items-center border-b-2 border-[#E3E1E1]">
              <Text
                style={{fontFamily: `${font} bold`}}
                className="font-bold text-xl mb-7"
              >
                Settings
              </Text>
              <Pressable onPress={toggleSettings}>
                <Image
                  source={{
                    uri: "https://ranjeet.blr1.cdn.digitaloceanspaces.com/Pomodoro-Assets/icon-close.svg",
                  }}
                  alt="X"
                />
              </Pressable>
            </View>
            <View className="pt-6">
              <Text
                style={{ fontFamily: `${font} bold` }}
                className="text-xs font-bold tracking-[4.23px] text-center"
              >
                Time (Minutes)
              </Text>
              <View className="py-6 gap-y-2 border-b-2 border-[#E3E1E1]">
                <View className="flex-row items-center h-10">
                  <Text
                    className="text-xs"
                    style={{ flex: 0.5 ,fontFamily: `${font} bold`}}
                  >
                    Pomodoro
                  </Text>
                  <View style={{ flex: 0.5 }}>
                    <Picker
                      selectedValue={tempPomodoroTime}
                      onValueChange={(e) => setTempPomodoroTime(e)}
                    >
                      {Array.from({ length: 60 }, (_, i) => i + 1).map(
                        (value) => (
                          <Picker.Item
                            key={value}
                            label={value.toString()}
                            value={value.toString()}
                          />
                        )
                      )}
                    </Picker>
                  </View>
                </View>
                <View className="flex-row items-center h-10">
                  <Text
                    className="text-xs"
                    style={{ flex: 0.5 ,fontFamily: `${font} bold`}}
                  >
                    Short Break
                  </Text>
                  <View style={{ flex: 0.5 }}>
                    <Picker
                      selectedValue={tempShortBreakTime}
                      onValueChange={(e) => setTempShortBreakTime(e)}
                    >
                      {Array.from({ length: 60 }, (_, i) => i + 1).map(
                        (value) => (
                          <Picker.Item
                            key={value}
                            label={value.toString()}
                            value={value.toString()}
                          />
                        )
                      )}
                    </Picker>
                  </View>
                </View>
                <View className="flex-row items-center h-10 ">
                  <Text
                    className="text-xs"
                    style={{ flex: 0.5 ,fontFamily: `${font} bold`}}
                  >
                    Long Break
                  </Text>
                  <View style={{ flex: 0.5 }}>
                    <Picker
                      selectedValue={tempLongBreakTime}
                      onValueChange={(e) => setTempLongBreakTime(e)}
                    >
                      {Array.from({ length: 60 }, (_, i) => i + 1).map(
                        (value) => (
                          <Picker.Item
                            key={value}
                            label={value.toString()}
                            value={value.toString()}
                          />
                        )
                      )}
                    </Picker>
                  </View>
                </View>
              </View>
              <View className="items-center py-4 gap-y-4  border-b-2 border-[#E3E1E1]">
                <Text
                  style={{ fontFamily: `${font} bold` }}
                  className="text-xs font-bold tracking-[4.23px] uppercase"
                >
                  Font
                </Text>
                <View className="flex-row gap-x-4 justify-center">
                  <TouchableOpacity
                    className="rounded-full w-10 h-10 justify-center items-center"
                    style={{
                      backgroundColor:
                        tempFont === "kumbh sans" ? "#161932" : "#EFF1FA",
                    }}
                    onPress={() => setTempFont("kumbh sans")}
                  >
                    <Text
                      className="font-bold text-base"
                      style={{
                        fontFamily: `${tempFont} bold`,
                        color: tempFont === "kumbh sans" ? "white" : "#1E213F",
                      }}
                    >
                      Aa
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="rounded-full w-10 h-10 justify-center items-center"
                    style={{
                      backgroundColor:
                        tempFont === "roboto slab" ? "#161932" : "#EFF1FA",
                    }}
                    onPress={() => setTempFont("roboto slab")}
                  >
                    <Text
                      className="font-bold text-base"
                      style={{
                        fontFamily: `${tempFont} bold`,
                        color: tempFont === "roboto slab" ? "white" : "#1E213F",
                      }}
                    >
                      Aa
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="rounded-full w-10 h-10 justify-center items-center"
                    style={{
                      backgroundColor:
                        tempFont === "space mono" ? "#161932" : "#EFF1FA",
                    }}
                    onPress={() => setTempFont("space mono")}
                  >
                    <Text
                      className="font-bold text-base"
                      style={{
                        fontFamily: `${tempFont} bold`,
                        color: tempFont === "space mono" ? "white" : "#1E213F",
                      }}
                    >
                      Aa
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="items-center py-4 gap-y-4">
                <Text
                  style={{ fontFamily: `${font} bold` }}
                  className="text-xs font-bold tracking-[4.23px]"
                >
                  Color
                </Text>
                <View className="flex-row gap-x-4 justify-center">
                  <TouchableOpacity
                    className="h-10 w-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: "#F87070" }}
                    onPress={() => setTempColor("#F87070")}
                  >
                    <Text style={{ fontFamily: `${font} bold` }}>
                      {tempColor === "#F87070" && "✔"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="h-10 w-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: "#70F3F8" }}
                    onPress={() => setTempColor("#70F3F8")}
                  >
                    <Text style={{ fontFamily: `${font} bold` }}>
                      {tempColor === "#70F3F8" && "✔"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="h-10 w-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: "#D881F8" }}
                    onPress={() => setTempColor("#D881F8")}
                  >
                    <Text style={{ fontFamily: `${font} bold` }}>
                      {tempColor === "#D881F8" && "✔"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                className="w-36 h-[53px] rounded-3xl items-center justify-center self-center"
                style={{ backgroundColor: color }}
                onPress={() => {
                  toggleSettings();
                  setPomodoroTime(tempPomodoroTime);
                  setShortBreakTime(tempShortBreakTime);
                  setLongBreakTime(tempLongBreakTime);
                  setFont(tempFont);
                  setColor(tempColor);
                }}
              >
                <Text style={{ fontFamily: `${font} bold` }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Pomodoro;
