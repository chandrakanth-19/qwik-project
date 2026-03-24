/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#FFF9E6",
          100: "#FFE566",
          400: "#F5C800",
          600: "#C49B00",
          900: "#7A5F00",
        },
      },
    },
  },
  plugins: [],
};
