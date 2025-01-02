# PCC Government Taiwan Dashboard

A dashboard application for visualizing Taiwan's Public Construction Commission (PCC) procurement data.

## Local Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Dependencies

The project uses:
- Vite as the build tool
- React with TypeScript
- TailwindCSS for styling
- ESLint for linting
- Other key dependencies:
  - axios for API calls
  - lucide-react for icons

### Setup and Running Locally

1. Clone the repository
```bash
git clone https://github.com/[your-username]/pcc-gov-tw-dashboard.git
cd pcc-gov-tw-dashboard
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## Deployment to GitHub Pages

### First-time Setup

1. Create a GitHub repository if you haven't already

2. Update the `package.json` file to include the homepage field:
```json
{
  "homepage": "https://[your-username].github.io/pcc-gov-tw-dashboard"
}
```

3. Install gh-pages package if not already installed:
```bash
npm install --save-dev gh-pages
# or
yarn add --dev gh-pages
```

4. Add deployment scripts to `package.json` if not present:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

### Deploying

To deploy your latest changes to GitHub Pages:

```bash
npm run deploy
# or
yarn deploy
```

This will create a `gh-pages` branch in your repository and publish the contents of the `dist` directory.

### After Deployment

- Your application will be available at: `https://[your-username].github.io/pcc-gov-tw-dashboard`
- It may take a few minutes for the changes to be reflected on GitHub Pages
- Ensure your repository settings have GitHub Pages enabled and are using the `gh-pages` branch

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request 