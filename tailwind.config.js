module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        // Flashy Colors
        primary: {
          darker: "#4e44ce",
          main: "rgb(99, 102, 241)",
          whiter: "rgb(153, 155, 255)",
        },
        secondary: "#3b82f680",
        // Main Colors
        headline: "#ffffff",
        description: {
          DEFAULT: "#ffffff99",
          whiter: "rgb(209 213 219)",
        },
        black: "rgb(17, 24, 39)",
        // BackGround
        bgi: {
          black: "rgb(28, 28, 28)",
          darker: "rgb(34, 34, 34)",
          main: "rgb(44, 45, 48)",
          whiter: "rgb(53, 54, 58)",
        },
      },
      gridTemplateRows: {
        12: "repeat(12, minmax(0, 1fr))",
      },

      // EnableVariant
      ringWidth: ["hover", "active"],
      ringColor: ["hover", "active"],
      backgroundColor: ["active"],
    },
  },
  plugins: [],
};
