const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "media", // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        // Flashy Colors
        primary: {
          darker: "#4e44ce",
          main: "rgb(99, 102, 241)",
          whiter: "rgb(153, 155, 255)",
          whitest: "rgb(179, 180, 255)",
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
          whitest: "rgb(85, 85, 85)",
        },
      },
      // Custom Size
      gridTemplateRows: {
        12: "repeat(12, minmax(0, 1fr))",
      },
      gridTemplateColumns: {
        24: "repeat(24, minmax(0, 1fr))",
      },
      gridColumn: {
        "span-13": "span 13 / span 13",
        "span-14": "span 14 / span 14",
        "span-15": "span 15 / span 15",
        "span-16": "span 16 / span 16",
        "span-17": "span 17 / span 17",
      },
      spacing: {
        "iframe-h": "315px",
        "iframe-w": "560px",
        "info-bubble": "calc(50% - 136.5px)",
      },
      // Animation
      animation: {
        fadeIn: "fadeIn 0.1s ease-in 0s 1 forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0.2", transform: "scale(0.1)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },

      // EnableVariant
      ringWidth: ["hover", "active"],
      ringColor: ["hover", "active"],
      backgroundColor: ["active"],
    },
    // Responsive
    screens: {
      xs: "450px",
      ...defaultTheme.screens,
    },
  },
  plugins: [],
};
