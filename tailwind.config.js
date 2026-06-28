import defaultTheme from "tailwindcss/defaultTheme";
import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php",
        "./storage/framework/views/*.php",
        "./resources/views/**/*.blade.php",
        "./resources/js/**/*.jsx",
    ],

    theme: {
        extend: {
            colors: {
                "app-bg": "#FAFAF8",
                surface: "#FFFFFF",
                sidebar: "#0A0A0A",
                "sidebar-active": "#FFDE59",
                "sidebar-hover": "#1A1A1A",

                brand: "#FFDE59",
                "brand-hover": "#F5D033",
                "brand-ink": "#0A0A0A",

                success: "#16A34A",
                "success-bg": "#F0FDF4",
                warning: "#D97706",
                "warning-bg": "#FFFBEB",
                danger: "#DC2626",
                "danger-bg": "#FEF2F2",

                "text-primary": "#0F172A",
                "text-secondary": "#64748B",
                "text-muted": "#94A3B8",

                border: "#E5E1D8",
                muted: "#F4F2EC",
            },

            borderRadius: {
                btn: "10px",
                input: "10px",
                card: "16px",
                modal: "18px",
                dropdown: "12px",
            },

            fontFamily: {
                sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
                display: [
                    "Manrope",
                    "ui-sans-serif",
                    "system-ui",
                    "sans-serif",
                ],
            },
        },
    },

    plugins: [forms],
};
