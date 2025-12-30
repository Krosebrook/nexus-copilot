import Copilot from './pages/Copilot';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import SystemHealth from './pages/SystemHealth';
import Approvals from './pages/Approvals';
import Docs from './pages/Docs';
import Onboarding from './pages/Onboarding';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Copilot": Copilot,
    "Dashboard": Dashboard,
    "Settings": Settings,
    "SystemHealth": SystemHealth,
    "Approvals": Approvals,
    "Docs": Docs,
    "Onboarding": Onboarding,
}

export const pagesConfig = {
    mainPage: "Copilot",
    Pages: PAGES,
    Layout: __Layout,
};