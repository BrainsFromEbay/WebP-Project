const cityInput = document.getElementById("searchLocation")
const submitButton = document.getElementById("submitButton")
const autoSearch = document.getElementById("user-location")
const cityName = document.getElementById("location-name")
const temperatureDisplay = document.getElementById("current-temperature")
let chart

submitButton.addEventListener("click", async function(event) {
    event.preventDefault()
    const city = cityInput.value

    if (!city) {
        temperatureDisplay.innerText = "Enter a city"
        return
    }

    try {
        const cityCoords = await getCoordinates(city)
        const {lat, lon} = cityCoords;
        cityName.innerText = city
        await getMaxMin(city)
        await fetchWeather(lat, lon)
    } catch (error) {
        temperatureDisplay.innerText = "Couldn't find the city"
    }
    
})

autoSearch.addEventListener("click", async function (event) {
    event.preventDefault()
    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        const city = await getCityName(lat, lon)
        cityName.innerText = city
        await getMaxMin(city)
        await fetchWeather(lat, lon)
    })
})

async function fetchWeather (lat, lon) {
    const unitChoice = document.querySelector(`input[name="temperature"]:checked`).value
    let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&hourly=temperature_2m,rain`

    if (unitChoice === "F") {
        url += `&temperature_unit=fahrenheit`
    } else if (unitChoice === "K") {
        const apiKey = `fb226e469bddb8553ed2846db6e75e1c` 
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
    }

    try {
        const response = await fetch(url)
        const data = await response.json()
        console.log("Is here city name", data)
        showCurrentWeather(data, unitChoice) 
        buildChart(data)
    } catch (error) {
        console.log(error)
    }
}

function showCurrentWeather(data, unitChoice) {
    let temperature = ""

    if (unitChoice === "K") {
        temperature = data.main.temp
    } else {
        temperature = data.current.temperature_2m
    }

    temperatureDisplay.innerText = temperature + "°" + unitChoice
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

function buildChart(data) {
    const days = data.hourly.time
    const temps = data.hourly.temperature_2m
    const rain = data.hourly.rain

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
                    borderColor: "#eb5146", 
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
    sevenDayIcons(data)
}

function sevenDayIcons (data) {
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