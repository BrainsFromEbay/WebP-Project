const cityInput = document.getElementById("searchLocation")
const submitButton = document.getElementById("submitButton")
const autoSearch = document.getElementById("user-location")
const favoritesDropdown = document.getElementById("favoritesDropdown")
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
    default: "fa-solid fa-meteor weather-icon", // :)
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
    const unitChoice = document.querySelector(`input[name="temperature"]:checked`).value
    const city = cityInput.value
    const cityCoords = await getCoordinates(city)
    const {lat, lon} = cityCoords;

    await getMaxMin(city, unitChoice)
    await fetchWeather(lat, lon, unitChoice, city)

})

autoSearch.addEventListener("click", async function (event) {
    event.preventDefault()
    const unitChoice = document.querySelector(`input[name="temperature"]:checked`).value
    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        const city = await getCityName(lat, lon)

        await getMaxMin(city, unitChoice)
        await fetchWeather(lat, lon, unitChoice, city)

    })
})

async function fetchWeather (lat, lon, unitChoice, city) {
    let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,rain,weather_code&hourly=temperature_2m,rain,weather_code`

    if (unitChoice === "F") {
        url += `&temperature_unit=fahrenheit`
    }

    const response = await fetch(url)
    const data = await response.json()
    console.log("Is here city name", data)
    currentWeatherCard(data, unitChoice, city)
    hourlyForecast(data, unitChoice) 
    buildChart(data, unitChoice)
}

function currentWeatherCard(data, unitChoice, city) {
    const currentWeather = document.getElementById("current-weather-card")
    currentWeather.innerText = ""

    let temperature = data.current.temperature_2m
    let weatherCode = data.current.weather_code

    if (unitChoice === "K") {
        Math.round(temperature += 273.15)
        temperature = temperature.toFixed(2)
    }
    
    const nameText = document.createElement("h2")
    nameText.innerText = city
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
    const apiKey = `TemporarilyDisabled`
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
    const apiKey = `TemporarilyDisabled`
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    return data[0].name
}

function hourlyForecast(data, unitChoice) {
    const sliceContainer = document.getElementById("container-24")
    sliceContainer.innerText = ""

    const date = new Date()
    const currentHour = date.getHours()
    
    const next24Hours = data.hourly.time.slice(currentHour, currentHour + 24)
    let next24Temps = data.hourly.temperature_2m.slice(currentHour, currentHour + 24)
    const next24Codes = data.hourly.weather_code.slice(currentHour, currentHour + 24)

    if (unitChoice === "K") {
        next24Temps = next24Temps.map(temp => Math.round(temp + 273.15))
    }

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

function buildChart(data, unitChoice) {
    const days = data.hourly.time
    let temps = data.hourly.temperature_2m
    const rain = data.hourly.rain

    if (unitChoice === "K") {
        temps = temps.map(temp => Math.round(temp + 273.15))
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

async function getMaxMin(city, unitChoice) {
    const apiKey = `TemporarilyDisabled`
    const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=7`

    const response = await fetch(url)
    const data = await response.json()
    console.log("yes", data)
    sevenDayCards(data, unitChoice)
}

function sevenDayCards (data, unitChoice) {
    const cardContainer = document.getElementById("seven-day-cards")
    cardContainer.innerText = ""

    data.forecast.forecastday.forEach(day => {
        const dayCard = document.createElement("div")
        dayCard.classList.add("day-card")

        console.log("yesss", unitChoice)

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
        if (unitChoice === "K") {
            maxTemp.innerText = "Max:" + (Math.round(day.day.maxtemp_c + 273.15))
        } else if (unitChoice === "F") {
            maxTemp.innerText = "Max:" + day.day.maxtemp_f
        } else if (unitChoice === "C") {
            maxTemp.innerText = "Max: " + day.day.maxtemp_c
        }
        dayCard.appendChild(maxTemp)

        const minTemp = document.createElement("p")
        minTemp.classList.add("min-temp")
        if (unitChoice === "K") {
            minTemp.innerText = "Min:" + (Math.round(day.day.mintemp_c + 273.15))
        } else if (unitChoice === "F") {
            minTemp.innerText = "Min:" + day.day.mintemp_f
        } else {
            minTemp.innerText = "Min: " + day.day.mintemp_c
        }
        dayCard.appendChild(minTemp)

        cardContainer.appendChild(dayCard)
    })
}
