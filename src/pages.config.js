import Approvals from './pages/Approvals';
import Copilot from './pages/Copilot';
import Dashboard from './pages/Dashboard';
import Docs from './pages/Docs';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import SystemHealth from './pages/SystemHealth';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Approvals": Approvals,
    "Copilot": Copilot,
    "Dashboard": Dashboard,
    "Docs": Docs,
    "Onboarding": Onboarding,
    "Settings": Settings,
    "SystemHealth": SystemHealth,
}

export const pagesConfig = {
    mainPage: "Copilot",
    Pages: PAGES,
    Layout: __Layout,
};