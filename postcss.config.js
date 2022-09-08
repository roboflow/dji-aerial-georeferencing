module.exports = {
    ident: "postcss",
    plugins: {
        "postcss-import": {},
        "tailwindcss": {},
        "postcss-nested": {},
        "autoprefixer": {}
    },
    cacheInclude: [/.*\.(css|scss|hbs)$/, /.tailwind\.config\.js$/]
};
