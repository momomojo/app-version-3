# Clinical Neurology Self-Assessment App

This Electron application lets you practice neurology exam questions offline.

## Prerequisites

- **Node.js** 18 or higher
- **npm** (comes with Node.js)

## Setup

Install dependencies:

```bash
npm install
```

## Running the App

Start the development version with:

```bash
npm start
```

## Building Distributables

Create packaged builds using:

```bash
npm run build
```

The output will appear in the `dist` folder.

## Exam Question Files

JSON files containing exam questions must be stored in the
`questions and answers` directory at the project root. Existing files in this
folder (`Neuro-E-5.json`, `Neuro-E-6.json`, etc.) can be used as examples. To
add your own exams, place additional JSON files in this directory using the same
structure.
