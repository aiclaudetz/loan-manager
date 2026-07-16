# LoanManager

A loan management system (React + React Router). The large single
`LoanManager.jsx` file has been split into a proper project structure to make it
easier to read, maintain, and later integrate with Supabase.

## Project Structure

```
src/
  main.jsx              — entry point
  App.jsx                — all routes and main layout
  styles.js               — all style objects (CSS-in-JS)
  context/
    LoanContext.jsx        — LoanProvider + useLoans() hook (mock data for now)
  utils/
    utils.js                — getDueDate, isLoanOverdue, getEffectiveStatus, formatPhoneForWaMe
  components/
    Navbar.jsx, Sidebar.jsx, LoanCard.jsx
  pages/
    Dashboard.jsx, Clients.jsx, Loans.jsx, NewClient.jsx, EditClient.jsx,
    NewLoan.jsx, EditLoan.jsx, Payments.jsx, NewPayment.jsx, EditPayment.jsx,
    Reports.jsx, Reminders.jsx, LoanDetails.jsx
```

## How to Run

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Building for Production (Vercel)

```bash
npm run build
```

This will create a `dist/` folder that you can deploy directly to Vercel
(Vercel automatically detects Vite projects with no extra config needed).

## Next Steps

- The data is still **mock data** (stored inside `LoanContext.jsx`). When you're
  ready to connect to Supabase, change the `useEffect` that loads data and
  `addLoan/addClient/addPayment/...` inside `LoanContext.jsx` to call Supabase
  instead of the local `setState` calls.
