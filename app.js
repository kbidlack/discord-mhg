"use strict";

const channelIdInputField = document.getElementById("channelId");
const channelIdSubmitButton = document.getElementById("generateGraph");
const folderInput = document.getElementById("folderInput");
const channelSelectDiv = document.getElementById("channelSelect");
const ctx = document.getElementById("messageHistoryChart");
const outputDiv = document.getElementById("messageHistoryGraph");

// only allow to generate graph if valid channel id is passed
channelIdInputField.addEventListener("input", function () {
  channelIdSubmitButton.disabled = !verifyChannelId(channelIdInputField.value);
});

function verifyFolder() {
  channelSelectDiv.style.display = "block";
}

function verifyChannelId(id) {
  return /^\d{18}$/.test(id) || id === "";
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = function (event) {
      let csvData = event.target.result;
      let results = Papa.parse(csvData, { newline: "\n" });

      results.data.shift(); // remove column titles
      // last row is nothing (empty string), probably because \n at end of file?
      results.data.pop();

      let dates = results.data.map((message) => new Date(message[1]));
      resolve(dates);
    };

    reader.readAsText(file);
  });
}

function plotGraph(dates) {
  let dateCounts = {};
  dates.forEach((date) => {
    let newDate = new Date(date.toDateString());
    dateCounts[newDate] = (dateCounts[newDate] || 0) + 1;
  });

  let labels = Object.keys(dateCounts).map(
    (dateString) => new Date(dateString)
  );
  let data = Object.values(dateCounts);

  let frequencyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Messages",
          data: data,
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
            tooltipFormat: "yyyy-MM-dd",
          },
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Messages",
          },
        },
      },
    },
  });
}

function generateGraph() {
  channelIdSubmitButton.disabled = true;
  channelIdInputField.disabled = true;
  let promises = [];

  for (let i = 0; i < folderInput.files.length; i++) {
    let file = folderInput.files[i];
    if (file.name.endsWith(".csv")) {
      promises.push(readFile(file));
    }
  }

  Promise.all(promises).then((allDates) => {
    let dates = allDates.flat();
    plotGraph(dates);
    outputDiv.style.display = "block";
  });
}
