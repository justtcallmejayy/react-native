import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Animated,
  SafeAreaView,
  Platform,
} from 'react-native';

const API_KEY = 'eda0956da9d4e765c23cc7414d7bb0b8'; // My api key for weatherAPI from open_weather_api

export default function App() {
  const [city, setCity] = useState('');
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine if the device is mobile based on screen width
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 600;

  // Create an animated value for the forecast container (initially offset by 50 for slide-up effect)
  const forecastAnim = useRef(new Animated.Value(50)).current;

  // Create an animated value for the glitter effect on the thank you message
  const glitterAnim = useRef(new Animated.Value(0)).current;

  // When forecast data is loaded, animate the forecast container into view
  useEffect(() => {
    if (forecast.length > 0) {
      Animated.timing(forecastAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [forecast]);

  // Animate the glitter text continuously
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glitterAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(glitterAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const fetchWeatherData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch current weather
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );
      const weatherData = await weatherResponse.json();
      if (weatherData.cod !== 200) {
        throw new Error(weatherData.message);
      }
      setCurrentWeather(weatherData);

      // Fetch forecast data
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );
      const forecastData = await forecastResponse.json();
      setForecast(forecastData.list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date and day
  const formatDate = (dt) => {
    const date = new Date(dt * 1000);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const formatTime = (dt) => {
    const date = new Date(dt * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to group forecast data by date and return up to 6 days
  const getSixDayForecast = () => {
    const forecastByDay = {};
    forecast.forEach((item) => {
      const date = item.dt_txt.split(' ')[0];
      if (!forecastByDay[date]) {
        forecastByDay[date] = item; // Take the first forecast for that day
      }
    });
    const dailyForecast = Object.values(forecastByDay);
    return dailyForecast.slice(0, 6);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#3d405b" }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Glittering thank you message at the top */}
        <Animated.Text
          style={[
            styles.glitterText,
            {
              opacity: glitterAnim,
              transform: [
                {
                  scale: glitterAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            },
          ]}
        >
          Thank you Kristin for looking at this! You are amazing.
        </Animated.Text>

        <Text style={styles.header}>Weather App</Text>
        
        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter city name"
            placeholderTextColor="#f4f1de"
            value={city}
            onChangeText={setCity}
          />
          <View style={styles.buttonContainer}>
            <Button title="Get Weather" onPress={fetchWeatherData} color="#81b29a" />
          </View>
        </View>

        {loading && <ActivityIndicator size="large" color="#e07a5f" />}
        {error !== '' && <Text style={styles.error}>{error}</Text>}

        {/* Current Weather */}
        {currentWeather && (
          <View style={styles.currentWeather}>
            <Text style={styles.title}>
              Current Conditions in {currentWeather.name}
            </Text>
            <Text style={styles.temp}>
              {Math.round(currentWeather.main.temp)}°C
            </Text>
            <Text style={styles.description}>
              {currentWeather.weather[0].description}
            </Text>
            <Text style={styles.date}>
              {formatDate(currentWeather.dt)}
            </Text>
            <Image
              style={styles.icon}
              source={{
                uri: `https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`,
              }}
            />
          </View>
        )}

        {/* Forecast */}
        {forecast.length > 0 && (
          <Animated.View
            style={[
              styles.forecastContainer,
              {
                transform: [{ translateY: forecastAnim }],
                opacity: forecastAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [1, 0],
                }),
              },
            ]}
          >
            <Text style={styles.title}>Forecast</Text>
            {isMobile ? (
              // For mobile: wrap forecast items in rows using a flex container that centers content
              <View style={styles.forecastWrapper}>
                {getSixDayForecast().map((item, index) => (
                  <View key={index} style={styles.forecastItem}>
                    <Text style={styles.forecastDate}>{formatDate(item.dt)}</Text>
                    <Text style={styles.forecastTime}>{formatTime(item.dt)}</Text>
                    <Text style={styles.forecastTemp}>
                      {Math.round(item.main.temp)}°C
                    </Text>
                    <Image
                      style={styles.iconSmall}
                      source={{
                        uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
                      }}
                    />
                  </View>
                ))}
              </View>
            ) : (
              // For larger screens: display forecast items horizontally in a FlatList
              <FlatList
                data={getSixDayForecast()}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.forecastItem}>
                    <Text style={styles.forecastDate}>{formatDate(item.dt)}</Text>
                    <Text style={styles.forecastTime}>{formatTime(item.dt)}</Text>
                    <Text style={styles.forecastTemp}>
                      {Math.round(item.main.temp)}°C
                    </Text>
                    <Image
                      style={styles.iconSmall}
                      source={{
                        uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
                      }}
                    />
                  </View>
                )}
              />
            )}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Platform.OS === 'ios' ? 20 : 15,
    backgroundColor: "#3d405b", // Dark background from your palette
    alignItems: "center",
  },
  glitterText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f4f1de", // Main font color
    textShadowColor: "#e07a5f",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginBottom: 10,
  },
  header: {
    fontSize: 28,
    marginBottom: 20,
    color: "#f4f1de", // Main font color
    fontWeight: "bold",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
  },
  input: {
    width: "20rem",
    padding: 12,
    borderColor: "#81b29a", // Accent border color
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#e07a5f", // Warm input background
    color: "#f4f1de", // Input text color
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 10,
    width: "8rem",
  },
  error: {
    color: "#e07a5f", // Using an accent color for errors
    marginVertical: 10,
  },
  currentWeather: {
    alignItems: "center",
    marginVertical: 20,
    backgroundColor: "#81b29a", // Lighter accent for current weather section
    padding: 15,
    borderRadius: 18,
    width: "20rem",
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    color: "#f4f1de",
  },
  temp: {
    fontSize: 36,
    color: "#f4f1de",
  },
  description: {
    fontSize: 18,
    color: "#f4f1de",
    textTransform: "capitalize",
  },
  date: {
    fontSize: 16,
    color: "#f4f1de",
    marginBottom: 10,
  },
  icon: {
    width: 100,
    height: 100,
  },
  forecastContainer: {
    marginTop: 20,
    width: "100%",
    alignItems: "center", // Center forecast container content
  },
  forecastWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center", // Center items in each row
  },
  forecastItem: {
    alignItems: "center",
    margin: 5,
    backgroundColor: "#e07a5f", // Accent background for forecast cards
    padding: 10,
    borderRadius: 8,
    width: 130,
  },
  forecastDate: {
    fontSize: 14,
    color: "#f4f1de",
  },
  forecastTime: {
    fontSize: 12,
    color: "#f4f1de",
  },
  forecastTemp: {
    fontSize: 18,
    color: "#f4f1de",
    marginVertical: 5,
  },
  iconSmall: {
    width: 50,
    height: 50,
  },
});
