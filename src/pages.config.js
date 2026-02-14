/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AgentBuilder from './pages/AgentBuilder';
import Analytics from './pages/Analytics';
import Approvals from './pages/Approvals';
import Copilot from './pages/Copilot';
import CopilotSettings from './pages/CopilotSettings';
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
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgentBuilder": AgentBuilder,
    "Analytics": Analytics,
    "Approvals": Approvals,
    "Copilot": Copilot,
    "CopilotSettings": CopilotSettings,
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
}

export const pagesConfig = {
    mainPage: "Copilot",
    Pages: PAGES,
    Layout: __Layout,
};