module.exports = {
  purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: "#fbbf24", // yellow-500
      },
      gridTemplateRows: {
        12: "repeat(12, minmax(0, 1fr))",
      },
      backgroundImage: {
        // "ack-logo-sign-up": "url('/IconAck192.png')",
      },
      ringWidth: ["hover", "active"],
      ringColor: ["hover", "active"],
      backgroundColor: ["active"],
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
