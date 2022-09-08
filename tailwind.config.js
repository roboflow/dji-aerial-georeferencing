var colors = require("tailwindcss/colors");

module.exports = {
    mode: "jit",
    purge: {
        layers: ["components", "utilities"],
        content: [
            "./src/**/*.html",
            "./src/**/*.js",
            "./src/**/*.jsx",
            "./src/**/*.ts",
            "./src/**/*.hbs",
            "./src/**/*.scss",
            "./src/styles/tailwind/safelist.txt"
        ],
        options: {
            safelist: [/^:/]
        }
    },
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    "Inter",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "Segoe UI",
                    "Roboto",
                    "Helvetica Neue",
                    "Arial",
                    "Noto Sans",
                    "sans-serif",
                    "Apple Color Emoji",
                    "Segoe UI Emoji",
                    "Segoe UI Symbol",
                    "Noto Color Emoji"
                ]
            }
        }
    },
    variants: {
        extend: {
            backgroundColor: ["active", "focus-visible", "focus"],
            textColor: ["active"],
            outline: ["focus-visible", "focus"],
            position: ["focus-visible", "focus"],
            ringColor: ["focus-visible", "focus"],
            ringOffsetColor: ["focus-visible", "focus"],
            ringOffsetWidth: ["focus-visible", "focus"],
            ringOpacity: ["focus-visible", "focus"],
            ringWidth: ["focus-visible", "focus"]
        }
    }
};
