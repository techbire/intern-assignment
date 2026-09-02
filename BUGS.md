# Bugs found

Bugs are arranged in descending order from **Highest Priority** (critical financial calculations, state corruption, and core logic errors) to **Lowest Priority** (UI synchronization and form ergonomics).

---

## Bug 1 (High Priority - State Corruption)

**How to reproduce:** Filter expenses or view the sorted expense list (where item order differs from `state.expenses`). Click "Delete" or edit the amount of any expense (e.g. Board game).

**What is wrong:** Deleting or editing an expense modified or removed a completely different expense in `state.expenses` because `ExpenseList` passed the array index of the filtered/sorted array to the store reducer instead of a unique expense ID.

**What I changed:**
- In `src/state/store.js`, updated `DELETE_EXPENSE` and `UPDATE_EXPENSE` reducer cases to filter and map by unique expense `id`.
- In `src/App.jsx`, updated `ExpenseList` callbacks to pass expense `id` to the store reducer.
- In `src/components/ExpenseList.jsx`, updated `onDelete` and `onSaveAmount` callbacks to pass `expense.id`.

---

## Bug 2 (High Priority - Core Financial Calculation)

**How to reproduce:** Log an expense where the payer is not in `splitWith` (e.g. Diya pays $60 for an Uber split between Aisha and Ben only).

**What is wrong:** The payer's balance was erroneously reduced by `amount / n` even though they were not included in the expense split. The spec requires that someone paying for others without participating in the bill gets refunded in full.

**What I changed:**
- In `src/lib/balances.js`, removed the extra subtraction logic that deducted `amount / n` from non-participating payers.

---

## Bug 3 (High Priority - Settle Up Algorithm)

**How to reproduce:** Set up balances where a debtor owes an amount that exactly equals what a creditor is owed (e.g., Debtor owes $50, Creditor is owed $50).

**What is wrong:** The `suggestSettlements` algorithm in `src/lib/settle.js` skipped adding a settlement transfer when `debtor.amount === creditor.amount`, advancing indices without recording the payment and leaving debts unsettled.

**What I changed:**
- In `src/lib/settle.js`, added a condition to push a transfer for `d.amount` from debtor to creditor when `d.amount` equals `c.amount` before advancing both indices.

---

## Bug 4 (High Priority - Core Financial Display)

**How to reproduce:** Open the app and observe the Balances panel for Aisha Khan (who paid $148 total for the group but consumed less).

**What is wrong:** The Balances panel displayed positive balances (`bal > 0`) as "owes $X" (red) and negative balances (`bal < 0`) as "is owed $X" (green). Inverting these labels displayed creditors as debtors and debtors as creditors.

**What I changed:**
- In `src/components/BalancesPanel.jsx`, swapped the labels and CSS classes so positive balances display `is owed ${formatMoney(bal)}` (`cls = "owed"`) and negative balances display `owes ${formatMoney(-bal)}` (`cls = "owe"`).

---

## Bug 5 (Medium Priority - Financial Precision & Rounding)

**How to reproduce:** Split an expense equally among members where the total amount cannot be evenly divided in cents (e.g. $100 split 3 ways).

**What is wrong:** Each person's share was independently rounded to 2 decimal places ($33.33 x 3 = $99.99), resulting in $0.01 lost due to rounding, violating the rule that portions together must equal the full bill.

**What I changed:**
- In `src/lib/money.js`, updated `splitEqual` to calculate base cents per person and distribute any remainder cents to participants so the sum of shares strictly equals the total amount.
- Updated `percentsSumTo100` to use floating-point epsilon comparison (`Math.abs(sum - 100) < 0.01`).

---

## Bug 6 (Medium Priority - Financial Precision & Rounding)

**How to reproduce:** Check seed expense `e9` (Wine, $20.00 split 33.33%, 33.33%, 33.34%).

**What is wrong:** `splitByPercent` calculated `$6.67 + $6.67 + $6.67 = $20.01` ($0.01 higher than the $20.00 bill), inventing $0.01 and causing the group's net balances across everyone to not cancel out to zero.

**What I changed:**
- In `src/lib/money.js`, updated `splitByPercent` to compute exact cents and adjust any fractional cents difference against the total so the sum of shares always strictly equals the expense amount.

---

## Bug 7 (Medium Priority - Filter Feature Broken)

**How to reproduce:** Select any person from the "Paid by" dropdown inside the "Filter" panel.

**What is wrong:** The filter condition in `App.jsx` compared numeric `e.paidBy` with string `paidBy` using strict inequality (`e.paidBy !== paidBy`), which always evaluated to `true`. This caused all expenses to disappear with "No expenses match these filters".

**What I changed:**
- In `src/App.jsx`, changed the comparison to `String(e.paidBy) !== String(paidBy)`.

---

## Bug 8 (Medium Priority - UI / Sorting Spec)

**How to reproduce:** Open the app. The expense list says “Newest first”. The first row is Wine (7 Mar). Board game (15 Mar) is further down.

**What is wrong:** The list was showing oldest expenses first instead of newest first. In addition, string dates loaded from `localStorage` produced `NaN` during subtraction.

**What I changed:**
- In `src/lib/format.js`, updated `dateValue` to parse dates into numeric timestamps using `new Date(date).getTime()`.
- In `src/components/ExpenseList.jsx`, updated the sorting function to sort expenses in descending order (`dateValue(b.date) - dateValue(a.date)`).

---

## Bug 9 (Low Priority - UI State Synchronization)

**How to reproduce:** Add a new group member using the "Add member" form in the Summary panel without adding any new expenses.

**What is wrong:** The newly added member did not appear in the "Paid so far" list because `perPerson` was memoized using `useMemo` with only `[expenses]` in the dependency array.

**What I changed:**
- In `src/components/SummaryCards.jsx`, added `members` to the `useMemo` dependency array `[expenses, members]`.

---

## Bug 10 (Low Priority - Form UX)

**How to reproduce:** Fill in a description and amount in the "Add expense" form and click "Save expense".

**What is wrong:** The form inputs for `description` and `amount` did not reset after successfully adding the expense, leaving stale input text in the form and risking duplicate submissions.

**What I changed:**
- In `src/components/AddExpenseForm.jsx`, added `setDescription("")` and `setAmount("")` upon successful form submission.

---

## Bug 11 (Low Priority - Floating-Point Precision)

**How to reproduce:** Settle up accounts where floating-point arithmetic produces fractional cent approximations.

**What is wrong:** JavaScript floating-point subtraction (`d.amount -= c.amount`) could produce long decimal tails (e.g., `60.13000000000001`), risking rounding inaccuracies in settlement transfer amounts.

**What I changed:**
- In `src/lib/settle.js`, enforced 2-decimal place precision (`Number(val.toFixed(2))`) on transfer amounts and remaining balance deductions.

---
