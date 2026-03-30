let historyArr = JSON.parse(localStorage.getItem("skyHistory")) || [];

$(document).ready(function() {
    renderHistory();

    $("#searchBtn").click(function() {
        const city = $("#cityInput").val().trim();
        if (city) getCoordinates(city);
    });

    $("#cityInput").keypress(e => { if (e.which == 13) $("#searchBtn").click(); });

    $(document).on("click", ".history-chip", function() {
        getCoordinates($(this).text());
    });

    $("#toggleMode").click(function() {
        $("body").toggleClass("dark-mode-active");
        $(this).text($("body").hasClass("dark-mode-active") ? "☀️ Light Mode" : "🌙 Dark Mode");
    });
});
async function getCoordinates(city) {
    $("#error").text("");
    $("#loader").removeClass("d-none");
    $("#weatherContent").addClass("d-none");

    try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?city=${city}&localityLanguage=en`);
        const geoData = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
        const geoResult = await geoData.json();

        if (!geoResult.results) {
            throw new Error("City not found");
        }

        const { latitude, longitude, name, country } = geoResult.results[0];
        fetchWeather(latitude, longitude, name, country);
    } catch (err) {
        $("#loader").addClass("d-none");
        $("#error").text("Could not find that city. Try another!");
    }
}

async function fetchWeather(lat, lon, name, country) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,uv_index&timezone=auto`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const current = data.current;

        $("#loader").addClass("d-none");
        $("#weatherContent").removeClass("d-none");
        
        // Update UI
        $("#cityName").text(`${name}, ${country}`);
        $("#mainTemp").text(`${Math.round(current.temperature_2m)}°C`);
        $("#statHumidity").text(`${current.relative_humidity_2m}%`);
        $("#statWind").text(`${current.wind_speed_10m} km/h`);
        $("#statFeels").text(`${Math.round(current.apparent_temperature)}°C`);
        $("#statUV").text(current.uv_index);

        interpretWeatherCode(current.weather_code);
        saveHistory(name);
    } catch (err) {
        $("#error").text("Error fetching weather data.");
    }
}

function interpretWeatherCode(code) {
    const body = $("body");
    body.removeClass("bg-sunny bg-cloudy bg-rainy default-bg");
    let emoji = "☀️";
    let desc = "Clear Skies";

    if (code === 0) { 
        body.addClass("bg-sunny"); emoji = "☀️"; desc = "Clear Skies";
    } else if (code <= 3) { 
        body.addClass("bg-cloudy"); emoji = "☁️"; desc = "Partly Cloudy";
    } else if (code >= 51) { 
        body.addClass("bg-rainy"); emoji = "🌧️"; desc = "Rainy Day";
    } else {
        body.addClass("default-bg"); emoji = "🌤️"; desc = "Variable";
    }

    $("#weatherEmoji").text(emoji);
    $("#weatherDesc").text(desc);
}

function saveHistory(city) {
    if (!historyArr.includes(city)) {
        historyArr.unshift(city);
        if (historyArr.length > 6) historyArr.pop();
        localStorage.setItem("skyHistory", JSON.stringify(historyArr));
        renderHistory();
    }
}

function renderHistory() {
    $("#historyList").empty();
    historyArr.forEach(city => {
        $("#historyList").append(`<div class="history-chip">${city}</div>`);
    });
}
