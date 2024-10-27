const cityInput = document.getElementById("searchLocation")
const submitButton = document.getElementById("submitButton")
const autoSearch = document.getElementById("user-location")
const temperatureDisplay = document.getElementById("current-temperature")
let chart

const weatherIcons = {
    clear: "fa-solid fa-sun weather-icon",
    partlyCloudy: "fa-solid fa-cloud weather-icon",
    cloudy: "fa-solid fa-cloud weather-icon",
    fog: "fa-solid fa-smog weather-icon",
    rain: "fa-solid fa-cloud-rain weather-icon",
    heavyRain: "fa-solid fa-cloud-showers-heavy weather-icon",
    snow: "fa-solid fa-snowflake weather-icon",
    thunder: "fa-solid fa-bolt weather-icon",
    highTemp: "fa-solid fa-temperature-high weather-icon",
    lowTemp: "fa-solid fa-temperature-low weather-icon",
    wind: "fa-solid fa-wind weather-icon",
    default: "fa-solid fa-meteor weather-icon",
}

function getWeatherIcon(weatherCode) {
    if (weatherCode === 0) return weatherIcons.clear
    if ([1, 2].includes(weatherCode)) return weatherIcons.partlyCloudy
    if (weatherCode === 3) return weatherIcons.cloudy
    if ([45, 48].includes(weatherCode)) return weatherIcons.fog
    if ([51, 53, 56, 61, 63, 66].includes(weatherCode)) return weatherIcons.rain
    if ([55, 57, 65, 67, 80, 81, 82].includes(weatherCode)) return weatherIcons.heavyRain
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return weatherIcons.snow
    if ([95, 96, 99].includes(weatherCode)) return weatherIcons.thunder

    return weatherIcons.default
}


submitButton.addEventListener("click", async function(event) {
    event.preventDefault()
    const city = cityInput.value

    if (!city) {
        temperatureDisplay.innerText = "Enter a city"
        return
    }

    const cityCoords = await getCoordinates(city)
    const {lat, lon} = cityCoords;
    await getMaxMin(city)
    await fetchWeather(lat, lon)
    
})

autoSearch.addEventListener("click", async function (event) {
    event.preventDefault()
    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        const city = await getCityName(lat, lon)
        await getMaxMin(city)
        await fetchWeather(lat, lon)
    })
})

async function fetchWeather (lat, lon) {
    const unitChoice = document.querySelector(`input[name="temperature"]:checked`).value
    let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,rain,weather_code&hourly=temperature_2m,rain,weather_code`

    if (unitChoice === "F") {
        url += `&temperature_unit=fahrenheit`
    } 
    if (unitChoice === "K") {
        const apiKey = `fb226e469bddb8553ed2846db6e75e1c` 
        console.log("K")
        url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}`
    }

    const response = await fetch(url)
    const data = await response.json()
    console.log("Is here city name", data)
    currentWeatherCard(data, unitChoice)
    hourlyForecast(data, unitChoice) 
    buildChart(data, unitChoice)
}

function currentWeatherCard(data, unitChoice) {
    const currentWeather = document.getElementById("current-weather-card")
    currentWeather.innerText = ""

    let temperature = ""
    let weatherCode = ""

    if (unitChoice === "K") {
        temperature = data.current.temp
        weatherCode = data.weather[0].id
    } else {
        temperature = data.current.temperature_2m
        weatherCode = data.current.weather_code
    }
    
    
    const nameText = document.createElement("h2")
    nameText.innerText = cityInput.value
    currentWeather.appendChild(nameText)

    const temperatureText = document.createElement("h3")
    temperatureText.innerText = temperature + " " + unitChoice
    currentWeather.appendChild(temperatureText)

    const weatherIcon = getWeatherIcon(weatherCode)
    const iconDisplay = document.createElement("i")
    iconDisplay.className = weatherIcon
    console.log(iconDisplay)
    currentWeather.appendChild(iconDisplay)
}

async function getCoordinates(city) {
    const apiKey = `fb226e469bddb8553ed2846db6e75e1c`
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()
    console.log(data)

    return {
        lat: data[0].lat,
        lon: data[0].lon,
        city: data[0].name
    }
}

