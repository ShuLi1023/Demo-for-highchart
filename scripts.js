let add = 1
let selectedValues = []
let calculateData = []
let protections = []

function readTextFile(file) {
	var rawFile = new XMLHttpRequest()
	rawFile.open('GET', file, false)
	rawFile.onreadystatechange = function () {
		if (rawFile.readyState === 4) {
			if (rawFile.status === 200 || rawFile.status == 0) {
				var allText = rawFile.responseText
				// console.log(allText)
				console.log('json:' + convertCsvToJson(allText)[0].Date)
			}
		}
	}
	rawFile.send(null)
}

function convertCsvToJson(csvData) {
	const f = csvData.split('\r\n')

	// Get first row for column headers
	const headers = f.shift().split(';')
	var json = []
	f.forEach(function (d) {
		// Loop through each row
		const tmp = {}
		const row = d.replaceAll(',', '.').split(';')
		for (var i = 0; i < headers.length; i++) {
			if (i === 0) {
				const dateParts = row[i].split('/')

				// month is 0-based, that's why we need dataParts[1] - 1
				const dateObject = new Date(
					+dateParts[2],
					dateParts[1] - 1,
					+dateParts[0]
				)
				tmp[headers[i]] = dateObject
			} else {
				tmp[headers[i]] = parseFloat(row[i])
			}
		}
		// Add object to list
		json.push(tmp)
	})
	return json
}

function addSelect() {
	add += 1
	document.getElementById('selections').insertAdjacentHTML(
		'beforeend',
		`<div class="selection-item row">
		<select id="selection-` +
			add +
			`" class="col-7" aria-label=".form-select-sm example" onchange="select(this)">
			<option selected></option>
			<option value="1">Eurostoxx50</option>
			<option value="2">CAC 40</option>
			<option value="3">Dow Jones</option>
			<option value="4">Eurostoxx Banks</option>
			<option value="5">Airbus SE</option>
			<option value="6">AXA SA</option>
			<option value="7">Daimler AG</option>
			<option value="8">Deutsche Telekom AG</option>
			<option value="9">Kering</option>
			<option value="10">Soci�t� G�n�rale</option>
			<option value="11">Veolia Environnement SA</option>
			<option value="12">Vinci SA</option>
			<option value="13">S&P 500</option>
		  </select>
		  <input class="col-5" type="number" name="poids" id="poids-` +
			add +
			`" onchange="savePoids(this)" >
	</div>`
	)

	const n = document.getElementById('selections').children.length
}

function select(selected) {
	// let selectedValues = []

	const n = document.getElementById('selections').children.length
	// const child
	// console.log(child)
	// for(let i = 1; i <= n ; i++) {
	// 	const value = document.getElementById(`select-` + i).innerText
	// 	console.log(value)
	// 	// selectedValues.push()
	// }

	const selectedValue = selected.options[selected.selectedIndex].text
	selectedValues.push(selectedValue)
	console.log(selectedValues)
	Highcharts.stockChart('container1', {
		chart: {
			type: 'spline',
		},
		title: {
			text: 'Live Data (CSV)',
		},

		subtitle: {
			text: 'Data input from a remote CSV file',
		},

		data: {
			csvURL: '/ChartData.csv',
			enablePolling: true,
			complete: function (options) {
				options.series = options.series.filter((e) =>
					selectedValues.includes(e.name)
				)

				options.series.forEach((element) => {
					const rate = 100 / element.data[0][1]
					element.data.forEach((e) => {
						e[1] *= rate
					})
				})
				calculateData = options.series
				console.log(calculateData)
			},
		},
	})
}

function calculate() {
	let result = []
	for (let key in calculateData) {
		console.log(key)
		calculateData[key].data.forEach((value, index) => {
			if (isBlank(result[index])) {
				result[index] = [value[index], 0]
			}
			result[index][0] = value[0]
			result[index][1] += (value[1] * protections[key]) / 100
		})
	}
	return result
}

async function validate() {
	var data = await calculate()
	console.log(data)
	Highcharts.stockChart('container2', {
		rangeSelector: {
			selected: 1,
		},

		title: {
			text: 'AAPL Stock Price',
		},

		series: [
			{
				name: 'AAPL',
				data: data,
				tooltip: {
					valueDecimals: 2,
				},
			},
		],
	})

	var indexYear = new Date(data[0][0]).getFullYear()
	var indexMonth = new Date(data[0][0]).getMonth() + 1
	var objectArray = [
		{
			year: indexYear,
			month: indexMonth,
			value: [],
			result: 0.0,
		},
	]
	var index = 0
	data.map((e) => {
		if (new Date(e[0]).getFullYear() == indexYear) {
			if (new Date(e[0]).getMonth() + 1 == indexMonth) {
				objectArray[index].value.push(e[1])
			} else {
				indexMonth++
				index++
				let e = {
					year: indexYear,
					month: indexMonth,
					value: [],
					result: 0.0,
				}
				objectArray.push(e)
			}
		} else {
			indexYear++
			index++
			indexMonth = 1
			let e = {
				year: indexYear,
				month: indexMonth,
				value: [],
			}
			objectArray.push(e)
		}
	})
	objectArray.forEach((e) => {
		var result =
			((e.value[e.value.length - 1] - e.value[0]) / e.value[0]) * 100
		e.result = result
	})

	console.log(objectArray)
	var resultFor2011 = []
	objectArray.map((e) => {
		if (e.year == 2011) {
			resultFor2011.push(e.result)
		}
	})
	console.log(resultFor2011)
}

function savePoids(e) {
	protections.push(e.value)
}

function isBlank(val) {
	if (val == null || val == '') {
		return true
	}
}
