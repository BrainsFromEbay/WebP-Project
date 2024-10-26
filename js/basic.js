const cityInput = document.getElementById("searchLocation")
const submitButton = document.getElementById("submitButton")


submitButton.addEventListener("click", async function(event) {
    event.preventDefault()

    let coords = Geolocation.getCurrentPosition()
    console.log(coords)
    
    const city = cityInput.value
    const cityCoords = await getCoordinates(city)
    const {lat, lon} = cityCoords;

    const unitChoice = document.querySelector(`input[name="temperature"]:checked`).value
    console.log(unitChoice)
    
    let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&hourly=temperature_2m`

    if (unitChoice === "F") {
        url = url + `&temperature_unit=fahrenheit`
    } else if (unitChoice === "K") {
        const apiKey = `fb226e469bddb8553ed2846db6e75e1c` 
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
    }

    const response = await fetch(url)
    const data = await response.json()
    console.log(data)

    const temperatureDisplay = document.getElementById("current-temperature")
    let temperature = ""

    if (unitChoice === "K") {
        temperature = data.main.temp
    } else {
        temperature = data.current.temperature_2m
    }

    temperatureDisplay.innerText = temperature + "°" + unitChoice
})

async function getCoordinates(city) {
    const apiKey = `fb226e469bddb8553ed2846db6e75e1c`
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()
    console.log(data)

    return {
        lat: data[0].lat,
        lon: data[0].lon
    }
}