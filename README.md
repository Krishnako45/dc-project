# CRC Error Detection & Data Transmission Simulator

A web application that demonstrates CRC (Cyclic Redundancy Check) error detection using real modulo-2 binary division — not a hardcoded demo.

## Project files

```
crc-project/
├── index.html   → structure of the page (Frontend - HTML)
├── style.css    → visual styling, colors, layout (Frontend - CSS)
├── script.js    → the CRC logic + all interactivity (Frontend logic / "engine")
└── README.md    → this file
```

## Why there is no backend

This project intentionally has **no server and no database**. CRC calculation is pure math — it needs numbers as input and produces a result, with no need to store data or talk to another system. So the entire application runs inside the browser (client-side only). This is a normal, correct design choice for a project like this, not a missing piece.

If asked in viva: *"This project doesn't require a backend because the CRC computation is self-contained logic that runs entirely client-side in JavaScript."*

## How to run it

1. Keep all three files (`index.html`, `style.css`, `script.js`) in the same folder.
2. Double-click `index.html`, or open it in any browser (Chrome, Edge, Firefox).
3. No installation, no server, no internet connection required (except for loading the fonts).

## How the code is organized

- **index.html** — defines three sections on the page: Sender, Transmission Channel, Receiver. Each section is just empty containers that `script.js` fills in with results.
- **style.css** — controls how everything looks (dark theme, card layout, colors for success/error states). Doesn't contain any logic.
- **script.js** — has two parts:
  1. **The CRC engine** (`crcDivide`, `calculateCRC`, `checkReceived`) — the actual binary division logic. This is the part your professor will care about most.
  2. **The interface code** — listens for button clicks (Calculate CRC, Send, Introduce error, Check for errors) and updates the page with results.

## How the CRC engine works (for your report/viva)

1. Take the binary **data** the user enters.
2. Append `(generator length − 1)` zeros to it.
3. Divide this padded data by the **generator polynomial** using XOR (this is "modulo-2 division" — subtraction becomes XOR).
4. Whatever is left over after the division is the **CRC remainder**.
5. Attach that remainder to the original data → this combined value is the **transmitted frame**.
6. The **receiver** repeats the same division on the frame it receives, using the same generator.
7. If the leftover remainder is all zeros → **no error detected**. If not → **error detected**.

The "Introduce error" button randomly flips one bit in the transmitted frame before it reaches the receiver, simulating noise on a transmission line. The receiver then genuinely recalculates — the result isn't pre-decided.

## Test cases to run and screenshot

| Data | Generator | Action | Expected result |
|------|-----------|--------|------------------|
| 1101 | 1011 | Send normally | No error detected |
| 1101 | 1011 | Simulate transmission error | Error detected |
| 2101 | 1011 | (invalid) | Rejected — "Data must be binary" |
| 1101 | 1021 | (invalid) | Rejected — "Generator must be binary" |
| 11010110 | 1101 | Send normally | No error detected |

## Verification happens automatically

There is no "Check for errors" button. The moment a frame arrives at the receiver — whether sent normally or with a simulated error — the receiver immediately re-runs the CRC division itself and shows the remainder and result. The result is never decided by which button you clicked; it's calculated fresh every time from whatever frame actually arrived.
