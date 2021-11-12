module.exports = {
  purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: "media", // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: "#fbbf24", // yellow-500
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
