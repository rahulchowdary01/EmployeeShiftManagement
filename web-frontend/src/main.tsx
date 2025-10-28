/**
 * Application entry point and router configuration.
 * 
 * This file sets up the React application with React Router for navigation
 * between different pages of the Employee Shift Management System.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './pages/App'
import Employees from './pages/Employees'
import Shifts from './pages/Shifts'
import Assignments from './pages/Assignments'
import AIDashboard from './pages/AIDashboard'

// Configure the application routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // Main layout component
    children: [
      { index: true, element: <Employees /> }, // Default route shows Employees page
      { path: 'shifts', element: <Shifts /> },
      { path: 'assignments', element: <Assignments /> },
      { path: 'ai', element: <AIDashboard /> },
    ],
  },
])

// Render the application to the DOM
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

