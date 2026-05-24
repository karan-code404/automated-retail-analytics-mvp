# Automated Retail Analytics Dashboard

A professional-grade, full-stack analytics application showcasing an Express backend bridged with a Python + Pandas calculation engine and a React + Vite + Tailwind CSS v4 interactive dashboard.

## 📊 Project Architecture

The application is structured into two main layers:

```
/DataAnalytics_project
├── backend/                  # Node.js + Express API server
│   ├── analyzer.py           # Core computation logic using Pandas
│   ├── server.js             # API router and Multer file upload handler
│   ├── package.json          # Express dependencies (cors, multer, express)
│   └── uploads/              # Directory for temp file uploads
├── frontend/                 # React + Vite + Tailwind CSS UI
│   ├── src/
│   │   ├── components/       # Reusable components (FileUploader, Dashboard)
│   │   ├── App.jsx           # Main coordinator & API bridge state manager
│   │   ├── index.css         # Tailwind v4 import & custom styles
│   │   └── main.jsx          # React app entry point
│   ├── package.json          # React, Recharts, Lucide, Tailwind config
│   └── vite.config.js        # Vite + Tailwind v4 bundler config
└── README.md                 # Setup & running instructions (this file)
```

## ⚙️ Workflow Mechanics

1. **Upload**: User selects a CSV file. The frontend uploads it to the backend (`POST /api/upload`) using Axios.
2. **Middleware**: Multer intercepts the upload and saves it inside the `backend/uploads` folder with a unique filename.
3. **Bridge Execution**: The Express server spawns a Python child process (`child_process.spawn`) executing `analyzer.py` and passing the file path.
4. **Pandas Calculation**: The Python engine loads the file, validates the schema, computes KPI summaries, category aggregates, product rankings, and generates smart recommendations. The result is written directly to `stdout` as JSON.
5. **Data Cleanup & Response**: Express collects the JSON, cleans up/deletes the temporary CSV file from the filesystem, and sends the payload to the frontend.
6. **Visualization**: The frontend renders KPI cards, Recharts Area & Bar charts, and action-oriented intelligence recommendations under a Dark Slate & Teal theme.

---

## 🛠️ Setup & Installation

Follow these steps to run the project locally on your system.

### Prerequisites
1. **Node.js** (v18 or higher recommended)
2. **Python 3** (Verify by running `python --version` or `python3 --version`)

---

### Step 1: Install Python Dependencies

The analysis engine relies on the **Pandas** library. Run the following command in your terminal:

```bash
pip install pandas
```

*Note: Depending on your system, you may need to use `pip3 install pandas`.*

---

### Step 2: Set Up Backend Server

1. Navigate to the `backend` folder (run `cd backend` in your terminal).
2. Install node dependencies:

```bash
npm install
```

---

### Step 3: Set Up Frontend Client

1. Navigate to the `frontend` folder (run `cd frontend` in your terminal).
2. Install dependencies (we use `--legacy-peer-deps` to support React 19 peer constraints on charting modules):

```bash
npm install --legacy-peer-deps
```

---

## 🚀 Running the Application

### 1. Start the Backend API Server
In the `/backend` directory, run:
```bash
npm run dev
```
The server will boot on [http://localhost:5000](http://localhost:5000).

### 2. Start the Frontend Dev Server
In the `/frontend` directory, run:
```bash
npm run dev
```
The web app will boot on [http://localhost:5173](http://localhost:5173) (or the first available port). Open your browser and navigate to this link.

---

## 📁 Sample Schema
You can test the application using the included `dummy_data.csv` file. The column schema matches:
`Date, Product, Category, Location, Cost_Price, Selling_Price, Sales_Amount`
