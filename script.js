
const CONFIG = {
  API_KEY      : '4697f6fd6334e51473d7f5e79e378b63',         
  BASE_URL     : 'https://api.openweathermap.org/data/2.5',
  GEO_URL      : 'https://api.openweathermap.org/geo/1.0',
  REFRESH_MS   : 5 * 60 * 1000,             
};

const state = {
  unit         : localStorage.getItem('aura-unit') || 'metric',
  currentCity  : null,
  currentData  : null,
  refreshTimer : null,
};

const DOM = {
  dateTime       : document.getElementById('dateTime'),
  skeletonWrap   : document.getElementById('skeletonWrap'),
  errorState     : document.getElementById('errorState'),
  errorEmoji     : document.getElementById('errorEmoji'),
  errorTitle     : document.getElementById('errorTitle'),
  errorMsg       : document.getElementById('errorMsg'),
  retryBtn       : document.getElementById('retryBtn'),
  weatherData    : document.getElementById('weatherData'),
  heroCard       : document.getElementById('heroCard'),
  cityName       : document.getElementById('cityName'),
  bigTemp        : document.getElementById('bigTemp'),
  tempMax        : document.getElementById('tempMax'),
  tempMin        : document.getElementById('tempMin'),
  conditionText  : document.getElementById('conditionText'),
  weatherEmoji   : document.getElementById('weatherEmoji'),
  feelsLikeTemp  : document.getElementById('feelsLikeTemp'),
  feelLikeText   : document.getElementById('feelLikeText'),
  humidity       : document.getElementById('humidity'),
  windSpeed      : document.getElementById('windSpeed'),
  windDir        : document.getElementById('windDir'),
  pressure       : document.getElementById('pressure'),
  visibility     : document.getElementById('visibility'),
  sunrise        : document.getElementById('sunrise'),
  sunset         : document.getElementById('sunset'),
  sunsetTime     : document.getElementById('sunsetTime'),
  hourlySlider   : document.getElementById('hourlySlider'),
  forecastGrid   : document.getElementById('forecastGrid'),
  locationBtn    : document.getElementById('locationBtn'),
  pressure: document.getElementById('pressure') || {},
  visibility: document.getElementById('visibility') || {},
  hourlySlider: document.getElementById('hourlySlider') || {},
  searchInput: document.getElementById('searchInput'),
searchBtn: document.getElementById('searchBtn'),
};
const searchWrapper = document.querySelector('.search-wrapper');

DOM.searchBtn.addEventListener('click', () => {
  if (!searchWrapper.classList.contains('active')) {
    searchWrapper.classList.add('active');
    DOM.searchInput.focus();
  } else {
    handleSearch();
  }
});
function handleSearch() {
  showSkeleton();
  const city = DOM.searchInput.value.trim();

  if (!city) return;

  loadWeather(city);

  DOM.searchInput.value = '';
}
const MATERIAL_ICONS_MAP = {
  '01d': 'sunny', '01n': 'bedtime', '02d': 'partly_cloudy_day', '02n': 'partly_cloudy_night',
  '03d': 'cloud', '03n': 'cloud', '04d': 'cloud', '04n': 'cloud',
  '09d': 'rainy', '09n': 'rainy', '10d': 'rainy', '10n': 'rainy',
  '11d': 'thunderstorm', '11n': 'thunderstorm', '13d': 'ac_unit', '13n': 'ac_unit',
  '50d': 'cloud', '50n': 'cloud',
};

function updateDateTime() {
  const now = new Date();

  const datePart = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const timePart = now.toLocaleTimeString('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  hourCycle: 'h12'
});

  const [time, period] = timePart.split(' ');

  DOM.dateTime.innerHTML = `
    ${datePart} • ${time} <span class="ampm">${period}</span>
  `;
}

setInterval(updateDateTime, 30_000);
updateDateTime();

const tempStr = (k, unit) => unit === 'metric'
  ? `${Math.round(k)}°`
  : `${Math.round(k * 9/5 + 32)}°`;

const speedStr = (ms, unit) => unit === 'metric'
  ? `${Math.round(ms)}`
  : `${Math.round(ms * 2.237)}`;

function showSkeleton() {
  DOM.skeletonWrap.style.display = 'block';
  DOM.errorState.style.display = 'none';
  DOM.weatherData.style.display = 'none';
}

