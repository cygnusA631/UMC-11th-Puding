import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Header } from "../components/layout/header";
import { Footer } from "../components/layout/footer";

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7f9] text-[#17181c] antialiased">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-12 min-[768px]:px-10 min-[1200px]:px-20">
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없어요.</h1>
    </main>
  ),
});
