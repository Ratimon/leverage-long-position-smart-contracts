# 📚 smartcontract

### Quick Guide

1. Spinning Up Node

```bash
yarn fork:node mainnet --blockNumber 14518731
```

This will be stored in `/Deployments/localhost` but it stores only recently deployed one. Then, this will use to build artifact in the next step

2. Building Artifacts to use in frontend

```bash
yarn hardhat export --network localhost --export "./assets/web/contracts.json"
```

This will generate `contracts.json` to be used in front-end part of monorepo

3. Running Test (Optional)

```bash
yarn fork:test mainnet --blockNumber 14518731 --tags "protocol"
```

### Description

### 1. 🏗 Installation

- everything you need to install and fix relevant issue

- > Read more [`here`](./docs/1_SETUP.md).

### 2. 🏄‍♂️ Quick Start & Architecture

- Quickly experiment the reporisory

- > Read more [`here`](./docs/2_ARCHITECTURE.md).

### 3. 💼 Deployments Scripts

- See deployment scripts in [`./deploy`](./deploy). They are used for both test suites and deployment on production

- > Read more [`here`](./docs/3_DEPLOY_SCRIPT.md).

### 4. 🎲 Test Suites

- Run test suites

- > Read more [`here`](./docs/4_TEST.md).

### 5. 📱 Stand Alone Scripts

- Quickly interact with protocol

- > Read more [`here`](./docs/5_RUN_SCRIPT.md).

### 6. 🛠 Running Manual Tasks

- Develope with Useful utillity tasks

- > Read more [`here`](./docs/6_RUN_TASKS.md).

### 7 🔏 Internal Naming Convention & Pipeline

- > Read more [`here`](./docs/7_WORKFLOW.md).
