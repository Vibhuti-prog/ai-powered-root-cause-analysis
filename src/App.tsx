import { Provider } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { store } from "@/store";
import { Dashboard } from "@/pages/Dashboard";
import { Workspace } from "@/pages/Workspace";

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-100 text-slate-900">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 font-bold text-white">
                  A
                </div>
                <div>
                  <div className="text-sm font-bold leading-tight text-slate-900">
                    AIVOA Quality
                  </div>
                  <div className="text-xs leading-tight text-slate-500">
                    API Manufacturing · Root Cause Analysis
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                GMP QMS · Deviation → RCA → CAPA
              </div>
            </div>
          </header>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/investigation" element={<Workspace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </Provider>
  );
}
