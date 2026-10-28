# PulseCRUD - Modern Personnel & Team Management Application

A high-performance, human-centered **CRUD Application** built using pure **HTML5**, **Vanilla CSS3**, and **Modern JavaScript (ES6+)**.

---

## 🌟 Key Features

### 1. Complete CRUD Functionality
- **Create**: Add new members with real-time form validation (Name, Email format, Phone, Department, Job Role, Salary, Avatar Color, and Skills tags).
- **Read**: Dynamic responsive **Data Table** and **Grid Cards View** with real-time analytics counter.
- **Update**: Modal edit interface with pre-populated values and instant validation feedback.
- **Delete**: Human-friendly safety confirmation dialog before irreversible removal.

### 2. Live Search, Filter & Sort
- **Multi-field Instant Search**: Type-ahead search across names, emails, roles, departments, and skill badges.
- **Department & Status Filters**: Instant filtering by Engineering, Design, Product, Marketing, Operations, Finance, etc.
- **Dynamic Sorting**: Sort by Newest, Oldest, Alphabetical (A-Z / Z-A), and Compensation.

### 3. Clean Human Styling & Aesthetics
- **Human-Centered Typography**: Styled with Google Fonts (`Plus Jakarta Sans` & `JetBrains Mono`).
- **Dark & Light Mode**: Seamless theme toggle with smooth transitions and stored preference.
- **Interactive UI Feedback**: Floating toast notifications (Created, Updated, Deleted).
- **Glassmorphism & Micro-animations**: Elevation shadows, hover states, and smooth modal entrances.

### 4. Data Persistence
- **LocalStorage**: Your data automatically persists across browser refreshes and tabs.

---
“LocalStorage Persistence is a web browser feature that allows data to be stored locally on a user's device and remain available even after refreshing the page or closing and reopening the browser.”

In simple English: Data saved in LocalStorage stays in the browser until it is manually removed or cleared by the website or browser settings.

## 🚀 How to Run the Application

### Option A: Direct in Browser
Simply double-click [`index.html`](file:///c:/Users/sangr/OneDrive/Desktop/CRUD%20Application/index.html) or right-click and choose **Open with > Chrome / Edge / Firefox**.

### Option B: Local Server (Node.js)
Open your terminal in this directory and run:
```bash
node server.js
```
Then navigate to: **[http://localhost:3000](http://localhost:3000)**

---

## 📁 Project Structure

```
CRUD Application/
├── index.html        # Clean semantic HTML5 layout and modals
├── style.css         # Modern design system, themes, and animations
├── app.js            # Pure JS CRUD engine, search/filter, storage
├── server.js         # Lightweight local dev server
└── README.md         # Documentation
```


**app.js**   : application ka "Chehra aur Haath-Pair" (UI) hai jo user ko dikhta hai.


**server.js** :application ka "Dimag aur Tijori" (Engine & Database) hai jo parde ke peeche data ko sambhalta hai.


**index.html**: Yeh sirf building ka "Blueprin" hai. Yeh batata hai ki "Kahan par table banegi, kahan button rakha jayega, aur kahan parde (modals) lagaye jayenge".

**style.css**: Yeh building ka "Interior Designer" hai. Yeh decide karta hai ki deewaron ka rang kaisa hoga, furniture ka texture kya hoga, aur lights kitni chamkili hongi (Dark Mode vs Light Mode).


