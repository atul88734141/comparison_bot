# Crypto Funding Rate Arbitrage

A beautiful, responsive web application that compares cryptocurrency funding rates between Binance and Delta Exchange India, helping traders identify potential arbitrage opportunities.

## Features

- 📊 Real-time funding rate comparison between Binance and Delta Exchange India
- 💰 Automatic identification of arbitrage opportunities
- 📱 Fully responsive design that works on desktop and mobile devices
- 📈 Detailed statistics and summaries
- 🔄 Easy data refresh with a single click
- 🔍 Individual exchange data views

## Screenshots

*Screenshots will appear here after deployment*

## Live Demo

You can access the live application at: [GitHub Pages URL after deployment]

## How to Use

1. Open the application in your web browser
2. The app will automatically fetch the latest funding rates from both exchanges
3. View the comparison table to see the differences between funding rates
4. Check the "Top 5 Positive Differences" and "Top 5 Negative Differences" sections for the best opportunities
5. Use the tabs to switch between the comparison view and individual exchange views
6. Click the "Refresh Data" button to get the latest rates

## Understanding the Data

- **Funding Rate**: The periodic payment between long and short positions in perpetual futures contracts
- **Difference**: Delta Exchange rate minus Binance rate (in percentage points)
- **Arbitrage**: Opportunities with a difference greater than 0.01% are marked with 💰

## Local Development

### Prerequisites

- A modern web browser
- Basic understanding of HTML, CSS, and JavaScript (if you want to modify the code)

### Running Locally

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/crypto-funding-arbitrage.git
   ```

2. Navigate to the project directory:
   ```
   cd crypto-funding-arbitrage
   ```

3. Open `index.html` in your web browser

## Deploying to GitHub Pages

1. Create a new repository on GitHub

2. Push your code to the repository:
   ```
   git remote add origin https://github.com/yourusername/crypto-funding-arbitrage.git
   git branch -M main
   git push -u origin main
   ```

3. Go to your repository settings on GitHub

4. Scroll down to the "GitHub Pages" section

5. Select the branch you want to deploy (usually `main`)

6. Click "Save"

7. Your site will be published at `https://yourusername.github.io/crypto-funding-arbitrage/`

## CORS Issues

Note: The application uses a CORS proxy to fetch data from Delta Exchange. In a production environment, you should set up your own proxy server or backend service to handle these requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Data provided by [Binance](https://www.binance.com/) and [Delta Exchange India](https://www.delta.exchange/)
- Icons by [Font Awesome](https://fontawesome.com/)