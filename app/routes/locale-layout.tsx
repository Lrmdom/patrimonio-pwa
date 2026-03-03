import { Outlet } from "react-router";

export default function LocaleLayout() {
  return (
    <div className="h-screen bg-parchment parchment-texture flex flex-col">
      {/* Main content - sem header para não interferir com os controlos do mapa */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
