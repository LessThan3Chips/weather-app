const cityInput = document.getElementById('city-input');
const getWeatherButton = document.getElementById('get-weather');
const findLocationButton = document.getElementById('find-location');
const weatherDetails = document.getElementById('weather-details');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const weatherIcon = document.getElementById('weather-icon');
const citySuggestions = document.getElementById('city-suggestions');
const errorMessage = document.getElementById('error-message');

// Elements for the clock and sunrise/sunset times
const clockElement = document.getElementById('clock');
const sunriseElement = document.getElementById('sunrise');
const sunsetElement = document.getElementById('sunset');

// Weather code to description and icon mapping
const weatherMapping = {
    0: { description: "Clear sky", icon: "clear.png" },
    1: { description: "Mainly clear", icon: "clear.png" },
    2: { description: "Partly cloudy", icon: "cloudy.png" },
    3: { description: "Overcast", icon: "cloudy.png" },
    45: { description: "Fog", icon: "cloudy.png" },
    48: { description: "Depositing rime fog", icon: "cloudy.png" },
    51: { description: "Light drizzle", icon: "rain_light.png" },
    53: { description: "Moderate drizzle", icon: "rain_moderate.png" },
    55: { description: "Heavy drizzle", icon: "rain_heavy.png" },
    61: { description: "Light rain", icon: "rain_light.png" },
    63: { description: "Moderate rain", icon: "rain_moderate.png" },
    65: { description: "Heavy rain", icon: "rain_heavy.png" },
    66: { description: "Very heavy rain", icon: "rain_heavy.png" },
    67: { description: "Extreme rain", icon: "rain_heavy.png" },
    80: { description: "Showers of rain", icon: "rain_moderate.png" },
    81: { description: "Heavy showers of rain", icon: "rain_heavy.png" },
    82: { description: "Violent showers of rain", icon: "rain_heavy.png" },
    95: { description: "Thunderstorms", icon: "thunderstorm.png" },
    96: { description: "Thunderstorms with light hail", icon: "thunderstorm.png" },
    99: { description: "Thunderstorms with heavy hail", icon: "thunderstorm.png" }
};

// Function to fetch weather data from Open-Meteo API with retries
async function getWeather(city, latitude, longitude, attempts = 20) {
    try {
        // If a city is passed, use the geocoding API to get coordinates
        if (!latitude || !longitude) {
            const geoResponse = await fetch(`https://geocode.xyz/${city}?json=1`);
            if (!geoResponse.ok) {
                throw new Error("Geocoding API failed");
            }

            const geoData = await geoResponse.json();
            latitude = geoData.latt;
            longitude = geoData.longt;

            if (!latitude || !longitude) {
                throw new Error("Invalid coordinates returned from geocoding API");
            }
        }

        // Fetch weather data from Open-Meteo API
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=sunrise,sunset`;
        const weatherResponse = await fetch(apiUrl);

        if (!weatherResponse.ok) {
            throw new Error("Weather API request failed");
        }

        const weatherData = await weatherResponse.json();
        const weather = weatherData.current_weather;

        // Update the UI with weather data
        cityName.innerText = city;
        temperature.innerText = `${weather.temperature}°C`;

        const weatherInfo = weatherMapping[weather.weathercode];
        if (weatherInfo) {
            description.innerText = weatherInfo.description;
            weatherIcon.src = `icons/${weatherInfo.icon}`;
        } else {
            description.innerText = "Unknown weather";
            weatherIcon.src = "icons/default.png";
        }

        // Display sunrise and sunset times
        const sunrise = new Date(weatherData.daily.sunrise[0]);
        const sunset = new Date(weatherData.daily.sunset[0]);

        sunriseElement.innerText = `Sunrise: ${sunrise.toLocaleTimeString()}`;
        sunsetElement.innerText = `Sunset: ${sunset.toLocaleTimeString()}`;

        // Show the weather details section
        weatherDetails.style.display = 'block';
        errorMessage.style.display = 'none';
    } catch (error) {
        if (attempts > 0) {
            console.log(`Attempt failed. Retries left: ${attempts - 1}`);
            getWeather(city, latitude, longitude, attempts - 1); // Retry if failed
        } else {
            showErrorMessage(error.message);
        }
    }
}

// Show error message for 3 seconds
function showErrorMessage(message) {
    errorMessage.innerText = `Error: ${message}`;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000); // Hide error message after 3 seconds
}

// Function to get city suggestions from Geocode API
async function getCitySuggestions(query) {
    if (query.length < 3) return; // Only search if query length is greater than 2

    const response = await fetch(`https://geocode.xyz/${query}?json=1`);
    const data = await response.json();

    citySuggestions.innerHTML = ''; // Clear previous suggestions

    if (data.standard) {
        const suggestions = data.standard.city || [];
        suggestions.forEach(city => {
            const suggestionItem = document.createElement('li');
            suggestionItem.innerText = city;
            suggestionItem.addEventListener('click', () => {
                cityInput.value = city;
                citySuggestions.innerHTML = ''; // Clear suggestions after selection
                getWeather(city); // Fetch weather for selected city
            });
            citySuggestions.appendChild(suggestionItem);
        });
    }
}

// Event listener to trigger city suggestion when user types
cityInput.addEventListener('input', (e) => {
    const city = e.target.value.trim();
    if (city) {
        getCitySuggestions(city);
    } else {
        citySuggestions.innerHTML = ''; // Clear suggestions when input is empty
    }
});

// Event listener to trigger weather fetch when the "Get Weather" button is clicked
getWeatherButton.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city, null, null); // Fetch weather with retries
    } else {
        showErrorMessage("Please enter a city.");
    }
});

// Event listener for "Find Location" button
findLocationButton.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            getWeather('Your Location', latitude, longitude); // Fetch weather based on user's coordinates
        }, (error) => {
            showErrorMessage("Failed to get location.");
        });
    } else {
        showErrorMessage("Geolocation is not supported by this browser.");
    }
});

// Display the current time for the user’s location
function updateClock() {
    const now = new Date();
    clockElement.innerText = now.toLocaleTimeString();
}

// Update the clock every second
setInterval(updateClock, 1000);  // Update every 1 second
