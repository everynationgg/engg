import i18next from "i18next";

// Example language resources
const resources = {
  en: { translation: { "welcome": "Welcome!" } },
  es: { translation: { "welcome": "¡Bienvenido!" } },
};

i18next.init({
  lng: "en",
  fallbackLng: "en",
  resources,
});

export default i18next;
