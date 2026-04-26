# ShelfSense: Smart Library Management System

ShelfSense is a modern, full-stack library management application designed for seamless book circulation, real-time inventory tracking, and interactive administrative oversight. It features a premium glassmorphic UI, role-based access control, and an automated reservation system.

## 🚀 Key Features

### 👨‍💼 For Administrators (Librarians)
*   **Interactive Analytics Dashboard**: Clickable cards for Total, Issued, and Overdue books that reveal detailed lists generated specifically from the admin's managed inventory.
*   **Catalog Management**: Add, update, or permanently delete books directly from the intuitive dashboard.
*   **Hardware Integration**: "Gun Station" support for quick barcode scanning to issue or return books.
*   **Issue Management**: Global tracking of all active transactions with clear headers for due dates and student identifiers.
*   **Fine Waiver System**: Approve or reject fine waiver requests based on student-submitted justifications.

### 🎓 For Students
*   **Personal Dashboard**: Track current issues, overdue status, and borrowing limits.
*   **Digital Catalog**: Real-time book availability and location tracking (Floor -> Row -> Rack).
*   **Reservations**: Smart queueing system that automatically issues books to the next student once they are returned.
*   **Fine Tracking**: Transparency into accrued fines and the ability to submit waiver requests.

## 🛠️ Technology Stack

**Frontend:**
*   React 19 (Vite)
*   Tailwind CSS (Styling)
*   Framer Motion (Animations)
*   Lucide-React (Icons)
*   Recharts (Data Visualization)
*   Axios (API communication)

**Backend:**
*   Node.js & Express
*   MySQL (Database)
*   JSON Web Tokens (Authentication)
*   Bcrypt.js (Password Security)

## 📦 Installation & Setup

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd shelf-sense
```

### 2. Database Configuration
1. Install MySQL if not already installed.
2. Create a database named `shelfsense`.
3. Import the `server/schema.sql` file into your MySQL instance to set up the tables and initial data.

### 3. Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory and add your credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=shelfsense
   JWT_SECRET=your_super_secret_key
   ```
4. Start the server:
   ```bash
   node server.js
   ```

### 4. Frontend Setup
1. Open a new terminal and navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## 📸 Screenshots
*(Add your own screenshots here to showcase the glassmorphic design!)*

---

Developed by Amna, Annapurna and Seharish

Developed with ❤️ as a Smart Library Solution.
