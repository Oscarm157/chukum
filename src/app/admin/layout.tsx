export const metadata = { robots: { index: false, follow: false } };

// Envuelve todo /admin en .crm-root (tokens del panel) + script anti-flash de tema.
// El bloque .crm-root vive en globals.css y no filtra al sitio público.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="crm-root min-h-[100dvh]">
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem('crm-theme')!=='dark')document.documentElement.setAttribute('data-crm-theme','light');}catch(e){}`,
        }}
      />
      {children}
    </div>
  );
}
