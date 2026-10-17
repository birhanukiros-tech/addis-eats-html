# Addis Eats — Ethiopian Food Ordering Website

**Addis Eats** is a responsive Ethiopian food ordering website built with HTML, CSS, and vanilla JavaScript. It provides a simple, user-friendly interface for exploring Ethiopian dishes, managing a shopping cart, placing demo orders, and viewing order history.

🌐 **Live Demo:** [https://addis-eats-html.vercel.app/index.html](https://addis-eats-html.vercel.app/index.html)

💻 **GitHub Repository:** [https://github.com/birhanukiros-tech/addis-eats-html](https://github.com/birhanukiros-tech/addis-eats-html)

## Features

### Customer Features
- Browse Ethiopian food dishes and view their details.
- Explore the menu and discover different food categories.
- Add dishes to the cart and update quantities.
- Manage favorite dishes.
- Complete the demo checkout flow.
- View order history and detailed order information.
- Reorder items from previous orders.
- Switch between light and dark themes.
- Sign in using the customer demo account.

### Admin Features
- Access the separate admin login page.
- Use the available administration features to manage the demo experience.

### User Experience
- Responsive layout for desktop and mobile screens.
- Consistent styling and reusable CSS variables.
- Interactive modals and clear order status indicators.
- Local browser storage for supported demo data.
- Deployed on Vercel.

## Technologies Used

- **HTML5** — page structure and semantic markup.
- **CSS3** — responsive design, styling, and themes.
- **JavaScript** — interactive features and application logic.
- **JSON** — menu data.
- **LocalStorage** — persistence of supported browser-side demo data.
- **Vercel** — deployment and hosting.
- **Git and GitHub** — version control and source code hosting.

## Getting Started

### Prerequisites

You need a modern web browser and, optionally, Visual Studio Code.

### Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/birhanukiros-tech/addis-eats-html.git
   ```

2. Open the project folder:

   ```bash
   cd addis-eats-html
   ```

3. Open `index.html` in your browser, or use the **Live Server** extension in Visual Studio Code.

If your browser restricts loading the local JSON menu data, run the project through Live Server instead of opening the HTML file directly.

## Demo Accounts

The following accounts are for demonstrating the application's client-side flows.

| Account | Username | Password |
|---|---|---|
| Customer | `customer` | `1234` |
| Admin | `admin` | `AddisAdmin123!` |

**Security note:** These are demo credentials, not production authentication. This project uses frontend JavaScript and browser storage; it does not provide secure server-side authentication or authorization. Do not reuse these credentials for real accounts.

## Project Structure

```text
addis-eats-html/
├── index.html
├── admin-login.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── cart.js
│   ├── favorites.js
│   ├── checkout.js
│   └── orders.js
├── data/
│   └── data.json
└── README.md
```

*Note: The structure above highlights the main files. Other assets and pages may also be present in the repository.*

## What I Learned

Through this project, I practised:

- Building interactive interfaces with vanilla JavaScript.
- Managing application state and browser LocalStorage.
- Implementing cart, favorites, checkout, and order-history flows.
- Creating responsive layouts and light/dark themes with CSS.
- Organizing a multi-file frontend application.
- Using Git and GitHub for version control.
- Deploying a static website with Vercel.

## Future Improvements

- Add a backend API and database for persistent menu and order data.
- Implement secure server-side authentication and role-based access control.
- Integrate a real payment provider.
- Add automated tests and stronger error handling.

## Author

**Birhanu Kiros**

Aspiring Full-Stack Software Developer

- GitHub: [@birhanukiros-tech](https://github.com/birhanukiros-tech)

---

*Built as a practical web development project focused on Ethiopian food and a user-friendly ordering experience.*