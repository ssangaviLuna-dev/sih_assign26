# College Laboratory Equipment Issue and Maintenance Register

A modern, lightweight frontend web application built for tracking laboratory equipment issuance, current conditions, return statuses, and maintenance schedules.

## Problem Statement
Academic laboratories frequently struggle to keep track of shared equipment, student checkout records, and maintenance timelines. Without a unified system, instruments go missing, maintenance dates pass unnoticed, and equipment conditions are untracked. This register provides a clean client-side management interface to filter equipment, view issue durations, and automatically highlight overdue maintenance schedules.

## Features
- **Dynamic Data Fetching**: Asynchronously loads and validates 40 equipment records from `data.json`.
- **Search & Filter**: Real-time combined filtering by Equipment Name, Student Name, and Condition status.
- **Record Counter**: Live display indicator showing `Showing X of Y records`.
- **Details Panel**: Interactive detail view rendered on row selection.
- **Derived Calculations**:
  - **Borrow Duration**: Calculates total days borrowed (or days elapsed to date if unreturned).
  - **Service Overdue Detector**: Automatically flags equipment exceeding service dates with the precise number of overdue days.
- **Error & Loading States**: Comprehensive UI feedback covering loading, fetch errors, empty search results, and missing record parameters.
- **Responsive Interface**: Mobile-friendly layout using CSS Grid/Flexbox and sticky positioning.

## Folder Structure