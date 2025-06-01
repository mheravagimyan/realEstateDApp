/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        accent:  "#f59e0b",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        estate: {
          primary:   "#2563eb",
          secondary: "#f59e0b",
          accent:    "#9333ea",
          "base-100": "#ffffff",
        },
      },
      "dark",
    ],
  },
};
