// Define Stock class
let selectedStock = null;

class Stock {
    constructor(symbol, quantity, id) {
        this.symbol = symbol;
        this.quantity = quantity;
        this.id = id;
        this.price = null; // Initialize price as null
    }

    getID() {
        return this.id;
    }

    setPrice(price) {
        this.price = price;
    }

    getPrice() {
        return this.price;
    }
}

// Define Portfolio class
class Portfolio {
    constructor() {
        this.stocks = [];
        this.total = 0;
    }

    addStock(stock) {
        this.stocks.push(stock);
        ++this.total;
    }

    removeStock(symbol) {
        this.stocks = this.stocks.filter(stock => stock.symbol !== symbol);
        --this.total;
    }

    getTotalValue() {
        let totalValue = 0;
        this.stocks.forEach(stock => {
            if (stock.getPrice() !== null) {
                totalValue += stock.getPrice() * stock.quantity;
            }
        });
        return totalValue;
    }

    displaySummary() {
        const portfolioList = document.getElementById('portfolioList');
        portfolioList.innerHTML = ''; 

        this.stocks.forEach(stock => {
            const listItem = document.createElement('li');
            const container = document.createElement('div'); 
            const editButton = document.createElement('button');
            
            // Set attributes and content for the edit button
            editButton.id = 'editButton';
            editButton.className = 'btn btn-secondary';
            editButton.textContent = 'Edit';
            
           
            container.className = 'd-flex justify-content-between align-items-center';
            
            // Set content for the list item
            listItem.className = `list-group-item id:${stock.getID()}`;
            listItem.textContent = `${stock.symbol}: ${stock.quantity} (Price: ${stock.getPrice() !== null ? `$${stock.getPrice()}` : 'Loading...'})`;
            
            // Append text and button to the container
            container.appendChild(listItem);
            container.appendChild(editButton);
            
            portfolioList.appendChild(container);

            // event listeners for button
            editButton.addEventListener('click', () => {
                $('#editModal').modal('show');
                selectedStock = stock;
            });

    

            
        });

        const totalValue = this.getTotalValue();
        const totalValueItem = document.createElement('li');
        totalValueItem.className = `list-group-item font-weight-bold`;
        totalValueItem.textContent = `Total Portfolio Value: $${totalValue.toFixed(2)}`;
        portfolioList.appendChild(totalValueItem);
    }

    getTotal() {
        return this.total;
    }
}

// Initialize portfolio
const portfolio = new Portfolio();

// Alpha Vantage API configurations
const apiKey = 'U8JWTP47K82U1RQX';
const baseUrl = 'https://www.alphavantage.co/query';

