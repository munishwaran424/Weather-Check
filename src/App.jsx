




import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  // Fetch current weather and forecast
  const fetchWeather = async (params) => {
    const response = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          ...params,
          appid: API_KEY,
          units: "metric",
        },
      }
    );

    const data = response.data;

    setWeather(data);
    setCity(data.name);

    try {
      const forecastResponse = await axios.get(
        "https://api.openweathermap.org/data/2.5/forecast",
        {
          params: {
            lat: data.coord.lat,
            lon: data.coord.lon,
            appid: API_KEY,
            units: "metric",
          },
        }
      );

      // Select one forecast close to noon for each day
      const dailyData = {};

      forecastResponse.data.list.forEach((item) => {
        const date = item.dt_txt.split(" ")[0];
        const hour = Number(item.dt_txt.split(" ")[1].slice(0, 2));

        if (
          !dailyData[date] ||
          Math.abs(hour - 12) <
            Math.abs(dailyData[date].hour - 12)
        ) {
          dailyData[date] = {
            ...item,
            hour,
          };
        }
      });

      setForecast(Object.values(dailyData).slice(0, 5));
    } catch {
      setForecast([]);
      setError("Current weather loaded, but forecast is unavailable.");
    }
  };

  // Search by city
  const getWeather = async (e) => {
    if (e) e.preventDefault();

    if (!city.trim()) {
      setError("Please enter a city name.");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);
    setForecast([]);

    try {
      await fetchWeather({ q: city.trim() });
    } catch (err) {
      if (err.response?.status === 404) {
        setError("City not found. Please check the spelling.");
      } else if (err.response?.status === 401) {
        setError("Invalid API key. Please check your API key.");
      } else {
        setError("Unable to fetch weather. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Search using GPS
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser does not support GPS location.");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);
    setForecast([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await fetchWeather({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        } catch (err) {
          setError(
            err.response?.status === 401
              ? "Invalid API key. Please check your API key."
              : "Unable to fetch local weather."
          );
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        if (geoError.code === 1) {
          setError("Location permission denied. Please allow GPS access.");
        } else if (geoError.code === 2) {
          setError("Your current location is unavailable.");
        } else {
          setError("Location request timed out. Try again.");
        }

        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  const getDay = (date) => {
    return new Date(date + "T12:00:00").toLocaleDateString(
      "en-US",
      { weekday: "short" }
    );
  };

  const getFullDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const weatherIcon = (icon) =>
    `https://openweathermap.org/img/wn/${icon}@2x.png`;

  return (
    <div className="dashboard">

      {/* HEADER */}

      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">☀</span>
          <div>
            <h2>SkyCast</h2>
            <p>WEATHER DASHBOARD</p>
          </div>
        </div>

        <div className="top-date">
          <span>📅</span> {getFullDate()}
        </div>
      </header>

      {/* SEARCH SECTION */}

      <section className="search-section">
        <div>
          <h1>Weather Dashboard</h1>
          <p>Explore real-time weather conditions around the world.</p>
        </div>

        <form className="search-bar" onSubmit={getWeather}>
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            Search
          </button>
        </form>

        <button
          className="gps-button"
          onClick={getCurrentLocation}
          disabled={loading}
        >
          📍 {loading ? "Detecting..." : "My Location"}
        </button>
      </section>

      {/* ERROR MESSAGE */}

      {error && <div className="error-message">{error}</div>}

      {/* LOADING */}

      {loading && (
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Getting your weather information...</p>
        </div>
      )}

      {/* WEATHER CONTENT */}

      {weather && !loading && (
        <main className="weather-content">

          {/* MAIN WEATHER CARD */}

          <section className="hero-card">
            <div className="hero-left">
              <span className="live-label">
                <span className="live-dot"></span>
                CURRENT WEATHER
              </span>

              <h2>
                {weather.name}, {weather.sys.country}
              </h2>

              <p className="weather-description">
                {weather.weather[0].description}
              </p>

              <div className="temperature">
                {Math.round(weather.main.temp)}
                <span>°C</span>
              </div>

              <p className="feels">
                Feels like {Math.round(weather.main.feels_like)}°C
              </p>
            </div>

            <div className="hero-right">
              <img
                src={weatherIcon(weather.weather[0].icon)}
                alt={weather.weather[0].description}
              />
              <p>Weather Conditions</p>
            </div>
          </section>

          {/* WEATHER DETAILS */}

          <section className="details-section">
            <div className="section-heading">
              <div>
                <h2>Today's Highlights</h2>
                <p>Important weather information</p>
              </div>
            </div>

            <div className="details-grid">

              <div className="info-card">
                <div className="info-top">
                  <span>💧</span>
                  <p>HUMIDITY</p>
                </div>
                <h2>{weather.main.humidity}%</h2>
                <p>Relative humidity</p>
              </div>

              <div className="info-card">
                <div className="info-top">
                  <span>🌬️</span>
                  <p>WIND SPEED</p>
                </div>
                <h2>{weather.wind.speed} <small>m/s</small></h2>
                <p>Current wind speed</p>
              </div>

              <div className="info-card">
                <div className="info-top">
                  <span>🌡️</span>
                  <p>FEELS LIKE</p>
                </div>
                <h2>{Math.round(weather.main.feels_like)}°C</h2>
                <p>Perceived temperature</p>
              </div>

              <div className="info-card">
                <div className="info-top">
                  <span>🔵</span>
                  <p>PRESSURE</p>
                </div>
                <h2>{weather.main.pressure} <small>hPa</small></h2>
                <p>Atmospheric pressure</p>
              </div>

              <div className="info-card">
                <div className="info-top">
                  <span>👁️</span>
                  <p>VISIBILITY</p>
                </div>
                <h2>{(weather.visibility / 1000).toFixed(1)} <small>km</small></h2>
                <p>Horizontal visibility</p>
              </div>

              <div className="info-card">
                <div className="info-top">
                  <span>☁️</span>
                  <p>CLOUDINESS</p>
                </div>
                <h2>{weather.clouds.all}%</h2>
                <p>Cloud coverage</p>
              </div>

            </div>
          </section>

          {/* FIVE DAY FORECAST */}

          <section className="forecast-section">
            <div className="section-heading">
              <div>
                <h2>5-Day Forecast</h2>
                <p>Upcoming weather conditions</p>
              </div>
              <span className="forecast-tag">5 DAYS</span>
            </div>

            <div className="forecast-grid">
              {forecast.map((day) => (
                <div className="forecast-card" key={day.dt}>
                  <h3>
                    {getDay(day.dt_txt.split(" ")[0])}
                  </h3>

                  <p className="forecast-date">
                    {day.dt_txt.split(" ")[0]}
                  </p>

                  <img
                    src={weatherIcon(day.weather[0].icon)}
                    alt={day.weather[0].description}
                  />

                  <h2>{Math.round(day.main.temp)}°C</h2>

                  <p className="forecast-description">
                    {day.weather[0].description}
                  </p>
                </div>
              ))}
            </div>
          </section>

        </main>
      )}

      {/* EMPTY STATE */}

      {!weather && !loading && !error && (
        <section className="welcome-card">
          <div className="welcome-icon">🌤️</div>
          <h2>Your Weather, Your World</h2>
          <p>
            Search for a city or use your current location
            to discover live weather conditions.
          </p>
          <button onClick={getCurrentLocation}>
            📍 Detect My Location
          </button>
        </section>
      )}

      {/* FOOTER */}

      <footer className="footer">
        <p>SkyCast Weather Dashboard</p>
        <p>Powered by OpenWeather API</p>
      </footer>

    </div>
  );
}

export default App;










