async function getCityName(lat, lon) {
    const apiKey = `fb226e469bddb8553ed2846db6e75e1c`
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    return data[0].name
}

function buildChart(data, unitChoice) {
    const days = data.hourly.time
    const temps = data.hourly.temperature_2m
    const rain = data.hourly.rain

    if (unitChoice === "K") {
        temperature = data.main.temp
        weatherCode = data.weather[0].id
    } else {
        temperature = data.current.temperature_2m
        weatherCode = data.current.weather_code
    }

    if (chart) {
        chart.destroy()
    }

    const ctx = document.getElementById('chart')

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: days,
            datasets: [
                {
                    label: "Temperature", 
                    data: temps, 
                    backgroundColor: "#eb5146",
                    borderColor: "#443366",
                    borderWidth: 2,
                    pointRadius: 0,
                    yAxisID: "y",
                },
                {
                    label: "Rain",
                    data: rain,
                    type: "bar",
                    backgroundColor: "#5d92e8",
                    borderColor: "#5d92e8",
                    borderWidth: 1,
                    yAxisID: "y1",
                },
            ]
        },
        options: {
            responsive: true,
            elements: {
                line: {
                    tension: 0.2
                },
            },
            scales: {
                y: {
                    position: "left",
                },
                y1: {
                    position: "right",
                }
            }
        }
    })
}

async function getMaxMin(city) {
    const apiKey = `33f2807acb5f410abd5135226242610`
    const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=7`

    const response = await fetch(url)
    const data = await response.json()
    console.log("yes", data)
    sevenDayCards(data)
}

function hourlyForecast(data, unitChoice) {
    const sliceContainer = document.getElementById("container-24")
    sliceContainer.innerText = ""

    const date = new Date()
    const currentHour = date.getHours()
    
    const next24Hours = data.hourly.time.slice(currentHour, currentHour + 24)
    const next24Temps = data.hourly.temperature_2m.slice(currentHour, currentHour + 24)
    const next24Codes = data.hourly.weather_code.slice(currentHour, currentHour + 24)

    next24Hours.forEach((time, index) => {
        const hourCard = document.createElement("div")
        hourCard.classList.add("hour-card")

        const hourTime = new Date(time)
        console.log(hourTime)
        const displayHour = hourTime.getHours() + ":00"

        const hourLabel = document.createElement("p")
        hourLabel.classList.add("hour-label")
        hourLabel.innerText = displayHour
        hourCard.appendChild(hourLabel)

        const temp = document.createElement("p")
        temp.classList.add("hour-temp")
        temp.innerText = next24Temps[index] + " " + unitChoice
        hourCard.appendChild(temp)

        const iconElement = document.createElement("i")
        iconElement.className = getWeatherIcon(next24Codes[index])
        hourCard.appendChild(iconElement)

        sliceContainer.appendChild(hourCard)
    })
}

function sevenDayCards (data) {
    const cardContainer = document.getElementById("seven-day-cards")
    cardContainer.innerText = ""

    data.forecast.forecastday.forEach(day => {
        const dayCard = document.createElement("div")
        dayCard.classList.add("day-card")

        const date = new Date(day.date)
        const weekday = date.toLocaleDateString("en-US", { weekday: 'short' })

        const dateP = document.createElement("p")
        dateP.classList.add("date")
        dateP.innerText = weekday
        dayCard.appendChild(dateP)

        const dayIcon = document.createElement("img")
        dayIcon.src = day.day.condition.icon
        dayCard.appendChild(dayIcon)

        const maxTemp = document.createElement("p")
        maxTemp.classList.add("max-temp")
        maxTemp.innerText = "Max: " + day.day.maxtemp_c
        dayCard.appendChild(maxTemp)

        const minTemp = document.createElement("p")
        minTemp.classList.add("min-temp")
        minTemp.innerText = "Min: " + day.day.mintemp_c
        dayCard.appendChild(minTemp)

        cardContainer.appendChild(dayCard)
    })
}
