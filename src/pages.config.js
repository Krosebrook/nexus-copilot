import Approvals from './pages/Approvals';
import Copilot from './pages/Copilot';
import Dashboard from './pages/Dashboard';
import Docs from './pages/Docs';
import Knowledge from './pages/Knowledge';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import SystemHealth from './pages/SystemHealth';
import IntegrationHealth from './pages/IntegrationHealth';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Approvals": Approvals,
    "Copilot": Copilot,
    "Dashboard": Dashboard,
    "Docs": Docs,
    "Knowledge": Knowledge,
    "Onboarding": Onboarding,
    "Settings": Settings,
    "SystemHealth": SystemHealth,
    "IntegrationHealth": IntegrationHealth,
}

export const pagesConfig = {
    mainPage: "Copilot",
    Pages: PAGES,
    Layout: __Layout,
};