function showError(emoji, title, msg) {
  DOM.skeletonWrap.style.display = 'none';
  DOM.errorState.style.display = 'block';
  DOM.weatherData.style.display = 'none';
  DOM.errorEmoji.textContent = emoji;
  DOM.errorTitle.textContent = title;
  DOM.errorMsg.textContent = msg;
}

function showWeather() {
  DOM.skeletonWrap.style.display = 'none';
  DOM.errorState.style.display = 'none';
  DOM.weatherData.style.display = 'block';
}

function renderCurrent(data) {
  const u = state.unit;
  const icon = data.weather[0].icon;

  // City & temperature
  DOM.cityName.textContent = data.name;
  DOM.bigTemp.textContent = tempStr(data.main.temp, u);
  DOM.tempMax.textContent = tempStr(data.main.temp_max, u);
  DOM.tempMin.textContent = tempStr(data.main.temp_min, u);
  DOM.feelsLikeTemp.textContent = tempStr(data.main.feels_like, u);
  DOM.conditionText.textContent = data.weather[0].description;

  // Weather icon
  DOM.weatherEmoji.textContent = MATERIAL_ICONS_MAP[icon] || 'cloud';

  // Stats
  DOM.humidity.textContent = `${data.main.humidity}%`;
  DOM.windSpeed.textContent = speedStr(data.wind.speed, u);
  DOM.windDir.textContent = `${getWindDirection(data.wind.deg)} ${getWindIntensity(data.wind.speed)}`;
  DOM.pressure.textContent = `${data.main.pressure}`;
  DOM.visibility.textContent = `${(data.visibility / 1000).toFixed(1)}`;
  DOM.sunrise.textContent = fmtTime(data.sys.sunrise, data.timezone);
  DOM.sunset.textContent = fmtTime(data.sys.sunset, data.timezone);
  DOM.sunsetTime.textContent = fmtTime(data.sys.sunset, data.timezone);

  state.currentCity = data.name;
  localStorage.setItem('aura-last-city', data.name);
}

function getWindDirection(deg) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round(deg / 22.5) % 16];
}

function getWindIntensity(speed) {
  if (speed < 2) return 'Calm';
  if (speed < 5) return 'Light';
  if (speed < 9) return 'Gentle';
  if (speed < 14) return 'Moderate';
  if (speed < 19) return 'Fresh';
  return 'Strong';
}

function renderHourly(forecast, unit) {
  const items = forecast.list.slice(0, 12);
  if (DOM.hourlySlider) {
  DOM.hourlySlider.innerHTML = '';
}
  
  items.forEach((item, i) => {
    const time = new Date(item.dt * 1000);
    const label = i === 0
  ? 'Now'
  : time.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      hour12: true
    });
    const icon = MATERIAL_ICONS_MAP[item.weather[0].icon] || 'cloud';
    
    const div = document.createElement('div');
    div.className = 'flex flex-col items-center gap-5 min-w-[70px] group cursor-pointer';
    div.innerHTML = `
      <span class="font-bold text-[11px] text-white/60 group-hover:text-white transition-colors">${label}</span>
      <span class="material-symbols-outlined text-white text-3xl group-hover:scale-110 transition-transform" data-icon="${icon}">${icon}</span>
      <span class="text-2xl font-black text-white">${tempStr(item.main.temp, unit)}</span>
    `;
    DOM.hourlySlider.appendChild(div);
  });
}

function renderForecast(forecast, unit) {
  const days = {};
  forecast.list.forEach(item => {
    const d = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
    if (!days[d]) days[d] = [];
    days[d].push(item);
  });

  DOM.forecastGrid.innerHTML = '';
  const dayKeys = Object.keys(days).slice(0, 5);
  
  dayKeys.forEach((day, idx) => {
    const items = days[day];
    const temps = items.map(i => i.main.temp);
    const hi = Math.max(...temps);
    const lo = Math.min(...temps);
    const mid = items[Math.floor(items.length / 2)];
    const icon = MATERIAL_ICONS_MAP[mid.weather[0].icon] || 'cloud';

    const card = document.createElement('div');
    card.className = 'group flex items-center justify-between p-4 rounded-2xl hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10';
    card.innerHTML = `
      <span class="w-14 font-bold text-white/90">${idx === 0 ? 'Today' : day.split(',')[0]}</span>
      <span class="material-symbols-outlined text-white text-2xl" data-icon="${icon}">${icon}</span>
      <div class="flex gap-4 w-20 justify-end">
        <span class="font-bold text-white">${tempStr(hi, unit)}</span>
        <span class="font-medium text-white/40">${tempStr(lo, unit)}</span>
      </div>
    `;
    DOM.forecastGrid.appendChild(card);
  });
}

