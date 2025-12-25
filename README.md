# Task Manager

A comprehensive task management application built with Angular, featuring user authentication, task creation and management, with a full testing suite.

## Features

- User authentication (login, register, forgot password, reset password)
- Create, read, update, and delete tasks
- Task organization with tags and status tracking
- Responsive UI with Angular Material
- Multi-language support with ngx-translate

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v10.9.2 or higher)

### Installation

```bash
npm install
```

### Running the Application

Start the development server:

```bash
npm start
```

The application will be available at `http://localhost:4200`

## Testing Experience

This project includes a comprehensive testing suite with both unit tests and end-to-end (E2E) tests.

### Unit Tests

Unit tests are run using **Vitest** and Angular's built-in testing utilities.

#### Run Unit Tests

```bash
npm test
```

This command runs all unit tests in watch mode, allowing you to see test results in real-time as you make changes.

#### Test Reports

Unit test results are generated in HTML format and can be found at:
```
./vitest-report/index.html
```

Open this file in your browser to view detailed test coverage and results.

### End-to-End (E2E) Tests

E2E tests are run using **Cypress** and cover the complete user workflows.

#### Available E2E Test Suites

- **Login Tests** (`cypress/e2e/test_login.cy.ts`) - Tests user authentication flows
- **Task Form Tests** (`cypress/e2e/test_tasks_form.cy.ts`) - Tests task creation and form validation
- **Task List Tests** (`cypress/e2e/test_tasksList.cy.ts`) - Tests task listing and manipulation

#### Run E2E Tests

**Run all E2E tests in headless mode:**
```bash
npm run cy:run
```

**Open Cypress interactive test runner:**
```bash
npx cypress open
```

This launches the Cypress UI where you can run individual test suites and watch them execute in real-time.

#### Generate E2E Test Reports

```bash
npm run cy:test
```

This command runs all E2E tests and generates a comprehensive HTML report using Mochawesome.

#### View E2E Test Reports

After running `npm run cy:test`, the test report can be found at:
```
./cypress/reports/mochawesome/report.html
```

The report includes:
- Detailed test statistics (passes, failures, pending)
- Interactive test execution timeline
- Screenshots of failures (when `embeddedScreenshots` is enabled)
- Charts and graphs for test metrics

#### Clean Test Reports and Artifacts

Remove all previous test reports, screenshots, and videos:
```bash
npm run cy:clean
```

This is useful when you want to start fresh without old test artifacts.

## Testing Best Practices

### Unit Tests
- Tests are organized alongside their corresponding components with `.spec.ts` extension
- Each component and service should have comprehensive test coverage
- Tests verify functionality, edge cases, and error handling

### E2E Tests
- Tests simulate real user interactions and workflows
- Tests start the application fresh for each suite
- Tests are organized by feature area
- Screenshots are captured on test failures for debugging
- Reports provide detailed insights into test execution

## Project Structure

```
src/
├── app/
│   ├── components/        # Application components with test files
│   ├── guards/            # Route guards
│   ├── services/          # Application services
│   └── classes/           # Enums, interfaces, and classes
├── environments/          # Environment configuration
└── styles.css            # Global styles

cypress/
├── e2e/                  # End-to-end tests
├── fixtures/             # Test data
├── reports/              # Test reports and artifacts
├── screenshots/          # Failure screenshots
└── support/              # Cypress commands and helpers
```

## Development Workflow

1. **Start development server**: `npm start`
2. **Run unit tests**: `npm test` (in another terminal)
3. **Run E2E tests**: `npx cypress open` (in interactive mode)
4. **Build for production**: `npm build`

## Troubleshooting

### E2E Tests Not Running
- Ensure the development server is running on `http://localhost:4200`
- Check that the `baseUrl` in `cypress.config.ts` matches your server address
- Clear Cypress cache: `npx cypress cache clear`

### Test Reports Not Generating
- Verify that the `cypress/reports/` directory exists and has write permissions
- Check that Mochawesome reporter is installed: `npm list mochawesome`
- Run `npm run cy:clean` to clear old reports and try again

### Unit Tests Failing
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check that you're using Node.js v18 or higher

## License

This project is private and not licensed for external use.
