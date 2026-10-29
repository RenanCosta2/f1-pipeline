/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          red: "#E10600",
          darkred: "#B30500",
          black: "#15151E",
          dark: "#101018",
          card: "#1E1E2C",
          border: "#2C2C3E",
          subtle: "#8E8EA0",
        },
        teams: {
          ferrari: "#E80020",
          redbull: "#3671C6",
          mclaren: "#FF8000",
          mercedes: "#27F4D2",
          astonmartin: "#229971",
          alpine: "#0093CC",
          williams: "#64C4FF",
          rb: "#6692FF",
          sauber: "#52E252",
          haas: "#B6BABD",
        },
        tyres: {
          soft: "#FF1801",
          medium: "#FFD12E",
          hard: "#FFFFFF",
          intermediate: "#43B02A",
          wet: "#0067AD",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
