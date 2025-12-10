# Budget Tracker

Budget Tracker is a simple, privacy-focused personal finance app that helps users stay in control of their monthly spending.

Instead of syncing with banks or sending data to external services, the app connects directly to your own server using a custom API key — giving you full ownership of your financial data.

## Features
- Set a monthly budget
- Track expenses with quick, clean input forms
- View remaining budget, total spent, and overall status ("On Track", etc.)
- Add transactions with names, amounts, dates, and categories
- Enable or disable budget rollover from previous months
- See everything updated instantly through a responsive, mobile-friendly UI

The app focuses on being lightweight, fast, secure, and fully customizable, ideal for people who want an easy budgeting tool without giving their data to third-party finance apps.

## Quick Start

Budget Tracker is composed of a React Native app powered by Expo, as well as a FastAPI app on the backend side.
Since it's a decentralized service, you are supposed to deploy your own backend instance, and refer the endpoint inside the mobile app.

There is a Makefile for both frontend and backend to run the app in the dev environment.

### 1. Backend

Go inside backend directory to run the below commands:

```bash
# Create and populate database with dummy data (optional)
make seed

# Run backend on your host by installing dependencies
make run

# Run backend inside a docker container (swagger doc enabled)
make docker-dev-run

# Run backend in a docker container using prod Dockerfile
make docker-run
```

### 2. Frontend

Go inside frontend directory to run the below commands:
```bash
# Run expo server on your host by installing dependencies
make run

# Run expo server from inside of a container
make docker-dev-run

# Build .apk file and deploy it inside an emulator (if you have one installed)
make emulate

# Build .apk on your host by installing dependencies
make build

# Build .apk from inside a container, and move it inside the frontend/build/ directory
make docker-build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for personal use. Feel free to modify and adapt for your needs.
Check [LICENCE](./LICENSE) file.