// Function to fetch stock price
async function fetchStockPrice(symbol) {
    const url = `${baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log(data['Global Quote']);

    if (data['Global Quote']) {
        const  price  = data['Global Quote']['05. price'];
        let amount = parseFloat(price);
        console.log(`price:  ${price}`)
        return amount;
    } else {
        throw new Error('Error fetching stock price');
    }
}

// Add Stock form submit event
document.getElementById('addStockForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const symbol = document.getElementById('symbol').value;
    const quantity = parseInt(document.getElementById('quantity').value);

    if (!isNaN(quantity) && quantity > 0) {
        const stock = new Stock(symbol.toUpperCase(), quantity, portfolio.getTotal());

        try {
            const price = await fetchStockPrice(symbol);
            stock.setPrice(price * quantity);
        } catch (error) {
            console.error(error);
            alert('Error fetching stock price. Please try again later.');
        }

        portfolio.addStock(stock);
        portfolio.displaySummary();
    } else {
        alert('Please enter a valid quantity.');
    }

    // Reset form
    document.getElementById('symbol').value = '';
    document.getElementById('quantity').value = '';
});

// // Update stock prices every minute
// setInterval(async () => {
//     portfolio.stocks.forEach(async stock => {
//         try {
//             const price = await fetchStockPrice(stock.symbol);
//             stock.setPrice(price);
//         } catch (error) {
//             console.error(error);
//         }
//     });
//     portfolio.displaySummary();
// }, 60000);



// Edit Stock Form
document.getElementById('editStockForm').addEventListener('submit', (event) => {
    event.preventDefault();
});

// Save Changes
document.getElementById('saveChanges').addEventListener('click', () => {
    if (selectedStock) {
        const quantity = parseInt(document.getElementById('editQuantity').value);
        const price = parseFloat(document.getElementById('editPrice').value);

        if (!isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
            selectedStock.quantity = quantity;
            selectedStock.setPrice(price);
            portfolio.displaySummary();
            $('#editModal').modal('hide');
        } else {
            alert('Please enter valid quantities and prices.');
        }
    }
});

// Delete Stock
document.getElementById('deleteStock').addEventListener('click', () => {
    if (selectedStock) {
        portfolio.removeStock(selectedStock.symbol);
        portfolio.displaySummary();
        $('#editModal').modal('hide');
        selectedStock = null;
    }
});

// Edit Stock
document.querySelectorAll('#portfolioList li').forEach(listItem => {
    listItem.addEventListener('click', () => {
        const stockId = listItem.classList[1].split(':')[1];
        selectedStock = portfolio.stocks.find(stock => stock.getID() === parseInt(stockId));

        if (selectedStock) {
            document.getElementById('editQuantity').value = selectedStock.quantity;
            document.getElementById('editPrice').value = selectedStock.getPrice();
            $('#editModal').modal('show');
        }
    });
});


// HISTORY

async function drawGraph() {
    // Fetch data from Alpha Vantage
    let x = document.getElementById('stockName').value

fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${x}&apikey=U8JWTP47K82U1RQX`)
.then(response => response.json())
.then(data => {
  // Extract daily stock prices from the response
  const dailyPrices = data['Time Series (Daily)'];

  // Convert data to an array of objects with date and close price
  const stockData = Object.keys(dailyPrices).map(date => ({
    date: new Date(date),
    price: parseFloat(dailyPrices[date]['4. close'])
  }));

  // Sort data by date in ascending order
  stockData.sort((a, b) => a.date - b.date);
  console.log(stockData);

const vlSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "description": "Apple Stock Price Trend",
    "data": {
      "values": stockData
    },
    "mark": "line",
    "encoding": {
      "x": {"field": "date", "type": "temporal"},
      "y": {"field": "price", "type": "quantitative"},
      "tooltip": [ 
        {"field": "date", "type": "temporal", "title": "Date"},
        {"field": "price", "type": "quantitative", "title": "Price"}
      ]
    }
  };
  
  // Render the chart using Vega-Embed
  vegaEmbed('#historicalDataDisplay', vlSpec);
})
.catch(error => console.error('Error fetching data:', error));

}


document.querySelector('.hist-button').addEventListener('click', async event =>{
    event.preventDefault();
    await drawGraph();
    switchCase('hist-button');


})

document.querySelector('.hist-back').addEventListener('click', async event =>{
    switchCase('History')
})






//  toggles

document.querySelector('#Portfolio-opt').addEventListener('click', (e)=> {
    switchCase('Portfolio')
})


document.querySelector('#History-opt').addEventListener('click', (e)=> {
    switchCase('History')
})

document.querySelector('#Home-opt').addEventListener('click', (e)=> {
    switchCase('Home')

})

function switchCase(opt) {
 switch (opt) {
    case 'Portfolio': {
        document.querySelector(".Portfolio").style.display = 'block';
        document.querySelector(".History").style.display = 'none';
        document.querySelector(".Home").style.display = 'none'
        document.querySelector('#historicalDataDisplay').style.display = 'none';

    }

    break;

    case 'History': {
        document.querySelector(".Portfolio").style.display = 'none';
        document.querySelector(".History").style.display = 'block';
        document.querySelector(".Home").style.display = 'none'
        document.querySelector('#historicalDataForm').style.display = 'block';
        document.querySelector('.hist-back').style.display = 'none';
        document.querySelector('#historicalDataDisplay').style.display = 'none';


    }

    break;
 
    case 'Home': {
        document.querySelector(".Portfolio").style.display = 'none';
        document.querySelector(".History").style.display = 'none';
        document.querySelector(".Home").style.display = 'block'
        document.querySelector('#historicalDataDisplay').style.display = 'none';

    }

    break;

    case 'hist-button': {
        document.querySelector('#historicalDataForm').style.display = 'none';

        document.querySelector('#historicalDataDisplay').style.display = 'block';
        document.querySelector('.hist-back').style.display = 'block';

    }

    break;

 }
}