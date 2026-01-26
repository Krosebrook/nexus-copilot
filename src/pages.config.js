import Approvals from './pages/Approvals';
import Copilot from './pages/Copilot';
import Dashboard from './pages/Dashboard';
import Docs from './pages/Docs';
import IntegrationConfig from './pages/IntegrationConfig';
import IntegrationHealth from './pages/IntegrationHealth';
import IntegrationSetup from './pages/IntegrationSetup';
import Knowledge from './pages/Knowledge';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import SystemHealth from './pages/SystemHealth';
import WorkflowBuilder from './pages/WorkflowBuilder';
import CopilotSettings from './pages/CopilotSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Approvals": Approvals,
    "Copilot": Copilot,
    "Dashboard": Dashboard,
    "Docs": Docs,
    "IntegrationConfig": IntegrationConfig,
    "IntegrationHealth": IntegrationHealth,
    "IntegrationSetup": IntegrationSetup,
    "Knowledge": Knowledge,
    "Onboarding": Onboarding,
    "Settings": Settings,
    "SystemHealth": SystemHealth,
    "WorkflowBuilder": WorkflowBuilder,
    "CopilotSettings": CopilotSettings,
}

export const pagesConfig = {
    mainPage: "Copilot",
    Pages: PAGES,
    Layout: __Layout,
};