async function fetchCurrent(city) {
  const res = await fetch(
    `${CONFIG.BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${CONFIG.API_KEY}&units=metric`
  );
  if (!res.ok) throw new Error(res.status === 404 ? 'City not found' : 'API error');
  return res.json();
}

async function fetchForecast(city) {
  const res = await fetch(
    `${CONFIG.BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${CONFIG.API_KEY}&units=metric`
  );
  if (!res.ok) throw new Error('Forecast unavailable');
  return res.json();
}

async function fetchByCoords(lat, lon) {
  const res = await fetch(
    `${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric`
  );
  if (!res.ok) throw new Error('Location weather unavailable');
  return res.json();
}

async function fetchForecastByCoords(lat, lon) {
  const res = await fetch(
    `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric`
  );
  if (!res.ok) throw new Error('Forecast unavailable');
  return res.json();
}

async function loadWeather(city) {
  showSkeleton();
  clearAutoRefresh();

  try {
    const [current, forecast] = await Promise.all([
      fetchCurrent(city),
      fetchForecast(city),
    ]);

    state.currentData = { current, forecast };
    renderCurrent(current);
    renderHourly(forecast, state.unit);
    renderForecast(forecast, state.unit);
    showWeather();
    startAutoRefresh(city);

  } catch (err) {
    if (err.message.includes('not found')) {
      showError('🗺️', 'City not found', `"${city}" doesn't ring a bell. Try another city name.`);
    } else if (CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
      showError('🔑', 'API Key Missing', 'Please add your OpenWeatherMap API key in script.js at the top.');
    } else {
      showError('⚡', 'Something went wrong', 'Check your internet connection and try again.');
    }
  }
}

async function loadWeatherByCoords(lat, lon) {
  showSkeleton();
  clearAutoRefresh();

  try {
    const [current, forecast] = await Promise.all([
      fetchByCoords(lat, lon),
      fetchForecastByCoords(lat, lon),
    ]);

    state.currentData = { current, forecast };
    renderCurrent(current);
    renderHourly(forecast, state.unit);
    renderForecast(forecast, state.unit);
    showWeather();
    startAutoRefresh(current.name);

  } catch (err) {
    showError('📡', 'Location Error', 'Could not fetch weather for your location.');
  }
}

function startAutoRefresh(city) {
  state.refreshTimer = setTimeout(() => loadWeather(city), CONFIG.REFRESH_MS);
}

function clearAutoRefresh() {
  if (state.refreshTimer) clearTimeout(state.refreshTimer);
}

function useLocation() {
  if (!navigator.geolocation) {
    showError('📍', 'Not supported', 'Your browser does not support geolocation.');
    return;
  }
  showSkeleton();
  navigator.geolocation.getCurrentPosition(
    pos => loadWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
    err => {
      const msgs = {
        1: 'Location permission denied. Please allow it and try again.',
        2: 'Location unavailable. Try searching manually.',
        3: 'Location request timed out.',
      };
      showError('📍', 'Location Error', msgs[err.code] || 'Could not get your location.');
    },
    { timeout: 10_000 }
  );
}

function fmtTime(unix, tzOffset) {
  const d = new Date((unix + tzOffset) * 1000);
  let h = d.getUTCHours(), m = d.getUTCMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function bindEvents() {
  DOM.locationBtn.addEventListener('click', useLocation);
  DOM.retryBtn.addEventListener('click', () => {
    if (state.currentCity) loadWeather(state.currentCity);
    else useLocation();
  });
}

function init() {
DOM.searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleSearch();
  }
});
  bindEvents();
  
  const lastCity = localStorage.getItem('aura-last-city');
  if (lastCity) {
    loadWeather(lastCity);
  } else {
    if (navigator.geolocation) {
      showSkeleton();
      navigator.geolocation.getCurrentPosition(
        pos => loadWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        () => loadWeather('London'),
        { timeout: 6_000 }
      );
    } else {
      loadWeather('London');
    }
  }
}

document.addEventListener('DOMContentLoaded', init);

