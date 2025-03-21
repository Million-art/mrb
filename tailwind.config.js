const plugin = require("tailwindcss/plugin")

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
         
        gray: {
          light: "##9CA3AF",
          deep: "#111827", 
          dark: "#1e1e1e",  
          medium: "#374151",  
        },
       
        blue: {
          light: "#30c0f9",  
          medium: "#15a2f1",  
          DEFAULT: "#33c3fa",  
        },
         
        red: {
          light: "#D73A49",  
          DEFAULT: "#E93D2A",  
        },
      },
    },
  },
  plugins: [   
    plugin(({ addUtilities }) => {
      addUtilities({
        /* Chrome, Safari and Opera */
        ".scrollbar-hidden::-webkit-scrollbar": {
          display: "none",
        },

        ".scrollbar-hidden": {
          "scrollbar-width": "none" /* Firefox */,
          "-ms-overflow-style": "none" /* IE and Edge */,
        },
      })
    }),
  ],
}