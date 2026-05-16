// Google Analytics 4 Management
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initGA = () => {
  if (!GA_ID) {
    console.log('[Analytics] No GA Measurement ID found. Tracking disabled.');
    return;
  }

  // Load the script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    page_path: window.location.pathname,
  });
};

export const trackPageView = (path: string) => {
  if (typeof window.gtag === 'function' && GA_ID) {
    window.gtag('config', GA_ID, {
      page_path: path,
    });
  }
};

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
