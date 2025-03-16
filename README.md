# Economic Mobility Guide

An interactive web application designed to help families make informed decisions about economic mobility by providing personalized recommendations for neighborhoods, schools, and community programs.

## Features

- **Personalization Quiz**: Collect family information to provide tailored recommendations
- **Interactive Area Explorer**: 
  - Search by ZIP code
  - View top-rated neighborhoods
  - Find age-appropriate schools
  - Discover local housing options
  - Browse community programs
- **Dynamic Data**: Real-time data fetching using OpenAI API for accurate, up-to-date information
- **PDF Summary**: Generate downloadable action plans

## Prerequisites

Before running this application, make sure you have:

- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (comes with Node.js)
- An OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd [repository-name]
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
OPENAI_API_KEY=your_api_key_here
```

## Running the Application

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

- `index.html` - Main HTML file
- `script.js` - Frontend JavaScript
- `styles.css` - CSS styles
- `server.js` - Node.js backend server
- `.env` - Environment variables (create this file)
- `package.json` - Project dependencies

## API Integration

The application uses the OpenAI API to provide:
- Neighborhood recommendations
- School information
- Community programs

Make sure your OpenAI API key has sufficient credits and permissions.

## Performance Features

### Data Caching
- Initial ZIP code submission triggers a one-time data fetch for all sections
- Data is cached in memory for instant navigation between sections
- Fresh data is only fetched when:
  - A new ZIP code is entered
  - The page is refreshed
  - The server is restarted

### Loading States
- Loading overlay with spinner appears during data fetching
- Clear visual feedback of data retrieval progress
- Smooth transitions between cached content

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

For the best experience, use the latest version of your preferred browser.

## Usage Flow

1. Complete the personalization quiz
2. Enter your desired ZIP code
3. Explore recommended neighborhoods
4. View age-appropriate schools
5. Browse housing options
6. Select community programs
7. Generate and download your action plan

## Development

To modify the application:

1. Frontend changes:
   - Edit `index.html` for structure
   - Modify `script.js` for functionality
   - Update `styles.css` for appearance

2. Backend changes:
   - Edit `server.js` for API endpoints
   - Update OpenAI prompts in server.js

## Troubleshooting

Common issues:

1. **Server won't start**
   - Check if port 3000 is available
   - Verify Node.js installation
   - Ensure all dependencies are installed

2. **API errors**
   - Verify OpenAI API key in .env
   - Check API rate limits
   - Confirm internet connection

3. **Loading issues**
   - Clear browser cache
   - Check browser console for errors
   - Verify server is running

## Security Notes

- Never commit the `.env` file
- Keep your API key secure
- Update dependencies regularly

## License

[Add your license information here]

## Contact

[Add your contact information here]
